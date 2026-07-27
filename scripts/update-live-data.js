const fs = require("fs");
const path = require("path");
const { loadTournamentData } = require("../src/lib/tournamentData");

const ROOT = path.resolve(__dirname, "..");
const REPORT_DIR = path.join(ROOT, "reports", "live-data");
const DATA_FILES = {
  fixtures: "fixtures.json",
  results: "results.json",
  squads: "squads.json",
  playerStats: "playerStats.json"
};

function getArg(name) {
  const prefix = `--${name}=`;
  const value = process.argv.find((argument) => argument.startsWith(prefix));
  return value ? value.slice(prefix.length) : null;
}

async function readPayload(input) {
  if (/^https?:\/\//i.test(input)) {
    const response = await fetch(input, { signal: AbortSignal.timeout(60_000), headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`${response.status}: ${input}`);
    return response.json();
  }
  return JSON.parse(fs.readFileSync(path.resolve(ROOT, input), "utf8"));
}

function validateShape(key, value) {
  if (key === "fixtures" && !Array.isArray(value)) throw new Error("fixtures must be an array");
  if (key === "results" && (!value || !Array.isArray(value.matches))) throw new Error("results must contain matches[]");
  if (key === "squads" && (!value || !Array.isArray(value.teams))) throw new Error("squads must contain teams[]");
  if (key === "playerStats" && (!value || !Array.isArray(value.players))) throw new Error("playerStats must contain players[]");
}

function writeReport(report) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORT_DIR, "latest.json"), JSON.stringify(report, null, 2) + "\n");
}

async function main() {
  const input = getArg("input");
  const apply = process.argv.includes("--apply");
  const report = { startedAt: new Date().toISOString(), mode: apply ? "apply" : "audit", input: input || null, changes: [] };

  if (input) {
    const payload = await readPayload(input);
    for (const [key, filename] of Object.entries(DATA_FILES)) {
      if (!(key in payload)) continue;
      validateShape(key, payload[key]);
      report.changes.push({ key, records: Array.isArray(payload[key]) ? payload[key].length : (payload[key].matches || payload[key].teams || payload[key].players).length });
      if (apply) fs.writeFileSync(path.join(ROOT, "src", "data", filename), JSON.stringify(payload[key], null, 2) + "\n");
    }
  }

  const data = loadTournamentData(ROOT);
  report.finishedAt = new Date().toISOString();
  report.status = "passed";
  report.summary = {
    fixtures: data.fixtures.length,
    completedResults: data.results.matches.length,
    squads: data.squads.teams.length,
    completeSquads: data.squads.teams.filter((squad) => squad.completeness === "complete").length,
    playerStats: data.playerStats.players.length,
    dataQuality: data.dataQuality.overallStatus
  };
  writeReport(report);
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
}

main().catch((error) => {
  const report = { finishedAt: new Date().toISOString(), status: "failed", error: error.message };
  writeReport(report);
  console.error(error);
  process.exit(1);
});
