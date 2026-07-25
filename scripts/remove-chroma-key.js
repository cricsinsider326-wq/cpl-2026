const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { ensureDirectory, parseArgs, resolveProjectPath } = require("./replication-common");

const args = parseArgs();

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

async function main() {
  const input = resolveProjectPath(args.get("input"));
  const output = resolveProjectPath(args.get("output"));
  if (!input || !output || !fs.existsSync(input)) {
    throw new Error("Usage: node scripts/remove-chroma-key.js --input=green-screen.png --output=transparent.png");
  }
  const source = sharp(input, { animated: false }).ensureAlpha();
  const metadata = await source.metadata();
  const { data, info } = await source.raw().toBuffer({ resolveWithObject: true });
  let transparentPixels = 0;
  for (let offset = 0; offset < data.length; offset += info.channels) {
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const dominance = green - Math.max(red, blue);
    const chroma = clamp((dominance - 28) / 92, 0, 1);
    if (chroma > 0) {
      data[offset + 3] = Math.round(data[offset + 3] * (1 - chroma));
      data[offset + 1] = Math.min(green, Math.max(red, blue) + 8);
      if (data[offset + 3] < 8) {
        data[offset + 3] = 0;
        transparentPixels += 1;
      }
    }
  }
  ensureDirectory(output);
  await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .png({ compressionLevel: 9 })
    .toFile(output);
  const outputMeta = await sharp(output).metadata();
  console.log(`Chroma removed: ${path.relative(process.cwd(), input)}`);
  console.log(`Saved: ${path.relative(process.cwd(), output)}`);
  console.log(`Dimensions: ${outputMeta.width}x${outputMeta.height}; transparent pixels: ${transparentPixels}`);
  if (!outputMeta.hasAlpha || !metadata.width || !metadata.height) throw new Error("Chroma output failed alpha validation.");
}

main().catch((error) => {
  console.error(`Chroma removal failed: ${error.message}`);
  process.exitCode = 1;
});
