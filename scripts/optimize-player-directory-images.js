const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");
const PLAYERS_PATH = path.join(ROOT, "src", "data", "players.json");
const CARD_DIR = path.join(ROOT, "assets", "images", "players", "cards");
const OG_PATH = path.join(ROOT, "assets", "images", "social", "cpl-2026-players-og.webp");
const HERO_PATH = path.join(ROOT, "assets", "images", "players", "cpl-2026-players-hero.webp");

function localAssetPath(publicPath) {
  return path.join(ROOT, publicPath.replace(/^\//, "").replace(/\//g, path.sep));
}

async function buildCardThumbnail(player) {
  if (!player.heroPhoto) return false;
  const input = localAssetPath(player.heroPhoto);
  if (!fs.existsSync(input)) throw new Error(`Missing player artwork: ${input}`);
  const output = path.join(CARD_DIR, `${player.slug}.webp`);
  await sharp(input)
    .resize(560, 768, { fit: "contain", position: "bottom", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 82, alphaQuality: 90, effort: 5 })
    .toFile(output);
  return true;
}

async function main() {
  const players = JSON.parse(fs.readFileSync(PLAYERS_PATH, "utf8"));
  fs.mkdirSync(CARD_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(OG_PATH), { recursive: true });

  let generated = 0;
  for (const player of players) {
    if (await buildCardThumbnail(player)) generated += 1;
  }

  await sharp(HERO_PATH)
    .resize(1200, 630, { fit: "cover", position: "center" })
    .webp({ quality: 86, effort: 5 })
    .toFile(OG_PATH);

  console.log(`Generated ${generated} player-card thumbnails and the 1200x630 players social image.`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
