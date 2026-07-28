const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const APPLY = process.argv.includes("--apply");
const CHECKED_ON = new Date().toISOString().slice(0, 10);

const files = {
  squads: path.join(ROOT, "src", "data", "squads.json"),
  players: path.join(ROOT, "src", "data", "players.json"),
  sources: path.join(ROOT, "src", "data", "sources.json"),
  teams: path.join(ROOT, "src", "data", "teams.json")
};

const announcements = [
  {
    teamCode: "JAK",
    id: 19961,
    slug: "jamaica-kingsmen-unveil-overseas-players-for-cpl-2026",
    sourceId: "official-cpl-2026-jak-overseas",
    publishedAt: "2026-07-20",
    name: "Jamaica Kingsmen overseas players for CPL 2026",
    phasedAvailability: true,
    scope: "All nineteen officially announced players are listed. The seven-player overseas contingent includes phased replacements from 19 August.",
    players: [
      ["Maaz Sadaqat", "Allrounder", "Pakistan"],
      ["Saim Ayub", "Batter / Allrounder", "Pakistan"],
      ["Usman Khan", "Batter / Wicketkeeper", "Pakistan"],
      ["Hassan Khan", "Allrounder", "Pakistan"],
      ["Hunain Shah", "Bowler", "Pakistan"],
      ["Shayan Jahangir", "Batter / Wicketkeeper", "United States"],
      ["Tayyab Arif", "Batter", "Pakistan"]
    ]
  },
  {
    teamCode: "ABF",
    id: 20008,
    slug: "falcons-confirm-overseas-players",
    sourceId: "official-cpl-2026-abf-overseas",
    publishedAt: "2026-07-21",
    name: "Antigua and Barbuda Falcons overseas players for CPL 2026",
    phasedAvailability: true,
    scope: "All eighteen officially announced players are listed. Availability varies across the six-player overseas contingent.",
    players: [
      ["Moeen Ali", "Allrounder", "England"],
      ["Kusal Perera", "Batter / Wicketkeeper", "Sri Lanka"],
      ["Milind Kumar", "Batter / Allrounder", "United States"],
      ["Tajinder Singh", "Allrounder", "United States"],
      ["Shadab Khan", "Allrounder", "Pakistan"],
      ["Sufiyan Muqeem", "Bowler", "Pakistan"]
    ]
  },
  {
    teamCode: "TKR",
    id: 20138,
    slug: "trinbago-knight-riders-unveil-overseas-contingent-for-cpl-2026",
    sourceId: "official-cpl-2026-tkr-overseas",
    publishedAt: "2026-07-23",
    name: "Trinbago Knight Riders overseas contingent for CPL 2026",
    scope: "Seventeen-player roster compiled from the official local-player draft and five-player overseas-contingent announcement.",
    players: [
      ["Alex Hales", "Batter", "England"],
      ["Usman Tariq", "Bowler", "Pakistan"],
      ["Colin Munro", "Batter", "New Zealand"],
      ["Matthew Breetzke", "Batter", "South Africa"],
      ["Amshi de Silva", "Allrounder", "Sri Lanka"]
    ]
  },
  {
    teamCode: "SKNP",
    id: 20170,
    slug: "st-kitts-nevis-patriots-confirm-overseas-players-for-cpl-2026",
    sourceId: "official-cpl-2026-sknp-overseas",
    publishedAt: "2026-07-24",
    name: "St Kitts and Nevis Patriots overseas players for CPL 2026",
    scope: "Seventeen-player roster compiled from the official local-player draft and five-player overseas-contingent announcement.",
    players: [
      ["Naseem Shah", "Bowler", "Pakistan"],
      ["Dasun Shanaka", "Allrounder", "Sri Lanka"],
      ["Waqar Salamkheil", "Bowler", "Afghanistan"],
      ["Wanindu Hasaranga", "Allrounder", "Sri Lanka"],
      ["Nikhil Chaudhary", "Allrounder", "Australia"]
    ]
  }
];

const verifiedRoleCorrections = new Map([
  ["Dexter Sween", ["Allrounder", "Trinidad & Tobago"]],
  ["Akeem Auguste", ["Batter", "Saint Lucia"]],
  ["Charith Asalanka", ["Batter / Allrounder", "Sri Lanka"]],
  ["Shadley van Schalkwyk", ["Bowling Allrounder", "United States"]],
  ["Rakheem Cornwall", ["Allrounder", "Antigua & Barbuda"]]
]);

