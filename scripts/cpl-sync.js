const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const REPORT_DIR = path.join(ROOT, "reports", "cpl-sync");
const NPM =
  process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "npm";
const POWERSHELL = process.platform === "win32" ? "powershell.exe" : "pwsh";
const FAST_DEPLOY_FILES = [
  "assets/styles.css",
  "assets/premium.css",
  "assets/reference-home.css",
  "assets/app.js",
  ".htaccess",
  "index.html",
  "cpl-2026/index.html",
  "fixtures/index.html",
  "players/index.html",
  "teams/index.html",
  "points-table/index.html",
  "live-score/index.html",
  "how-to-watch/index.html",
  "news/index.html",
  "venues/index.html",
  "tickets/index.html",
  "faq/index.html",
  "results/index.html",
  "data-quality.json",
  "sitemap.xml",
  "robots.txt",
];

const argumentsList = process.argv.slice(2);
const hasFlag = (flag) => argumentsList.includes("--" + flag);
const getArg = (name) => {
  const prefix = "--" + name + "=";
  const argument = argumentsList.find((value) => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : null;
};

const options = {
  deploy: hasFlag("deploy"),
  dryRun: hasFlag("dry-run"),
  fastDeploy: hasFlag("fast-deploy"),
  fullDeploy: hasFlag("full"),
  noAudit: hasFlag("no-audit"),
  refreshImages: hasFlag("refresh-images"),
  refreshRoles: hasFlag("refresh-roles"),
  skipImages: hasFlag("skip-images"),
  skipRoles: hasFlag("skip-roles"),
  team: getArg("team"),
};

const report = {
  startedAt: new Date().toISOString(),
  options,
  status: "running",
  stages: [],
};

function npmRun(script, extraArgs, stageName) {
  const args =
    process.platform === "win32"
      ? ["/d", "/s", "/c", "npm", "run", script]
      : ["run", script];
  if (extraArgs && extraArgs.length) args.push("--", ...extraArgs);
  return runCommand(NPM, args, stageName);
}

function runCommand(command, args, stageName, env) {
  const startedAt = Date.now();
  process.stdout.write("\n=== " + stageName + " ===\n");
  const result = spawnSync(command, args, {
    cwd: ROOT,
    env: { ...process.env, ...(env || {}) },
    stdio: "inherit",
    shell: false,
  });
  const stage = {
    name: stageName,
    command: command + " " + args.join(" "),
    durationSeconds: Math.round((Date.now() - startedAt) / 100) / 10,
    exitCode: typeof result.status === "number" ? result.status : 1,
  };
  report.stages.push(stage);
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(stageName + " failed with exit code " + String(result.status));
  }
}

async function verifyLiveAssets() {
  const startedAt = Date.now();
  const stamp = Date.now();
  const response = await fetch(
    "https://cplinsider.com/players/?cpl-sync=" + String(stamp),
    { headers: { "cache-control": "no-cache" }, signal: AbortSignal.timeout(45_000) },
  );
  if (!response.ok) throw new Error("Live players page returned HTTP " + response.status);
  const html = await response.text();
  const cards = (html.match(/data-player-card/g) || []).length;
  const externalImages = [
    ...html.matchAll(/<img[^>]+src="(https?:\/\/[^"]+)/g),
  ].map((match) => match[1]);
  const localImages = [
    ...html.matchAll(
      /<img[^>]+src="(\/assets\/images\/players\/directory\/[^"?]+\.webp)/g,
    ),
  ].map((match) => match[1]);
  const uniqueImages = [...new Set(localImages)];
  const checks = await Promise.all(
    uniqueImages.map(async (imagePath) => {
      const imageResponse = await fetch(
        "https://cplinsider.com" + imagePath + "?cpl-sync=" + String(stamp),
        { method: "HEAD", signal: AbortSignal.timeout(30_000) },
      );
      return {
        path: imagePath,
        status: imageResponse.status,
        type: imageResponse.headers.get("content-type") || "",
      };
    }),
  );
  const badImages = checks.filter(
    (item) => item.status !== 200 || !item.type.includes("image/webp"),
  );
  if (cards !== 99) throw new Error("Live player card count is " + cards + ", expected 99");
  if (externalImages.length) throw new Error("Live player page contains external image hotlinks");
  if (badImages.length) throw new Error(String(badImages.length) + " live WebP images failed");
  report.stages.push({
    name: "Live asset verification",
    durationSeconds: Math.round((Date.now() - startedAt) / 100) / 10,
    exitCode: 0,
    playerCards: cards,
    localWebpImages: uniqueImages.length,
    externalImageHotlinks: externalImages.length,
  });
  process.stdout.write(
    "Live verification passed: " +
      String(cards) +
      " cards, " +
      String(uniqueImages.length) +
      " local WebP portraits, zero hotlinks.\n",
  );
}

