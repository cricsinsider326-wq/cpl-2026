const { escapeHtml } = require("../lib/html");
const { renderPlayerLeaders } = require("./homePremium");
const { renderAbout } = require("../pages/cplHub");

function teamByCode(teams, code) {
  return teams.find((team) => team.code === code) || {};
}

function teamLogo(teams, code, alt = "") {
  const team = teamByCode(teams, code);
  return `<img src="${escapeHtml(team.logo || "")}" alt="${escapeHtml(alt || `${team.name || code} logo`)}" width="76" height="76" loading="lazy" decoding="async" />`;
}

function renderNextMatch(site, teams, fixtures) {
  const match = fixtures[0];
  const teamA = teamByCode(teams, match.teamA);
  const teamB = teamByCode(teams, match.teamB);
  return `<section class="rh-next-match" aria-labelledby="rh-next-match-title">
    <div class="rh-next-match-main">
      <div class="rh-match-intro"><div><p class="rh-match-kicker"><i data-lucide="circle-arrow-right" aria-hidden="true"></i> Opening fixture</p><h3 id="rh-next-match-title">Next CPL 2026 Match</h3></div><p><i data-lucide="clock-3" aria-hidden="true"></i> Venue local time</p></div>
      <div class="rh-match-line">
        <a class="rh-match-team" href="/teams/${escapeHtml(teamA.slug)}/">${teamLogo(teams, match.teamA)}<span><small>${escapeHtml(teamA.country)}</small><strong>${escapeHtml(teamA.name)}</strong><em>${escapeHtml(match.teamA)}</em></span></a>
        <div class="rh-match-vs"><span>VS</span><strong>${escapeHtml(match.dateText)} 2026</strong><b>${escapeHtml(match.time)} local</b></div>
        <a class="rh-match-team rh-match-team-right" href="/teams/${escapeHtml(teamB.slug)}/"><span><small>${escapeHtml(teamB.country)}</small><strong>${escapeHtml(teamB.name)}</strong><em>${escapeHtml(match.teamB)}</em></span>${teamLogo(teams, match.teamB)}</a>
      </div>
      <div class="rh-match-meta"><span><i data-lucide="calendar-days" aria-hidden="true"></i>${escapeHtml(match.day)}, ${escapeHtml(match.date)} 2026</span><span><i data-lucide="map-pin" aria-hidden="true"></i>${escapeHtml(match.venue)}</span></div>
      <div class="rh-match-actions"><a class="rh-button rh-button-purple" href="/fixtures/${escapeHtml(match.slug)}/"><i data-lucide="clipboard-list" aria-hidden="true"></i> Match centre</a><a class="rh-button rh-button-outline" href="/tickets/"><i data-lucide="ticket" aria-hidden="true"></i> Ticket guide</a></div>
    </div>
    <aside class="rh-countdown" aria-label="CPL 2026 countdown" data-countdown="${escapeHtml(match.dateISO)}T19:00:00-04:00">
      <p>Starts in</p><div class="rh-countdown-values"><b><span data-days>00</span><small>days</small></b><b><span data-hours>00</span><small>hours</small></b><b><span data-minutes>00</span><small>mins</small></b><b><span data-seconds>00</span><small>secs</small></b></div>
      <strong><span class="rh-mini-mark">CPL</span> CPL 2026</strong>
    </aside>
  </section>`;
}

function renderLiveScore(site, teams, fixtures) {
  const match = fixtures[0];
  const teamA = teamByCode(teams, match.teamA);
  const teamB = teamByCode(teams, match.teamB);
  return `<section class="rh-section rh-live-score" aria-labelledby="rh-live-score-title">
    <div class="rh-section-title"><div><p class="rh-eyebrow">Match status</p><h3 id="rh-live-score-title">CPL 2026 Live Score</h3></div><a href="/live-score/">Open live score <i data-lucide="arrow-right" aria-hidden="true"></i></a></div>
    <div class="rh-live-score-card rh-live-score-compact">
      <div class="rh-live-status"><span><i data-lucide="circle-pause" aria-hidden="true"></i> No live match</span><strong>Coverage starts on match day</strong><p>Toss results, playing XIs, and live overs appear here during matches.</p></div>
      <div class="rh-live-next" aria-label="Next CPL 2026 live coverage">
        <small>Next coverage</small><strong>${escapeHtml(match.teamA)} <em>vs</em> ${escapeHtml(match.teamB)}</strong>
        <time datetime="${escapeHtml(match.dateISO)}">${escapeHtml(match.dateText)} 2026 &middot; ${escapeHtml(match.time)} local</time>
        <span>${escapeHtml(match.venue)}</span>
      </div>
      <div class="rh-live-actions"><a class="rh-button rh-button-yellow" href="/live-score/"><i data-lucide="radio" aria-hidden="true"></i> Live score</a><a class="rh-button rh-button-outline" href="/fixtures/${escapeHtml(match.slug)}/"><i data-lucide="clipboard-list" aria-hidden="true"></i> Match centre</a><small>Reviewed ${escapeHtml(site.tournament.lastVerifiedAt)}</small></div>
    </div>
  </section>`;
}

