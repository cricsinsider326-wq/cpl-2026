const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const sharp = require("sharp");

const project = path.resolve(__dirname, "..");
const assetRoot = path.join(project, "assets", "images");

const slugify = (value) => String(value)
  .toLowerCase()
  .replace(/&/g, "and")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

async function readJson(relative) {
  return JSON.parse(await fs.readFile(path.join(project, relative), "utf8"));
}

async function writeJson(relative, data) {
  await fs.writeFile(path.join(project, relative), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function ensureDir(relative) {
  await fs.mkdir(path.join(assetRoot, relative), { recursive: true });
}

async function convertFile(source, destination, options = {}) {
  await sharp(source).webp({ quality: 92, effort: 6, ...options }).toFile(destination);
}

async function downloadToWebp(url, destination, options = {}) {
  const response = await fetch(url, { headers: { "user-agent": "CPLInsider asset localization" } });
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await sharp(buffer).webp({ quality: 90, effort: 6, ...options }).toFile(destination);
}

async function localizeCollection(relative, field, folder, options = {}) {
  const items = await readJson(relative);
  await ensureDir(folder);
  const cache = new Map();
  for (const item of items) {
    const source = item[field];
    if (String(source).startsWith("/assets/")) continue;
    const name = `${slugify(item.slug || item.name)}.webp`;
    const destination = path.join(assetRoot, folder, name);
    if (!cache.has(source)) {
      await downloadToWebp(source, destination, options);
      cache.set(source, `/assets/images/${folder}/${name}`);
      console.log(`localized ${source} -> ${destination}`);
    } else if (!(await fs.stat(destination).catch(() => null))) {
      await fs.copyFile(path.join(project, cache.get(source)), destination);
    }
    item[field] = cache.get(source);
  }
  await writeJson(relative, items);
}

async function main() {
  await ensureDir("hero");
  await ensureDir("brand");
  const referenceHero = path.join(assetRoot, "hero", "cpl-2026-css-hero-reference.png");
  const referenceBrand = path.join(assetRoot, "brand", "cpl-2026-brand-lockup.png");
  if (await fs.stat(referenceHero).catch(() => null)) {
    await convertFile(referenceHero, path.join(assetRoot, "hero", "cpl-2026-css-hero-reference.webp"), { quality: 100 });
  }
  if (await fs.stat(referenceBrand).catch(() => null)) {
    await convertFile(referenceBrand, path.join(assetRoot, "brand", "cpl-2026-brand-lockup.webp"), { lossless: true });
  }

  await localizeCollection("src/data/players.json", "photo", "players");
  await localizeCollection("src/data/teams.json", "logo", "teams", { lossless: true });
  await localizeCollection("src/data/news.json", "image", "news");
  await localizeCollection("src/data/venues.json", "image", "venues");

  const matchCentre = await readJson("src/data/homeMatchCentre.json");
  await ensureDir("highlights");
  const highlight = matchCentre.featuredHighlight;
  const highlightPath = path.join(assetRoot, "highlights", "cpl-classic-highlights.webp");
  if (!String(highlight.thumbnail).startsWith("/assets/")) {
    await downloadToWebp(highlight.thumbnail, highlightPath, { quality: 90 });
    highlight.thumbnail = "/assets/images/highlights/cpl-classic-highlights.webp";
  }
  await writeJson("src/data/homeMatchCentre.json", matchCentre);

  const pngs = [];
  async function collect(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await collect(full);
      else if (entry.name.toLowerCase().endsWith(".png")) pngs.push(full);
    }
  }
  await collect(assetRoot);
  for (const png of pngs) {
    if (png.endsWith("cpl-2026-css-hero-reference.png") || png.endsWith("cpl-2026-brand-lockup.png")) continue;
    const webp = png.replace(/\.png$/i, ".webp");
    if (!(await fs.stat(webp).catch(() => null))) await convertFile(png, webp);
  }
  console.log(`localized assets; ${pngs.length} original PNG assets scanned`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
