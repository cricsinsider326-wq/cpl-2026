const { escapeHtml } = require("../lib/html");

function teamByCode(teams, code) {
  return teams.find((team) => team.code === code) || {};
}

function renderTeamIdentity(team) {
  return `<div class="pm-team" style="--team-accent:${escapeHtml(team.accent || "#ffd400")}">
    <img src="${escapeHtml(team.logo || "")}" alt="${escapeHtml(team.name || "CPL team")} logo" width="92" height="92" />
    <div><span>${escapeHtml(team.country || "Caribbean")}</span><strong>${escapeHtml(team.name || "To be announced")}</strong></div>
  </div>`;
}

function renderFeaturedMatch(site, teams, fixtures) {
  const match = fixtures[0];
  const teamA = teamByCode(teams, match.teamA);
  const teamB = teamByCode(teams, match.teamB);

  return `<section class="pm-match-section" aria-labelledby="next-match-title">
    <article class="pm-match-card">
      <div class="pm-match-status">
        <div><span class="status-badge">Next match</span><p id="next-match-title">Opening fixture &middot; CPL 2026</p></div>
        <p class="pm-updated"><i data-lucide="refresh-cw"></i> Updated ${escapeHtml(site.tournament.lastVerifiedAt)}</p>
      </div>
      <div class="pm-match-main">
        ${renderTeamIdentity(teamA)}
        <div class="pm-match-vs"><span>VS</span><time datetime="${escapeHtml(match.dateISO)}">${escapeHtml(match.dateText)} 2026</time><b>${escapeHtml(match.time)} local</b></div>
        ${renderTeamIdentity(teamB)}
      </div>
      <div class="pm-match-meta">
        <span><i data-lucide="map-pin"></i>${escapeHtml(match.venue)}</span>
        <span><i data-lucide="clock-3"></i>Times shown in venue local time</span>
        <div><a class="secondary-button" href="/fixtures/${escapeHtml(match.slug)}/">Match Centre</a><a class="primary-button" href="/tickets/">Ticket Guide</a></div>
      </div>
    </article>
  </section>`;
}

function renderSectionHeader() {
  return `<div class="pm-section-heading pm-matchday-heading">
    <div><p class="eyebrow">Match centre</p><h2 id="matchday-title">CPL live score and upcoming fixtures</h2></div>
    <a href="/live-score/">Open live score <i data-lucide="arrow-right" aria-hidden="true"></i></a>
  </div>`;
}

function renderCardHeader(title, linkHref = "", linkLabel = "") {
  return `<div class="pm-card-heading">${title}${linkHref ? `<a href="${linkHref}">${linkLabel}</a>` : ""}</div>`;
}

function renderFixtureRow(match, teams) {
    const teamA = teamByCode(teams, match.teamA);
    const teamB = teamByCode(teams, match.teamB);
    return `<a class="pm-fixture-row" href="/fixtures/${escapeHtml(match.slug)}/" aria-label="Open match centre for ${escapeHtml(match.match)} on ${escapeHtml(match.dateText)} at ${escapeHtml(match.time)}">
      <time datetime="${escapeHtml(match.dateISO)}"><b>${escapeHtml(match.date)} 2026</b><span>${escapeHtml(match.day)} &middot; ${escapeHtml(match.time)}</span></time>
      <span class="pm-fixture-team"><img src="${escapeHtml(teamA.logo || "")}" alt="${escapeHtml(teamA.name || match.teamAName)} logo" width="76" height="76" loading="lazy" /><strong>${escapeHtml(match.teamA || match.teamAName)}</strong></span>
      <b class="pm-fixture-vs">VS</b>
      <span class="pm-fixture-team"><img src="${escapeHtml(teamB.logo || "")}" alt="${escapeHtml(teamB.name || match.teamBName)} logo" width="76" height="76" loading="lazy" /><strong>${escapeHtml(match.teamB || match.teamBName)}</strong></span>
      <span class="pm-fixture-venue">${escapeHtml(match.venue)}</span>
      <i class="pm-row-arrow" data-lucide="chevron-right" aria-hidden="true"></i>
    </a>`;
}

function renderFixtureRows(fixtures, teams) {
  return fixtures.slice(0, 5).map((match) => renderFixtureRow(match, teams)).join("");
}

