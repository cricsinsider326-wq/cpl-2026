const fs = require("fs");
const path = require("path");
const { validateTournamentData } = require("./dataQuality");
const { createTournament2026 } = require("./tournament2026");

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function loadTournamentData(root) {
  const data = {
    site: readJson(root, "src/data/site.json"),
    teams: readJson(root, "src/data/teams.json"),
    players: readJson(root, "src/data/players.json"),
    fixtures: readJson(root, "src/data/fixtures.json"),
    venues: readJson(root, "src/data/venues.json"),
    news: readJson(root, "src/data/news.json"),
    faqs: readJson(root, "src/data/faqs.json"),
    content: readJson(root, "src/data/content.json"),
    sources: readJson(root, "src/data/sources.json"),
    squads: readJson(root, "src/data/squads.json"),
    broadcasters: readJson(root, "src/data/broadcasters.json"),
    results: readJson(root, "src/data/results.json"),
    playerStats: readJson(root, "src/data/playerStats.json"),
    playerProfiles: readJson(root, "src/data/playerProfiles.json")
  };

  data.dataQuality = validateTournamentData(data);
  if (data.dataQuality.errors.length) {
    throw new Error(`Tournament data validation failed:\n- ${data.dataQuality.errors.join("\n- ")}`);
  }

  data.tournament2026 = createTournament2026(data);
  data.site.tournament = data.tournament2026;
  data.site.stats = {
    ...data.site.stats,
    teams: data.tournament2026.teamCount,
    matches: data.tournament2026.matchCount,
    venues: data.tournament2026.venueCount
  };
  data.site.buildUpdated = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Karachi"
  }).format(new Date());

  data.squadByTeam = new Map(data.squads.teams.map((record) => [record.teamCode, record]));
  data.currentStatsByPlayer = new Map(data.playerStats.players.map((record) => [record.playerSlug, record]));
  data.playerProfileBySlug = new Map(data.playerProfiles.profiles.map((record) => [record.playerSlug, record]));
  data.players = data.players.map((player) => {
    const profile = data.playerProfileBySlug.get(player.slug);
    return profile ? {
      ...player,
      nationality: profile.nationality,
      role: player.role === "Role to be confirmed" && profile.playingRole ? profile.playingRole : player.role,
      profile
    } : player;
  });
  data.sourcesById = new Map(data.sources.map((source) => [source.id, source]));
  return data;
}

module.exports = { loadTournamentData };
