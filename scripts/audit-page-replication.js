const fs = require("fs");
const http = require("http");
const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("playwright-core");
const sharp = require("sharp");
const {
  ROOT,
  ensureDirectory,
  parseArgs,
  readJson,
  resolveProjectPath,
  slugify,
  writeJson,
} = require("./replication-common");

const args = parseArgs();
const MANIFEST = path.join(ROOT, "src", "data", "pageReplications.json");

function usage() {
  return [
    "Page replication visual audit",
    "",
    "  node scripts/audit-page-replication.js --page=players --variant=desktop",
    "",
    "Optional: --url=http://127.0.0.1:4177 --tolerance=28 --max-changed=0.35 --full-page",
  ].join("\n");
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function reachable(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 500);
    });
    request.setTimeout(1500, () => request.destroy());
    request.on("error", () => resolve(false));
  });
}

async function startServer(baseUrl) {
  if (await reachable(baseUrl)) return null;
  const port = new URL(baseUrl).port || "4177";
  const child = spawn(process.execPath, ["server.js"], {
    cwd: ROOT,
    env: { ...process.env, PORT: port },
    stdio: "ignore",
  });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (await reachable(baseUrl)) return child;
    if (child.exitCode !== null) break;
  }
  child.kill();
  throw new Error(`Could not start local preview at ${baseUrl}`);
}

async function compare(referencePath, actualPath, diffPath, tolerance) {
  const referenceMeta = await sharp(referencePath).metadata();
  const width = referenceMeta.width;
  const height = referenceMeta.height;
  const reference = await sharp(referencePath).removeAlpha().raw().toBuffer();
  const actual = await sharp(actualPath)
    .resize(width, height, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer();
  const diff = Buffer.alloc(reference.length);
  let changedPixels = 0;
  let absoluteDelta = 0;
  for (let offset = 0; offset < reference.length; offset += 3) {
    const red = Math.abs(reference[offset] - actual[offset]);
    const green = Math.abs(reference[offset + 1] - actual[offset + 1]);
    const blue = Math.abs(reference[offset + 2] - actual[offset + 2]);
    const maximum = Math.max(red, green, blue);
    absoluteDelta += red + green + blue;
    if (maximum > tolerance) changedPixels += 1;
    diff[offset] = maximum > tolerance ? 255 : Math.round(red * 0.25);
    diff[offset + 1] = maximum > tolerance ? 40 : Math.round(green * 0.25);
    diff[offset + 2] = maximum > tolerance ? 120 : Math.round(blue * 0.25);
  }
  ensureDirectory(diffPath);
  await sharp(diff, { raw: { width, height, channels: 3 } })
    .webp({ quality: 82 })
    .toFile(diffPath);
  return {
    width,
    height,
    tolerance,
    changedPixelRatio: changedPixels / (width * height),
    meanChannelDelta: absoluteDelta / reference.length,
  };
}

async function main() {
  if (args.has("help")) {
    console.log(usage());
    return;
  }
  const pageSlug = slugify(args.get("page"));
  const variant = slugify(args.get("variant", "desktop"));
  const manifest = readJson(MANIFEST, { pages: [] });
  const pageRecord = manifest.pages.find((entry) => entry.slug === pageSlug);
  if (!pageRecord) throw new Error(`No replication request found for page: ${pageSlug}`);
  const referenceRecord = pageRecord.references.find((entry) => entry.variant === variant);
  if (!referenceRecord) throw new Error(`No ${variant} reference found for page: ${pageSlug}`);
  const referencePath = resolveProjectPath(referenceRecord.path.replace(/^\//, ""));
  const route = args.get("route", pageRecord.route);
  const baseUrl = args.get("url", "http://127.0.0.1:4177");
  const tolerance = Number(args.get("tolerance", "28"));
  const maximumChanged = Number(args.get("max-changed", "0.35"));
  const browserPath = findBrowser();
  if (!browserPath) throw new Error("Chrome or Edge was not found.");
  const server = await startServer(baseUrl);
  const reportDir = path.join(ROOT, "reports", "replication", "pages", pageSlug, variant);
  const actualPath = path.join(reportDir, "actual.webp");
  const diffPath = path.join(reportDir, "difference.webp");
  ensureDirectory(actualPath);
  const browser = await chromium.launch({ executablePath: browserPath, headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: referenceRecord.width, height: referenceRecord.height },
      deviceScaleFactor: 1,
    });
    const browserPage = await context.newPage();
    const response = await browserPage.goto(new URL(route, `${baseUrl}/`).href, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    if (!response || response.status() >= 400) throw new Error(`Route returned ${response ? response.status() : "no response"}`);
    await browserPage.evaluate(() => document.fonts?.ready);
    await browserPage.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    const screenshot = await browserPage.screenshot({ type: "png", fullPage: args.has("full-page") });
    await sharp(screenshot).webp({ quality: 92 }).toFile(actualPath);
    await context.close();
  } finally {
    await browser.close();
    if (server) server.kill();
  }
  const comparison = await compare(referencePath, actualPath, diffPath, tolerance);
  const passed = comparison.changedPixelRatio <= maximumChanged;
  const report = {
    generatedAt: new Date().toISOString(),
    page: pageSlug,
    variant,
    route,
    reference: path.relative(ROOT, referencePath).replace(/\\/g, "/"),
    actual: path.relative(ROOT, actualPath).replace(/\\/g, "/"),
    difference: path.relative(ROOT, diffPath).replace(/\\/g, "/"),
    maximumChangedPixelRatio: maximumChanged,
    comparison,
    status: passed ? "passed" : "needs-review",
  };
  writeJson(path.join(reportDir, "report.json"), report);
  writeJson(path.join(ROOT, "reports", "replication", "pages", "latest.json"), report);
  console.log(`Page replication audit ${report.status}: ${(comparison.changedPixelRatio * 100).toFixed(2)}% changed pixels.`);
  console.log(`Difference image: ${report.difference}`);
  if (!passed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`Page replication audit failed: ${error.message}`);
  process.exitCode = 1;
});