function renderNewsRows(news) {
  return news.slice(0, 3).map((item) => `<a class="pm-news-row" href="/news/${escapeHtml(item.slug)}/" aria-label="Read ${escapeHtml(item.title)}">
    <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" width="110" height="76" loading="lazy" />
    <span class="pm-news-copy"><span>${escapeHtml(item.category)} &middot; ${escapeHtml(item.date)}</span><strong>${escapeHtml(item.title)}</strong><small>4 min read</small></span>
  </a>`).join("");
}

function renderLiveScoreCard(site, teams, fixtures) {
  const next = fixtures[0];
  const teamA = teamByCode(teams, next.teamA);
  const teamB = teamByCode(teams, next.teamB);
  return `<article class="pm-live-score-feature" aria-labelledby="home-live-score-title">
    ${renderCardHeader('<div><span>Match centre</span><h3 id="home-live-score-title">CPL live score</h3></div>', "/live-score/", "Open live score")}
    <div class="pm-live-score-state">
      <div class="pm-score-status"><span class="status-badge neutral"><i data-lucide="circle-pause" aria-hidden="true"></i> No live match</span><p>${escapeHtml(next.dateText)} 2026 &middot; ${escapeHtml(next.venue)}</p></div>
      <div class="pm-score-preview">
        <div class="pm-score-team"><img src="${escapeHtml(teamA.logo || "")}" alt="${escapeHtml(teamA.name || next.teamAName)} logo" width="112" height="112" /><strong>${escapeHtml(teamA.name || next.teamAName)}</strong><span>${escapeHtml(next.teamA)}</span></div>
        <div class="pm-score-centre"><small>Next fixture</small><b>VS</b><time datetime="${escapeHtml(next.dateISO)}">${escapeHtml(next.time)} local</time></div>
        <div class="pm-score-team"><img src="${escapeHtml(teamB.logo || "")}" alt="${escapeHtml(teamB.name || next.teamBName)} logo" width="112" height="112" /><strong>${escapeHtml(teamB.name || next.teamBName)}</strong><span>${escapeHtml(next.teamB)}</span></div>
      </div>
      <div class="pm-score-note"><i data-lucide="activity" aria-hidden="true"></i><p><strong>Scorecard activates on match day</strong><span>Toss, playing XI, innings score and over-by-over updates will appear here after verification.</span></p></div>
      <div class="pm-score-actions"><a class="primary-button" href="/fixtures/${escapeHtml(next.slug)}/">Match centre <i data-lucide="arrow-right" aria-hidden="true"></i></a><a class="secondary-button" href="/fixtures/">Full schedule <i data-lucide="arrow-right" aria-hidden="true"></i></a></div>
    </div>
    <p class="pm-live-updated"><i data-lucide="refresh-cw" aria-hidden="true"></i> Last checked ${escapeHtml(site.tournament.lastVerifiedAt)}</p>
  </article>`;
}

function renderUpcomingFixturesCard(fixtures, teams) {
  return `<article class="pm-desk-card pm-fixtures-card" aria-labelledby="upcoming-fixtures-title">
    <div class="pm-fixtures-heading"><div><span>Match centre</span><h3 id="upcoming-fixtures-title">Upcoming fixtures</h3></div><a href="/fixtures/">View all fixtures <i data-lucide="arrow-right" aria-hidden="true"></i></a></div>
    <div class="pm-fixture-list">${renderFixtureRows(fixtures, teams)}</div>
    <a class="pm-card-footer" href="/fixtures/">View full CPL 2026 schedule <i data-lucide="arrow-right" aria-hidden="true"></i></a>
  </article>`;
}

function renderLatestNewsCard(news) {
  return `<article class="pm-desk-card pm-news-card">
    ${renderCardHeader("<h3>Latest news</h3>", "/news/", "View all CPL news")}
    <div class="pm-news-list">${renderNewsRows(news)}</div>
  </article>`;
}

function renderMatchdayDesk(site, teams, fixtures) {
  return `<section class="pm-section pm-matchday" aria-labelledby="matchday-title">
    ${renderSectionHeader()}
    <div class="pm-matchday-grid">
      ${renderLiveScoreCard(site, teams, fixtures)}
      ${renderUpcomingFixturesCard(fixtures, teams)}
    </div>
  </section>`;
}

