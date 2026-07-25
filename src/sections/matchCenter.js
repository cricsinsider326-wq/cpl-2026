const { escapeHtml } = require("../lib/html");

function renderPointsTable(site) {
  return `<article class="panel points-card" id="points">
    <h2>CPL 2026 Points Table</h2>
    <p class="panel-note">CPL 2026 standings will update after the first completed match.</p>
    <p class="last-updated"><i data-lucide="refresh-cw"></i> Last updated: ${escapeHtml(site.lastUpdated)}</p>
    <div class="points-empty"><i data-lucide="table-properties"></i><strong>Tournament standings are not active yet</strong><p>Played, won, lost, no result, net run rate and points will appear only after a verified match result.</p><div class="points-empty-actions"><a href="/fixtures/">View fixtures</a><a href="/cpl-2026/#format">How CPL points work</a><a href="/past-seasons/">Previous seasons</a></div></div>
  </article>`;
}

function renderLiveScore(site, fixtures) {
  const next = fixtures[0];
  return `<article class="panel fixtures-card" id="live-score">
    <div class="section-heading tight"><h2>CPL Live Score</h2><a href="/live-score/">Match Center <i data-lucide="arrow-right"></i></a></div>
    <p class="last-updated"><i data-lucide="refresh-cw"></i> Last updated: ${escapeHtml(site.lastUpdated)}</p>
    <div class="live-score-card">
      <span>Next Match</span>
      <strong>${escapeHtml(next.teamA)} vs ${escapeHtml(next.teamB)}</strong>
      <small>Live score, toss, playing XI and scorecard updates will appear here on match day.</small>
    </div>
  </article>`;
}

function renderFixtures(site, fixtures, options = {}) {
  const visibleFixtures = options.limit ? fixtures.slice(0, options.limit) : fixtures;
  const title = options.title || "Upcoming Fixtures";
  const headingLink = options.headingLink !== false
    ? `<a href="/fixtures/">View Full Schedule <i data-lucide="arrow-right"></i></a>`
    : "";
  return `<article class="panel fixtures-card" id="fixtures">
    <div class="section-heading tight"><h2>${escapeHtml(title)}</h2>${headingLink}</div>
    <p class="last-updated"><i data-lucide="refresh-cw"></i> Last updated: ${escapeHtml(site.lastUpdated)}</p>
    <div class="fixture-list">
      ${visibleFixtures.map((match) => `<article><time datetime="${escapeHtml(match.dateISO || match.date)}">${escapeHtml(match.date)}<br />${escapeHtml(match.day)}</time><strong>${match.teamB ? `${escapeHtml(match.teamA)} <span>vs</span> ${escapeHtml(match.teamB)}` : escapeHtml(match.match)}</strong><small>${escapeHtml(match.venue)}</small><b>${escapeHtml(match.time)}</b><a class="fixture-link" href="/fixtures/${escapeHtml(match.slug)}/" aria-label="View ${escapeHtml(match.match)} details"></a></article>`).join("")}
    </div>
  </article>`;
}

function renderTopPlayers(players) {
  return `<article class="panel top-players" id="players">
    <div class="section-heading tight"><h2>Recent CPL Top Performers</h2><a href="/players/">View All Players <i data-lucide="arrow-right"></i></a></div>
    <p class="panel-note">Previous-season form snapshot. CPL 2026 player stats will update after matches begin.</p>
    <ol>
      ${players.map((player, index) => `<li><span>${index + 1}</span>${player.photo ? `<img src="${escapeHtml(player.photo)}" alt="${escapeHtml(player.name)} ${escapeHtml(player.team)} official CPL player photo" loading="lazy" />` : `<strong class="player-avatar">${escapeHtml(player.initials)}</strong>`}<div><strong>${escapeHtml(player.name)}</strong><small>${escapeHtml(player.team)}</small></div><b>${escapeHtml(player.stat)}</b></li>`).join("")}
    </ol>
  </article>`;
}

function renderMatchCenter(site, fixtures, players) {
  return `<section class="lower-grid match-center-grid">${renderPointsTable(site)}${renderLiveScore(site, fixtures)}${renderTopPlayers(players)}</section>`;
}

module.exports = {
  renderFixtures,
  renderLiveScore,
  renderMatchCenter,
  renderPointsTable,
  renderTopPlayers
};
