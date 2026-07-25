const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PLAYERS_PATH = path.join(ROOT, "src", "data", "players.json");
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36";
const CWI_INDEX =
  "https://www.windiescricket.com/api/player-list/?filter_type=gender&filter_value=M&page=";
const VERIFIED_ROLE_OVERRIDES = new Map([
  ["sunil narine", "Allrounder"],
  ["kieron pollard", "Allrounder"],
]);

function getArg(name) {
  const prefix = "--" + name + "=";
  const value = process.argv.find((argument) => argument.startsWith(prefix));
  return value ? value.slice(prefix.length) : null;
}

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function fetchResponse(url) {
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { accept: "*/*", "user-agent": USER_AGENT },
        signal: AbortSignal.timeout(45_000),
      });
      if (response.ok) return response;
      if (response.status < 500 && response.status !== 429) {
        throw new Error(String(response.status) + ": " + url);
      }
      lastError = new Error(String(response.status) + ": " + url);
    } catch (error) {
      lastError = error;
    }
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker()),
  );
  return results;
}

function decodeHtml(value) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeRole(value) {
  const role = decodeHtml(value).toLowerCase();
  if (/^(wicketkeeper|wicket keeper)\b/.test(role) || role.includes("wicket")) {
    return "Batter / Wicketkeeper";
  }
  if (/^(all[- ]?rounder)\b/.test(role)) return "Allrounder";
  if (/^(batter|batsman)\b/.test(role)) return "Batter";
  if (/^bowler\b/.test(role)) return "Bowler";
  if (role.includes("all-rounder") || role.includes("allrounder")) return "Allrounder";
  if (role.includes("batter") || role.includes("batsman")) return "Batter";
  if (role.includes("bowler")) return "Bowler";
  return null;
}

async function collectCwiProfiles() {
  const first = await (await fetchResponse(CWI_INDEX + "1")).json();
  const lastPage = first.page?.last_page || 1;
  const payloads = await mapWithConcurrency(
    Array.from({ length: Math.max(0, lastPage - 1) }, (_, index) => index + 2),
    8,
    async (page) => (await (await fetchResponse(CWI_INDEX + String(page))).json()).results || [],
  );
  const rows = [...(first.results || []), ...payloads.flat()];
  return new Map(
    rows
      .filter((row) => row.known_as && row.url)
      .map((row) => [normalizeName(row.known_as), "https://www.windiescricket.com" + row.url]),
  );
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const refresh = process.argv.includes("--refresh");
  const teamFilter = getArg("team");
  const players = JSON.parse(fs.readFileSync(PLAYERS_PATH, "utf8"));
  const profiles = await collectCwiProfiles();
  const candidates = players.filter(
    (player) =>
      (!teamFilter || player.teamCode === teamFilter || player.team === teamFilter) &&
      (refresh || player.role === "Role to be confirmed"),
  );
  const updates = await mapWithConcurrency(candidates, 8, async (player) => {
    const profileUrl =
      profiles.get(normalizeName(player.name)) ||
      profiles.get(normalizeName(player.officialName));
    if (!profileUrl) return { player, role: null };
    try {
      const html = await (await fetchResponse(profileUrl)).text();
      const match = html.match(
        /<label>Player Role<\/label>\s*<span>([\s\S]*?)<\/span>/i,
      );
      return { player, role: match ? normalizeRole(match[1]) : null };
    } catch {
      return { player, role: null };
    }
  });

  const rolesByName = new Map();
  for (const update of updates) {
    if (update.role) rolesByName.set(update.player.name, update.role);
  }

  for (const player of candidates) {
    const override = VERIFIED_ROLE_OVERRIDES.get(normalizeName(player.name));
    if (override) rolesByName.set(player.name, override);
  }

  for (const player of players) {
    const role = rolesByName.get(player.name);
    if (role && !dryRun) {
      player.role = role;
      process.stdout.write("Updated " + player.name + ": " + role + "\n");
    }
  }

  if (!dryRun) {
    fs.writeFileSync(PLAYERS_PATH, JSON.stringify(players, null, 2) + "\n");
  }
  process.stdout.write(
    JSON.stringify(
      {
        totalPlayers: players.length,
        recordsChecked: candidates.length,
        matchedRoles: rolesByName.size,
        mode: dryRun ? "dry-run" : "write",
        teamFilter: teamFilter || "all",
        stillPending: players.filter((player) => player.role === "Role to be confirmed")
          .length,
      },
      null,
      2,
    ) + "\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