function renderTeams(teams, squadByTeam) {
  return `<section class="pm-section pm-teams" aria-labelledby="teams-title">
    <div class="pm-section-heading pm-compact-heading"><div><p class="eyebrow">Seven franchises</p><h2 id="teams-title">CPL 2026 teams</h2></div><a href="/teams/">View all teams <i data-lucide="arrow-right"></i></a></div>
    <div class="pm-team-grid">${teams.map((team) => {
      const squad = squadByTeam.get(team.code);
      const squadFact = squad?.players.length
        ? `${squad.players.length}-player ${squad.completeness === "complete" ? "roster" : "local group"} confirmed`
        : "Squad announcement pending";
      return `<article class="pm-team-card" style="--team-accent:${escapeHtml(team.accent)}">
      <img src="${escapeHtml(team.logo)}" alt="${escapeHtml(team.name)} team logo" width="112" height="112" loading="lazy" />
      <div><span>${escapeHtml(team.country)}</span><h3>${escapeHtml(team.name)}</h3><p>${escapeHtml(team.homeVenue)}</p><small>${escapeHtml(squadFact)}</small></div>
      <a href="/teams/${escapeHtml(team.slug)}/" aria-label="Explore ${escapeHtml(team.name)}"><i data-lucide="arrow-up-right"></i></a>
    </article>`;
    }).join("")}</div>
  </section>`;
}

function renderHubStandings(teams) {
  return `<div class="pm-hub-standings">
    <div class="pm-hub-status">
      <span class="pm-preseason-badge"><i data-lucide="calendar-days" aria-hidden="true"></i> Pre-tournament</span>
      <p>Standings will update after the first completed match.</p>
    </div>
    <div class="pm-hub-table-wrap" tabindex="0" role="region" aria-label="CPL 2026 pre-tournament standings table">
      <table class="pm-hub-table">
        <thead><tr><th scope="col">Pos</th><th scope="col">Team</th><th scope="col">P</th><th scope="col">W</th><th scope="col">L</th><th scope="col">NRR</th><th scope="col">Pts</th></tr></thead>
        <tbody>${teams.map((team, index) => `<tr>
          <td>${index + 1}</td>
          <th scope="row"><a href="/teams/${escapeHtml(team.slug)}/"><img src="${escapeHtml(team.logo)}" alt="" width="38" height="38" loading="lazy" /><span>${escapeHtml(team.name)}</span></a></th>
          <td>&mdash;</td><td>&mdash;</td><td>&mdash;</td><td>&mdash;</td><td>&mdash;</td>
        </tr>`).join("")}</tbody>
      </table>
    </div>
    <div class="pm-hub-actions">
      <a class="primary-button" href="/fixtures/"><i data-lucide="calendar-days" aria-hidden="true"></i> View CPL 2026 fixtures <i data-lucide="arrow-right" aria-hidden="true"></i></a>
      <a class="secondary-button" href="/news/cpl-2026-points-table-explained/"><i data-lucide="circle-help" aria-hidden="true"></i> How points work <i data-lucide="arrow-right" aria-hidden="true"></i></a>
      <a class="secondary-button" href="/past-seasons/"><i data-lucide="chart-no-axes-column-increasing" aria-hidden="true"></i> Previous seasons <i data-lucide="arrow-right" aria-hidden="true"></i></a>
    </div>
  </div>`;
}

function renderHubTeamPair(match, teams) {
  const teamA = teamByCode(teams, match.teamA);
  const teamB = teamByCode(teams, match.teamB);
  return `<a class="pm-hub-matchup" href="/fixtures/${escapeHtml(match.slug)}/">
    <span><img src="${escapeHtml(teamA.logo || "")}" alt="" width="34" height="34" loading="lazy" />${escapeHtml(match.teamA)}</span>
    <b>vs</b>
    <span><img src="${escapeHtml(teamB.logo || "")}" alt="" width="34" height="34" loading="lazy" />${escapeHtml(match.teamB)}</span>
  </a>`;
}

function renderHubPanelCard({ badge, icon, message, tableLabel, tableClass, headings, rows, actions, actionCount = 2 }) {
  return `<div class="pm-hub-panel-card">
    <div class="pm-hub-status">
      <span class="pm-preseason-badge"><i data-lucide="${escapeHtml(icon)}" aria-hidden="true"></i> ${escapeHtml(badge)}</span>
      <p>${escapeHtml(message)}</p>
    </div>
    <div class="pm-hub-table-wrap" tabindex="0" role="region" aria-label="${escapeHtml(tableLabel)}">
      <table class="pm-hub-data-table ${escapeHtml(tableClass)}">
        <colgroup>${headings.map(() => "<col />").join("")}</colgroup>
        <thead><tr>${headings.map((heading) => `<th scope="col">${escapeHtml(heading)}</th>`).join("")}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="pm-hub-actions pm-hub-actions-${actionCount}">${actions}</div>
  </div>`;
}