function renderUpcoming(fixtures, teams) {
  return `<section class="rh-section rh-upcoming" aria-labelledby="rh-upcoming-title">
    <div class="rh-section-title"><div><p class="rh-eyebrow">Next fixtures</p><h3 id="rh-upcoming-title">Upcoming CPL 2026 Matches</h3><p class="rh-section-copy">Confirmed match dates, venues — local start times.</p></div><a href="/fixtures/">View full schedule <i data-lucide="arrow-right" aria-hidden="true"></i></a></div>
    <div class="rh-slider-shell">
      <button class="rh-slider-prev" type="button" data-scroll-prev="rh-upcoming-track" aria-label="Show previous upcoming match" style="align-items:center!important;background:#6c24df!important;border:1px solid rgba(255,255,255,.35)!important;border-radius:50%!important;box-shadow:0 4px 14px rgba(108,36,223,.45)!important;color:#fff!important;cursor:pointer!important;display:flex!important;height:42px!important;justify-content:center!important;left:-14px!important;outline:none!important;padding:0!important;position:absolute!important;top:50%!important;transform:translateY(-50%)!important;width:42px!important;z-index:10!important;"><i data-lucide="chevron-left" aria-hidden="true"></i></button>
      <div class="rh-upcoming-grid" id="rh-upcoming-track">${fixtures.slice(0, 5).map((match) => `<a class="rh-upcoming-card" href="/fixtures/${escapeHtml(match.slug)}/">
      <div><b>${escapeHtml(match.date)} 2026</b></div>
      <div class="rh-upcoming-pair"><span>${teamLogo(teams, match.teamA)}<strong>${escapeHtml(match.teamA)}</strong></span><em>vs</em><span>${teamLogo(teams, match.teamB)}<strong>${escapeHtml(match.teamB)}</strong></span></div>
      <small><i data-lucide="map-pin" aria-hidden="true"></i>${escapeHtml(match.venue)}</small><time datetime="${escapeHtml(match.dateISO)}">${escapeHtml(match.day)} - ${escapeHtml(match.time)} local</time>
    </a>`).join("")}</div><button class="rh-slider-next" type="button" data-scroll-next="rh-upcoming-track" aria-label="Show next upcoming match" style="align-items:center!important;background:#6c24df!important;border:1px solid rgba(255,255,255,.35)!important;border-radius:50%!important;box-shadow:0 4px 14px rgba(108,36,223,.45)!important;color:#fff!important;cursor:pointer!important;display:flex!important;height:42px!important;justify-content:center!important;right:-14px!important;outline:none!important;padding:0!important;position:absolute!important;top:50%!important;transform:translateY(-50%)!important;width:42px!important;z-index:10!important;"><i data-lucide="chevron-right" aria-hidden="true"></i></button></div>
  </section>`;
}

function renderMatchCentre(site, teams, fixtures) {
  return `<section class="rh-match-centre" aria-labelledby="rh-match-centre-title">
    <div class="rh-match-centre-heading"><div><p class="rh-eyebrow">Fixtures and scores</p><h2 id="rh-match-centre-title">CPL 2026 Match Centre</h2></div><a href="/fixtures/">Complete schedule <i data-lucide="arrow-right" aria-hidden="true"></i></a></div>
    <div class="rh-match-centre-grid">${renderNextMatch(site, teams, fixtures)}${renderLiveScore(site, teams, fixtures)}</div>
    ${renderUpcoming(fixtures, teams)}
  </section>`;
}

