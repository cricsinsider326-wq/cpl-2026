const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const [, , inputArg, outputArg] = process.argv;

if (!inputArg || !outputArg) {
  console.error("Usage: node scripts/remove-checker-background.js <input> <output>");
  process.exit(1);
}

const input = path.resolve(inputArg);
const output = path.resolve(outputArg);

function isLightNeutral(data, index, relaxed = false) {
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min <= (relaxed ? 30 : 24) && min >= (relaxed ? 150 : 185);
}

async function run() {
  const { data, info } = await sharp(input)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const pixels = width * height;
  const background = new Uint8Array(pixels);
  const queue = new Int32Array(pixels);
  let head = 0;
  let tail = 0;

  const enqueue = (pixel) => {
    if (background[pixel]) return;
    const index = pixel * channels;
    if (!isLightNeutral(data, index)) return;
    background[pixel] = 1;
    queue[tail++] = pixel;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  while (head < tail) {
    const pixel = queue[head++];
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    if (x > 0) enqueue(pixel - 1);
    if (x + 1 < width) enqueue(pixel + 1);
    if (y > 0) enqueue(pixel - width);
    if (y + 1 < height) enqueue(pixel + width);
  }

  // Pull the mask through pale anti-aliased edge pixels to avoid a white halo.
  for (let pass = 0; pass < 2; pass += 1) {
    const additions = [];
    for (let pixel = 0; pixel < pixels; pixel += 1) {
      if (background[pixel] || !isLightNeutral(data, pixel * channels, true)) continue;
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      const touchesBackground =
        (x > 0 && background[pixel - 1]) ||
        (x + 1 < width && background[pixel + 1]) ||
        (y > 0 && background[pixel - width]) ||
        (y + 1 < height && background[pixel + width]);
      if (touchesBackground) additions.push(pixel);
    }
    for (const pixel of additions) background[pixel] = 1;
  }

  const rgba = Buffer.alloc(pixels * 4);
  for (let pixel = 0; pixel < pixels; pixel += 1) {
    const source = pixel * channels;
    const target = pixel * 4;
    rgba[target] = data[source];
    rgba[target + 1] = data[source + 1];
    rgba[target + 2] = data[source + 2];
    rgba[target + 3] = background[pixel] ? 0 : 255;
  }

  fs.mkdirSync(path.dirname(output), { recursive: true });
  await sharp(rgba, { raw: { width, height, channels: 4 } })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 16,
      right: 16,
      bottom: 0,
      left: 16,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .resize({ width: 1500, withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toFile(output);

  const metadata = await sharp(output).metadata();
  console.log(`${path.relative(process.cwd(), output)}: ${metadata.width}x${metadata.height}, alpha=${metadata.hasAlpha}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