function renderHubLiveScore(site, teams, fixtures) {
  const next = fixtures[0];
  return renderHubPanelCard({
    badge: "No live match",
    icon: "radio-tower",
    message: `Live score data was last checked ${site.tournament.lastVerifiedAt}. The next match is listed below.`,
    tableLabel: "CPL 2026 live score status",
    tableClass: "pm-hub-live-table",
    headings: ["Status", "Match", "Start", "Venue"],
    rows: `<tr><td data-label="Status"><span class="pm-hub-state pending">Scheduled</span></td><th scope="row" data-label="Match">${renderHubTeamPair(next, teams)}</th><td data-label="Start"><time datetime="${escapeHtml(next.dateISO)}">${escapeHtml(next.dateText)}<small>${escapeHtml(next.time)} local</small></time></td><td class="pm-hub-venue-cell" data-label="Venue">${escapeHtml(next.venue)}</td></tr>`,
    actions: `<a class="primary-button" href="/live-score/"><i data-lucide="radio-tower" aria-hidden="true"></i> Open live score <i data-lucide="arrow-right" aria-hidden="true"></i></a>
      <a class="secondary-button" href="/fixtures/${escapeHtml(next.slug)}/"><i data-lucide="clipboard-list" aria-hidden="true"></i> Match centre <i data-lucide="arrow-right" aria-hidden="true"></i></a>`
  });
}

function renderHubFixtures(teams, fixtures) {
  const rows = fixtures.slice(0, 5).map((match) => `<tr>
    <td data-label="Date"><time datetime="${escapeHtml(match.dateISO)}"><b>${escapeHtml(match.date)} 2026</b><small>${escapeHtml(match.day)}</small></time></td>
    <th scope="row" data-label="Match">${renderHubTeamPair(match, teams)}</th>
    <td data-label="Time">${escapeHtml(match.time)}</td>
    <td class="pm-hub-venue-cell" data-label="Venue">${escapeHtml(match.venue)}</td>
    <td data-label=""><a class="pm-hub-row-link" href="/fixtures/${escapeHtml(match.slug)}/" aria-label="Open ${escapeHtml(match.match)} match page"><i data-lucide="chevron-right" aria-hidden="true"></i></a></td>
  </tr>`).join("");
  return renderHubPanelCard({
    badge: "Upcoming matches",
    icon: "calendar-days",
    message: "The next five confirmed CPL 2026 fixtures are shown in venue local time.",
    tableLabel: "Upcoming CPL 2026 fixtures",
    tableClass: "pm-hub-fixtures-table",
    headings: ["Date", "Match", "Time", "Venue", ""],
    rows,
    actions: `<a class="primary-button" href="/fixtures/"><i data-lucide="calendar-days" aria-hidden="true"></i> View full schedule <i data-lucide="arrow-right" aria-hidden="true"></i></a>
      <a class="secondary-button" href="/teams/"><i data-lucide="shield" aria-hidden="true"></i> Explore teams <i data-lucide="arrow-right" aria-hidden="true"></i></a>`
  });
}

function renderHubResults(teams, fixtures, results) {
  const completed = results?.matches || [];
  const rows = completed.length
    ? completed.slice(0, 5).map((result) => {
      const fixture = fixtures.find((match) => match.slug === result.fixtureSlug);
      return `<tr><td data-label="Status"><span class="pm-hub-state verified">Completed</span></td><th scope="row" data-label="Match">${fixture ? renderHubTeamPair(fixture, teams) : escapeHtml(result.match)}</th><td data-label="Result">${escapeHtml(result.summary)}</td><td data-label=""><a class="pm-hub-row-link" href="/fixtures/${escapeHtml(result.fixtureSlug)}/"><i data-lucide="chevron-right" aria-hidden="true"></i></a></td></tr>`;
    }).join("")
    : fixtures.slice(0, 5).map((match) => `<tr>
      <td data-label="Date"><time datetime="${escapeHtml(match.dateISO)}">${escapeHtml(match.date)} 2026</time></td>
      <th scope="row" data-label="Match">${renderHubTeamPair(match, teams)}</th>
      <td data-label="Result"><span class="pm-hub-state pending">Awaiting match</span></td>
      <td data-label=""><a class="pm-hub-row-link" href="/fixtures/${escapeHtml(match.slug)}/" aria-label="Open ${escapeHtml(match.match)} match page"><i data-lucide="chevron-right" aria-hidden="true"></i></a></td>
    </tr>`).join("");
  return renderHubPanelCard({
    badge: completed.length ? "Verified results" : "Tournament not started",
    icon: "clipboard-check",
    message: completed.length ? `${completed.length} completed match results are available.` : "No CPL 2026 match has been completed. Upcoming matches remain clearly marked.",
    tableLabel: "CPL 2026 results status",
    tableClass: "pm-hub-results-table",
    headings: completed.length ? ["Status", "Match", "Result", ""] : ["Date", "Match", "Result", ""],
    rows,
    actions: `<a class="primary-button" href="/results/"><i data-lucide="clipboard-check" aria-hidden="true"></i> View all results <i data-lucide="arrow-right" aria-hidden="true"></i></a>
      <a class="secondary-button" href="/points-table/"><i data-lucide="table-properties" aria-hidden="true"></i> Points table <i data-lucide="arrow-right" aria-hidden="true"></i></a>`
  });
}

