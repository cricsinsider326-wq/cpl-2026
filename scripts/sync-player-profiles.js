const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PLAYERS_PATH = path.join(ROOT, "src", "data", "players.json");
const SQUADS_PATH = path.join(ROOT, "src", "data", "squads.json");
const SOURCES_PATH = path.join(ROOT, "src", "data", "sources.json");
const PROFILES_PATH = path.join(ROOT, "src", "data", "playerProfiles.json");
const CWI_INDEX = "https://www.windiescricket.com/api/player-list/?filter_type=gender&filter_value=M&page=";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36";

const INTERNATIONAL_PROFILES = {
  "imran-tahir": { nationality: "South Africa", battingStyle: "Right-handed", bowlingStyle: "Leg break googly" },
  "glenn-phillips": { nationality: "New Zealand", battingStyle: "Right-handed", bowlingStyle: "Right-arm off break" },
  "mohammad-nabi": { nationality: "Afghanistan", battingStyle: "Right-handed", bowlingStyle: "Right-arm off break" },
  "rahmanullah-gurbaz": { nationality: "Afghanistan", battingStyle: "Right-handed", bowlingStyle: "Does not bowl" },
  "dwaine-pretorius": { nationality: "South Africa", battingStyle: "Right-handed", bowlingStyle: "Right-arm medium fast" },
  "quinton-de-kock": { nationality: "South Africa", battingStyle: "Left-handed", bowlingStyle: "Does not bowl" },
  "chris-green": { nationality: "Australia", battingStyle: "Right-handed", bowlingStyle: "Right-arm off break" },
  "mujeeb-ur-rahman": { nationality: "Afghanistan", battingStyle: "Right-handed", bowlingStyle: "Right-arm off break" },
  "george-linde": { nationality: "South Africa", battingStyle: "Left-handed", bowlingStyle: "Slow left-arm orthodox" },
  "daniel-sams": { nationality: "Australia", battingStyle: "Right-handed", bowlingStyle: "Left-arm fast medium" },
  "noor-ahmad": { nationality: "Afghanistan", battingStyle: "Right-handed", bowlingStyle: "Left-arm wrist spin" },
  "tim-seifert": { nationality: "New Zealand", battingStyle: "Right-handed", bowlingStyle: "Does not bowl" },
  "maheesh-theekshana": { nationality: "Sri Lanka", battingStyle: "Right-handed", bowlingStyle: "Right-arm off break" },
  "charith-asalanka": { nationality: "Sri Lanka", battingStyle: "Left-handed", bowlingStyle: "Right-arm off break", playingRole: "Batter" },
  "shadley-van-schalkwyk": { nationality: "South Africa", battingStyle: "Right-handed", bowlingStyle: "Right-arm medium fast", playingRole: "Allrounder" }
};

const PROFILE_OVERRIDES = {
  "shai-hope": { battingStyle: "Right-handed", bowlingStyle: "Does not bowl" },
  "dexter-sween": { dateOfBirth: "1998-02-09", battingStyle: "Right-handed", bowlingStyle: "Right-arm medium", playingRole: "Batter" },
  "joshua-da-silva": { battingStyle: "Right-handed", bowlingStyle: "Does not bowl" },
  "brandon-king": { battingStyle: "Right-handed", bowlingStyle: "Does not bowl" },
  "jewel-andrew": { battingStyle: "Right-handed", bowlingStyle: "Does not bowl" },
  "akeem-auguste": { battingStyle: "Right-handed", bowlingStyle: "Does not bowl", playingRole: "Batter", sourceUrl: "https://www.windiescricket.com/news/the-quiet-hunger-of-akeem-auguste/" },
  "amir-jangoo": { battingStyle: "Left-handed", bowlingStyle: "Does not bowl" },
  "jahmar-hamilton": { battingStyle: "Right-handed", bowlingStyle: "Does not bowl" },
  "rakheem-cornwall": { dateOfBirth: "1993-02-01", battingStyle: "Right-handed", bowlingStyle: "Right-arm off break", playingRole: "Allrounder", sourceUrl: "https://www.windiescricket.com/players/rahkeem-cornwall-2598/" }
};

function normalizeName(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function cleanHtml(value) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}

function displayBatting(value) {
  const text = cleanHtml(value);
  if (/^LHB\b/i.test(text)) return "Left-handed";
  if (/^RHB\b/i.test(text)) return "Right-handed";
  return text || "To be confirmed";
}

function displayBowling(value) {
  const text = cleanHtml(value).replace(/\s*\([^)]*\)\s*$/, "");
  return text || "To be confirmed";
}

