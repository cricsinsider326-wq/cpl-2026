const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const {
  ROOT,
  assertInsideProject,
  ensureDirectory,
  parseArgs,
  readJson,
  relativeWebPath,
  resolveProjectPath,
  slugify,
  writeJson,
} = require("./replication-common");

const args = parseArgs();
const REPORT_DIR = path.join(ROOT, "reports", "replication", "images");
const PLAYER_DATA = path.join(ROOT, "src", "data", "players.json");
const PLAYER_PROMPT = [
  "Create a professional waist-up cricket player promotional portrait using the reference image for identity.",
  "Front-facing athletic posture with arms crossed and a confident serious expression.",
  "Keep the full head, shoulders, elbows and crossed arms visible in a consistent 4:5 composition.",
  "Use realistic skin texture, sharp facial and jersey detail, balanced cinematic contrast and soft shoulder rim light.",
  "Use a modern unbranded cricket jersey inspired only by the supplied team colors.",
  "No official logos, sponsor names, readable branding, player name, statistics, text, badges, buttons, card UI or watermark.",
  "Return a clean transparent-background website-card-ready cutout with natural hair and shoulder edges.",
].join(" ");

function usage() {
  return [
    "Image replication pipeline",
    "",
    "Supplied hero (preserves the complete artwork):",
    "  node scripts/replicate-image.js --mode=hero --input=path/image.png --slug=home-hero",
    "",
    "Supplied transparent player portrait:",
    "  node scripts/replicate-image.js --mode=player --input=path/player.png --slug=player-slug",
    "",
    "OpenAI reference edit (paid and approval-gated):",
    "  node scripts/replicate-image.js --mode=player --input=path/reference.jpg --slug=player-slug --generate --approve --team-colors=red,black",
    "",
    "Add --update-player to update only that player's heroPhoto and artwork metadata.",
  ].join("\n");
}

async function inspectImage(filePath) {
  const metadata = await sharp(filePath, { animated: false }).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || "unknown",
    hasAlpha: Boolean(metadata.hasAlpha),
    bytes: fs.statSync(filePath).size,
  };
}

async function createHeroAsset(input, output) {
  ensureDirectory(output);
  await sharp(input, { animated: false })
    .rotate()
    .webp({ quality: 92, alphaQuality: 100, effort: 6 })
    .toFile(output);
}

async function createPlayerAsset(input, output) {
  const sourceMeta = await sharp(input, { animated: false }).metadata();
  if (!sourceMeta.hasAlpha) {
    throw new Error(
      "Player normalization requires a transparent input. Use --generate --approve or remove the background before normalization.",
    );
  }
  const trimmed = await sharp(input, { animated: false })
    .rotate()
    .ensureAlpha()
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const subject = await sharp(trimmed)
    .resize({
      width: 900,
      height: 1480,
      fit: "contain",
      position: "bottom",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const metadata = await sharp(subject).metadata();
  const left = Math.round((1120 - metadata.width) / 2);
  const top = 1536 - metadata.height;
  ensureDirectory(output);
  await sharp({
    create: {
      width: 1120,
      height: 1536,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: subject, left, top }])
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toFile(output);
}

async function generatePlayerEdit(input, prompt, outputPng) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required for --generate.");
  if (apiKey.startsWith("sk-or-")) {
    throw new Error("OPENAI_API_KEY contains an OpenRouter key. Set a direct OpenAI Platform API key, or use the built-in image generation workflow.");
  }
  const form = new FormData();
  form.set("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-2");
  form.set("prompt", prompt);
  form.set("size", "1024x1536");
  form.set("quality", "high");
  form.set("background", "transparent");
  form.set("output_format", "png");
  const bytes = fs.readFileSync(input);
  const extension = path.extname(input).toLowerCase();
  const mime = extension === ".png" ? "image/png" : extension === ".webp" ? "image/webp" : "image/jpeg";
  form.append("image[]", new Blob([bytes], { type: mime }), path.basename(input));

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(240_000),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`OpenAI image edit failed (${response.status}): ${payload.error?.message || JSON.stringify(payload)}`);
  }
  const encoded = payload.data?.[0]?.b64_json;
  if (!encoded) throw new Error("OpenAI image edit returned no b64_json output.");
  ensureDirectory(outputPng);
  fs.writeFileSync(outputPng, Buffer.from(encoded, "base64"));
}