function renderHubPlayers(players) {
  const rows = players.slice(0, 5).map((player) => `<tr>
    <th scope="row" data-label="Player"><a class="pm-hub-person" href="/players/${escapeHtml(player.slug)}/"><img src="${escapeHtml(player.photo)}" alt="" width="44" height="44" loading="lazy" /><span>${escapeHtml(player.name)}</span></a></th>
    <td data-label="Team">${escapeHtml(player.team)}</td>
    <td data-label="Role">${escapeHtml(player.role)}</td>
    <td data-label="2025 snapshot"><strong>${escapeHtml(player.stat)}</strong><small>Previous season</small></td>
    <td data-label=""><a class="pm-hub-row-link" href="/players/${escapeHtml(player.slug)}/" aria-label="View ${escapeHtml(player.name)} profile"><i data-lucide="chevron-right" aria-hidden="true"></i></a></td>
  </tr>`).join("");
  return renderHubPanelCard({
    badge: "Players to watch",
    icon: "users",
    message: "Current team and role are shown with clearly labelled previous-season form context.",
    tableLabel: "CPL 2026 players to watch",
    tableClass: "pm-hub-players-table",
    headings: ["Player", "Team", "Role", "2025 snapshot", ""],
    rows,
    actions: `<a class="primary-button" href="/players/"><i data-lucide="users" aria-hidden="true"></i> View all players <i data-lucide="arrow-right" aria-hidden="true"></i></a>
      <a class="secondary-button" href="/player-stats/"><i data-lucide="chart-no-axes-column-increasing" aria-hidden="true"></i> Player stats <i data-lucide="arrow-right" aria-hidden="true"></i></a>`
  });
}

function renderHubVenues(venues) {
  const rows = venues.slice(0, 5).map((venue) => `<tr>
    <th scope="row" data-label="Venue"><a class="pm-hub-venue" href="/venues/${escapeHtml(venue.slug)}/"><img src="${escapeHtml(venue.image)}" alt="" width="74" height="44" loading="lazy" /><span>${escapeHtml(venue.name)}</span></a></th>
    <td data-label="Location">${escapeHtml(venue.location)}</td>
    <td data-label="Guide status"><span class="pm-hub-state verified">Guide available</span></td>
    <td data-label=""><a class="pm-hub-row-link" href="/venues/${escapeHtml(venue.slug)}/" aria-label="Open ${escapeHtml(venue.name)} venue guide"><i data-lucide="chevron-right" aria-hidden="true"></i></a></td>
  </tr>`).join("");
  return renderHubPanelCard({
    badge: `${venues.length} host venues`,
    icon: "map-pinned",
    message: "Browse every CPL 2026 stadium and its local matchday guide.",
    tableLabel: "CPL 2026 venue guides",
    tableClass: "pm-hub-venues-table",
    headings: ["Venue", "Location", "Guide status", ""],
    rows,
    actions: `<a class="primary-button" href="/venues/"><i data-lucide="map-pinned" aria-hidden="true"></i> View all venues <i data-lucide="arrow-right" aria-hidden="true"></i></a>
      <a class="secondary-button" href="/fixtures/"><i data-lucide="calendar-days" aria-hidden="true"></i> Matches by venue <i data-lucide="arrow-right" aria-hidden="true"></i></a>`
  });
}

