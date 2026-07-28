const fs = require("fs");
const http = require("http");
const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("playwright-core");

const live = process.argv.includes("--live");
const baseUrl = live ? "https://cplinsider.com/players/" : "http://127.0.0.1:4177/players/";

function isReachable(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 500);
    });
    request.setTimeout(1500, () => request.destroy());
    request.on("error", () => resolve(false));
  });
}

async function startLocalServer() {
  if (live || await isReachable(baseUrl)) return null;
  const child = spawn(process.execPath, ["server.js"], {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, PORT: "4177" },
    stdio: "ignore"
  });
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await isReachable(baseUrl)) return child;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  child.kill();
  throw new Error("Local preview server did not start.");
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate));
}

async function auditViewport(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const issues = [];
  const setSelectValue = async (selector, value) => {
    await page.locator(selector).evaluate((select, nextValue) => {
      select.value = nextValue;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await page.waitForTimeout(30);
  };
  try {
    const response = await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30000 });
    if (!response || response.status() >= 400) issues.push(`HTTP status ${response ? response.status() : "missing"}`);

    const structure = await page.evaluate(() => {
      const heroCopy = document.querySelector(".pd-hero-copy > p:not(.eyebrow)");
      const heroStats = document.querySelector(".pd-hero-chips");
      const footer = document.querySelector(".site-footer");
      const trackerRows = [...document.querySelectorAll(".pd-tracker-row")];
      const visiblePlayerCards = [...document.querySelectorAll("[data-player-card]")].filter((card) => {
        const style = getComputedStyle(card);
        return style.display !== "none" && !card.hidden;
      });
      const cardHeights = visiblePlayerCards.slice(0, 8).map((card) => Math.round(card.getBoundingClientRect().height));
      const intersects = (left, right) => {
        if (!left || !right) return false;
        const a = left.getBoundingClientRect();
        const b = right.getBoundingClientRect();
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      };
      const schemaTypes = [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap((script) => {
        try {
          const json = JSON.parse(script.textContent);
          return (json["@graph"] || [json]).map((entry) => entry["@type"]);
        } catch {
          return [];
        }
      });
      return {
        h1Count: document.querySelectorAll("h1").length,
        h2Count: document.querySelectorAll("h2").length,
        cardHeadingCount: document.querySelectorAll("[data-player-card] h3").length,
        heroOverlap: intersects(heroCopy, heroStats),
        trackerDisplays: trackerRows.map((row) => getComputedStyle(row).display),
        trackerHeights: trackerRows.map((row) => Math.round(row.getBoundingClientRect().height)),
        playerCount: document.querySelectorAll("[data-player-card]").length,
        standardArtworkCount: document.querySelectorAll('[data-player-card][data-artwork-standard="true"]').length,
        cardHeights,
        footerHeight: footer ? Math.round(footer.getBoundingClientRect().height) : 0,
        schemaTypes
      };
    });

    if (structure.h1Count !== 1) issues.push(`Expected one H1, found ${structure.h1Count}`);
    if (structure.h2Count !== 6) issues.push(`Expected six section H2 headings, found ${structure.h2Count}`);
    if (structure.cardHeadingCount !== structure.playerCount) issues.push(`Expected ${structure.playerCount} player-card H3 headings, found ${structure.cardHeadingCount}`);
    if (structure.heroOverlap) issues.push("Hero description overlaps the squad-summary panel");
    if (viewport.width >= 1101 && Math.max(...structure.trackerHeights) > 100) {
      issues.push(`Desktop squad tracker row is too tall (${Math.max(...structure.trackerHeights)}px)`);
    }
    if (viewport.width <= 430 && Math.max(...structure.trackerHeights) > 92) {
      issues.push(`Collapsed mobile squad tracker row is too tall (${Math.max(...structure.trackerHeights)}px)`);
    }
    if (structure.cardHeights.length && Math.max(...structure.cardHeights) - Math.min(...structure.cardHeights) > 2) {
      issues.push(`Visible player-card heights differ (${structure.cardHeights.join(", ")}px)`);
    }
    if (!structure.schemaTypes.includes("ItemList") || !structure.schemaTypes.includes("FAQPage")) {
      issues.push(`Players page schema is incomplete (${structure.schemaTypes.join(", ")})`);
    }
    if (viewport.width <= 430 && structure.footerHeight > 620) {
      issues.push(`Mobile footer is too tall (${structure.footerHeight}px)`);
    }

    const visibleCards = () => page.locator("[data-player-card]:visible");
    if (await visibleCards().count() !== 8) issues.push("Initial player page must show 8 cards");
    if ((await page.locator("[data-player-result-count]").textContent()).trim() !== `${structure.playerCount} players found`) issues.push("Initial player count is incorrect");
    const artworkOrder = await page.locator("[data-player-card]").evaluateAll((cards) => cards.map((card) => card.dataset.artworkStandard));
    const firstNonStandard = artworkOrder.indexOf("false");
    if (artworkOrder.filter((value) => value === "true").length !== structure.standardArtworkCount || firstNonStandard !== structure.standardArtworkCount) {
      issues.push("Standardized player artworks are not ordered before remaining records");
    }
    if (viewport.width <= 760 && await page.locator("[data-filter-toggle]").isVisible()) {
      await page.locator("[data-filter-toggle]").click();
    }
    if (!(await page.locator("[data-player-nationality]").isVisible()) || !(await page.locator("[data-player-status]").isVisible())) {
      issues.push("Nationality and squad-status filters must be visible");
    }

    const firstPageNames = await visibleCards().locator("h3").allTextContents();
    await page.locator("[data-player-next]").click();
    const secondPageNames = await visibleCards().locator("h3").allTextContents();
    if (firstPageNames.join("|") === secondPageNames.join("|")) issues.push("Next-page control did not change players");

    await page.locator("[data-player-search]").fill("Nicholas Pooran");
    if (await visibleCards().count() !== 1) issues.push("Player-name search did not return one matching card");
    if (!(await page.locator("[data-player-result-count]").textContent()).includes("1 player found")) issues.push("Filtered player count is incorrect");
    if (!new URL(page.url()).searchParams.has("q")) issues.push("Player filters are not preserved in the URL");

    await page.locator("[data-player-filters]").evaluate((form) => form.reset());
    await page.waitForTimeout(50);
    const expectedRoleCounts = await page.locator("[data-player-card]").evaluateAll((cards) =>
      cards.reduce((counts, card) => {
        card.dataset.role.split(/\s+/).forEach((role) => {
          counts[role] = (counts[role] || 0) + 1;
        });
        return counts;
      }, {}),
    );
    for (const role of ["batter", "allrounder", "bowler"]) {
      await setSelectValue("[data-player-role]", role);
      const actual = Number.parseInt(
        await page.locator("[data-player-result-count]").textContent(),
        10,
      );
      if (actual !== (expectedRoleCounts[role] || 0) || actual < 2) {
        issues.push("Role filter did not return the expected " + role + " count");
      }
    }
    await page.locator("[data-player-filters]").evaluate((form) => form.reset());
    await page.waitForTimeout(50);
    const expectedNationalityCounts = await page.locator("[data-player-card]").evaluateAll((cards) =>
      cards.reduce((counts, card) => {
        counts[card.dataset.nationality] = (counts[card.dataset.nationality] || 0) + 1;
        return counts;
      }, {}),
    );
    const nationalityOptions = await page.locator("[data-player-nationality] option").evaluateAll((options) =>
      options.map((option) => option.value).filter((value) => value !== "all"),
    );
    for (const nationality of nationalityOptions) {
      await setSelectValue("[data-player-nationality]", nationality);
      const actual = Number.parseInt(
        await page.locator("[data-player-result-count]").textContent(),
        10,
      );
      if (actual !== (expectedNationalityCounts[nationality] || 0)) {
        issues.push("Nationality filter did not return the expected " + nationality + " count");
      }
    }
    await page.locator("[data-player-filters]").evaluate((form) => form.reset());
    await page.waitForTimeout(50);
    const expectedStatusCounts = await page.locator("[data-player-card]").evaluateAll((cards) =>
      cards.reduce((counts, card) => {
        counts[card.dataset.status] = (counts[card.dataset.status] || 0) + 1;
        return counts;
      }, {}),
    );
    const statusOptions = await page.locator("[data-player-status] option").evaluateAll((options) =>
      options.map((option) => option.value).filter((value) => value !== "all"),
    );
    for (const status of statusOptions) {
      await setSelectValue("[data-player-status]", status);
      const actual = Number.parseInt(
        await page.locator("[data-player-result-count]").textContent(),
        10,
      );
      if (actual !== (expectedStatusCounts[status] || 0) || actual < 1) {
        issues.push("Squad status filter did not return the expected " + status + " count");
      }
    }
    await page.locator("[data-player-filters]").evaluate((form) => form.reset());
    await page.waitForTimeout(50);
    await setSelectValue("[data-player-team]", "GAW");
    if (!(await page.locator("[data-player-result-count]").textContent()).includes("17 players found")) issues.push("Team filter did not return the verified Guyana squad count");
    await setSelectValue("[data-player-role]", "bowler");
    const combinedCount = Number.parseInt(
      await page.locator("[data-player-result-count]").textContent(),
      10,
    );
    if (combinedCount < 1 || combinedCount > 17) issues.push("Combined team and role filters did not narrow the directory");

    await page.locator("[data-player-search]").fill("No Such CPL Player");
    if (await visibleCards().count() !== 0 || !(await page.locator("[data-player-empty]").isVisible())) issues.push("Empty search state did not render");

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 1) issues.push(`Page has ${overflow}px horizontal overflow`);

    if (viewport.width <= 900) {
      const toggle = page.locator(".nav-toggle");
      await toggle.click();
      const close = page.locator(".mobile-nav-close");
      await close.waitFor({ state: "visible", timeout: 5000 });
      const box = await close.boundingBox();
      if (!box || box.width < 44 || box.height < 44) issues.push("Mobile menu close target is smaller than 44px");
      await close.click();
      if (await toggle.getAttribute("aria-expanded") !== "false") issues.push("Mobile menu did not close");
    }
  } finally {
    await context.close();
  }
  return issues;
}

(async () => {
  const server = await startLocalServer();
  const executablePath = findBrowser();
  if (!executablePath) throw new Error("Chrome or Edge was not found.");
  const browser = await chromium.launch({ executablePath, headless: true });
  const viewports = [
    { width: 1440, height: 1000 },
    { width: 768, height: 1024 },
    { width: 430, height: 932 },
    { width: 320, height: 568 }
  ];
  let failed = false;
  try {
    for (const viewport of viewports) {
      const issues = await auditViewport(browser, viewport);
      console.log(`${viewport.width}px: ${issues.length ? issues.join("; ") : "passed"}`);
      if (issues.length) failed = true;
    }
  } finally {
    await browser.close();
    if (server) server.kill();
  }
  if (failed) process.exitCode = 1;
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