function renderTeams(teams, squadByTeam) {
  return `<section class="rh-section rh-teams" aria-labelledby="rh-teams-title">
    <div class="rh-section-title"><div><p class="rh-eyebrow">Seven franchises</p><h2 id="rh-teams-title">Meet the CPL 2026 Teams</h2><p class="rh-section-copy">Seven T20 franchises compete in CPL 2026 — official squads, captains, coaches, and home grounds.</p></div><a href="/teams/">View all teams <i data-lucide="arrow-right" aria-hidden="true"></i></a></div>
    <div class="rh-team-grid">${teams.map((team) => {
      const squad = squadByTeam.get(team.code);
      const status = squad?.completeness === "complete" ? "Confirmed" : squad?.players?.length ? "Partial" : "Awaiting update";
      const statusClass = squad?.completeness === "complete" ? "confirmed" : squad?.players?.length ? "partial" : "awaiting";
      const squadCount = squad?.players?.length ? `${squad.players.length} players` : "Squad pending";
      return `<a class="rh-team-card" style="--team-accent:${escapeHtml(team.accent)}" href="/teams/${escapeHtml(team.slug)}/">
      <img src="${escapeHtml(team.logo)}" alt="${escapeHtml(team.name)} team logo" width="112" height="112" loading="lazy" decoding="async" />
      <strong>${escapeHtml(team.name)}</strong><span>${escapeHtml(team.code)}</span><small>${escapeHtml(team.homeVenue)}</small><em>${escapeHtml(squadCount)}</em><i class="rh-squad-status ${statusClass}">${escapeHtml(status)}</i><b>View team <i data-lucide="arrow-up-right" aria-hidden="true"></i></b>
    </a>`;}).join("")}</div>
  </section>`;
}

function renderStandings(teams) {
  return `<article class="rh-panel rh-standings" aria-labelledby="rh-standings-title">
    <div class="rh-panel-heading"><div><h2 id="rh-standings-title">CPL 2026 Points Table</h2><p class="rh-section-copy">CPL standings track wins, losses, points, and net run rate — playoff qualification.</p></div><a href="/points-table/">View full table <i data-lucide="arrow-right" aria-hidden="true"></i></a></div>
    <div class="rh-standings-alert" style="background: rgba(255,208,0,0.08); border: 1px solid rgba(255,208,0,0.25); border-radius: 6px; padding: 10px 14px; margin: 12px 0 6px; color: #ffd000; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 8px;"><i data-lucide="bell" style="height:16px; width:16px; flex-shrink:0;"></i><span>Tournament starts Aug 7 — Points table updates live after Match 1</span></div>
    <p class="rh-muted">The points table will start updating after the first completed match.</p>
    <div class="rh-table-wrap"><table><thead><tr><th>Pos</th><th>Team</th><th>P</th><th>W</th><th>L</th><th>NRR</th><th>Pts</th></tr></thead><tbody>${teams.map((team, index) => `<tr><td>${index + 1}</td><th><img src="${escapeHtml(team.logo)}" alt="" width="28" height="28" loading="lazy" />${escapeHtml(team.name)}</th><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>`).join("")}</tbody></table></div>
    <a class="rh-panel-button" href="/points-table/">View full points table <i data-lucide="arrow-right" aria-hidden="true"></i></a>
  </article>`;
}