function renderHubWatch(broadcasters) {
  const rows = broadcasters.markets.map((market) => {
    const verified = market.status === "verified";
    return `<tr>
      <th scope="row" data-label="Market">${escapeHtml(market.market)}</th>
      <td data-label="TV broadcaster">${escapeHtml(market.tvBroadcaster || "To be announced")}</td>
      <td data-label="Streaming">${escapeHtml(market.streamingPlatform || "To be announced")}</td>
      <td data-label="Status"><span class="pm-hub-state ${verified ? "verified" : "pending"}">${verified ? "Confirmed" : "Pending"}</span></td>
    </tr>`;
  }).join("");
  return renderHubPanelCard({
    badge: "Broadcast guide",
    icon: "tv",
    message: "Only confirmed TV and streaming providers are named; pending markets remain clearly labelled.",
    tableLabel: "How to watch CPL 2026 by market",
    tableClass: "pm-hub-watch-table",
    headings: ["Market", "TV broadcaster", "Streaming", "Status"],
    rows,
    actions: `<a class="primary-button" href="/how-to-watch/"><i data-lucide="tv" aria-hidden="true"></i> Open watching guide <i data-lucide="arrow-right" aria-hidden="true"></i></a>
      <a class="secondary-button" href="/live-score/"><i data-lucide="radio-tower" aria-hidden="true"></i> Live score hub <i data-lucide="arrow-right" aria-hidden="true"></i></a>`
  });
}

function renderTournamentHub(site, teams, fixtures, players, venues, broadcasters, results) {
  const tabs = [
    ["standings", "Standings"], ["live", "Live score"], ["fixtures", "Fixtures"],
    ["results", "Results"], ["players", "Players"], ["venues", "Venues"], ["watch", "How to watch"]
  ];
  return `<section class="pm-section pm-hub" aria-labelledby="hub-title">
    <div class="pm-section-heading pm-compact-heading"><div><p class="eyebrow">One tournament, one destination</p><h2 id="hub-title">CPL 2026 tournament hub</h2></div><a href="/cpl-2026/">Open complete hub <i data-lucide="arrow-right"></i></a></div>
    <div class="pm-tabs" data-tabs>
      <div class="pm-tab-list" role="tablist" aria-label="Tournament hub sections">${tabs.map(([id, label], index) => `<button type="button" role="tab" id="tab-${id}" aria-controls="panel-${id}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" data-tab="${id}">${label}</button>`).join("")}</div>
      <div class="pm-tab-panel pm-standings-panel" role="tabpanel" id="panel-standings" aria-labelledby="tab-standings" data-panel="standings">
        ${renderHubStandings(teams)}
      </div>
      <div class="pm-tab-panel pm-standings-panel" role="tabpanel" id="panel-live" aria-labelledby="tab-live" data-panel="live" hidden>${renderHubLiveScore(site, teams, fixtures)}</div>
      <div class="pm-tab-panel pm-standings-panel" role="tabpanel" id="panel-fixtures" aria-labelledby="tab-fixtures" data-panel="fixtures" hidden>${renderHubFixtures(teams, fixtures)}</div>
      <div class="pm-tab-panel pm-standings-panel" role="tabpanel" id="panel-results" aria-labelledby="tab-results" data-panel="results" hidden>${renderHubResults(teams, fixtures, results)}</div>
      <div class="pm-tab-panel pm-standings-panel" role="tabpanel" id="panel-players" aria-labelledby="tab-players" data-panel="players" hidden>${renderHubPlayers(players)}</div>
      <div class="pm-tab-panel pm-standings-panel" role="tabpanel" id="panel-venues" aria-labelledby="tab-venues" data-panel="venues" hidden>${renderHubVenues(venues)}</div>
      <div class="pm-tab-panel pm-standings-panel" role="tabpanel" id="panel-watch" aria-labelledby="tab-watch" data-panel="watch" hidden>${renderHubWatch(broadcasters)}</div>
    </div>
  </section>`;
}

