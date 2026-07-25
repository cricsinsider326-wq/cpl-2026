const fs = require("fs");
const http = require("http");
const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("playwright-core");

const live = process.argv.includes("--live");
const screenshots = process.argv.includes("--screenshots");
const baseUrl = live ? "https://cplinsider.com/" : "http://127.0.0.1:4177/";
const screenshotDir = path.resolve(__dirname, "..", "reports", "interaction-audit");

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
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  const issues = [];
  try {
    const response = await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30000 });
    if (!response || response.status() >= 400) issues.push(`HTTP status ${response ? response.status() : "missing"}`);

    const structure = await page.evaluate(() => ({
      width: innerWidth,
      h1Count: document.querySelectorAll("main h1").length,
      skipTarget: document.querySelector(".skip-link")?.getAttribute("href"),
      targetExists: Boolean(document.querySelector("#main-content")),
      countdown: [...document.querySelectorAll(".rh-countdown-values [data-days], .rh-countdown-values [data-hours], .rh-countdown-values [data-minutes], .rh-countdown-values [data-seconds]")].map((item) => item.textContent.trim())
    }));
    if (structure.width !== viewport.width) issues.push(`Viewport rendered at ${structure.width}px instead of ${viewport.width}px`);
    if (structure.h1Count !== 1) issues.push(`Expected one H1, found ${structure.h1Count}`);
    if (structure.skipTarget !== "#main-content" || !structure.targetExists) issues.push("Skip-link target is not available");
    if (structure.countdown.length !== 4 || structure.countdown.every((value) => value === "00")) issues.push("Opening-match countdown did not initialize");

    const faq = page.locator(".rh-faq details").first();
    await faq.locator("summary").click();
    if (!(await faq.evaluate((item) => item.open))) issues.push("FAQ accordion did not open");
    await faq.locator("summary").click();

    const newsletter = page.locator(".rh-newsletter");
    if (!(await newsletter.getByText("Subscription registration is not open yet.").isVisible())) issues.push("Newsletter availability status is missing");
    if ((await newsletter.locator(".rh-newsletter-link").getAttribute("href")) !== "/news/") issues.push("Newsletter fallback must link to latest news");

    if (viewport.width >= 1000) {
      const track = page.locator("#rh-upcoming-track");
      const before = await track.evaluate((item) => item.scrollLeft);
      await page.locator("[data-scroll-next='rh-upcoming-track']").click();
      await page.waitForTimeout(500);
      const after = await track.evaluate((item) => item.scrollLeft);
      if (after <= before) issues.push("Upcoming-fixture slider did not advance");
    } else {
      const toggle = page.locator(".nav-toggle");
      await toggle.click();
      if (await toggle.getAttribute("aria-expanded") !== "true" || !(await page.locator("#primary-nav").evaluate((nav) => nav.classList.contains("is-open")))) issues.push("Mobile navigation did not open");
      await page.waitForTimeout(250);
      const drawerState = await page.locator("#primary-nav").evaluate((nav) => {
        const rect = nav.getBoundingClientRect();
        const probe = document.elementFromPoint(Math.min(innerWidth - 12, rect.right - 12), Math.min(innerHeight - 12, rect.top + 110));
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          visibleAtProbe: Boolean(probe?.closest("#primary-nav")),
          probe: probe ? `${probe.tagName.toLowerCase()}#${probe.id}.${probe.className}` : "none",
          navZ: getComputedStyle(nav).zIndex,
          headerZ: getComputedStyle(document.querySelector(".main-header")).zIndex,
          overlayZ: getComputedStyle(document.querySelector(".nav-overlay")).zIndex,
          pageOverflow: document.documentElement.scrollWidth - innerWidth,
          scrollX: window.scrollX
        };
      });
      if (drawerState.left < -1 || drawerState.right > viewport.width + 1 || drawerState.width < Math.min(240, viewport.width * 0.75)) issues.push(`Mobile navigation drawer is outside the viewport: ${JSON.stringify(drawerState)}`);
      if (!drawerState.visibleAtProbe) issues.push(`Mobile navigation drawer is obscured by the backdrop: ${JSON.stringify(drawerState)}`);
      if (drawerState.pageOverflow > 1) issues.push(`Mobile navigation creates ${drawerState.pageOverflow}px horizontal overflow`);
      if (Math.abs(drawerState.scrollX) > 1) issues.push(`Mobile navigation shifted the page horizontally by ${drawerState.scrollX}px`);
      if (!(await page.locator(".mobile-nav-close").isVisible())) issues.push("Mobile navigation close button is not visible");
      if (Math.abs(drawerState.left) > 1 || Math.abs(drawerState.right - viewport.width) > 1) issues.push(`Mobile navigation must fill the viewport below the header: ${JSON.stringify(drawerState)}`);
      if (screenshots) {
        fs.mkdirSync(screenshotDir, { recursive: true });
        await page.screenshot({ path: path.join(screenshotDir, `${live ? "live-" : ""}${viewport.name}-menu-open.png`) });
      }
      await page.keyboard.press("Escape");
      if (await toggle.getAttribute("aria-expanded") !== "false") issues.push("Mobile navigation did not close with Escape");
      await toggle.click();
      await page.waitForTimeout(250);
      await page.locator(".mobile-nav-close").click();
      if (await toggle.getAttribute("aria-expanded") !== "false") issues.push("Mobile navigation did not close with its close button");
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
    { name: "desktop", width: 1440, height: 1000 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
    { name: "mobile-small", width: 320, height: 568 }
  ];
  let failed = false;
  try {
    for (const viewport of viewports) {
      const issues = await auditViewport(browser, viewport);
      console.log(`${viewport.name}: ${issues.length ? issues.join("; ") : "passed"}`);
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
