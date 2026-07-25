const { escapeHtml } = require("../lib/html");

function teamByCode(teams, code) {
  return teams.find((team) => team.code === code) || {};
}

function renderTeamFace(team, side) {
  return `<div class="match-team ${side}" style="--team-accent:${team.accent || "#ffd000"}">
    ${team.logo ? `<img src="${escapeHtml(team.logo)}" alt="${escapeHtml(team.name)} CPL 2026 team logo" loading="lazy" />` : ""}
    <span>${escapeHtml(team.code || "")}</span>
    <strong>${escapeHtml(team.name || "")}</strong>
  </div>`;
}

function renderOpeningMatch(teams, fixtures) {
  const opening = fixtures[0];
  const teamA = teamByCode(teams, opening.teamA);
  const teamB = teamByCode(teams, opening.teamB);
  return `<article class="opening-match panel" id="opening-match">
    <div class="opening-label"><span>Opening Match</span><strong>${escapeHtml(opening.dateText || opening.date)} 2026</strong></div>
    <div class="opening-match-main">
      ${renderTeamFace(teamA, "home")}
      <div class="versus">VS</div>
      ${renderTeamFace(teamB, "away")}
      <div class="match-venue"><i data-lucide="map-pin"></i><strong>${escapeHtml(opening.venue.split(",")[0])}</strong><span>${escapeHtml(opening.hostCountry)} - ${escapeHtml(opening.time)}</span></div>
      <div class="opening-actions">
        <a class="secondary-button compact" href="/fixtures/${escapeHtml(opening.slug)}/">Match Centre</a>
        <a class="primary-button compact" href="/tickets/">Tickets</a>
      </div>
    </div>
  </article>`;
}

function renderQuickCards(site, teams, fixtures, players) {
  const live = fixtures[0];
  const next = fixtures[1] || live;
  const topPlayer = players[0] || {};
  const pointTeams = teams.slice(0, 5);
  return `<section class="match-card-grid" aria-label="CPL 2026 match center preview">
    <article class="panel live-match-card">
      <div class="card-title"><h2>Live Match</h2><span>Pre-season</span></div>
      <strong class="score-placeholder">Scorecard opens on match day</strong>
      <p>${escapeHtml(live.teamAName)} vs ${escapeHtml(live.teamBName)} starts ${escapeHtml(live.dateText)} at ${escapeHtml(live.time)}.</p>
      <a class="secondary-button compact full" href="/live-score/">Live Score Hub</a>
    </article>
    <article class="panel next-match-card">
      <div class="card-title"><h2>Next Match</h2><span>${escapeHtml(next.date)}</span></div>
      <div class="mini-fixture">
        <img src="${escapeHtml(teamByCode(teams, next.teamA).logo || "")}" alt="" loading="lazy" />
        <strong>${escapeHtml(next.teamA)} <span>vs</span> ${escapeHtml(next.teamB)}</strong>
        <img src="${escapeHtml(teamByCode(teams, next.teamB).logo || "")}" alt="" loading="lazy" />
      </div>
      <p>${escapeHtml(next.venue)} - ${escapeHtml(next.time)}</p>
      <a class="secondary-button compact full" href="/fixtures/">View Preview</a>
    </article>
    <article class="panel mini-points-card">
      <div class="card-title"><h2>Points Table</h2><span>${escapeHtml(site.lastUpdated)}</span></div>
      <ol>${pointTeams.map((team, index) => `<li><span>${index + 1}</span><strong>${escapeHtml(team.code)}</strong><em>0 pts</em></li>`).join("")}</ol>
      <a class="secondary-button compact full" href="/points-table/">Full Table</a>
    </article>
    <article class="panel performer-card">
      <div class="card-title"><h2>Top Performer</h2><span>Form Watch</span></div>
      ${topPlayer.photo ? `<img src="${escapeHtml(topPlayer.photo)}" alt="${escapeHtml(topPlayer.name)} CPL player photo" loading="lazy" />` : ""}
      <strong>${escapeHtml(topPlayer.name || "Player watch")}</strong>
      <p>${escapeHtml(topPlayer.team || "CPL 2026")} - ${escapeHtml(topPlayer.context || "Stats update after matches begin")}</p>
      <b>${escapeHtml(topPlayer.stat || "Coming soon")}</b>
      <a class="secondary-button compact full" href="/players/">View All Stats</a>
    </article>
  </section>`;
}

function renderOverview(site, teams, fixtures, players) {
  return `<section class="home-match-hub" id="overview">
    ${renderOpeningMatch(teams, fixtures)}
    ${renderQuickCards(site, teams, fixtures, players)}
  </section>`;
}

module.exports = { renderOverview };
