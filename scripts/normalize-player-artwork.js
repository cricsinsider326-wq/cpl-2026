const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

async function main() {
  const slug = valueAfter("--slug");
  const inputArg = valueAfter("--input");
  const outputArg = valueAfter("--output");
  if (!slug || !inputArg) {
    throw new Error("Usage: node scripts/normalize-player-artwork.js --slug player-slug --input path-to-transparent-image [--output path]");
  }

  const input = path.resolve(root, inputArg);
  const output = outputArg
    ? path.resolve(root, outputArg)
    : path.join(root, "assets", "images", "players", `${slug}-desktop-art.webp`);
  if (!fs.existsSync(input)) throw new Error(`Input image not found: ${input}`);

  const source = sharp(input, { failOn: "error" }).ensureAlpha();
  const trimmedBuffer = await source.trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const subject = await sharp(trimmedBuffer)
    .resize({
      width: 900,
      height: 1480,
      fit: "contain",
      position: "bottom",
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();
  const subjectMeta = await sharp(subject).metadata();
  const left = Math.round((1120 - subjectMeta.width) / 2);
  const top = 1536 - subjectMeta.height;

  fs.mkdirSync(path.dirname(output), { recursive: true });
  await sharp({
    create: {
      width: 1120,
      height: 1536,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: subject, left, top }])
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toFile(output);

  const result = await sharp(output).metadata();
  if (result.width !== 1120 || result.height !== 1536 || !result.hasAlpha) {
    throw new Error(`Normalized output failed validation: ${JSON.stringify(result)}`);
  }
  console.log(`Normalized ${slug}: ${result.width}x${result.height} transparent WebP`);
  console.log(`Saved: ${path.relative(root, output)}`);
  console.log(`Bytes: ${fs.statSync(output).size}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
