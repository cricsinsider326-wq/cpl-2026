const fs = require("fs");
const http = require("http");
const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("playwright-core");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);
const valueFor = (name, fallback) => {
  const prefix = `${name}=`;
  const match = args.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
};

const baseUrl = valueFor("--url", hasFlag("--live") ? "https://cplinsider.com" : "http://127.0.0.1:4177");
const strictWarnings = hasFlag("--strict-warnings");
const screenshotMode = valueFor("--screenshots", "failures");
const routeArg = valueFor("--routes", "");
const routes = routeArg
  ? routeArg.split(",").map((route) => route.trim()).filter(Boolean)
  : ["/", "/fixtures/", "/results/", "/live-score/", "/teams/", "/players/", "/points-table/", "/how-to-watch/"];
const allViewports = [
  { name: "desktop-wide", width: 1440, height: 1000 },
  { name: "desktop", width: 1280, height: 900 },
  { name: "laptop", width: 1024, height: 900 },
  { name: "tablet-landscape", width: 900, height: 600 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile-landscape", width: 844, height: 390 },
  { name: "phablet", width: 540, height: 960 },
  { name: "mobile-large", width: 430, height: 932 },
  { name: "mobile", width: 390, height: 844 },
  { name: "mobile-medium", width: 375, height: 812 },
  { name: "mobile-compact", width: 360, height: 800 },
  { name: "mobile-small", width: 320, height: 568 }
];
const viewportArg = valueFor("--viewports", "");
const requestedViewports = new Set(viewportArg.split(",").map((name) => name.trim()).filter(Boolean));
const viewports = requestedViewports.size ? allViewports.filter((viewport) => requestedViewports.has(viewport.name)) : allViewports;

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function safeName(route) {
  if (route === "/") return "home";
  return route.replace(/^\/|\/$/g, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isReachable(url) {
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
  if (!baseUrl.startsWith("http://127.0.0.1") && !baseUrl.startsWith("http://localhost")) return null;
  if (await isReachable(baseUrl)) return null;

  const parsed = new URL(baseUrl);
  const child = spawn(process.execPath, ["server.js"], {
    cwd: root,
    env: { ...process.env, PORT: parsed.port || "8080" },
    stdio: ["ignore", "pipe", "pipe"]
  });

  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await isReachable(baseUrl)) return child;
    if (child.exitCode !== null) break;
    await wait(250);
  }

  child.kill();
  throw new Error(`Could not start local preview at ${baseUrl}`);
}

async function auditTabs(page, viewport) {
  const issues = [];
  const tabs = page.locator("[data-tabs] [role='tab']");
  const count = await tabs.count();
  if (!count) return issues;

  if (viewport.width >= 901) {
    const widths = await tabs.evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().width)));
    if (Math.max(...widths) - Math.min(...widths) > 6) {
      issues.push({
        severity: "warning",
        type: "uneven-tabs",
        selector: "[data-tabs] [role='tab']",
        detail: `Desktop tab widths differ: ${widths.join(", ")}px`
      });
    }
  }

  for (let index = 0; index < count; index += 1) {
    const tab = tabs.nth(index);
    const panelId = await tab.getAttribute("aria-controls");
    await tab.click();
    const result = await page.locator(`#${panelId}`).evaluate((panel) => {
      const wrap = panel.querySelector(".pm-hub-table-wrap");
      const matchups = [...panel.querySelectorAll(".pm-hub-matchup")];
      const matchupIssues = matchups.flatMap((matchup, matchupIndex) => {
        const logos = [...matchup.querySelectorAll("img")];
        const teams = [...matchup.querySelectorAll(":scope > span")];
        const versus = matchup.querySelector("b");
        if (logos.length !== 2 || teams.length !== 2 || !versus) {
          return [{ matchupIndex, detail: "Expected two team logos and one VS label." }];
        }
        const centers = [teams[0], versus, teams[1]].map((item) => {
          const rect = item.getBoundingClientRect();
          return rect.left + rect.width / 2;
        });
        const leftGap = centers[1] - centers[0];
        const rightGap = centers[2] - centers[1];
        const bounds = matchup.getBoundingClientRect();
        const outside = logos.some((logo) => {
          const rect = logo.getBoundingClientRect();
          return rect.left < bounds.left - 1 || rect.right > bounds.right + 1;
        });
        if (Math.abs(leftGap - rightGap) > 5 || outside) {
          return [{
            matchupIndex,
            detail: `Logo/VS gaps are ${leftGap.toFixed(1)}px and ${rightGap.toFixed(1)}px${outside ? "; a logo exceeds the match cell" : ""}.`
          }];
        }
        return [];
      });
      return {
        hidden: panel.hidden,
        textLength: panel.textContent.trim().length,
        overflow: wrap ? Math.max(0, wrap.scrollWidth - wrap.clientWidth) : 0,
        matchupIssues
      };
    });

    if (result.hidden || result.textLength < 80) {
      issues.push({
        severity: "error",
        type: "empty-tab",
        selector: `#${panelId}`,
        detail: `Tab panel is ${result.hidden ? "hidden" : "too short"} after activation.`
      });
    }
    if (result.overflow > 1) {
      issues.push({
        severity: "error",
        type: "tab-overflow",
        selector: `#${panelId} .pm-hub-table-wrap`,
        detail: `Tab content overflows horizontally by ${result.overflow}px at ${viewport.width}px.`
      });
    }
    result.matchupIssues.forEach((issue) => {
      issues.push({
        severity: "error",
        type: "matchup-alignment",
        selector: `#${panelId} .pm-hub-matchup:nth-of-type(${issue.matchupIndex + 1})`,
        detail: issue.detail
      });
    });
  }

  await tabs.first().click();
  return issues;
}

