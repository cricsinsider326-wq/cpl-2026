const { escapeHtml } = require("../lib/html");

function renderVenues(venues) {
  return `<article class="panel venues-card">
    <div class="section-heading tight"><h2>CPL 2026 Venues</h2><a href="/venues/">View All Venues <i data-lucide="arrow-right"></i></a></div>
    <div class="venue-grid">
      ${venues.map((venue) => `<figure><img src="${venue.image}" alt="${escapeHtml(venue.name)} CPL 2026 venue in ${escapeHtml(venue.location)}" loading="lazy" /><figcaption>${escapeHtml(venue.name)} <span>${escapeHtml(venue.location)}</span></figcaption></figure>`).join("")}
    </div>
  </article>`;
}

function renderFanZone() {
  const items = [
    ["badge-help", "Fan Polls", "Vote and have your say"],
    ["camera", "Fan Gallery", "Share your moments"],
    ["trophy", "Fantasy League", "Play and win big"],
    ["shirt", "Merchandise", "CPL-inspired gear"],
    ["map", "Fan Guide", "Plan your CPL trip"],
    ["ticket", "Tickets & Packages", "Book your experience"]
  ];
  return `<article class="panel fan-zone" id="fan-zone">
    <h2>Fan Zone</h2>
    <div class="fan-grid">${items.map(([icon, title, text]) => `<a href="#"><i data-lucide="${icon}"></i><strong>${title}</strong><span>${text}</span></a>`).join("")}</div>
  </article>`;
}

function renderHowToWatch() {
  const broadcasters = [
    ["To be announced", "Caribbean"],
    ["To be announced", "UK & Ireland"],
    ["To be announced", "USA & Canada"],
    ["To be announced", "India & Pakistan"]
  ];
  return `<article class="panel how-watch-card">
    <div class="section-heading tight"><h2>How To Watch</h2><a href="/how-to-watch/">View All <i data-lucide="arrow-right"></i></a></div>
    <ul>${broadcasters.map(([name, region]) => `<li><i data-lucide="radio-tower"></i><strong>${name}</strong><span>${region}</span></li>`).join("")}</ul>
    <a class="secondary-button compact full" href="/how-to-watch/">View Broadcasters</a>
  </article>`;
}

function renderVenuesFan(venues) {
  return `<section class="venue-fan-grid">${renderVenues(venues)}${renderFanZone()}${renderHowToWatch()}</section>`;
}

module.exports = { renderFanZone, renderHowToWatch, renderVenues, renderVenuesFan };
