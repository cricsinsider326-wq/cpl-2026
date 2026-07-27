const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function projectPath(value) {
  return path.resolve(root, value);
}

async function main() {
  const inputArg = valueAfter("--input");
  const outputArg = valueAfter("--output");
  if (!inputArg || !outputArg) {
    throw new Error("Usage: node scripts/remove-chroma-background.js --input path/image.png --output path/image.png");
  }

  const input = projectPath(inputArg);
  const output = projectPath(outputArg);
  if (!fs.existsSync(input)) throw new Error(`Input image not found: ${input}`);

  const source = sharp(input).rotate().ensureAlpha();
  const metadata = await source.metadata();
  const { data, info } = await source.raw().toBuffer({ resolveWithObject: true });
  let transparentPixels = 0;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];
    const nonGreen = Math.max(red, blue);
    const dominance = green - nonGreen;

    if (green > 110 && dominance > 58) {
      const keyStrength = Math.min(1, Math.max(0, (dominance - 58) / 82));
      const luminanceStrength = Math.min(1, Math.max(0, (green - 110) / 95));
      const matte = Math.max(keyStrength, luminanceStrength * 0.85);
      const nextAlpha = Math.round(alpha * (1 - matte));
      data[index + 3] = nextAlpha;
      if (nextAlpha < 255) {
        data[index + 1] = Math.min(green, nonGreen + 12);
      }
      if (nextAlpha === 0) transparentPixels += 1;
    }
  }

  fs.mkdirSync(path.dirname(output), { recursive: true });
  await sharp(data, { raw: info })
    .png({ compressionLevel: 9 })
    .toFile(output);

  const result = await sharp(output).metadata();
  if (!result.hasAlpha || result.width !== metadata.width || result.height !== metadata.height) {
    throw new Error(`Transparent output validation failed: ${JSON.stringify(result)}`);
  }
  console.log(`Removed chroma background: ${path.relative(root, output)}`);
  console.log(`${result.width}x${result.height}, transparent pixels: ${transparentPixels}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