function writeReport() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const safeTime = report.startedAt.replace(/[:.]/g, "-");
  const output = JSON.stringify(report, null, 2) + "\n";
  fs.writeFileSync(path.join(REPORT_DIR, safeTime + ".json"), output);
  fs.writeFileSync(path.join(REPORT_DIR, "latest.json"), output);
}

async function main() {
  if (options.dryRun && options.deploy) {
    throw new Error("--dry-run and --deploy cannot be used together");
  }
  if (options.fullDeploy && options.fastDeploy) {
    throw new Error("--full and --fast-deploy cannot be used together");
  }

  if (!options.skipImages) {
    const imageArgs = [];
    if (options.team) imageArgs.push("--team=" + options.team);
    if (options.refreshImages) imageArgs.push("--refresh");
    npmRun(
      options.dryRun ? "players:images:audit" : "players:images:official",
      imageArgs,
      options.dryRun ? "Official image dry run" : "Official image sync",
    );
  }

  if (!options.skipRoles) {
    const roleArgs = [];
    if (options.dryRun) roleArgs.push("--dry-run");
    if (options.team) roleArgs.push("--team=" + options.team);
    if (options.refreshRoles) roleArgs.push("--refresh");
    npmRun("players:roles:official", roleArgs, "Official role sync");
  }

  npmRun("check", [], "Lint, data, build and SEO validation");
  if (!options.noAudit) {
    npmRun("ui:audit:players", [], "Player directory responsive audit");
  }

  if (options.deploy) {
    const deployArgs = [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      path.join(ROOT, "scripts", "deploy-hostspk-backend.ps1"),
    ];
    if (options.fullDeploy) {
      deployArgs.push("-Full");
    } else if (options.fastDeploy) {
      deployArgs.push("-OnlyFiles", FAST_DEPLOY_FILES.join(","));
    } else {
      deployArgs.push("-CriticalOnly");
    }
    if (process.env.HOSTSPK_USERNAME && process.env.HOSTSPK_PASSWORD) {
      deployArgs.push("-UserName", process.env.HOSTSPK_USERNAME);
      deployArgs.push("-Password", process.env.HOSTSPK_PASSWORD);
    }
    runCommand(POWERSHELL, deployArgs, "HostSPK deployment");
    await verifyLiveAssets();
    if (!options.noAudit) {
      runCommand(
        process.execPath,
        [path.join(ROOT, "scripts", "audit-player-directory.js"), "--live"],
        "Live player filter audit",
      );
    }
  }

  report.status = "passed";
}

main()
  .catch((error) => {
    report.status = "failed";
    report.error = error.stack || error.message;
    process.stderr.write("\nCPL sync stopped: " + error.message + "\n");
    process.exitCode = 1;
  })
  .finally(() => {
    report.finishedAt = new Date().toISOString();
    writeReport();
    process.stdout.write(
      "\nCPL sync " +
        report.status +
        ". Report: " +
        path.join(REPORT_DIR, "latest.json") +
        "\n",
    );
  });