async function auditPage(page, viewport) {
  return page.evaluate(({ width }) => {
    const issues = [];
    const isVisible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    };
    const selectorFor = (element) => {
      if (element.id) return `#${element.id}`;
      const classes = [...element.classList].slice(0, 3);
      return `${element.tagName.toLowerCase()}${classes.map((name) => `.${name}`).join("")}`;
    };
    const add = (severity, type, element, detail) => {
      issues.push({ severity, type, selector: selectorFor(element), detail });
    };

    if (Math.abs(innerWidth - width) > 1) {
      issues.push({
        severity: "error",
        type: "viewport-mismatch",
        selector: "html",
        detail: `Requested ${width}px but browser rendered ${innerWidth}px.`
      });
    }

    const pageOverflow = Math.max(0, document.documentElement.scrollWidth - innerWidth);
    if (pageOverflow > 1) {
      issues.push({
        severity: "error",
        type: "page-overflow",
        selector: "html",
        detail: `Page is ${pageOverflow}px wider than the ${innerWidth}px viewport.`
      });
    }

    document.querySelectorAll("img").forEach((image) => {
      if (!isVisible(image)) return;
      if (!image.complete || image.naturalWidth === 0) {
        add("error", "broken-image", image, `Image failed to render: ${image.currentSrc || image.src}`);
      }
    });

    const textSelectors = [
      "h1", "h2", "h3", "h4", "p", "li", "td", "th", "label",
      "button", ".primary-button", ".secondary-button", ".ticket-button"
    ].join(",");
    document.querySelectorAll(textSelectors).forEach((element) => {
      if (!isVisible(element) || element.matches(".sr-only") || element.closest("[aria-hidden='true']") || element.hasAttribute("data-ui-audit-ignore")) return;
      const text = element.textContent.replace(/\s+/g, " ").trim();
      if (!text) return;
      const style = getComputedStyle(element);
      const fontSize = parseFloat(style.fontSize);
      const lineHeight = parseFloat(style.lineHeight);
      const clipsX = element.scrollWidth - element.clientWidth > 3 && ["hidden", "clip"].includes(style.overflowX);
      const clipsY = element.scrollHeight - element.clientHeight > 3 && ["hidden", "clip"].includes(style.overflowY);

      if (clipsX || clipsY) {
        add("error", "clipped-text", element, `Text is clipped by ${clipsX ? "width" : "height"} (${element.clientWidth}x${element.clientHeight}px).`);
      }
      if (fontSize < 11) {
        add("error", "tiny-text", element, `Rendered font size is ${fontSize.toFixed(1)}px.`);
      } else if (fontSize < 13 && text.length > 28 && !element.matches("th, .eyebrow, .pm-disclaimer")) {
        add("warning", "small-copy", element, `Long copy renders at ${fontSize.toFixed(1)}px.`);
      }
      if (element.matches("p, li, td") && text.length > 45 && Number.isFinite(lineHeight) && lineHeight / fontSize < 1.18) {
        add("warning", "tight-line-height", element, `Line-height ratio is ${(lineHeight / fontSize).toFixed(2)}.`);
      }

      if (width <= 700 && !element.closest(".rh-table-wrap")) {
        const container = element.closest(".rh-panel, .rh-newsletter, .rh-feature-tile, .rh-team-card");
        if (container) {
          const elementRect = element.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          if (elementRect.left < containerRect.left - 1 || elementRect.right > containerRect.right + 1) {
            add("error", "text-outside-container", element, `Text bounds ${Math.round(elementRect.left)}px to ${Math.round(elementRect.right)}px exceed its container.`);
          }
        }
      }
    });

    document.querySelectorAll(".rh-hero-content h1 > span, .rh-hero-content h1 > strong").forEach((line) => {
      if (!isVisible(line)) return;
      const lineRect = line.getBoundingClientRect();
      const headingRect = line.parentElement.getBoundingClientRect();
      if (lineRect.left < headingRect.left - 1 || lineRect.right > headingRect.right + 1 || line.scrollWidth > line.clientWidth + 1) {
        add("error", "hero-heading-line-overflow", line, `Hero heading line exceeds its ${Math.round(headingRect.width)}px container.`);
      }
    });

    if (width <= 700) {
      const controls = "button, input, select, .primary-button, .secondary-button, .ticket-button, .pm-hub-row-link, .nav-toggle";
      document.querySelectorAll(controls).forEach((element) => {
        if (!isVisible(element)) return;
        const rect = element.getBoundingClientRect();
        if (rect.width < 40 || rect.height < 40) {
          add("warning", "small-touch-target", element, `Touch target is ${Math.round(rect.width)}x${Math.round(rect.height)}px.`);
        }
      });
    }

    document.querySelectorAll("main > section, main > article").forEach((section) => {
      if (!isVisible(section)) return;
      const rect = section.getBoundingClientRect();
      if (rect.left < -1 || rect.right > innerWidth + 1) {
        add("error", "section-outside-viewport", section, `Section bounds are ${Math.round(rect.left)}px to ${Math.round(rect.right)}px.`);
      }
    });

    const hero = document.querySelector(".home-page > .hero, .rh-home > .rh-hero");
    const heroContent = hero?.querySelector(".hero-content, .rh-hero-content");
    if (hero && heroContent && width >= 1000) {
      const heroRect = hero.getBoundingClientRect();
      const contentRect = heroContent.getBoundingClientRect();
      const contentShare = (contentRect.right - heroRect.left) / heroRect.width;
      if (contentShare > 0.54) {
        add("warning", "hero-safe-area", heroContent, `Hero text uses ${(contentShare * 100).toFixed(1)}% of the hero width and may overlap player artwork.`);
      }
    }

    const heroFacts = hero?.querySelector(".rh-hero-facts");
    if (heroContent && heroFacts && width > 760) {
      const contentRect = heroContent.getBoundingClientRect();
      const factsRect = heroFacts.getBoundingClientRect();
      const overlapsX = contentRect.left < factsRect.right && contentRect.right > factsRect.left;
      const overlapsY = contentRect.top < factsRect.bottom && contentRect.bottom > factsRect.top;
      if (overlapsX && overlapsY) {
        add("error", "hero-facts-overlap", heroFacts, "Hero facts overlap the heading, paragraph, or CTA content.");
      }
    }

    document.querySelectorAll(".pm-player-watch-card").forEach((card) => {
      if (!isVisible(card)) return;
      const portrait = card.querySelector(".pm-player-cutout-frame");
      const copy = card.querySelector(".pm-player-watch-copy");
      if (!portrait || !copy || !isVisible(portrait) || !isVisible(copy)) return;
      const portraitRect = portrait.getBoundingClientRect();
      const copyRect = copy.getBoundingClientRect();
      if (portraitRect.right > copyRect.left + 1) {
        add("error", "player-card-overlap", card, `Portrait frame overlaps player copy by ${Math.round(portraitRect.right - copyRect.left)}px.`);
      }

      const copyRows = ["h3", "p", "span", "em"]
        .map((selector) => copy.querySelector(selector))
        .filter((element) => element && isVisible(element));
      copyRows.slice(1).forEach((row, index) => {
        const previous = copyRows[index];
        const previousRect = previous.getBoundingClientRect();
        const rowRect = row.getBoundingClientRect();
        if (previousRect.bottom > rowRect.top + 1) {
          add("error", "player-copy-overlap", card, `${selectorFor(previous)} overlaps ${selectorFor(row)}.`);
        }
      });
    });

    const referenceHome = document.querySelector(".rh-home");
    if (referenceHome) {
      const visibleH1s = [...referenceHome.querySelectorAll("h1")].filter(isVisible);
      if (visibleH1s.length !== 1) {
        issues.push({ severity: "error", type: "heading-structure", selector: ".rh-home", detail: `Expected one visible H1, found ${visibleH1s.length}.` });
      }

      if (width <= 700) {
        const expectedOrder = [".rh-hero", ".rh-next-match", ".rh-upcoming", ".rh-teams", ".rh-news", ".rh-standings", ".rh-feature-tiles", ".pm-player-showcase", ".rh-watch", ".rh-venues", ".rh-faq", ".rh-newsletter"];
        const positions = expectedOrder.map((selector) => {
          const element = referenceHome.querySelector(selector);
          return { selector, top: element ? element.getBoundingClientRect().top + scrollY : null };
        });
        for (let index = 1; index < positions.length; index += 1) {
          const previous = positions[index - 1];
          const current = positions[index];
          if (previous.top === null || current.top === null || current.top + 1 < previous.top) {
            issues.push({ severity: "error", type: "mobile-section-order", selector: current.selector, detail: `${current.selector} must follow ${previous.selector} on mobile.` });
          }
        }
      }
    }

    return issues;
  }, { width: viewport.width });
}

