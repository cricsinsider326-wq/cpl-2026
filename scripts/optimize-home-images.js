const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const imageRoot = path.join(root, "assets", "images");

async function writeImage(input, output, transform) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  await transform(sharp(input)).toFile(output);
}

async function optimizeHero() {
  const input = path.join(imageRoot, "hero", "cpl-2026-player-artwork.webp");
  const widths = [720, 1280];

  for (const width of widths) {
    const base = path.join(imageRoot, "hero", `cpl-2026-player-artwork-${width}`);
    await writeImage(input, `${base}.webp`, (image) => image
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 74, smartSubsample: true, effort: 5 }));
    await writeImage(input, `${base}.avif`, (image) => image
      .resize({ width, withoutEnlargement: true })
      .avif({ quality: 54, effort: 5 }));
  }
}

async function optimizeBrand() {
  const input = path.join(imageRoot, "brand", "cpl-2026-brand-lockup.webp");
  for (const width of [160, 310]) {
    await writeImage(
      input,
      path.join(imageRoot, "brand", `cpl-insider-lockup-${width}.webp`),
      (image) => image.resize({ width, withoutEnlargement: true }).webp({ quality: 76, smartSubsample: true, effort: 5 })
    );
  }
}

async function optimizeTeamLogos() {
  const teamsDir = path.join(imageRoot, "teams");
  const outputDir = path.join(teamsDir, "home");
  const files = fs.readdirSync(teamsDir)
    .filter((file) => file.endsWith(".webp") && !file.includes(".optimized."));

  for (const file of files) {
    await writeImage(
      path.join(teamsDir, file),
      path.join(outputDir, file),
      (image) => image.resize({ width: 224, height: 224, fit: "contain" }).webp({ quality: 78, alphaQuality: 86, effort: 5 })
    );
  }
}

async function optimizeNewsThumbnails() {
  const newsDir = path.join(imageRoot, "news");
  const outputDir = path.join(newsDir, "thumbs");
  const files = fs.readdirSync(newsDir).filter((file) => file.endsWith(".webp"));

  for (const file of files) {
    await writeImage(
      path.join(newsDir, file),
      path.join(outputDir, file),
      (image) => image.resize({ width: 240, height: 152, fit: "cover", position: "centre" }).webp({ quality: 72, smartSubsample: true, effort: 5 })
    );
  }
}

async function main() {
  await optimizeHero();
  await optimizeBrand();
  await optimizeTeamLogos();
  await optimizeNewsThumbnails();
  console.log("Homepage image variants optimized.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