function getLabels(html) {
  return new Map([...html.matchAll(/<label>([^<]+)<\/label>\s*<span>([\s\S]*?)<\/span>/gi)].map((match) => [cleanHtml(match[1]), cleanHtml(match[2])]));
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": USER_AGENT, accept: "*/*" }, signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return response.text();
}

async function collectCwiIndex() {
  const first = JSON.parse(await fetchText(CWI_INDEX + "1"));
  const pages = Array.from({ length: Math.max(0, (first.page?.last_page || 1) - 1) }, (_, index) => index + 2);
  const payloads = [];
  for (let index = 0; index < pages.length; index += 8) {
    const batch = await Promise.all(pages.slice(index, index + 8).map(async (page) => JSON.parse(await fetchText(CWI_INDEX + page))));
    payloads.push(...batch);
  }
  const rows = [...(first.results || []), ...payloads.flatMap((payload) => payload.results || [])];
  return new Map(rows.filter((row) => row.known_as && row.url).map((row) => [normalizeName(row.known_as), `https://www.windiescricket.com${row.url}`]));
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

function createOverview(player, profile) {
  const role = profile.playingRole || player.role || "cricketer";
  const nationality = profile.countryLabel || profile.nationality || "the Caribbean";
  const style = profile.battingStyle && profile.battingStyle !== "To be confirmed" ? ` ${profile.battingStyle} batting` : "";
  return `${player.name} is a ${role.toLowerCase()} from ${nationality} listed with ${player.team} for CPL 2026.${style ? ` The profile records${style} and ${profile.bowlingStyle.toLowerCase()} bowling.` : ""} Current-season appearances and statistics are added only from verified scorecards.`;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const skipFetch = process.argv.includes("--offline");
  const players = JSON.parse(fs.readFileSync(PLAYERS_PATH, "utf8"));
  const squads = JSON.parse(fs.readFileSync(SQUADS_PATH, "utf8"));
  const sources = JSON.parse(fs.readFileSync(SOURCES_PATH, "utf8"));
  const existing = JSON.parse(fs.readFileSync(PROFILES_PATH, "utf8")).profiles || [];
  const existingBySlug = new Map(existing.map((profile) => [profile.playerSlug, profile]));
  const squadByCode = new Map(squads.teams.map((squad) => [squad.teamCode, squad]));
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const cwiIndex = skipFetch ? new Map() : await collectCwiIndex();
  const cwiCandidates = players.filter((player) => !INTERNATIONAL_PROFILES[player.slug] && cwiIndex.has(normalizeName(player.officialName || player.name)));
  const fetched = new Map();

  if (!skipFetch) {
    const rows = await mapWithConcurrency(cwiCandidates, 7, async (player) => {
      const sourceUrl = cwiIndex.get(normalizeName(player.officialName || player.name));
      try {
        const labels = getLabels(await fetchText(sourceUrl));
        return [player.slug, {
          nationality: "West Indies",
          countryLabel: "West Indies",
          dateOfBirth: labels.get("Born") || null,
          battingStyle: displayBatting(labels.get("Batting")),
          bowlingStyle: displayBowling(labels.get("Bowling")),
          sourceUrl
        }];
      } catch (error) {
        process.stderr.write(`Profile source warning for ${player.name}: ${error.message}\n`);
        return [player.slug, null];
      }
    });
    rows.forEach(([slug, profile]) => { if (profile) fetched.set(slug, profile); });
  }

  const today = new Date().toISOString().slice(0, 10);
  const profiles = players.map((player) => {
    const squad = squadByCode.get(player.teamCode);
    const source = { ...(fetched.get(player.slug) || INTERNATIONAL_PROFILES[player.slug] || {}), ...(PROFILE_OVERRIDES[player.slug] || {}) };
    const rosterSource = (player.sourceIds || []).map((id) => sourceById.get(id)).find((record) => record?.url);
    const generated = {
      playerSlug: player.slug,
      fullName: player.name,
      nationality: source.nationality || "West Indies",
      countryLabel: source.countryLabel || source.nationality || "West Indies",
      dateOfBirth: source.dateOfBirth || null,
      birthplace: source.birthplace || null,
      battingStyle: source.battingStyle || "To be confirmed",
      bowlingStyle: source.bowlingStyle || "To be confirmed",
      playingRole: source.playingRole || player.role || "Role to be confirmed",
      squadStatus: squad?.completeness === "complete" ? "Complete roster" : "Confirmed to date",
      sourceUrl: source.sourceUrl || player.imageSourcePage || rosterSource?.url || null,
      lastChecked: source.sourceUrl ? today : (player.lastChecked || squads.lastChecked),
      seasonNote: `${player.name} is included in the verified ${player.team} CPL 2026 squad record. Match appearances, live form and current-season statistics will update after confirmed scorecards are published.`
    };
    generated.overview = createOverview(player, generated);
    const previous = existingBySlug.get(player.slug) || {};
    const merged = { ...generated, ...previous };
    for (const field of ["nationality", "countryLabel", "dateOfBirth", "battingStyle", "bowlingStyle", "playingRole", "squadStatus", "sourceUrl", "overview", "seasonNote"]) {
      if (!previous[field] || previous[field] === "To be confirmed" || previous[field] === "Role to be confirmed") merged[field] = generated[field];
    }
    return merged;
  });

  const report = {
    generatedAt: new Date().toISOString(),
    players: players.length,
    cwiProfilesMatched: fetched.size,
    internationalProfiles: players.filter((player) => INTERNATIONAL_PROFILES[player.slug]).length,
    battingStylesConfirmed: profiles.filter((profile) => profile.battingStyle && profile.battingStyle !== "To be confirmed").length,
    bowlingStylesConfirmed: profiles.filter((profile) => profile.bowlingStyle && profile.bowlingStyle !== "To be confirmed").length,
    primarySourcesAttached: profiles.filter((profile) => profile.sourceUrl).length,
    mode: dryRun ? "dry-run" : "write"
  };

  if (!dryRun) fs.writeFileSync(PROFILES_PATH, JSON.stringify({ profiles }, null, 2) + "\n");
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
}

main().catch((error) => { console.error(error); process.exit(1); });
