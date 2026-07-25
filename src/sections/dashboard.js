const { escapeHtml } = require("../lib/html");
const { renderFixtures } = require("./matchCenter");

function renderNumbers(site) {
  return `<article class="panel numbers-card" id="stats">
    <h2>CPL By The Numbers</h2>
    <dl>
      <div><dt>${site.stats.seasons}</dt><dd>Seasons of Excitement</dd></div>
      <div><dt>${site.stats.matchesPlayed}</dt><dd>Matches Played</dd></div>
      <div><dt>${site.stats.internationalPlayers}</dt><dd>International Players</dd></div>
      <div><dt>${site.stats.fans}</dt><dd>Fans Worldwide</dd></div>
      <div><dt>${site.stats.teams}</dt><dd>Franchises United</dd></div>
    </dl>
  </article>`;
}

function renderHighlights() {
  return `<article class="panel highlights-card" id="videos">
    <div class="section-heading tight"><h2>Latest Highlights</h2><a href="/videos/">View All Videos <i data-lucide="arrow-right"></i></a></div>
    <div class="video-thumb">
      <img src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1100&q=80" alt="Caribbean Premier League cricket players celebrating under stadium lights" loading="lazy" />
      <button type="button" aria-label="Play video"><i data-lucide="play"></i></button>
      <div><strong>CPL Classic Highlights</strong><span>Relive thrilling Caribbean cricket moments</span></div>
      <time>08:45</time>
    </div>
  </article>`;
}

function renderNewsList(news) {
  return `<article class="panel latest-news" id="news">
    <div class="section-heading tight"><h2>Latest News</h2><a href="/news/">View All News <i data-lucide="arrow-right"></i></a></div>
    ${news.map((item) => `<article>
      <img src="${item.image}" alt="${escapeHtml(item.title)} CPL 2026 news image" loading="lazy" />
      <div><span>${escapeHtml(item.category)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.date)}</small></div>
      <em>${escapeHtml(item.label)}</em>
    </article>`).join("")}
  </article>`;
}

function renderDashboard(site, news, fixtures = []) {
  const visibleNews = news.slice(0, 4);
  return `<section class="portal-grid">
    ${renderFixtures(site, fixtures, { limit: 5 })}
    ${renderHighlights()}
    ${renderNewsList(visibleNews)}
    ${renderNumbers(site)}
  </section>`;
}

module.exports = { renderDashboard, renderHighlights, renderNewsList, renderNumbers };
