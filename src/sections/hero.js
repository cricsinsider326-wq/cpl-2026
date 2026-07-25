const { escapeHtml } = require("../lib/html");

function renderHero(site) {
  const formatDate = (value) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
  const stats = site.stats || {};
  const dateRange = `${formatDate(site.startDate)} - ${formatDate(site.endDate)} 2026`;
  return `<section class="hero hero-css-reference" aria-labelledby="hero-title">
  <div class="hero-overlay" aria-hidden="true"></div>
  <div class="hero-artwork" aria-hidden="true">
    <img src="/assets/images/hero/cpl-2026-player-artwork.webp" alt="" width="1717" height="916" fetchpriority="high" decoding="async" />
  </div>
  <div class="hero-container">
    <div class="hero-content">
      <p class="hero-kicker">Republic Bank CPL 2026</p>
      <h1 id="hero-title" class="hero-title">
        <span class="hero-title-season">CPL <b>2026</b></span>
        <span class="hero-title-accent">Caribbean Cricket’s</span>
        <span>Biggest Party Returns</span>
      </h1>
      <p class="hero-description">The region's premier T20 tournament is back. Follow every ball with fixtures, results, teams, standings and official viewing guides.</p>
      <div class="hero-actions">
        <a class="primary-button" href="/fixtures/"><i data-lucide="calendar-days" aria-hidden="true"></i>View schedule</a>
        <a class="secondary-button" href="/tickets/"><i data-lucide="ticket" aria-hidden="true"></i>Book tickets</a>
      </div>
    </div>
    <dl class="hero-facts" aria-label="CPL 2026 tournament facts">
      <div><dt><i data-lucide="calendar-days" aria-hidden="true"></i><span>Tournament dates</span></dt><dd><strong>${escapeHtml(dateRange)}</strong><small>Confirmed schedule window</small></dd></div>
      <div><dt><i data-lucide="circle-dot" aria-hidden="true"></i><span>Matches</span></dt><dd><strong>${escapeHtml(stats.matches || 39)}</strong><small>Group stage + playoffs</small></dd></div>
      <div><dt><i data-lucide="users" aria-hidden="true"></i><span>Teams</span></dt><dd><strong>${escapeHtml(stats.teams || 7)}</strong><small>One champion</small></dd></div>
      <div><dt><i data-lucide="map-pinned" aria-hidden="true"></i><span>Venues</span></dt><dd><strong>${escapeHtml(stats.venues || 8)}</strong><small>Across the Caribbean</small></dd></div>
    </dl>
  </div>
</section>`;
}

module.exports = { renderHero };
