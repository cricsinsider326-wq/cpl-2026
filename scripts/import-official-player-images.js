const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");
const PLAYERS_PATH = path.join(ROOT, "src", "data", "players.json");
const OUTPUT_DIR = path.join(ROOT, "assets", "images", "players", "directory");
const MANIFEST_PATH = path.join(ROOT, "src", "data", "playerImageSources.json");
const TARGET = { width: 640, height: 800 };
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36";
const CWI_IMAGE_HOST =
  "https://cricviz-westindies-production.s3.amazonaws.com/images/";
const REJECTED_CWI_IMAGE_IDS = new Set([
  "6f25ccd7-9fab-497b-9b08-adab926cb58d",
  "89f3ad3b-08f1-4546-84f8-23e0f2f9aaf",
]);

const OFFICIAL_SOURCES = {
  cwi: {
    label: "Cricket West Indies player profile",
    indexUrl:
      "https://www.windiescricket.com/api/player-list/?filter_type=gender&filter_value=M&page={page}",
    baseUrl: "https://www.windiescricket.com",
  },
  acb: {
    label: "Afghanistan Cricket Board national team page",
    pageUrl: "https://www.acb.af/en-US/afghan-atalan",
    imageBaseUrl: "https://api.acb.af/storage/",
  },
  barbados: {
    label: "Barbados Royals official team page",
    pageUrl: "https://www.barbadosroyals.com/team",
    team: "Barbados Tridents",
  },
  tkr: {
    label: "Trinbago Knight Riders official player profile",
    baseUrl: "https://www.tkriders.com",
    players: {
      "nicholas-pooran": 63726,
      "sunil-narine": 11229,
      "kieron-pollard": 3910,
      "akeal-hosein": 57239,
      "terrance-hinds": 69484,
      "nathan-edward": 87588,
    },
  },
};

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getArg(name) {
  const prefix = `--${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : null;
}

async function fetchResponse(url) {
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "*/*",
          "user-agent": USER_AGENT,
        },
        redirect: "follow",
        signal: AbortSignal.timeout(45_000),
      });
      if (response.ok) return response;
      if (response.status < 500 && response.status !== 429) {
        throw new Error(response.status + " " + response.statusText + ": " + url);
      }
      lastError = new Error(response.status + " " + response.statusText + ": " + url);
    } catch (error) {
      lastError = error;
    }
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}

async function fetchText(url) {
  return (await fetchResponse(url)).text();
}

async function fetchBuffer(url) {
  const response = await fetchResponse(url);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Expected image but received ${contentType || "unknown"}: ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function parseJsonAssignment(html, variableName) {
  const marker = `window.${variableName} = `;
  const start = html.indexOf(marker);
  if (start < 0) return null;

  const valueStart = start + marker.length;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = valueStart; index < html.length; index += 1) {
    const character = html[index];

    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }

    if (character === '"') inString = true;
    else if (character === "{" || character === "[") depth += 1;
    else if (character === "}" || character === "]") {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(html.slice(valueStart, index + 1));
      }
    }
  }

  return null;
}

async function collectBarbadosSources() {
  const source = OFFICIAL_SOURCES.barbados;
  const html = await fetchText(source.pageUrl);
  const data = parseJsonAssignment(html, "squadDetailsWidgetData");
  if (!data) {
    throw new Error("Barbados squad data was not found on the official team page.");
  }

  const groups = ["batsmen", "bowlers", "allRounders", "wicketKeepers"];
  const players = groups.flatMap((group) => (Array.isArray(data[group]) ? data[group] : []));
  const result = new Map();

  for (const player of players) {
    const id = player.id || player.player_id;
    if (!id || !player.name) continue;

    result.set(normalizeName(player.name), {
      sourceType: "official-franchise",
      sourceLabel: source.label,
      sourcePageUrl: source.pageUrl,
      sourceImageUrl: `https://www.barbadosroyals.com/static-assets/images/players/${id}.png?v=1.94`,
    });
  }

  return result;
}

async function collectTkrSources() {
  const source = OFFICIAL_SOURCES.tkr;
  const result = new Map();

  for (const [slug, id] of Object.entries(source.players)) {
    result.set(slug, {
      sourceType: "official-franchise",
      sourceLabel: source.label,
      sourcePageUrl: `${source.baseUrl}/players/${slug}-profile-${id}`,
      sourceImageUrl: `${source.baseUrl}/static-assets/images/players/2020/${id}.png?v=3.89`,
    });
  }

  return result;
}