function updatePlayer(slug, output) {
  const players = readJson(PLAYER_DATA, []);
  const player = players.find((entry) => entry.slug === slug);
  if (!player) throw new Error(`Player not found in src/data/players.json: ${slug}`);
  player.heroPhoto = relativeWebPath(output);
  player.artworkStatus = "ready";
  player.imageAlt = `${player.name} CPL player portrait`;
  player.artworkUpdatedAt = new Date().toISOString().slice(0, 10);
  writeJson(PLAYER_DATA, players);
  return player.name;
}

async function main() {
  if (args.has("help")) {
    console.log(usage());
    return;
  }
  const mode = args.get("mode");
  const input = resolveProjectPath(args.get("input"));
  const slug = slugify(args.get("slug") || (input ? path.parse(input).name : ""));
  const generate = args.has("generate");
  if (!mode || !["hero", "player"].includes(mode) || !input || !slug) {
    throw new Error(`${usage()}\n\nRequired: --mode, --input and --slug.`);
  }
  if (!fs.existsSync(input)) throw new Error(`Reference image not found: ${input}`);
  if (generate && mode !== "player") throw new Error("--generate is currently restricted to player portraits.");
  if (generate && !args.has("approve")) {
    throw new Error("Paid image generation is blocked until --approve is supplied explicitly.");
  }

  const defaultOutput = mode === "hero"
    ? path.join(ROOT, "assets", "images", "hero", `${slug}.webp`)
    : path.join(ROOT, "assets", "images", "players", `${slug}-desktop-art.webp`);
  const output = resolveProjectPath(args.get("output")) || defaultOutput;
  assertInsideProject(output, "Output");
  const report = {
    startedAt: new Date().toISOString(),
    mode,
    slug,
    input: path.relative(ROOT, input).replace(/\\/g, "/"),
    output: path.relative(ROOT, output).replace(/\\/g, "/"),
    generated: generate,
    approved: args.has("approve"),
    inputMetadata: await inspectImage(input),
    prompt: null,
    status: "running",
  };

  let workingInput = input;
  if (generate) {
    const teamColors = args.get("team-colors", "the player's team colors");
    const customPrompt = args.get("prompt", "");
    const prompt = `${PLAYER_PROMPT} Team color direction: ${teamColors}. ${customPrompt}`.trim();
    const generatedPng = path.join(ROOT, "temp", "replication", "generated", `${slug}.png`);
    report.prompt = prompt;
    await generatePlayerEdit(input, prompt, generatedPng);
    workingInput = generatedPng;
  }

  if (mode === "hero") await createHeroAsset(workingInput, output);
  else await createPlayerAsset(workingInput, output);

  const outputMetadata = await inspectImage(output);
  if (mode === "player" && (outputMetadata.width !== 1120 || outputMetadata.height !== 1536 || !outputMetadata.hasAlpha)) {
    throw new Error(`Player output validation failed: ${JSON.stringify(outputMetadata)}`);
  }
  report.outputMetadata = outputMetadata;
  report.playerUpdated = args.has("update-player") ? updatePlayer(slug, output) : null;
  report.status = "passed";
  report.finishedAt = new Date().toISOString();
  writeJson(path.join(REPORT_DIR, "latest.json"), report);
  writeJson(path.join(REPORT_DIR, `${Date.now()}-${slug}.json`), report);
  console.log(`Image replication passed: ${report.output}`);
  console.log(`${outputMetadata.width}x${outputMetadata.height}, ${outputMetadata.bytes} bytes, alpha=${outputMetadata.hasAlpha}`);
  if (!args.has("update-player") && mode === "player") {
    console.log("Player data was not changed. Re-run with --update-player after visual approval.");
  }
}

main().catch((error) => {
  console.error(`Image replication failed: ${error.message}`);
  process.exitCode = 1;
});
