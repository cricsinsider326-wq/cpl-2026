const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const playersPath = path.join(root, "src", "data", "players.json");
const squadsPath = path.join(root, "src", "data", "squads.json");
const teamsPath = path.join(root, "src", "data", "teams.json");

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function sync() {
  const current = JSON.parse(fs.readFileSync(playersPath, "utf8"));
  const squads = JSON.parse(fs.readFileSync(squadsPath, "utf8"));
  const teams = JSON.parse(fs.readFileSync(teamsPath, "utf8"));
  const teamsByCode = new Map(teams.map((team) => [team.code, team]));
  const byName = new Map(current.map((player) => [player.name, player]));
  const output = [];

  for (const squad of squads.teams) {
    for (const name of squad.players) {
      const existing = byName.get(name);
      const player = existing
        ? {
            ...existing,
            teamCode: squad.teamCode,
            sourceIds: [...new Set([...(existing.sourceIds || []), ...squad.sourceIds])],
            rosterStatus: squad.completeness,
            verificationStatus: squad.status,
            status: squad.status,
            lastChecked: squads.lastChecked,
            artworkStatus: existing.photo ? "ready" : "pending"
          }
        : {
            name,
            slug: slugify(name),
            teamCode: squad.teamCode,
            team: teamsByCode.get(squad.teamCode)?.name || "",
            role: "Role to be confirmed",
            initials: initials(name),
            stat: "Not started",
            context: "Confirmed CPL 2026 squad listing",
            officialName: name,
            officialSlug: slugify(name),
            sourceIds: squad.sourceIds,
            rosterStatus: squad.completeness,
            verificationStatus: squad.status,
            status: squad.status,
            lastChecked: squads.lastChecked,
            artworkStatus: "pending"
          };

      output.push(player);
    }
  }

  const syncedByName = new Map(output.map((player) => [player.name, player]));
  const unique = [];
  const seen = new Set();
  for (const player of [...current, ...output]) {
    if (seen.has(player.name)) continue;
    seen.add(player.name);
    unique.push(syncedByName.get(player.name) || player);
  }

  fs.writeFileSync(playersPath, `${JSON.stringify(unique, null, 2)}\n`);
  console.log(`Synced ${unique.length} player records from ${squads.teams.length} squad records.`);
  console.log(`Artwork ready: ${unique.filter((player) => player.artworkStatus === "ready").length}`);
  console.log(`Artwork pending: ${unique.filter((player) => player.artworkStatus === "pending").length}`);
}

sync();
