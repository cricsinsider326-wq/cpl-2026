const CONFIRMED_STATUSES = new Set(["verified", "reviewed"]);

function recordSourceIds(record) {
  return [...new Set([...(record?.sourceIds || []), record?.sourceId].filter(Boolean))];
}

function isConfirmed(record, sourcesById) {
  if (!record || !CONFIRMED_STATUSES.has(record.status)) return false;
  const ids = recordSourceIds(record);
  if (!ids.length) return false;
  return ids.every((id) => {
    const source = sourcesById.get(id);
    return Boolean(source && source.url && CONFIRMED_STATUSES.has(source.status));
  });
}

function validateTournamentData(data) {
  const errors = [];
  const warnings = [];
  const sourceIds = new Set();
  const sourcesById = new Map();

  for (const source of data.sources) {
    if (!source.id) errors.push("Source record missing id.");
    if (sourceIds.has(source.id)) errors.push(`Duplicate source id: ${source.id}`);
    sourceIds.add(source.id);
    sourcesById.set(source.id, source);
    if (CONFIRMED_STATUSES.has(source.status) && !source.url) {
      errors.push(`Confirmed source ${source.id} must have a URL.`);
    }
  }

  const teamCodes = new Set(data.teams.map((team) => team.code));
  const teamSlugs = new Set();
  for (const team of data.teams) {
    if (!team.code || !team.slug || !team.name) errors.push("Every team needs code, slug and name.");
    if (teamSlugs.has(team.slug)) errors.push(`Duplicate team slug: ${team.slug}`);
    teamSlugs.add(team.slug);
  }

  const squadCodes = new Set();
  for (const squad of data.squads.teams) {
    if (!teamCodes.has(squad.teamCode)) errors.push(`Squad references unknown team: ${squad.teamCode}`);
    if (squadCodes.has(squad.teamCode)) errors.push(`Duplicate squad record: ${squad.teamCode}`);
    squadCodes.add(squad.teamCode);
    const hasNamedData = Boolean(squad.captain || squad.coach || squad.players.length);
    if (hasNamedData && !isConfirmed(squad, sourcesById)) {
      errors.push(`Squad ${squad.teamCode} has named data without a confirmed source.`);
    }
    if (squad.players.length !== new Set(squad.players).size) {
      errors.push(`Squad ${squad.teamCode} contains duplicate player names.`);
    }
    if (squad.completeness === "complete" && squad.players.length !== 17) {
      errors.push(`Complete squad ${squad.teamCode} must contain 17 players.`);
    }
    if (squad.players.length && !["partial", "complete"].includes(squad.completeness)) {
      errors.push(`Squad ${squad.teamCode} needs partial or complete status.`);
    }
  }
  for (const code of teamCodes) {
    if (!squadCodes.has(code)) errors.push(`Missing squad status record for ${code}.`);
  }

  const teamsByName = new Map(data.teams.map((team) => [team.name, team]));
  const squadsByCode = new Map(data.squads.teams.map((squad) => [squad.teamCode, squad]));
  const playerNames = new Set();
  const playerProfileSlugs = new Set();
  const profileBySlug = new Map((data.playerProfiles?.profiles || []).map((profile) => [profile.playerSlug, profile]));
  for (const player of data.players) {
    if (playerNames.has(player.name)) errors.push(`Duplicate player record: ${player.name}`);
    playerNames.add(player.name);
    if (!player.slug) errors.push(`Player ${player.name} is missing a profile slug.`);
    if (playerProfileSlugs.has(player.slug)) errors.push(`Duplicate player slug: ${player.slug}`);
    playerProfileSlugs.add(player.slug);
    const team = teamsByName.get(player.team);
    if (!team) {
      errors.push(`Player ${player.name} references unknown current team ${player.team}.`);
      continue;
    }
    const squad = squadsByCode.get(team.code);
    if (squad?.players.length && !squad.players.includes(player.name)) {
      errors.push(`Player ${player.name} is not present in the verified ${team.code} squad record.`);
    }
    if (!isConfirmed(player, sourcesById)) {
      errors.push(`Player ${player.name} lacks a confirmed roster source.`);
    }
    const profile = profileBySlug.get(player.slug);
    if (!profile) errors.push(`Player ${player.name} is missing a profile data record.`);
    if (profile && (!profile.playingRole || !profile.nationality || !profile.squadStatus || !profile.overview)) {
      errors.push(`Player ${player.name} has an incomplete profile data record.`);
    }
  }
  for (const squad of data.squads.teams) {
    for (const name of squad.players) {
      if (!playerNames.has(name)) errors.push(`Verified ${squad.teamCode} squad player is missing a profile: ${name}`);
    }
  }

  for (const market of data.broadcasters.markets) {
    const hasRightsData = Boolean(market.tvBroadcaster || market.streamingPlatform);
    if (hasRightsData && !isConfirmed(market, sourcesById)) {
      errors.push(`Broadcaster market ${market.market} has named rights data without a confirmed source.`);
    }
  }

  const fixtureSlugs = new Set();
  for (const fixture of data.fixtures) {
    if (!fixture.slug || !fixture.dateISO || !fixture.match || !fixture.venue) {
      errors.push(`Fixture missing required fields: ${fixture.match || fixture.slug || "unknown"}`);
    }
    if (fixtureSlugs.has(fixture.slug)) errors.push(`Duplicate fixture slug: ${fixture.slug}`);
    fixtureSlugs.add(fixture.slug);
    if (Number.isNaN(Date.parse(`${fixture.dateISO}T00:00:00Z`))) errors.push(`Invalid fixture date: ${fixture.dateISO}`);
    for (const code of [fixture.teamA, fixture.teamB].filter(Boolean)) {
      if (!teamCodes.has(code)) errors.push(`Fixture ${fixture.slug} references unknown team ${code}.`);
    }
  }
  const fixtureSource = sourcesById.get("official-cpl-2026-fixtures");
  if (!fixtureSource || !fixtureSource.url) {
    warnings.push("Fixture dataset needs a direct primary-source article URL before it can be marked fully verified.");
  }

  for (const result of data.results.matches) {
    if (!fixtureSlugs.has(result.fixtureSlug)) errors.push(`Result references unknown fixture: ${result.fixtureSlug}`);
    if (!isConfirmed(result, sourcesById)) errors.push(`Result ${result.fixtureSlug} lacks a confirmed source.`);
    if (result.status !== "completed") errors.push(`Published result ${result.fixtureSlug} must be completed.`);
  }

  const playerSlugs = new Set(data.players.map((player) => player.slug));
  for (const stat of data.playerStats.players) {
    if (!playerSlugs.has(stat.playerSlug)) errors.push(`Player statistic references unknown player: ${stat.playerSlug}`);
    if (!isConfirmed(stat, sourcesById)) errors.push(`Player statistic ${stat.playerSlug} lacks a confirmed source.`);
  }

  const confirmedSquads = data.squads.teams.filter((record) => isConfirmed(record, sourcesById)).length;
  const completeSquads = data.squads.teams.filter((record) => isConfirmed(record, sourcesById) && record.completeness === "complete").length;
  const confirmedMarkets = data.broadcasters.markets.filter((record) => isConfirmed(record, sourcesById)).length;
  const confirmedResults = data.results.matches.filter((record) => isConfirmed(record, sourcesById)).length;
  const confirmedPlayerStats = data.playerStats.players.filter((record) => isConfirmed(record, sourcesById)).length;

  return {
    generatedAt: new Date().toISOString(),
    overallStatus: errors.length ? "failed" : warnings.length ? "review-required" : "verified",
    errors,
    warnings,
    summary: {
      sources: data.sources.length,
      fixtures: data.fixtures.length,
      teams: data.teams.length,
      confirmedSquads,
      completeSquads,
      totalSquads: data.squads.teams.length,
      confirmedMarkets,
      totalMarkets: data.broadcasters.markets.length,
      confirmedResults,
      confirmedPlayerStats
    },
    readiness: {
      squads: completeSquads === data.teams.length,
      broadcasters: confirmedMarkets > 0,
      results: confirmedResults > 0,
      playerStats: confirmedPlayerStats > 0
    }
  };
}

function routeIsIndexable(route, data) {
  if (route === "search") return false;
  if (route === "results") return data.dataQuality.readiness.results;
  if (["videos", "history", "winners-list", "records", "past-seasons"].includes(route)) return false;
  return true;
}

module.exports = { isConfirmed, recordSourceIds, routeIsIndexable, validateTournamentData };