function renderPlayerLeaders(players, teams) {
  const portraitSettings = {
    "nicholas-pooran": { width: 1120, height: 1536, scale: 1, x: "0%", y: "0%", mobileScale: 1, mobileY: "0%" },
    "andre-russell": { width: 1120, height: 1536, scale: 1, x: "0%", y: "0%", mobileScale: 1, mobileY: "0%" },
    "shai-hope": { width: 1120, height: 1536, scale: 1, x: "0%", y: "0%", mobileScale: 1, mobileY: "0%" },
    "alzarri-joseph": { width: 1120, height: 1536, scale: 1, x: "0%", y: "0%", mobileScale: 1, mobileY: "0%" }
  };
  const cards = players.slice(0, 4).map((player) => {
    const team = teams.find((item) => item.name === player.team) || {};
    const previousTeam = teams.find((item) => item.name === player.previousTeam) || {};
    const statMatch = player.stat.match(/^([\d.]+)\s+(.+)$/);
    const statValue = statMatch ? statMatch[1] : player.stat;
    const statLabel = statMatch ? statMatch[2] : "Previous-season stat";
    const roleTag = player.role.toLowerCase().includes("allrounder")
      ? "All-rounder"
      : player.role.toLowerCase().includes("bowler") ? "Bowler" : "Batter";
    const roleContext = player.role.replace("Batter / ", "");
    const heroPhoto = player.homePhoto || player.heroPhoto || player.photo;
    const portrait = portraitSettings[player.slug] || { width: 1120, height: 1536, scale: 1, x: "0%", y: "0%", mobileScale: 1, mobileY: "0%" };
    const portraitStyle = `--portrait-scale:${portrait.scale};--portrait-scale-mobile:${portrait.mobileScale};--portrait-x:${portrait.x};--portrait-y:${portrait.y};--portrait-y-mobile:${portrait.mobileY}`;
    return `<article class="pm-player-watch-card" data-player="${escapeHtml(player.slug)}" style="--player-accent:${escapeHtml(team.accent || "#7a3ff2")};${portraitStyle}" role="listitem">
      <a href="/players/${escapeHtml(player.slug)}/" aria-label="View ${escapeHtml(player.name)} CPL 2026 player profile">
        <div class="pm-player-watch-visual">
          <span class="pm-player-role">${escapeHtml(roleTag)}</span>
          <img class="pm-player-team-logo" src="${escapeHtml(team.logo || "")}" alt="" width="76" height="76" loading="lazy" />
          <div class="pm-player-cutout-frame">
            <img class="pm-player-cutout" src="${escapeHtml(heroPhoto)}" alt="${escapeHtml(player.imageAlt || `${player.name} player portrait`)}" width="${portrait.width}" height="${portrait.height}" loading="lazy" decoding="async" />
          </div>
          <div class="pm-player-watch-copy">
            <h3>${escapeHtml(player.name)}</h3>
            <p>${escapeHtml(player.team)}</p>
            <span>${escapeHtml(player.role)}</span>
            <em>CPL 2025 snapshot</em>
          </div>
        </div>
        <dl class="pm-player-watch-stats">
          <div class="pm-player-primary-stat"><dt>${escapeHtml(statLabel)}</dt><dd>${escapeHtml(statValue)}</dd></div>
          <div><dt>Role</dt><dd>${escapeHtml(roleContext)}</dd></div>
          <div><dt>Previous team</dt><dd>${escapeHtml(previousTeam.code || player.previousTeam)}</dd></div>
        </dl>
        <span class="pm-player-watch-link">View player profile <i data-lucide="arrow-right" aria-hidden="true"></i></span>
      </a>
    </article>`;
  }).join("");

  return `<section class="pm-section pm-player-showcase" aria-labelledby="players-watch-title">
    <div class="pm-section-heading">
      <div><p class="eyebrow">Previous-season form guide</p><h2 id="players-watch-title">Players to Watch This Season</h2><p>The 2026 tournament will bring together leading Caribbean players, young talent and overseas stars. Visit each profile to learn about the player's role, team and recent form.</p></div>
      <a href="/players/">View all players <i data-lucide="arrow-right" aria-hidden="true"></i></a>
    </div>
    <p class="pm-player-showcase-note"><i data-lucide="info" aria-hidden="true"></i> Statistics are from the previous completed CPL season and do not represent CPL 2026 performance.</p>
    <div class="pm-player-watch-grid" role="list">${cards}</div>
  </section>`;
}