function renderNews(news) {
  return `<article class="rh-panel rh-news" aria-labelledby="rh-news-title">
    <div class="rh-panel-heading"><div><h2 id="rh-news-title">Latest CPL 2026 News</h2><p class="rh-section-copy">Official fixture changes, squad news, player profiles, and broadcast market updates.</p></div><a href="/news/">View all updates <i data-lucide="arrow-right" aria-hidden="true"></i></a></div>
    <div class="rh-news-list">${news.slice(0, 5).map((item) => `<a href="/news/${escapeHtml(item.slug)}/"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" width="120" height="76" loading="lazy" /><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.date)}</small></span></a>`).join("")}</div>
  </article>`;
}

function renderFeatureTiles() {
  const tiles = [
    ["calendar-days", "Schedule", "Match dates, fixtures, local start times — and venues.", "/fixtures/"],
    ["trophy", "Points Table", "Team standings, net run rate — playoff races.", "/points-table/"],
    ["users", "Teams", "Franchise squads, captains, coaches — home grounds.", "/teams/"],
    ["person-standing", "Players", "T20 player profiles, roles — career stats.", "/players/"],
    ["landmark", "Venues", "Stadium guides, seating, locations — match lists.", "/venues/"],
    ["tv", "How to Watch", "Confirmed TV channels — regional streaming links.", "/how-to-watch/"]
  ];
  return `<section class="rh-section rh-feature-tiles" aria-labelledby="rh-explore-title"><div class="rh-section-title"><div><p class="rh-eyebrow">Tournament navigation</p><h2 id="rh-explore-title">Explore CPL 2026</h2><p class="rh-section-copy">Direct access to official tournament guides — fast links.</p></div></div><nav class="rh-feature-grid" aria-label="Explore CPL 2026">${tiles.map(([icon, title, text, href]) => `<a href="${href}" class="rh-feature-tile"><i data-lucide="${icon}" aria-hidden="true"></i><strong>${title}</strong><span>${text}</span><b><i data-lucide="arrow-right" aria-hidden="true"></i></b></a>`).join("")}</nav></section>`;
}

function renderPlayerIndex() {
  const roles = [
    ["club", "Batters", "batter"],
    ["hand", "Wicketkeepers", "wicketkeeper"],
    ["refresh-cw", "All-rounders", "allrounder"],
    ["gauge", "Fast bowlers", "bowler"],
    ["circle-dot-dashed", "Spin bowlers", "bowler"],
    ["globe-2", "Overseas players", "all"]
  ];
  return `<section class="rh-player-index" aria-labelledby="rh-player-index-title">
    <div class="rh-player-index-copy"><p class="rh-eyebrow">Player directory</p><h2 id="rh-player-index-title">Browse Players and Squads</h2><p>Filter player profiles by playing role — T20 squad lists.</p><a href="/players/">Explore all players <i data-lucide="arrow-right" aria-hidden="true"></i></a></div>
    <nav class="rh-player-role-grid" aria-label="Browse CPL players by role">${roles.map(([icon, label, role]) => `<a href="/players/${role === "all" ? "" : `?role=${role}`}"><i data-lucide="${icon}" aria-hidden="true"></i><strong>${label}</strong><i data-lucide="arrow-right" aria-hidden="true"></i></a>`).join("")}</nav>
  </section>`;
}

function renderVenues(venues) {
  const preferred = ["arnos-vale-stadium", "sabina-park", "brian-lara-stadium", "providence-stadium"];
  const featuredVenues = preferred.map((slug) => venues.find((venue) => venue.slug === slug)).filter(Boolean);
  return `<article class="rh-panel rh-venues" aria-labelledby="rh-venues-title"><div class="rh-panel-heading"><div><h2 id="rh-venues-title">Top CPL 2026 Venue Guides</h2><p class="rh-section-copy">Eight Caribbean grounds host CPL 2026 matches — stadium guides, seating, and fixtures.</p></div><a href="/venues/">View all venues <i data-lucide="arrow-right" aria-hidden="true"></i></a></div><div class="rh-venue-grid">${featuredVenues.map((venue, index) => `<a class="${index === 0 ? "featured" : ""}" href="/venues/${escapeHtml(venue.slug)}/"><img src="${escapeHtml(venue.image)}" alt="${escapeHtml(venue.name)} cricket ground" width="640" height="360" loading="lazy" decoding="async" /><span>${escapeHtml(venue.name)}</span><small>${escapeHtml(venue.location)}</small><b>View venue guide <i data-lucide="arrow-right" aria-hidden="true"></i></b></a>`).join("")}</div></article>`;
}

function renderWatch(broadcasters) {
  return `<article class="rh-panel rh-watch" aria-labelledby="rh-watch-title"><div class="rh-panel-heading"><div><h2 id="rh-watch-title">How to Watch CPL 2026</h2><p class="rh-section-copy">Official TV networks and streaming services broadcast CPL 2026 matches — country guides.</p></div><a href="/how-to-watch/">View Watching Guide <i data-lucide="arrow-right" aria-hidden="true"></i></a></div><div class="rh-watch-list">${broadcasters.markets.slice(0, 6).map((market) => `<div><span>${escapeHtml(market.market)}</span><b class="${market.status === "verified" ? "confirmed" : "pending"}">${market.status === "verified" ? "Confirmed" : "TBA"}</b></div>`).join("")}</div><p class="rh-watch-note"><i data-lucide="info" aria-hidden="true"></i> Broadcast details update after rights holder announcements.</p></article>`;
}

function renderFaqAndNewsletter(site, faqs) {
  const questions = [
    ["When does CPL 2026 start?", "When does CPL 2026 start?"],
    ["How many teams are playing in CPL 2026?", "How many teams are playing in CPL 2026?"],
    ["Where will the CPL 2026 final be played?", "Where will the CPL 2026 final be played?"],
    ["How can I watch CPL 2026?", "How can I watch CPL 2026?"],
    ["Where can I find CPL 2026 live scores?", "Where can I find CPL 2026 live scores?"]
  ];
  const homeFaqs = questions.map(([sourceQuestion, label]) => ({ ...faqs.find((faq) => faq.question === sourceQuestion), label })).filter((faq) => faq.answer);
  return `<section class="rh-bottom-grid" aria-label="CPL 2026 FAQs and updates"><article class="rh-panel rh-faq"><div class="rh-panel-heading"><h2>Frequently Asked Questions</h2><a href="/faq/">View All FAQs <i data-lucide="arrow-right" aria-hidden="true"></i></a></div>${homeFaqs.slice(0, 4).map((faq) => `<details><summary>${escapeHtml(faq.label)}<i data-lucide="chevron-right" aria-hidden="true"></i></summary><p>${escapeHtml(faq.answer)}</p></details>`).join("")}</article><article class="rh-newsletter"><div><p class="rh-eyebrow">Stay close to the action</p><h2>CPL Update Alerts</h2><p>Latest CPL news page tracks match dates, squad updates, results, and broadcasts.</p></div><a class="rh-newsletter-link" href="/news/">Browse latest CPL news <i data-lucide="arrow-right" aria-hidden="true"></i></a><small>Subscription registration opens soon.</small></article></section>`;
}

function renderPlanTournament(site) {
  const finalDate = new Date(`${site.endDate}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `<section class="rh-section rh-plan" aria-labelledby="rh-plan-title">
    <div class="rh-plan-copy"><p class="rh-eyebrow">Plan your tournament</p><h2 id="rh-plan-title">CPL 2026 Tickets and Final</h2><p class="rh-section-copy">Official ticket sellers handle match passes — final venue host pending.</p><div><a class="rh-button rh-button-yellow" href="/tickets/"><i data-lucide="ticket-check" aria-hidden="true"></i> Ticket guide</a><a class="rh-button rh-button-outline" href="/fixtures/"><i data-lucide="calendar-days" aria-hidden="true"></i> View fixtures</a></div></div>
    <div class="rh-plan-status">
      <article><i data-lucide="ticket" aria-hidden="true"></i><span><small>Ticket sales</small><strong>Official seller links pending</strong><em>Seller TBC</em></span></article>
      <article><i data-lucide="trophy" aria-hidden="true"></i><span><small>CPL 2026 final</small><strong>${escapeHtml(finalDate)}</strong><em>Host and venue TBC</em></span></article>
    </div>
  </section>`;
}

