const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const players = require(path.join(root, "src", "data", "players.json"));
const outputPath = path.join(root, "src", "data", "playerArtwork.json");
const assetRoot = path.join(root, "assets", "images", "players");
const TARGET_WIDTH = 1120;
const TARGET_HEIGHT = 1536;

function localPath(assetPath) {
  return assetPath ? path.join(root, assetPath.replace(/^\//, "")) : null;
}

async function inspect(assetPath) {
  const filePath = localPath(assetPath);
  if (!filePath || !fs.existsSync(filePath)) return null;
  const metadata = await sharp(filePath).metadata();
  return {
    path: assetPath,
    width: metadata.width,
    height: metadata.height,
    hasAlpha: Boolean(metadata.hasAlpha),
    bytes: fs.statSync(filePath).size
  };
}

async function findApprovedCandidate(player) {
  const candidates = [
    player.heroPhoto,
    `/assets/images/players/${player.slug}-desktop-art.webp`,
    `/assets/images/players/${player.slug}-card-hq.webp`,
    player.photo
  ].filter(Boolean);

  for (const candidate of [...new Set(candidates)]) {
    const details = await inspect(candidate);
    if (
      details
      && details.width === TARGET_WIDTH
      && details.height === TARGET_HEIGHT
      && details.hasAlpha
      && details.bytes >= 50000
    ) {
      return details;
    }
  }
  return null;
}

async function main() {
  fs.mkdirSync(assetRoot, { recursive: true });
  const existing = fs.existsSync(outputPath)
    ? JSON.parse(fs.readFileSync(outputPath, "utf8"))
    : { players: [] };
  const previousBySlug = new Map(existing.players.map((entry) => [entry.slug, entry]));
  const manifest = [];

  for (const player of players) {
    const previous = previousBySlug.get(player.slug);
    const approved = await findApprovedCandidate(player);
    manifest.push({
      name: player.name,
      slug: player.slug,
      team: player.team,
      teamCode: player.teamCode || null,
      sourceIds: player.sourceIds || [],
      referencePath: previous?.referencePath || null,
      approvedAsset: approved?.path || null,
      outputPath: `/assets/images/players/${player.slug}-desktop-art.webp`,
      target: {
        width: TARGET_WIDTH,
        height: TARGET_HEIGHT,
        format: "webp",
        alpha: true,
        subjectAlignment: "bottom-center"
      },
      status: approved ? "ready" : previous?.status === "blocked" ? "blocked" : "pending",
      validation: approved
        ? {
            width: approved.width,
            height: approved.height,
            hasAlpha: approved.hasAlpha,
            bytes: approved.bytes
          }
        : null
    });
  }

  const document = {
    generatedAt: new Date().toISOString(),
    designStandard: "CPL Players to Watch transparent portrait",
    target: {
      width: TARGET_WIDTH,
      height: TARGET_HEIGHT,
      format: "webp",
      alpha: true,
      visibleSubjectBox: "consistent across every card"
    },
    players: manifest
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`);
  console.log(`Artwork manifest written for ${manifest.length} players.`);
  console.log(`Ready: ${manifest.filter((entry) => entry.status === "ready").length}`);
  console.log(`Pending: ${manifest.filter((entry) => entry.status === "pending").length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