function slugify(value) {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function initials(value) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

async function fetchAnnouncement(announcement) {
  const endpoint = `https://wp.cplt20.com/wp-json/wp/v2/news/${announcement.id}`;
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`${response.status} from ${endpoint}`);
  const post = await response.json();
  if (post.slug !== announcement.slug) throw new Error(`Unexpected slug for official CPL post ${announcement.id}`);
  if (!post.date.startsWith(announcement.publishedAt)) throw new Error(`Unexpected publication date for ${announcement.slug}`);
  const description = post.acf?.description || "";
  for (const [name] of announcement.players) {
    if (!description.includes(name)) throw new Error(`${name} is not present in ${announcement.slug}`);
  }
  return {
    ...announcement,
    url: post.link,
    title: post.title?.rendered || announcement.name
  };
}

async function main() {
  const verified = await Promise.all(announcements.map(fetchAnnouncement));
  const squads = JSON.parse(fs.readFileSync(files.squads, "utf8"));
  const players = JSON.parse(fs.readFileSync(files.players, "utf8"));
  const sources = JSON.parse(fs.readFileSync(files.sources, "utf8"));
  const teams = JSON.parse(fs.readFileSync(files.teams, "utf8"));
  const teamByCode = new Map(teams.map((team) => [team.code, team]));
  const squadByCode = new Map(squads.teams.map((squad) => [squad.teamCode, squad]));
  const playerByName = new Map(players.map((player) => [player.name, player]));
  const sourceById = new Map(sources.map((source) => [source.id, source]));

  for (const announcement of verified) {
    const squad = squadByCode.get(announcement.teamCode);
    const team = teamByCode.get(announcement.teamCode);
    if (!squad || !team) throw new Error(`Missing local team data for ${announcement.teamCode}`);

    squad.players = [...new Set([...squad.players, ...announcement.players.map(([name]) => name)])];
    squad.status = "verified";
    squad.completeness = "complete";
    squad.scope = announcement.scope;
    squad.phasedAvailability = Boolean(announcement.phasedAvailability);
    squad.sourceIds = [...new Set([...squad.sourceIds, announcement.sourceId])];

    sourceById.set(announcement.sourceId, {
      id: announcement.sourceId,
      name: announcement.name,
      publisher: "Caribbean Premier League",
      url: announcement.url,
      sourceType: "primary",
      status: "verified",
      lastChecked: CHECKED_ON,
      publishedAt: announcement.publishedAt
    });

    for (const [name, role, nationality] of announcement.players) {
      const current = playerByName.get(name) || {
        name,
        slug: slugify(name),
        initials: initials(name),
        stat: "Not started",
        artworkStatus: "pending"
      };
      playerByName.set(name, {
        ...current,
        teamCode: team.code,
        team: team.name,
        role,
        nationality,
        context: "Official CPL 2026 squad announcement",
        officialName: name,
        officialSlug: slugify(name),
        sourceIds: [...new Set([...(current.sourceIds || []), announcement.sourceId])],
        rosterStatus: "complete",
        verificationStatus: "verified",
        status: "verified",
        lastChecked: CHECKED_ON,
        artworkStatus: current.heroPhoto || current.photo ? "ready" : "pending"
      });
    }
  }

  for (const squad of squads.teams) {
    if (squad.completeness === "complete") {
      for (const name of squad.players) {
        const player = playerByName.get(name);
        if (player) player.rosterStatus = "complete";
      }
    }
  }

  for (const [name, [role, nationality]] of verifiedRoleCorrections) {
    const player = playerByName.get(name);
    if (!player) continue;
    player.role = role;
    player.nationality = player.nationality || nationality;
    player.lastChecked = CHECKED_ON;
  }

  squads.lastChecked = CHECKED_ON;
  squads.teams.forEach((squad) => {
    if (squad.completeness === "complete") {
      squad.scope = squad.scope.replace("Seventeen-player", `${squad.players.length}-player`);
    }
  });

  const outputPlayers = [];
  const seen = new Set();
  for (const player of [...players, ...playerByName.values()]) {
    if (seen.has(player.name)) continue;
    seen.add(player.name);
    outputPlayers.push(playerByName.get(player.name) || player);
  }
  const outputSources = [...sourceById.values()];

  const summary = {
    checkedOn: CHECKED_ON,
    officialAnnouncementsVerified: verified.length,
    teams: squads.teams.map((squad) => ({ code: squad.teamCode, players: squad.players.length, completeness: squad.completeness })),
    playerRecords: outputPlayers.length,
    pendingRoles: outputPlayers.filter((player) => player.role === "Role to be confirmed").length,
    mode: APPLY ? "apply" : "dry-run"
  };

  if (APPLY) {
    fs.writeFileSync(files.squads, `${JSON.stringify(squads, null, 2)}\n`);
    fs.writeFileSync(files.players, `${JSON.stringify(outputPlayers, null, 2)}\n`);
    fs.writeFileSync(files.sources, `${JSON.stringify(outputSources, null, 2)}\n`);
  }
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
