const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const players = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "players.json"), "utf8"));
const sourceManifestPath = path.join(root, "src", "data", "playerImageSources.json");
const sourceManifest = fs.existsSync(sourceManifestPath)
  ? JSON.parse(fs.readFileSync(sourceManifestPath, "utf8"))
  : { sources: [] };
const sourcesBySlug = new Map((sourceManifest.sources || []).map((source) => [source.slug, source]));

function localPath(webPath) {
  return webPath && webPath.startsWith("/") ? path.join(root, webPath.slice(1)) : null;
}

async function inspect(webPath) {
  const file = localPath(webPath);
  if (!file || !fs.existsSync(file)) return null;
  const metadata = await sharp(file).metadata();
  return {
    path: webPath,
    width: metadata.width || 0,
    height: metadata.height || 0,
    hasAlpha: Boolean(metadata.hasAlpha),
    format: metadata.format || "unknown",
    bytes: fs.statSync(file).size,
  };
}

function classify(player, hero, photo) {
  if (hero && hero.width === 1120 && hero.height === 1536 && hero.hasAlpha && hero.format === "webp") {
    return "standard";
  }
  if (photo?.hasAlpha) return "needs-regeneration";
  if (photo) return "needs-clean-reference";
  return "needs-reference";
}

async function main() {
  const records = [];
  for (const player of players) {
    const hero = await inspect(player.heroPhoto);
    const photo = await inspect(player.photo);
    const source = sourcesBySlug.get(player.slug);
    records.push({
      slug: player.slug,
      name: player.name,
      team: player.team,
      teamCode: player.teamCode,
      status: classify(player, hero, photo),
      currentArtwork: hero || photo,
      source: source
        ? {
            type: source.sourceType,
            page: source.sourcePageUrl,
            image: source.sourceImageUrl,
          }
        : null,
    });
  }

  const summary = records.reduce((totals, record) => {
    totals[record.status] = (totals[record.status] || 0) + 1;
    return totals;
  }, {});
  const report = {
    generatedAt: new Date().toISOString(),
    standard: {
      width: 1120,
      height: 1536,
      format: "webp",
      requiresAlpha: true,
      visualDirection: "recognizable player, full head and crossed arms, unbranded CPL-inspired team-color jersey, transparent background",
    },
    summary,
    queue: records.filter((record) => record.status !== "standard"),
    records,
  };
  const output = path.join(root, "reports", "player-artwork-audit.json");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ output: path.relative(root, output), total: records.length, ...summary }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