function renderHtml(report) {
  const rows = report.runs.flatMap((run) => run.issues.map((issue) => `
    <tr>
      <td><span class="${issue.severity}">${issue.severity}</span></td>
      <td>${run.viewport}</td>
      <td><code>${run.route}</code></td>
      <td>${issue.type}</td>
      <td><code>${issue.selector}</code></td>
      <td>${issue.detail}</td>
    </tr>`)).join("");
  const empty = rows || '<tr><td colspan="6">No UI issues detected.</td></tr>';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CPL Insider UI audit</title>
  <style>
    body{margin:0;padding:32px;background:#080c1f;color:#eef2ff;font:15px/1.5 Arial,sans-serif}
    h1{margin:0 0 8px}.summary{margin-bottom:24px;color:#bdc5df}
    table{width:100%;border-collapse:collapse;background:#0e142c}
    th,td{padding:10px 12px;border:1px solid #29314f;text-align:left;vertical-align:top}
    th{background:#151d3a}code{color:#ffda18}.error{color:#ff7d8a}.warning{color:#ffd45c}
  </style>
</head>
<body>
  <h1>CPL Insider responsive UI audit</h1>
  <p class="summary">${report.summary.errors} errors, ${report.summary.warnings} warnings across ${report.runs.length} route/viewports. Generated ${report.generatedAt}.</p>
  <table><thead><tr><th>Severity</th><th>Viewport</th><th>Route</th><th>Check</th><th>Selector</th><th>Detail</th></tr></thead><tbody>${empty}</tbody></table>
</body>
</html>`;
}

async function main() {
  const executablePath = findBrowser();
  if (!executablePath) {
    throw new Error("Chrome or Edge was not found. Set CHROME_PATH to a Chromium executable.");
  }

  const server = await startLocalServer();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportDir = path.join(root, "reports", "ui-audit", stamp);
  fs.mkdirSync(reportDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ["--disable-gpu", "--hide-scrollbars"]
  });
  const runs = [];

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
      const page = await context.newPage();
      for (const route of routes) {
        const url = new URL(route, `${baseUrl.replace(/\/$/, "")}/`).href;
        const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.evaluate(() => document.fonts?.ready);
        await page.evaluate(async () => {
          const images = [...document.querySelectorAll("img")];
          images.forEach((image) => {
            if (image.loading === "lazy") image.loading = "eager";
          });
          const pageHeight = document.documentElement.scrollHeight;
          const scrollStep = Math.max(320, Math.round(innerHeight * 0.8));
          for (let offset = 0; offset < pageHeight; offset += scrollStep) {
            scrollTo(0, offset);
            await new Promise((resolve) => setTimeout(resolve, 40));
          }
          scrollTo(0, 0);
          await Promise.all(images.map((image) => {
            if (image.complete) return Promise.resolve();
            return new Promise((resolve) => {
              const done = () => resolve();
              image.addEventListener("load", done, { once: true });
              image.addEventListener("error", done, { once: true });
              setTimeout(done, 8000);
            });
          }));
        });
        await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(250);
        const issues = [];
        if (!response || response.status() >= 400) {
          issues.push({
            severity: "error",
            type: "http-status",
            selector: "document",
            detail: `Page returned ${response ? response.status() : "no response"}.`
          });
        } else {
          issues.push(...await auditPage(page, viewport));
          issues.push(...await auditTabs(page, viewport));
        }

        const shouldCapture = screenshotMode === "all" || (screenshotMode === "failures" && issues.length > 0) || (screenshotMode === "default" && route === "/" && viewport.name !== "tablet");
        let screenshot = "";
        if (shouldCapture) {
          screenshot = `${viewport.name}-${safeName(route)}.webp`;
          const screenshotBuffer = await page.screenshot({
            fullPage: true,
            type: "png"
          });
          await sharp(screenshotBuffer).webp({ quality: 78 }).toFile(path.join(reportDir, screenshot));
        }
        runs.push({ viewport: viewport.name, width: viewport.width, route, url, screenshot, issues });
        const errors = issues.filter((issue) => issue.severity === "error").length;
        const warnings = issues.length - errors;
        console.log(`${viewport.name.padEnd(7)} ${route.padEnd(16)} ${errors} error(s), ${warnings} warning(s)`);
      }
      await context.close();
    }
  } finally {
    await browser.close();
    if (server) server.kill();
  }

  const summary = {
    errors: runs.flatMap((run) => run.issues).filter((issue) => issue.severity === "error").length,
    warnings: runs.flatMap((run) => run.issues).filter((issue) => issue.severity === "warning").length
  };
  const report = { generatedAt: new Date().toISOString(), baseUrl, executablePath, summary, runs };
  fs.writeFileSync(path.join(reportDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(reportDir, "report.html"), renderHtml(report));
  fs.writeFileSync(path.join(root, "reports", "ui-audit", "latest.json"), `${JSON.stringify(report, null, 2)}\n`);

  console.log(`\nUI audit report: ${path.join(reportDir, "report.html")}`);
  console.log(`Summary: ${summary.errors} error(s), ${summary.warnings} warning(s)`);
  if (summary.errors || (strictWarnings && summary.warnings)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`UI audit failed: ${error.stack || error.message}`);
  process.exitCode = 1;
});
