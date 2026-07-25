const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const {
  ROOT,
  assertInsideProject,
  ensureDirectory,
  parseArgs,
  readJson,
  resolveProjectPath,
  slugify,
  writeJson,
} = require("./replication-common");

const args = parseArgs();
const MANIFEST = path.join(ROOT, "src", "data", "pageReplications.json");

function usage() {
  return [
    "Page replication request builder",
    "",
    "  node scripts/prepare-page-replication.js --reference=path/design.png --page=players --route=/players/ --variant=desktop",
    "",
    "Variants can be desktop, laptop, tablet or mobile. Add more references by re-running with the same --page.",
  ].join("\n");
}

function normalizeRoute(value, slug) {
  const route = value || `/${slug}/`;
  const trimmed = route.replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}/` : "/";
}

async function main() {
  if (args.has("help")) {
    console.log(usage());
    return;
  }
  const input = resolveProjectPath(args.get("reference"));
  const pageSlug = slugify(args.get("page"));
  const variant = slugify(args.get("variant", "desktop"));
  if (!input || !pageSlug || !variant) throw new Error(`${usage()}\n\nRequired: --reference and --page.`);
  if (!fs.existsSync(input)) throw new Error(`Reference image not found: ${input}`);
  const route = normalizeRoute(args.get("route"), pageSlug);
  const output = path.join(ROOT, "references", "pages", pageSlug, `${variant}.webp`);
  assertInsideProject(output, "Reference output");
  ensureDirectory(output);
  await sharp(input, { animated: false })
    .rotate()
    .webp({ quality: 94, alphaQuality: 100, effort: 6 })
    .toFile(output);
  const metadata = await sharp(output).metadata();
  const manifest = readJson(MANIFEST, { version: 1, pages: [] });
  let page = manifest.pages.find((entry) => entry.slug === pageSlug);
  if (!page) {
    page = {
      slug: pageSlug,
      route,
      status: "reference-ready",
      sourceOfTruth: "supplied-reference",
      contentPolicy: "preserve-approved-site-content",
      references: [],
      implementation: {
        pageModule: null,
        sectionModules: [],
        stylesheets: [],
      },
    };
    manifest.pages.push(page);
  }
  page.route = route;
  page.status = "reference-ready";
  page.updatedAt = new Date().toISOString();
  const record = {
    variant,
    path: path.relative(ROOT, output).replace(/\\/g, "/"),
    width: metadata.width,
    height: metadata.height,
    bytes: fs.statSync(output).size,
  };
  const existingIndex = page.references.findIndex((entry) => entry.variant === variant);
  if (existingIndex >= 0) page.references[existingIndex] = record;
  else page.references.push(record);
  writeJson(MANIFEST, manifest);

  const briefPath = path.join(ROOT, "docs", "page-replications", `${pageSlug}.md`);
  ensureDirectory(briefPath);
  const references = page.references
    .map((entry) => `- ${entry.variant}: \`${entry.path}\` (${entry.width}x${entry.height})`)
    .join("\n");
  fs.writeFileSync(briefPath, `# ${pageSlug} page replication\n\n## Route\n\n\`${route}\`\n\n## References\n\n${references}\n\n## Non-negotiable rules\n\n- Supplied references are the visual source of truth.\n- Recreate layout, spacing, typography hierarchy and card structure in real HTML and CSS.\n- Keep text, buttons, navigation, filters and pagination functional.\n- Preserve approved website content unless replacement copy is supplied.\n- Use local optimized WebP assets; do not hotlink third-party images.\n- Maintain one H1, logical H2 structure, metadata, schema and internal links.\n- Validate at 1440, 1280, 1024, 768, 430 and 390 pixels.\n- Run visual comparison before approval or deployment.\n\n## Implementation mapping\n\nRecord page module, section modules and stylesheets in \`src/data/pageReplications.json\` after implementation.\n`, "utf8");
  console.log(`Page replication request ready: ${pageSlug} ${variant}`);
  console.log(`Reference: ${path.relative(ROOT, output)}`);
  console.log(`Brief: ${path.relative(ROOT, briefPath)}`);
}

main().catch((error) => {
  console.error(`Page replication preparation failed: ${error.message}`);
  process.exitCode = 1;
});