function renderVenuePreview(venues) {
  return `<article class="pm-support-block pm-venues-preview">
    <div class="pm-card-heading"><div><span>Matchday planning</span><h2>Venue guides</h2></div><a href="/venues/">All venues</a></div>
    <div>${venues.slice(0, 4).map((venue) => `<a href="/venues/${escapeHtml(venue.slug)}/" aria-label="Open ${escapeHtml(venue.name)} venue guide"><img src="${escapeHtml(venue.image)}" alt="Representative cricket ground view for the ${escapeHtml(venue.name)} guide" width="320" height="180" loading="lazy" /><em>Guide image</em><span><b>${escapeHtml(venue.name)}</b><small>${escapeHtml(venue.location)}</small></span></a>`).join("")}</div>
  </article>`;
}

function renderWatchPreview(broadcasters) {
  const markets = broadcasters.markets.map((item) => `<option value="${escapeHtml(item.market)}">${escapeHtml(item.market)}</option>`).join("");
  return `<article class="pm-support-block pm-watch-preview">
    <div class="pm-card-heading"><div><span>International viewing</span><h2>How to watch CPL 2026</h2></div></div>
    <div class="pm-watch-intro"><i data-lucide="radio-tower" aria-hidden="true"></i><p>Find confirmed TV and streaming options for your country. Unconfirmed rights remain clearly marked.</p></div>
    <form class="pm-watch-form" action="/how-to-watch/" method="get">
      <label for="home-watch-market">Select your market</label>
      <select id="home-watch-market" name="market"><option value="">All viewing markets</option>${markets}</select>
      <button class="primary-button" type="submit">View watching guide</button>
    </form>
  </article>`;
}

function renderSupportGrid(players, venues, broadcasters, teams) {
  return `${renderPlayerLeaders(players, teams)}
    <section class="pm-section pm-support-grid pm-support-grid-two" aria-label="Venue and broadcast guides">${renderVenuePreview(venues)}${renderWatchPreview(broadcasters)}</section>`;
}

function renderBottomGrid(site, faqs) {
  const preferredQuestions = [
    "When does CPL 2026 start?",
    "When is the CPL 2026 final?",
    "How many teams are in CPL 2026?",
    "How does the CPL 2026 points table work?"
  ];
  const homeFaqs = preferredQuestions.map((question) => faqs.find((faq) => faq.question === question)).filter(Boolean);
  const tournament = site.tournament;
  return `<section class="pm-section pm-bottom-area" aria-label="CPL guide, frequently asked questions and updates">
    <div class="pm-bottom-grid">
      <article class="pm-bottom-card pm-bottom-guide" aria-labelledby="guide-preview-title">
      <div><p class="eyebrow">Plan your tournament</p><h2 id="guide-preview-title">CPL 2026 schedule, teams, standings and viewing guide</h2><p>Your complete guide to fixtures, venues, squads, standings, tickets and confirmed broadcasts.</p><div class="pm-guide-facts"><span><b>${escapeHtml(String(tournament.teamCount))}</b> teams</span><span><b>${escapeHtml(String(tournament.matchCount))}</b> matches</span><span><b>${escapeHtml(String(tournament.venueCount))}</b> venues</span></div><a class="primary-button" href="/cpl-2026/">Read complete CPL 2026 guide</a></div>
      </article>
      <article class="pm-bottom-card pm-bottom-faq" aria-labelledby="home-faq-title">
      <div class="pm-card-heading"><h2 id="home-faq-title">FAQ</h2><a href="/faq/">View all FAQs</a></div>
      <div>${homeFaqs.map((faq) => `<details><summary>${escapeHtml(faq.question)}<i data-lucide="plus" aria-hidden="true"></i></summary><p>${escapeHtml(faq.answer)}</p></details>`).join("")}</div>
      </article>
    </div>
    <article class="pm-bottom-card pm-bottom-newsletter" aria-labelledby="newsletter-title">
      <div><i data-lucide="mail"></i><span><h2 id="newsletter-title">Get CPL fixtures, results and match updates</h2><p>Receive useful schedule changes, results and viewing updates.</p></span></div>
      <form novalidate><label class="sr-only" for="newsletter-email">Email address</label><input id="newsletter-email" name="email" type="email" autocomplete="email" inputmode="email" placeholder="Enter your email" aria-describedby="newsletter-privacy newsletter-status" required /><button type="submit">Subscribe</button><small id="newsletter-privacy">No spam. Unsubscribe at any time.</small><p class="form-status" id="newsletter-status" aria-live="polite"></p></form>
    </article>
  </section>`;
}

module.exports = {
  renderBottomGrid,
  renderFeaturedMatch,
  renderMatchdayDesk,
  renderPlayerLeaders,
  renderSupportGrid,
  renderTeams,
  renderTournamentHub
};