function renderTrust(site) {
  return `<section class="rh-trust" aria-label="CPL Insider editorial information"><div><i data-lucide="file-check-2" aria-hidden="true"></i><span><strong>Sources</strong><p>Official tournament updates, team rosters, venue news — verified sources.</p><small>Page updated: ${escapeHtml(site.buildUpdated)}. Tournament data reviewed: ${escapeHtml(site.lastUpdated)}.</small></span></div><div><i data-lucide="pen-line" aria-hidden="true"></i><span><strong>Editor's note</strong><p>Match dates, squads, venues, and broadcasts change — check linked sources.</p><small>${escapeHtml(site.notAffiliated)}</small></span></div></section>`;
}

function renderSeoOverview() {
  return `<section class="rh-section rh-seo-overview" aria-labelledby="rh-seo-title">
    <div class="rh-section-title">
      <div>
        <p class="rh-eyebrow">Tournament Overview & Guide</p>
        <h2 id="rh-seo-title">CPL 2026 — Caribbean Cricket's Biggest Party Returns</h2>
      </div>
    </div>
    <div class="rh-seo-card">
      <div class="rh-seo-grid">
        <article class="rh-seo-block">
          <h3><i data-lucide="trophy" aria-hidden="true"></i> Tournament Overview & 2026 Season Format</h3>
          <p>Caribbean Premier League 2026 runs from 7 August to 20 September 2026 across eight venues. Seven T20 franchises — <a href="/teams/jamaica-kingsmen/">Jamaica Kingsmen</a>, <a href="/teams/trinbago-knight-riders/">Trinbago Knight Riders</a>, <a href="/teams/guyana-amazon-warriors/">Guyana Amazon Warriors</a>, <a href="/teams/barbados-tridents/">Barbados Tridents</a>, <a href="/teams/saint-lucia-kings/">Saint Lucia Kings</a>, <a href="/teams/st-kitts-nevis-patriots/">St Kitts &amp; Nevis Patriots</a>, and <a href="/teams/antigua-and-barbuda-falcons/">Antigua &amp; Barbuda Falcons</a> — battle in 39 T20 matches.</p>
        </article>
        <article class="rh-seo-block">
          <h3><i data-lucide="calendar" aria-hidden="true"></i> CPL 2026 Schedule, Live Scores & Match Centre</h3>
          <p>Match centre updates cover live scores, toss results, playing XIs, and local start times. Kensington Oval — host of CPL 2026 finals week — leads eight Caribbean venues. View complete <a href="/fixtures/">CPL 2026 schedule</a> and <a href="/live-score/">live score match centre</a> for stadium guides.</p>
        </article>
        <article class="rh-seo-block">
          <h3><i data-lucide="users" aria-hidden="true"></i> Franchise Squads, Player Profiles & Points Table</h3>
          <p>Official <a href="/teams/">CPL 2026 team squads</a> include Nicholas Pooran, Andre Russell, Kieron Pollard, Sunil Narine, and Shai Hope — <a href="/players/">player stats</a>. Points table tracks team wins, losses, net run rate, and standings — live <a href="/points-table/">CPL 2026 points table</a>.</p>
        </article>
      </div>
    </div>
  </section>`;
}

