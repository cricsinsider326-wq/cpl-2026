const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const roots = ["assets", "scripts", "src"].map((dir) => path.join(root, dir));
const files = [];
const errors = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    if (entry.isFile() && entry.name.endsWith(".js")) files.push(full);
  }
}

for (const dir of roots) walk(dir);

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  try {
    new vm.Script(source, { filename: file });
  } catch (error) {
    errors.push(`${path.relative(root, file)}: ${error.message}`);
  }
  if (source.includes("\uFFFD")) errors.push(`${path.relative(root, file)}: replacement character found`);
}

if (errors.length) {
  console.error(`Lint failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Lint passed: ${files.length} JavaScript files parsed successfully.`);
