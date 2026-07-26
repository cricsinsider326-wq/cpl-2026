const { escapeHtml } = require("../lib/html");

const icon = (name) => `<i data-lucide="${name}" aria-hidden="true"></i>`;
const safe = (value = "") => escapeHtml(String(value));

function teamByCode(teams, code) {
  return teams.find((team) => team.code === code) || {};
}

function playerBySlug(players, slug) {
  return players.find((player) => player.slug === slug) || null;
}

function playerImage(player) {
  return player?.heroPhoto || player?.photo || "";
}

function sectionHeading(eyebrow, title, copy = "") {
  return `<header class="hub-heading">
    <p class="hub-eyebrow">${safe(eyebrow)}</p>
    <h2>${safe(title)}</h2>
    <span class="hub-rule" aria-hidden="true"></span>
    ${copy ? `<p class="hub-copy">${safe(copy)}</p>` : ""}
  </header>`;
}

function renderHero(site) {
  const start = new Date(`${site.startDate}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const end = new Date(`${site.endDate}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `<section class="hub-hero" aria-labelledby="hub-title">
    <div class="hub-hero-art" aria-hidden="true"><img src="/assets/images/players/cpl-2026-players-hero.webp" alt="" width="2014" height="781" fetchpriority="high" decoding="async" /></div>
    <div class="hub-shell hub-hero-grid">
      <div class="hub-hero-copy">
        <p class="hub-eyebrow">Republic Bank Caribbean Premier League</p>
        <h1 id="hub-title">CPL 2026 Schedule, Teams, Squads and Tournament Guide</h1>
        <span class="hub-rule" aria-hidden="true"></span>
        <p>Your complete guide to CPL 2026. Discover the full schedule, fixtures, teams, squads, venues, tickets, viewing information and the latest points table.</p>
        <nav class="hub-actions" aria-label="CPL 2026 guide shortcuts">
          <a class="hub-button hub-button-primary" href="/fixtures/">${icon("calendar-days")} View schedule</a>
          <a class="hub-button" href="/teams/">${icon("users")} Explore teams</a>
          <a class="hub-button" href="/players/">${icon("user-round")} Browse players</a>
          <a class="hub-button hub-button-gold" href="/how-to-watch/">${icon("circle-play")} How to watch</a>
        </nav>
      </div>
      <dl class="hub-facts">
        <div><dt>${icon("calendar-days")} Start date</dt><dd>${safe(start)}</dd></div>
        <div><dt>${icon("calendar-check")} Final date</dt><dd>${safe(end)}</dd></div>
        <div><dt>${icon("users")} Teams</dt><dd>${safe(site.stats.teams)}</dd></div>
        <div><dt>${icon("circle-dot")} Matches</dt><dd>${safe(site.stats.matches)}</dd></div>
        <div><dt>${icon("map-pin")} Host destinations</dt><dd>${safe(site.stats.venues)}</dd></div>
        <div><dt>${icon("refresh-cw")} Last updated</dt><dd>${safe(site.lastUpdated)}</dd></div>
      </dl>
    </div>
  </section>`;
}

function renderAbout(site) {
  const stages = [
    ["1", "League stage", "Seven teams compete in the league phase."],
    ["2", "Eliminator", "Third and fourth meet in the first playoff."],
    ["3", "Qualifier 1", "The top two compete for a final place."],
    ["4", "Qualifier 2", "One final route remains for the contenders."],
    ["5", "Final", "The season concludes with the title match."]
  ];
  const features = [
    ["zap", "High-energy T20 matches", "Fast-paced Caribbean cricket from start to finish."],
    ["shield-check", "Caribbean and overseas talent", "Established stars and emerging players share the stage."],
    ["party-popper", "Cricket culture and atmosphere", "Music, colour and local support shape every host stop."]
  ];
  return `<section class="hub-section hub-about" id="about" aria-labelledby="hub-about-title">
    <div class="hub-shell hub-about-grid">
      <div>
        ${sectionHeading("About the tournament", "About the 2026 Tournament", "The Caribbean Premier League brings together regional talent and international players for a fast-moving season of T20 cricket across the Caribbean.")}
        <div class="hub-feature-list">${features.map(([i, title, text]) => `<div>${icon(i)}<span><strong>${safe(title)}</strong><small>${safe(text)}</small></span></div>`).join("")}</div>
      </div>
      <div class="hub-format">
        <p class="hub-eyebrow">Season format and tournament structure</p>
        <ol>${stages.map(([number, title, text], index) => `<li class="${index === stages.length - 1 ? "is-final" : ""}"><b>${number}</b><span>${icon(index === 0 ? "users" : index === 1 ? "swords" : "trophy")}</span><strong>${safe(title)}</strong><small>${safe(text)}</small></li>`).join("")}</ol>
        <dl class="hub-format-stats">
          <div><dt>Format</dt><dd>T20</dd></div><div><dt>Teams</dt><dd>${safe(site.stats.teams)}</dd></div><div><dt>Matches</dt><dd>${safe(site.stats.matches)}</dd></div><div><dt>Playoffs</dt><dd>4</dd></div><div><dt>Dates</dt><dd>7 Aug - 20 Sep</dd></div>
        </dl>
      </div>
    </div>
  </section>`;
}

function renderFixtures(fixtures, teams) {
  const next = fixtures[0] || {};
  const home = teamByCode(teams, next.teamA);
  const away = teamByCode(teams, next.teamB);
  return `<section class="hub-section hub-fixtures" id="schedule" aria-labelledby="hub-fixtures-title">
    <div class="hub-shell">
      ${sectionHeading("Fixtures and schedule", "CPL 2026 Fixtures and Match Schedule", "Explore the CPL 2026 schedule with confirmed dates, local start times, venues and dedicated match pages.")}
      <div class="hub-fixtures-grid">
        <article class="hub-next-match">
          <p class="hub-eyebrow">Next match</p>
          <div class="hub-next-pair">
            <a href="/teams/${safe(home.slug)}/"><img src="${safe(home.logo)}" alt="${safe(home.name)} logo" width="220" height="220" /><strong>${safe(home.name)}</strong></a>
            <span>VS</span>
            <a href="/teams/${safe(away.slug)}/"><img src="${safe(away.logo)}" alt="${safe(away.name)} logo" width="220" height="220" /><strong>${safe(away.name)}</strong></a>
          </div>
          <dl class="hub-match-meta"><div><dt>${icon("calendar-days")} Date</dt><dd>${safe(next.dateText)} 2026</dd></div><div><dt>${icon("clock-3")} Time</dt><dd>${safe(next.time)} local</dd></div><div><dt>${icon("map-pin")} Venue</dt><dd>${safe(next.venue)}</dd></div></dl>
          <div class="hub-actions"><a class="hub-button hub-button-primary" href="/fixtures/${safe(next.slug)}/">${icon("circle-arrow-right")} Match preview</a><a class="hub-button" href="/fixtures/">${icon("list") } Full schedule</a></div>
        </article>
        <div class="hub-fixture-table" role="region" aria-label="Upcoming CPL 2026 fixtures" tabindex="0">
          <div class="hub-fixture-head"><span>Date</span><span>Match</span><span>Venue</span><span>Time</span></div>
          ${fixtures.slice(0, 5).map((fixture) => {
            const a = teamByCode(teams, fixture.teamA); const b = teamByCode(teams, fixture.teamB);
            return `<a class="hub-fixture-row" href="/fixtures/${safe(fixture.slug)}/"><time datetime="${safe(fixture.dateISO)}">${safe(fixture.date)}</time><span class="hub-fixture-pair"><img src="${safe(a.logo)}" alt="" width="46" height="46" /><strong>${safe(fixture.teamA)}</strong><em>vs</em><img src="${safe(b.logo)}" alt="" width="46" height="46" /><strong>${safe(fixture.teamB)}</strong></span><span>${safe(fixture.venue)}</span><b>${safe(fixture.time)}</b></a>`;
          }).join("")}
        </div>
      </div>
    </div>
  </section>`;
}

function renderTeams(teams, squadByTeam) {
  return `<section class="hub-section hub-teams" id="teams" aria-labelledby="hub-teams-title">
    <div class="hub-shell hub-teams-layout">
      <div class="hub-teams-intro">${sectionHeading("Republic Bank Caribbean Premier League", "CPL 2026 Teams and Squads", "Explore all CPL 2026 teams, squad status, home venues and franchise guides ahead of the season.")}<a class="hub-text-link" href="/teams/">Explore all teams ${icon("arrow-right")}</a></div>
      <div class="hub-team-showcase">${teams.map((team) => {
        const squad = squadByTeam?.get(team.code);
        const status = squad?.completeness === "complete" ? "Squad confirmed" : squad?.players?.length ? "Squad partly confirmed" : "Squad update pending";
        return `<a class="hub-team" style="--team:${safe(team.accent)}" href="/teams/${safe(team.slug)}/"><span class="hub-team-glow"></span><img src="${safe(team.logo)}" alt="${safe(team.name)} team logo" width="190" height="190" loading="lazy" decoding="async" /><strong>${safe(team.name)}</strong><b>${safe(team.homeVenue)}</b><small>${safe(status)}</small></a>`;
      }).join("")}</div>
    </div>
    <p class="hub-team-line">7 teams <span aria-hidden="true">-</span> 1 champion</p>
  </section>`;
}

function renderPlayers(players, teams) {
  const preferred = ["shimron-hetmyer", "kieron-pollard", "sunil-narine", "rovman-powell"];
  const selected = preferred.map((slug) => playerBySlug(players, slug)).filter(Boolean);
  for (const player of players) {
    if (selected.length >= 4) break;
    if (!selected.includes(player) && playerImage(player)) selected.push(player);
  }
  const roles = [["club", "Batters", "batter"], ["hand", "Wicketkeepers", "wicketkeeper"], ["refresh-cw", "All-rounders", "allrounder"], ["gauge", "Fast bowlers", "bowler"], ["circle-dot-dashed", "Spin bowlers", "bowler"], ["globe-2", "Overseas players", "all"]];
  return `<section class="hub-section hub-players" id="players" aria-labelledby="hub-players-title">
    <div class="hub-shell">
      <div class="hub-player-layout">
        <div class="hub-player-intro">${sectionHeading("CPL 2026", "Players and Squads", "From explosive batters and reliable wicketkeepers to all-rounders and specialist bowlers, explore profiles, roles and team squads.")}<p class="hub-player-tagline">The stars. The squads. The story.</p><a class="hub-button" href="/players/">${icon("users")} Explore all squads</a></div>
        <div class="hub-player-stage">${selected.map((player, index) => {
          const team = teamByCode(teams, player.teamCode || player.team);
          return `<a class="hub-player hub-player-${index + 1}" href="/players/${safe(player.slug)}/"><img src="${safe(playerImage(player))}" alt="${safe(player.name)} CPL player portrait" width="1120" height="1536" loading="lazy" decoding="async" /><span><strong>${safe(player.name)}</strong><small style="--player-accent:${safe(team.accent || "#a855f7")}">${safe(team.code || player.teamCode)} <b>-</b> ${safe(player.role || "Player")}</small></span></a>`;
        }).join("")}</div>
      </div>
      <nav class="hub-role-nav" aria-label="Browse CPL players by role">${roles.map(([i, label, role]) => `<a href="/players/${role === "all" ? "" : `?role=${role}`}">${icon(i)}<strong>${safe(label)}</strong></a>`).join("")}</nav>
    </div>
  </section>`;
}

function renderPointsAndVenues(teams, venues) {
  const featured = venues.find((venue) => venue.name === "Brian Lara Stadium") || venues[0] || {};
  const gallery = venues.filter((venue) => venue.slug !== featured.slug).slice(0, 6);
  return `<section class="hub-section hub-points-venues" id="points-table" aria-labelledby="hub-points-title">
    <div class="hub-shell">
      <div class="hub-pv-grid">
        <div class="hub-standings">
          ${sectionHeading("CPL 2026", "Points Table, Venues and Host Destinations", "Follow the standings throughout the season and explore the Caribbean grounds hosting CPL 2026.")}
          <div class="hub-table-scroll" role="region" aria-label="CPL 2026 points table" tabindex="0"><table><thead><tr><th>Pos</th><th>Team</th><th>P</th><th>W</th><th>L</th><th>Pts</th><th>NRR</th></tr></thead><tbody>${teams.map((team, index) => `<tr><td>${index + 1}</td><th><img src="${safe(team.logo)}" alt="" width="30" height="30" loading="lazy" />${safe(team.name)}</th><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>`).join("")}</tbody></table></div>
          <p class="hub-data-note">Standings will update after the first completed match.</p>
        </div>
        <div class="hub-venue-showcase">
          <a class="hub-featured-venue" href="/venues/${safe(featured.slug)}/"><img src="${safe(featured.image)}" alt="${safe(featured.name)} cricket ground" width="960" height="540" loading="lazy" /><span><small>Featured venue</small><strong>${safe(featured.name)}</strong><b>${icon("map-pin")} ${safe(featured.location)}</b></span></a>
          <p class="hub-eyebrow">Our host venues</p>
          <div class="hub-venue-grid">${gallery.map((venue) => `<a href="/venues/${safe(venue.slug)}/"><img src="${safe(venue.image)}" alt="${safe(venue.name)} cricket ground" width="480" height="270" loading="lazy" /><strong>${safe(venue.name)}</strong><small>${icon("map-pin")} ${safe(venue.location)}</small></a>`).join("")}</div>
        </div>
      </div>
      <div class="hub-destinations"><p class="hub-eyebrow">Host destinations</p><div>${venues.map((venue) => `<a href="/venues/${safe(venue.slug)}/">${icon("map-pin")}<span><strong>${safe(venue.location)}</strong><small>${safe(venue.name)}</small></span></a>`).join("")}</div></div>
    </div>
  </section>`;
}

function renderFinal(site) {
  return `<section class="hub-section hub-final" id="final" aria-labelledby="hub-final-title">
    <div class="hub-shell hub-final-grid">
      <div class="hub-final-art"><img src="/assets/images/hub/cpl-final-trophy.webp" alt="CPL final trophy under stadium lights" width="840" height="1080" loading="lazy" decoding="async" /></div>
      <div class="hub-final-copy">
        <p class="hub-eyebrow">CPL 2026 final</p><h2 id="hub-final-title">The Climax.<br />The Crown.</h2><span class="hub-rule"></span>
        <p>The season reaches its title match after the league stage and playoffs. Confirmed final venue and ticket information will be published as soon as the official details are available.</p>
        <dl><div><dt>${icon("trophy")} Final host</dt><dd>To be confirmed</dd></div><div><dt>${icon("map-pin")} Venue</dt><dd>To be confirmed</dd></div><div><dt>${icon("calendar-days")} Date</dt><dd>${safe(new Date(`${site.endDate}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }))}</dd></div></dl>
        <a class="hub-button hub-button-primary" href="/fixtures/">${icon("circle-arrow-right")} View final guide</a>
      </div>
    </div>
  </section>`;
}

function renderTicketsAndWatch(broadcasters = {}) {
  const markets = (broadcasters.markets || []).slice(0, 6);
  const ticketRows = [["Opening match", "Awaiting official sale link"], ["League matches", "Awaiting official sale link"], ["Playoffs", "Coming soon"], ["Final", "Coming soon"]];
  return `<section class="hub-section hub-tickets" id="tickets" aria-labelledby="hub-tickets-title"><div class="hub-shell">
    <div class="hub-ticket-grid">
      <div>${sectionHeading("CPL 2026", "Tickets and How to Watch", "Use confirmed official sellers for tickets and check regional rights-holder information before subscribing to any viewing service.")}
        <div class="hub-info-table hub-ticket-list">${ticketRows.map(([match, status]) => `<div><span>${icon("ticket")}<strong>${safe(match)}</strong></span><b>${safe(status)}</b><small>Seller TBC</small></div>`).join("")}</div>
        <a class="hub-button hub-button-gold" href="/tickets/">${icon("ticket-check")} Ticket guide</a>
      </div>
      <div><h2 class="hub-subtitle">How to Watch CPL 2026</h2><span class="hub-rule"></span>
        <div class="hub-watch-table"><div class="hub-watch-head"><span>Region / country</span><span>Broadcaster</span><span>Status</span></div>${markets.map((market) => `<div><span>${icon("globe-2")} ${safe(market.market)}</span><strong>${safe(market.tvBroadcaster || market.streamingPlatform || "TBC")}</strong><b class="${market.status === "verified" ? "is-confirmed" : "is-pending"}">${market.status === "verified" ? "Confirmed" : "Awaiting confirmation"}</b></div>`).join("")}</div>
        <a class="hub-text-link" href="/how-to-watch/">Open full viewing guide ${icon("arrow-right")}</a>
      </div>
    </div>
    <div class="hub-benefits"><div>${icon("badge-check")}<span><strong>Official sources</strong><small>Use confirmed sellers and rights holders.</small></span></div><div>${icon("shield-check")}<span><strong>Secure payments</strong><small>Check the seller before every purchase.</small></span></div><div>${icon("globe-2")}<span><strong>Regional coverage</strong><small>Availability can differ by country.</small></span></div><div>${icon("radio")}<span><strong>Match updates</strong><small>Live information appears on match day.</small></span></div></div>
  </div></section>`;
}

function renderNewsAndRecords(news = [], players = []) {
  const lead = news[0] || {};
  const side = news.slice(1, 4);
  const recordPlayers = players.filter((player) => playerImage(player)).slice(0, 2);
  const records = [
    ["trophy", "Winners", "View all champions", "/winners-list/", ""],
    ["chart-no-axes-combined", "Records", "Explore CPL records", "/records/", ""],
    ["activity", "Leading run-scorers", "Previous-season leaders", "/records/", playerImage(recordPlayers[0])],
    ["circle-dot", "Leading wicket-takers", "Previous-season leaders", "/records/", playerImage(recordPlayers[1])]
  ];
  return `<section class="hub-section hub-news" id="news" aria-labelledby="hub-news-title"><div class="hub-shell">
    <p class="hub-eyebrow">Latest CPL 2026 updates</p>
    <div class="hub-news-grid">
      <a class="hub-lead-news" href="/news/${safe(lead.slug)}/"><img src="${safe(lead.image)}" alt="${safe(lead.title)}" width="920" height="560" loading="lazy" /><span><time>${safe(lead.date)}</time><h2 id="hub-news-title">${safe(lead.title || "Latest CPL 2026 update")}</h2><p>${safe(lead.excerpt)}</p><b>Read more ${icon("arrow-right")}</b></span></a>
      <div class="hub-side-news">${side.map((item) => `<a href="/news/${safe(item.slug)}/"><img src="${safe(item.image)}" alt="" width="300" height="180" loading="lazy" /><span><time>${safe(item.date)}</time><strong>${safe(item.title)}</strong></span>${icon("chevron-right")}</a>`).join("")}<a class="hub-text-link" href="/news/">View all news ${icon("arrow-right")}</a></div>
    </div>
    <div class="hub-records"><p class="hub-eyebrow">CPL records and previous seasons</p><div>${records.map(([i, title, copy, href, image]) => `<a href="${href}">${image ? `<img src="${safe(image)}" alt="" width="360" height="480" loading="lazy" />` : `<span class="hub-record-symbol">${icon(i)}</span>`}<span><strong>${safe(title)}</strong><small>${safe(copy)}</small></span>${icon("arrow-right")}</a>`).join("")}</div></div>
  </div></section>`;
}

function renderFaqAndGuides(site, faqs = []) {
  const selected = faqs.slice(0, 5);
  const guides = [["calendar-days", "Schedule", "/fixtures/"], ["users", "Teams", "/teams/"], ["user-round", "Players", "/players/"], ["list-ordered", "Points table", "/points-table/"], ["trophy", "Results", "/results/"], ["radio", "Live score", "/live-score/"], ["map-pin", "Venues", "/venues/"], ["tv", "How to watch", "/how-to-watch/"]];
  return `<section class="hub-section hub-faq" id="faq" aria-labelledby="hub-faq-title"><div class="hub-shell">
    ${sectionHeading("Frequently asked questions", "Frequently Asked Questions About CPL 2026")}
    <div class="hub-faq-list">${selected.map((faq) => `<details><summary>${icon("circle-help")}<span>${safe(faq.question)}</span>${icon("chevron-down")}</summary><p>${safe(faq.answer)}</p></details>`).join("")}</div>
    <div class="hub-guides"><p class="hub-eyebrow">Explore more</p><h2>Explore More CPL 2026 Guides</h2><div>${guides.map(([i, label, href]) => `<a href="${href}">${icon(i)}<strong>${safe(label)}</strong>${icon("arrow-right")}</a>`).join("")}</div></div>
    <div class="hub-trust"><div>${icon("file-text")}<span><strong>Sources</strong><p>Official tournament announcements, team websites, venue information and trusted sports sources.</p><small>Last updated: ${safe(site.lastUpdated)}</small></span></div><div>${icon("pen-line")}<span><strong>Editor's note</strong><p>Schedules, squads, venues, tickets and broadcasters can change. Check linked primary sources for the latest confirmation.</p><small>${safe(site.notAffiliated)}</small></span></div></div>
  </div></section>`;
}

function renderCplHubPage(data) {
  return `<main class="cpl-hub" data-cpl-hub>
    ${renderHero(data.site)}
    ${renderAbout(data.site)}
    ${renderFixtures(data.fixtures, data.teams)}
    ${renderTeams(data.teams, data.squadByTeam)}
    ${renderPlayers(data.players, data.teams)}
    ${renderPointsAndVenues(data.teams, data.venues)}
    ${renderFinal(data.site)}
    ${renderTicketsAndWatch(data.broadcasters)}
    ${renderNewsAndRecords(data.news, data.players)}
    ${renderFaqAndGuides(data.site, data.faqs)}
  </main>`;
}

// HUB-SECTIONS

module.exports = {
  renderAbout,
  renderCplHubPage,
  renderFinal,
  renderPlayers
};