async function collectAcbSources() {
  const source = OFFICIAL_SOURCES.acb;
  const html = (await fetchText(source.pageUrl))
    .replace(/\\"/g, '"')
    .replace(/\\\//g, "/");
  const result = new Map();

  for (const match of html.matchAll(
    /"photo":"([^"]+)"[\s\S]{0,500}?"name":"([^"]+)"/g,
  )) {
    const [, photo, name] = match;
    result.set(normalizeName(name.replace(/\s+Eisakhil$/i, "")), {
      sourceType: "official-governing-body",
      sourceLabel: source.label,
      sourcePageUrl: source.pageUrl,
      sourceImageUrl: new URL(photo, source.imageBaseUrl).href,
    });
  }

  return result;
}

async function collectCwiSources() {
  const source = OFFICIAL_SOURCES.cwi;
  const first = await (
    await fetchResponse(source.indexUrl.replace("{page}", "1"))
  ).json();
  const lastPage = first.page?.last_page || 1;
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, lastPage - 1) }, (_, index) => index + 2).map(
      async (page) =>
        (
          await (
            await fetchResponse(source.indexUrl.replace("{page}", String(page)))
          ).json()
        ).results || [],
    ),
  );
  const rows = [...(first.results || []), ...remainingPages.flat()];

  const result = new Map();
  for (const player of rows) {
    if (!player.known_as || !player.url) continue;
    const originalImage = player.image
      ? player.image.replace(/\.width-\d+\./, ".original.")
      : null;
    result.set(normalizeName(player.known_as), {
      sourceType: "official-governing-body",
      sourceLabel: source.label,
      sourcePageUrl: new URL(player.url, source.baseUrl).href,
      sourceImageUrl: originalImage,
    });
  }

  return result;
}

function toOriginalCwiImage(url) {
  const cleanUrl = url.replace(/&amp;/g, "&").replace(/[),;}\]]+$/, "");
  return cleanUrl.replace(
    /\.(?:max|fill|width)-\d+x?\d*\.(jpg|jpeg|png|webp)$/i,
    ".original.$1",
  );
}

function isUsableCwiImage(url) {
  if (!url.startsWith(CWI_IMAGE_HOST)) return false;
  if (url.includes("fill-970x90")) return false;
  return ![...REJECTED_CWI_IMAGE_IDS].some((id) => url.includes(id));
}

async function resolveCwiProfileImage(source) {
  if (source.sourceImageUrl) return source;

  const html = await fetchText(source.sourcePageUrl);
  const rawCandidates = [
    ...html.matchAll(
      /https:\/\/cricviz-westindies-production\.s3\.amazonaws\.com\/images\/[^"'\\<>\s]+/g,
    ),
  ]
    .map((match) => match[0].replace(/&amp;/g, "&").replace(/[),;}\]]+$/, ""))
    .filter(isUsableCwiImage);
  const candidates = rawCandidates.map(toOriginalCwiImage);

  const sourceImageUrl = [...new Set(candidates)][0];
  if (!sourceImageUrl) return null;

  return {
    ...source,
    sourceLabel: "Cricket West Indies player profile gallery",
    sourceImageUrl,
    sourceImageFallbackUrls: [...new Set(rawCandidates)].filter(
      (url) => url !== sourceImageUrl,
    ),
  };
}

async function fetchSourceBuffer(source) {
  const urls = [
    source.sourceImageUrl,
    ...(source.sourceImageFallbackUrls || []),
  ].filter(Boolean);
  let lastError = null;

  for (const url of urls) {
    try {
      return { buffer: await fetchBuffer(url), sourceImageUrl: url };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(`No downloadable image found for ${source.sourcePageUrl}.`);
}

async function normalizeImage(buffer, outputPath) {
  const image = sharp(buffer, { animated: false }).rotate();
  const metadata = await image.metadata();
  const hasAlpha = Boolean(metadata.hasAlpha);
  const isPortrait = metadata.height > metadata.width;

  if (!metadata.width || !metadata.height || metadata.width < 160 || metadata.height < 160) {
    throw new Error(
      `Source image is too small (${metadata.width || 0}x${metadata.height || 0}).`,
    );
  }

  const resizeOptions =
    hasAlpha || isPortrait
      ? {
          fit: "contain",
          position: "bottom",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        }
      : {
          fit: "cover",
          position: sharp.strategy.attention,
        };

  await image
    .resize(TARGET.width, TARGET.height, resizeOptions)
    .webp({ quality: 86, alphaQuality: 92, effort: 6, smartSubsample: true })
    .toFile(outputPath);

  const outputMetadata = await sharp(outputPath).metadata();
  return {
    sourceWidth: metadata.width,
    sourceHeight: metadata.height,
    sourceHasAlpha: hasAlpha,
    width: outputMetadata.width,
    height: outputMetadata.height,
    hasAlpha: Boolean(outputMetadata.hasAlpha),
    bytes: fs.statSync(outputPath).size,
  };
}

async function inspectNormalizedImage(outputPath) {
  const metadata = await sharp(outputPath).metadata();
  return {
    sourceWidth: null,
    sourceHeight: null,
    sourceHasAlpha: null,
    width: metadata.width,
    height: metadata.height,
    hasAlpha: Boolean(metadata.hasAlpha),
    bytes: fs.statSync(outputPath).size,
    reusedLocalFile: true,
  };
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker()),
  );
  return results;
}

