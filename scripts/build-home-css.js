const fs = require("fs");
const path = require("path");
const { PurgeCSS } = require("purgecss");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const htmlPath = path.join(dist, "index.html");
const rootHtmlPath = path.join(root, "index.html");
const cssVersion = "20260727-teams-v3";
const sourceStyles = [
  "styles.css",
  "premium.css",
  "cpl-hub.css",
  "reference-home.css"
];

async function buildHomeCss() {
  const html = fs.readFileSync(htmlPath, "utf8");
  const appJs = fs.readFileSync(path.join(dist, "assets", "app.js"), "utf8");
  const css = sourceStyles.map((file) => ({
    raw: fs.readFileSync(path.join(dist, "assets", file), "utf8"),
    extension: "css"
  }));

  const results = await new PurgeCSS().purge({
    content: [
      { raw: html, extension: "html" },
      { raw: appJs, extension: "js" }
    ],
    css,
    fontFace: true,
    keyframes: true,
    safelist: {
      standard: [
        "is-open",
        "is-active",
        "is-current",
        "is-error",
        "is-success",
        "nav-overlay",
        "mobile-nav-close",
        "form-status"
      ],
      greedy: [/^is-/, /^has-/, /^nav-/, /^mobile-nav-/]
    }
  });
  const homeCss = results.map((result) => result.css).join("\n");
  fs.writeFileSync(path.join(dist, "assets", "home.css"), homeCss);

  const names = sourceStyles.map((file) => file.replace(".", "\\.")).join("|");
  const stylesheetPattern = new RegExp(
    `\\s*<link rel="stylesheet" href="/assets/(?:${names})\\?v=[^"]+" \\/>`,
    "g"
  );
  const optimizedHtml = html
    .replace(stylesheetPattern, "")
    .replace(
      '<link rel="stylesheet" href="/assets/fonts.css',
      `<link rel="stylesheet" href="/assets/home.css?v=${cssVersion}" />\n    <link rel="stylesheet" href="/assets/fonts.css`
    )
    .replace(/\/assets\/app\.js\?v=[^"]+/, `/assets/app.js?v=${cssVersion}`);

  fs.writeFileSync(htmlPath, optimizedHtml);
  fs.writeFileSync(rootHtmlPath, optimizedHtml);
  console.log(`Homepage CSS built: ${Buffer.byteLength(homeCss)} bytes`);
}

buildHomeCss().catch((error) => {
  console.error(error);
  process.exit(1);
});
