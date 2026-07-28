const { escapeHtml } = require("../lib/html");

function renderPointsTable(site, teamRecords = []) {
  const teams = teamRecords.map((team, index) => ({ ...team, pos: index + 1 }));

  return `<article class="panel points-card" id="points">
    <div class="section-heading tight">
      <h2>CPL 2026 Points Table</h2>
      <a href="/points-table/">Full Table &amp; Rules <i data-lucide="arrow-right"></i></a>
    </div>
    <p class="panel-note">CPL 2026 standings start at zero. Table updates live after Match 1 completion.</p>
    <p class="last-updated"><i data-lucide="refresh-cw"></i> Last updated: ${escapeHtml(site.lastUpdated)}</p>
    <div class="points-table-wrap" style="overflow-x:auto;">
      <table class="points-table-grid" style="width:100%; border-collapse:collapse; text-align:left;">
        <thead>
          <tr style="border-bottom:2px solid rgba(255,255,255,0.12); color:#94a3b8; font-family:'Barlow Condensed',sans-serif; font-size:0.88rem; font-weight:800; text-transform:uppercase;">
            <th style="padding:10px 8px; width:40px; text-align:center;">Pos</th>
            <th style="padding:10px 12px;">Team</th>
            <th style="padding:10px 8px; text-align:center;">P</th>
            <th style="padding:10px 8px; text-align:center;">W</th>
            <th style="padding:10px 8px; text-align:center;">L</th>
            <th style="padding:10px 8px; text-align:center;">NRR</th>
            <th style="padding:10px 8px; text-align:center;">Pts</th>
          </tr>
        </thead>
        <tbody>
          ${teams.map((t, idx) => `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.06); ${idx === 3 ? 'border-bottom:2px solid #10b981;' : ''}">
              <td style="padding:12px 8px; text-align:center; color:#94a3b8; font-weight:800; font-family:'Barlow Condensed',sans-serif;">${t.pos}</td>
              <td style="padding:12px 12px;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <img src="${t.logo}" alt="" width="24" height="24" style="object-fit:contain;" />
                  <strong style="color:#fff; font-family:'Barlow Condensed',sans-serif; font-size:1rem; font-weight:800;">${escapeHtml(t.name)}</strong>
                </div>
              </td>
              <td style="padding:12px 8px; text-align:center; color:#cbd5e1; font-weight:700;">0</td>
              <td style="padding:12px 8px; text-align:center; color:#cbd5e1; font-weight:700;">0</td>
              <td style="padding:12px 8px; text-align:center; color:#cbd5e1; font-weight:700;">0</td>
              <td style="padding:12px 8px; text-align:center; color:#94a3b8; font-family:monospace; font-size:0.88rem;">0.000</td>
              <td style="padding:12px 8px; text-align:center; color:#ffd000; font-weight:900; font-family:'Barlow Condensed',sans-serif; font-size:1.1rem;">0</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
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

function renderMatchCenter(site, fixtures, players, teams) {
  return `<section class="lower-grid match-center-grid">${renderPointsTable(site, teams)}${renderLiveScore(site, fixtures)}${renderTopPlayers(players)}</section>`;
}

module.exports = {
  renderFixtures,
  renderLiveScore,
  renderMatchCenter,
  renderPointsTable,
  renderTopPlayers
};