function renderReferenceHome(data) {
  const { site, teams, players, fixtures, venues, news, faqs, broadcasters } = data;
  return `<main class="home-page rh-home" id="main-content">
    <section class="rh-hero" aria-labelledby="rh-hero-title">
      <div class="rh-hero-art"><img src="/assets/images/hero/cpl-2026-player-artwork.webp" alt="" width="1717" height="916" fetchpriority="high" decoding="async" /></div>
      <div class="rh-hero-content"><p class="rh-eyebrow">CPL 2026 Caribbean Premier League</p><h1 id="rh-hero-title"><span>Caribbean Cricket's</span> <strong>Biggest Party</strong> <span>Returns</span></h1><p>Caribbean Premier League 2026 brings 39 T20 matches across eight Caribbean venues — live scores, fixtures, squads, standings, and broadcast channels.</p><div class="rh-hero-actions"><a class="rh-button rh-button-yellow" href="/fixtures/">View Schedule <i data-lucide="arrow-right" aria-hidden="true"></i></a><a class="rh-button rh-button-outline" href="/teams/">Explore Teams <i data-lucide="arrow-right" aria-hidden="true"></i></a></div></div>
      <dl class="rh-hero-facts"><div><dt><i data-lucide="calendar-days"></i><span>Tournament dates</span></dt><dd>7 August - 20 September 2026</dd></div><div><dt><i data-lucide="trophy"></i><span>Matches</span></dt><dd>${escapeHtml(String(site.stats.matches))}</dd></div><div><dt><i data-lucide="users"></i><span>Teams</span></dt><dd>${escapeHtml(String(site.stats.teams))}</dd></div><div><dt><i data-lucide="map-pinned"></i><span>Venues</span></dt><dd>${escapeHtml(String(site.stats.venues))}</dd></div></dl>
    </section>
    ${renderMatchCentre(site, teams, fixtures)}
    ${renderTeams(teams, data.squadByTeam)}
    ${renderPlayerIndex()}
    <section class="rh-two-column">${renderStandings(teams)}${renderNews(news)}</section>
    ${renderFeatureTiles()}
    ${renderPlayerLeaders(players, teams)}
    <section class="rh-support-grid" aria-label="Venue and viewing guides">${renderVenues(venues)}${renderWatch(broadcasters)}</section>
    ${renderAbout(site)}
    ${renderPlanTournament(site)}
    ${renderSeoOverview()}
    ${renderFaqAndNewsletter(site, faqs)}
    ${renderTrust(site)}
  </main>`;
}

module.exports = { renderReferenceHome };
