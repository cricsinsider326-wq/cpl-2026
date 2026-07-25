const { escapeHtml } = require("../lib/html");

function renderTeamCard(team) {
  return `<article class="team-card" style="--team-accent:${team.accent};--team-glow:${team.accent}44">
    <img class="team-logo" src="${team.logo}" alt="${escapeHtml(team.name)} CPL 2026 team logo" loading="lazy" />
    <span class="team-code">${escapeHtml(team.code)}</span>
    <h3>${escapeHtml(team.name).replace(" &amp; ", " &<br />").replace(" ", "<br />")}</h3>
    <a href="/teams/${team.slug}/">View Team</a>
  </article>`;
}

function renderTeamsSection(teams) {
  return `<section class="section-block" id="teams">
    <div class="section-heading">
      <h2>Our Teams</h2>
      <a href="/teams/">View All Teams <i data-lucide="arrow-right"></i></a>
    </div>
    <div class="team-grid">${teams.map(renderTeamCard).join("")}</div>
  </section>`;
}

module.exports = { renderTeamCard, renderTeamsSection };
