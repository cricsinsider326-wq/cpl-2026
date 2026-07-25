const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function parseArgs(argv = process.argv.slice(2)) {
  const values = {};
  const flags = new Set();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const equals = token.indexOf("=");
    if (equals > -1) {
      values[token.slice(2, equals)] = token.slice(equals + 1);
      continue;
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      values[key] = next;
      index += 1;
    } else {
      flags.add(key);
    }
  }
  return {
    values,
    flags,
    get(name, fallback = null) {
      return Object.prototype.hasOwnProperty.call(values, name) ? values[name] : fallback;
    },
    has(name) {
      return flags.has(name);
    },
  };
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveProjectPath(value) {
  if (!value) return null;
  return path.isAbsolute(value) ? path.normalize(value) : path.resolve(ROOT, value);
}

function assertInsideProject(filePath, label = "Path") {
  const relative = path.relative(ROOT, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${label} must be inside ${ROOT}`);
  }
}

function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, value) {
  ensureDirectory(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function relativeWebPath(filePath) {
  return `/${path.relative(ROOT, filePath).replace(/\\/g, "/")}`;
}

module.exports = {
  ROOT,
  assertInsideProject,
  ensureDirectory,
  parseArgs,
  readJson,
  relativeWebPath,
  resolveProjectPath,
  slugify,
  writeJson,
};