async function main() {
  const teamFilter = getArg("team");
  const dryRun = process.argv.includes("--dry-run");
  const refresh = process.argv.includes("--refresh");
  const players = JSON.parse(fs.readFileSync(PLAYERS_PATH, "utf8"));
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const [barbados, tkr, cwi, acb] = await Promise.all([
    collectBarbadosSources(),
    collectTkrSources(),
    collectCwiSources(),
    collectAcbSources(),
  ]);
  const currentNames = new Set(
    players.flatMap((player) =>
      [normalizeName(player.name), normalizeName(player.officialName)].filter(Boolean),
    ),
  );
  const cwiProfilesWithoutImages = [...cwi.entries()].filter(
    ([name, source]) => currentNames.has(name) && !source.sourceImageUrl,
  );

  await mapWithConcurrency(cwiProfilesWithoutImages, 6, async ([name, source]) => {
    try {
      const resolved = await resolveCwiProfileImage(source);
      if (resolved) cwi.set(name, resolved);
      else cwi.delete(name);
    } catch {
      cwi.delete(name);
    }
  });

  const manifest = {
    generatedAt: new Date().toISOString(),
    policy: [
      "Images are downloaded to CPL Insider and are never hotlinked in frontend markup.",
      "Exact-name franchise sources take priority over official governing-body profiles.",
      "Unverified name matches are rejected.",
    ],
    target: {
      ...TARGET,
      format: "webp",
      frontendBasePath: "/assets/images/players/directory/",
    },
    sources: [],
    summary: {},
  };

  let imported = 0;
  let preserved = 0;
  let unavailable = 0;
  let failed = 0;

  for (const player of players) {
    if (teamFilter && player.teamCode !== teamFilter && player.team !== teamFilter) {
      continue;
    }

    const normalizedName = normalizeName(player.name);
    const officialName = normalizeName(player.officialName);
    let source = null;

    if (player.team === OFFICIAL_SOURCES.barbados.team) {
      source = barbados.get(normalizedName) || barbados.get(officialName);
    }
    if (!source && player.team === "Trinbago Knight Riders") {
      source = tkr.get(player.slug);
    }
    if (!source) {
      source = cwi.get(normalizedName) || cwi.get(officialName);
    }
    if (!source) {
      source = acb.get(normalizedName) || acb.get(officialName);
    }
    if (!source) {
      unavailable += 1;
      manifest.sources.push({
        name: player.name,
        slug: player.slug,
        team: player.team,
        status: player.photo ? "preserved-existing" : "official-image-unavailable",
        localPath: player.photo || null,
      });
      if (player.photo) preserved += 1;
      continue;
    }

    const relativePath = `/assets/images/players/directory/${player.slug}.webp`;
    const outputPath = path.join(OUTPUT_DIR, `${player.slug}.webp`);

    if (dryRun) {
      imported += 1;
      manifest.sources.push({
        name: player.name,
        slug: player.slug,
        team: player.team,
        status: "dry-run-match",
        ...source,
        localPath: relativePath,
      });
      continue;
    }

    try {
      let validation;
      if (!refresh && fs.existsSync(outputPath)) {
        validation = await inspectNormalizedImage(outputPath);
      } else {
        const downloaded = await fetchSourceBuffer(source);
        source = { ...source, sourceImageUrl: downloaded.sourceImageUrl };
        validation = await normalizeImage(downloaded.buffer, outputPath);
      }
      player.photo = relativePath;
      player.imageAlt = `${player.name} CPL 2026 player portrait`;
      player.imageSourceType = source.sourceType;
      player.imageSourcePage = source.sourcePageUrl;
      player.imageCheckedAt = new Date().toISOString().slice(0, 10);

      imported += 1;
      manifest.sources.push({
        name: player.name,
        slug: player.slug,
        team: player.team,
        status: "imported",
        ...source,
        localPath: relativePath,
        validation,
      });
      process.stdout.write(
        `${validation.reusedLocalFile ? "Reused" : "Imported"} ${player.name} (${player.teamCode})\n`,
      );
    } catch (error) {
      failed += 1;
      manifest.sources.push({
        name: player.name,
        slug: player.slug,
        team: player.team,
        status: "failed",
        ...source,
        localPath: null,
        error: error.message,
      });
      process.stderr.write(`Failed ${player.name}: ${error.message}\n`);
    }
  }

  manifest.summary = {
    totalPlayers: players.length,
    imported,
    preservedExisting: preserved,
    officialImageUnavailable: unavailable,
    failed,
  };

  if (!dryRun) {
    fs.writeFileSync(PLAYERS_PATH, `${JSON.stringify(players, null, 2)}\n`);
    fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  process.stdout.write(`${JSON.stringify(manifest.summary, null, 2)}\n`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
