const { escapeHtml } = require("../lib/html");
const { renderEditorialSection, renderIntentChecklist } = require("../sections/contentBlocks");
const { renderFixtures, renderLiveScore, renderPointsTable, renderTopPlayers } = require("../sections/matchCenter");
const { renderTeamCard } = require("../sections/teams");
const { renderVenues } = require("../sections/venuesFan");
const { renderFaq } = require("../sections/faq");
const { renderDetailPanel, renderListingGrid, renderPageHero } = require("../sections/innerPage");
const { displayValue, renderDataState } = require("../sections/dataState");
const { renderSchedulePage } = require("../sections/schedulePage");

function findTeam(data, code) {
  return data.teams.find((team) => team.code === code);
}

function sourceRecordsFor(data, record) {
  const ids = [...new Set([...(record?.sourceIds || []), record?.sourceId].filter(Boolean))];
  return ids.map((id) => data.sourcesById.get(id)).filter(Boolean);
}

function renderSquadRoster(data, team, squad) {
  if (!squad?.players.length) return "";
  const players = data.players.filter((player) => player.teamCode === team.code);
  const rosterStatus = squad.completeness === "complete" ? "Complete roster" : "Confirmed players to date";
  return `<section class="team-silo-section team-squad" id="squad" aria-labelledby="${escapeHtml(team.slug)}-squad-title">
    <div class="team-silo-heading">
      <div><p class="eyebrow">${escapeHtml(rosterStatus)}</p><h2 id="${escapeHtml(team.slug)}-squad-title">${escapeHtml(team.name)} CPL 2026 Squad</h2><p>${escapeHtml(squad.scope)}</p></div>
      <div class="team-squad-count"><strong>${squad.players.length}</strong><span>verified names</span></div>
    </div>
    <div class="team-squad-grid">
      ${players.map((player) => {
        const image = player.photo || player.heroPhoto;
        const portrait = image
          ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(player.imageAlt || `${player.name} CPL player portrait`)}" width="320" height="400" loading="lazy" decoding="async" />`
          : `<div class="team-player-placeholder" aria-hidden="true">${escapeHtml(player.initials)}</div>`;
        return `<article class="team-player-card" style="--team-accent:${escapeHtml(team.accent)}">
          <div class="team-player-image">${portrait}<img class="team-player-club" src="${escapeHtml(team.logo)}" alt="" width="44" height="44" loading="lazy" /></div>
          <div><p>${escapeHtml(player.role)}</p><h3>${escapeHtml(player.name)}</h3><a href="/players/${escapeHtml(player.slug)}/">View player profile <i data-lucide="arrow-right" aria-hidden="true"></i></a></div>
        </article>`;
      }).join("")}
    </div>
  </section>`;
}

function renderTeamFixtureStrip(data, team, fixtures) {
  if (!fixtures.length) return "";
  return `<section class="team-silo-section team-fixtures" id="fixtures" aria-labelledby="${escapeHtml(team.slug)}-fixtures-title">
    <div class="team-silo-heading"><div><p class="eyebrow">Team schedule</p><h2 id="${escapeHtml(team.slug)}-fixtures-title">Upcoming ${escapeHtml(team.code)} Matches</h2><p>Confirmed dates, local start times and venue links from the CPL 2026 schedule.</p></div><a href="/teams/${escapeHtml(team.slug)}/fixtures/">View full schedule <i data-lucide="arrow-right" aria-hidden="true"></i></a></div>
    <div class="team-fixture-list">
      ${fixtures.slice(0, 5).map((match) => {
        const opponentCode = match.teamA === team.code ? match.teamB : match.teamA;
        const opponent = findTeam(data, opponentCode);
        return `<a class="team-fixture-row" href="/fixtures/${escapeHtml(match.slug)}/">
          <time datetime="${escapeHtml(match.dateISO)}"><strong>${escapeHtml(match.dateText)}</strong><span>${escapeHtml(match.time)}</span></time>
          <div class="team-fixture-opponent"><img src="${escapeHtml(opponent?.logo || "")}" alt="" width="58" height="58" loading="lazy" /><span><small>${match.teamA === team.code ? "vs" : "at"}</small><strong>${escapeHtml(opponent?.name || opponentCode)}</strong></span></div>
          <span class="team-fixture-venue"><i data-lucide="map-pin" aria-hidden="true"></i>${escapeHtml(match.venue)}</span>
          <i data-lucide="chevron-right" aria-hidden="true"></i>
        </a>`;
      }).join("")}
    </div>
  </section>`;
}

function relatedTeamNews(data, team) {
  const terms = [team.name, team.code].map((term) => term.toLowerCase());
  return data.news.filter((item) => {
    const haystack = `${item.title} ${item.excerpt} ${item.body || ""}`.toLowerCase();
    return terms.some((term) => haystack.includes(term));
  }).slice(0, 3);
}

function playerRoleKey(role) {
  const normalized = role.toLowerCase();
  const roles = [];
  if (normalized.includes("batter")) roles.push("batter");
  if (normalized.includes("wicketkeeper")) roles.push("wicketkeeper");
  if (normalized.includes("allrounder")) roles.push("allrounder");
  if (normalized.includes("bowler")) roles.push("bowler");
  return roles.length ? roles.join(" ") : "pending";
}

function renderPlayerListingCard(player, team, eager = false) {
  const image = player.photo || player.heroPhoto;
  const imageWidth = player.photo ? 640 : 1120;
  const imageHeight = player.photo ? 800 : 1536;
  const loading = eager ? "eager" : "lazy";
  const portrait = image
    ? `<img class="pd-player-photo" src="${escapeHtml(image)}" alt="${escapeHtml(player.imageAlt || `${player.name} CPL player portrait`)}" width="${imageWidth}" height="${imageHeight}" loading="${loading}" decoding="sync" />`
    : `<div class="pd-player-placeholder" aria-label="${escapeHtml(player.name)} portrait pending"><strong>${escapeHtml(player.initials)}</strong><span>Portrait pending</span></div>`;
  const roleKey = playerRoleKey(player.role);
  const nationality = player.nationality || "Nationality pending";
  const nationalityKey = player.nationality ? player.nationality.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "pending";
  return `<article class="pd-player-card" data-player-card data-search="${escapeHtml(`${player.name} ${player.team} ${player.role} ${nationality}`.toLowerCase())}" data-team="${escapeHtml(player.teamCode)}" data-role="${escapeHtml(roleKey)}" data-nationality="${escapeHtml(nationalityKey)}" data-status="${escapeHtml(player.rosterStatus)}" style="--player-team-accent:${escapeHtml(team?.accent || "#7a3ff2")}">
    <div class="pd-player-visual">
      ${portrait}
    </div>
    <div class="pd-player-copy">
      <h2>${escapeHtml(player.name)}</h2>
      <p>${escapeHtml(player.team)}</p>
      <span>${escapeHtml(player.role)}</span>
    </div>
    <a href="/players/${escapeHtml(player.slug)}/">View profile <i data-lucide="arrow-right" aria-hidden="true"></i></a>
  </article>`;
}

function findVenue(data, venueText = "") {
  return data.venues.find((venue) => venueText === venue.name || venueText.startsWith(`${venue.name},`));
}

function venueFixtures(data, venue) {
  return data.fixtures.filter((match) => match.venue === venue.name || match.venue.startsWith(`${venue.name},`));
}

function teamListing(data) {
  const teamMottos = {
    "JAK": { location: "Kingston, Jamaica", motto: "Pride of Jamaica. Power, passion and a legacy that drives a nation." },
    "ABF": { location: "St. John's, Antigua", motto: "Soaring high with fearless cricket and island spirit." },
    "TKR": { location: "Port of Spain, Trinidad & Tobago", motto: "Champions in every moment. Built for glory." },
    "SLK": { location: "Gros Islet, Saint Lucia", motto: "Royal by nature. Relentless in pursuit of victory." },
    "SKNP": { location: "Basseterre, St Kitts & Nevis", motto: "United by passion. Driven by the Patriots' spirit." },
    "GAW": { location: "Georgetown, Guyana", motto: "Fierce. Fearless. Ready to conquer every challenge." },
    "BT": { location: "Bridgetown, Barbados", motto: "Strength in unity. Tridents rise, seas stand still." }
  };

  const latestNews = [
    { date: "28 MAY 2026", category: "TEAM NEWS", title: "Teams Announce Pre-Season Camps Ahead of CPL 2026", slug: "teams-announce-pre-season-camps" },
    { date: "14 MAY 2026", category: "OVERSEAS SIGNINGS", title: "Franchises Confirm New Overseas Signings", slug: "franchises-confirm-new-overseas-signings" },
    { date: "05 MAY 2026", category: "SEASON PREPARATION", title: "Teams Step Up Preparations for the 2026 Season", slug: "teams-step-up-preparations-for-2026-season" }
  ];

  const teamFaqs = [
    { question: "How many teams are playing in CPL 2026?", answer: "Seven franchises compete in CPL 2026 across 39 T20 matches." },
    { question: "Which teams are new or renamed for 2026?", answer: "Antigua & Barbuda Falcons replaced Jamaica Tallawahs as the seventh franchise slot." },
    { question: "Where can I view each team's fixtures?", answer: "Each team page features a dedicated fixtures tab showing confirmed match dates and start times." },
    { question: "Where can I find confirmed squads?", answer: "Confirmed 17-player squad rosters are updated live on each individual team page." },
    { question: "How often is this teams page updated?", answer: "All team rosters, captains, home venues, and news update immediately after official announcements." }
  ];

  return `<main class="teams-directory" data-teams-directory>
    <!-- Section 1: Hero -->
    <section class="tm-hero" aria-labelledby="tm-hero-title">
      <div class="tm-hero-copy">
        <p class="eyebrow">CPL 2026</p>
        <h1 id="tm-hero-title">CPL 2026 TEAMS</h1>
        <p>Explore all seven Caribbean Premier League teams, their home bases, histories and 2026 season guides.</p>
        <div class="tm-hero-actions">
          <a class="rh-button rh-button-yellow" href="#meet-the-teams">EXPLORE TEAMS <i data-lucide="arrow-right" aria-hidden="true"></i></a>
          <a class="rh-button rh-button-purple" href="/fixtures/"><i data-lucide="calendar-days" aria-hidden="true"></i> VIEW SCHEDULE</a>
        </div>
        <div class="tm-hero-chips">
          <div><i data-lucide="users" aria-hidden="true"></i> <span><strong>7</strong> <small>TEAMS</small></span></div>
          <div><i data-lucide="target" aria-hidden="true"></i> <span><strong>39</strong> <small>MATCHES</small></span></div>
          <div><i data-lucide="calendar-days" aria-hidden="true"></i> <span><strong>7 AUG - 20 SEP 2026</strong></span></div>
        </div>
      </div>
    </section>

    <!-- Section 2: Meet the CPL 2026 Teams -->
    <section class="tm-section" id="meet-the-teams" aria-labelledby="tm-meet-title">
      <div class="tm-section-heading">
        <h2 id="tm-meet-title">MEET THE CPL 2026 TEAMS</h2>
      </div>
      <div class="tm-banners-list">
        ${data.teams.map((team) => {
          const info = teamMottos[team.code] || { location: team.homeVenue, motto: team.summary };
          return `<article class="tm-banner-card" style="--team-accent:${escapeHtml(team.accent)}">
            <div class="tm-banner-identity">
              <img src="${escapeHtml(team.logo)}" alt="${escapeHtml(team.name)} logo" width="76" height="76" loading="lazy" decoding="async" />
              <h3>${escapeHtml(team.name.toUpperCase())}</h3>
            </div>
            <div class="tm-banner-details">
              <span class="tm-location"><i data-lucide="map-pin" aria-hidden="true"></i> ${escapeHtml(info.location.toUpperCase())}</span>
              <p>${escapeHtml(info.motto)}</p>
            </div>
            <a class="tm-banner-btn" href="/teams/${escapeHtml(team.slug)}/">VIEW TEAM <i data-lucide="arrow-right" aria-hidden="true"></i></a>
          </article>`;
        }).join("")}
      </div>
    </section>

    <!-- Section 3: CPL 2026 Team Guide -->
    <section class="tm-section" aria-labelledby="tm-guide-title">
      <div class="tm-section-heading">
        <h2 id="tm-guide-title">CPL 2026 TEAM GUIDE</h2>
      </div>
      <div class="tm-guide-grid">
        <article class="tm-guide-card tm-guide-caribbean">
          <h3>Seven Franchises Across the Caribbean</h3>
          <p>From Jamaica to Guyana, seven proud franchises represent their islands, cultures and fans. Discover each team's home base, journey and what makes them unique in CPL 2026.</p>
        </article>
        <article class="tm-guide-card tm-guide-season">
          <h3>Follow Every Team Through the Season</h3>
          <p>From opening clash to the final, follow every team's path, rivalries and key moments as they chase Caribbean glory in 2026.</p>
        </article>
      </div>
    </section>

    <!-- Section 4: Compare the Teams -->
    <section class="tm-section" aria-labelledby="tm-compare-title">
      <div class="tm-section-heading">
        <h2 id="tm-compare-title">COMPARE THE TEAMS</h2>
      </div>
      <div class="tm-table-wrap">
        <table class="tm-compare-table">
          <thead>
            <tr>
              <th>TEAM</th>
              <th>HOME BASE</th>
              <th>TEAM PROFILE</th>
            </tr>
          </thead>
          <tbody>
            ${data.teams.map((team) => {
              const info = teamMottos[team.code] || { location: team.homeVenue };
              return `<tr>
                <td>
                  <div class="tm-table-team" style="--team-accent:${escapeHtml(team.accent)}">
                    <img src="${escapeHtml(team.logo)}" alt="" width="36" height="36" loading="lazy" />
                    <strong>${escapeHtml(team.name.toUpperCase())}</strong>
                  </div>
                </td>
                <td>${escapeHtml(info.location)}</td>
                <td><a class="tm-table-link" href="/teams/${escapeHtml(team.slug)}/">VIEW GUIDE <i data-lucide="arrow-right" aria-hidden="true"></i></a></td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Section 5: Latest Team Updates -->
    <section class="tm-section" aria-labelledby="tm-news-title">
      <div class="tm-section-heading">
        <h2 id="tm-news-title">LATEST TEAM UPDATES</h2>
      </div>
      <div class="tm-news-grid">
        ${latestNews.map((news) => `<a class="tm-news-card" href="/news/">
          <time datetime="2026-05-28">${escapeHtml(news.date)}</time>
          <span class="tm-news-cat">${escapeHtml(news.category)}</span>
          <h3>${escapeHtml(news.title)} <i data-lucide="arrow-right" aria-hidden="true"></i></h3>
        </a>`).join("")}
      </div>
    </section>

    <!-- Section 6: Explore More CPL 2026 -->
    <section class="tm-section" aria-labelledby="tm-explore-title">
      <div class="tm-section-heading">
        <h2 id="tm-explore-title">EXPLORE MORE CPL 2026</h2>
      </div>
      <div class="tm-explore-grid">
        <a class="tm-explore-tile tile-purple" href="/players/">
          <i data-lucide="users" aria-hidden="true"></i>
          <strong>PLAYERS &amp; SQUADS <i data-lucide="arrow-right" aria-hidden="true"></i></strong>
        </a>
        <a class="tm-explore-tile tile-yellow" href="/fixtures/">
          <i data-lucide="calendar" aria-hidden="true"></i>
          <strong>MATCH SCHEDULE <i data-lucide="arrow-right" aria-hidden="true"></i></strong>
        </a>
        <a class="tm-explore-tile tile-blue" href="/venues/">
          <i data-lucide="landmark" aria-hidden="true"></i>
          <strong>VENUES <i data-lucide="arrow-right" aria-hidden="true"></i></strong>
        </a>
        <a class="tm-explore-tile tile-green" href="/points-table/">
          <i data-lucide="trophy" aria-hidden="true"></i>
          <strong>POINTS TABLE <i data-lucide="arrow-right" aria-hidden="true"></i></strong>
        </a>
      </div>
    </section>

    <!-- Section 7: CPL 2026 Teams FAQ -->
    <section class="tm-section" aria-labelledby="tm-faq-title">
      <div class="tm-section-heading">
        <h2 id="tm-faq-title">CPL 2026 TEAMS FAQ</h2>
      </div>
      <div class="tm-faq-list">
        ${teamFaqs.map((faq, index) => `<details class="tm-faq-item"${index === 0 ? " open" : ""}>
          <summary>${escapeHtml(faq.question)} <i data-lucide="chevron-down" aria-hidden="true"></i></summary>
          <p>${escapeHtml(faq.answer)}</p>
        </details>`).join("")}
      </div>
    </section>
  </main>`;
}

function teamDetail(data, team) {
  const teamFixtures = data.fixtures.filter((match) => match.teamA === team.code || match.teamB === team.code);
  const squad = data.squadByTeam.get(team.code);
  const squadSources = sourceRecordsFor(data, squad);
  const venue = data.venues.find((item) => item.name === team.homeVenue);
  const teamNews = relatedTeamNews(data, team);
  const squadLabel = squad?.completeness === "complete" ? "Complete" : "Partial";
  return `<main class="team-silo" style="--team-accent:${escapeHtml(team.accent)}">
    <section class="team-silo-hero" aria-labelledby="team-silo-title">
      <div class="team-silo-hero-copy"><p class="eyebrow">${escapeHtml(team.country)} &middot; CPL 2026</p><h1 id="team-silo-title">${escapeHtml(team.name)}</h1><p>${escapeHtml(team.summary)}</p><div><a class="primary-button" href="#fixtures">View fixtures</a><a class="secondary-button" href="#squad">View squad</a></div></div>
      <div class="team-silo-identity"><span>${escapeHtml(team.code)}</span><img src="${escapeHtml(team.logo)}" alt="${escapeHtml(team.name)} logo" width="260" height="260" decoding="async" /></div>
      <dl class="team-silo-facts">
        <div><dt>Home</dt><dd>${escapeHtml(team.country)}</dd></div>
        <div><dt>Venue</dt><dd>${escapeHtml(team.homeVenue)}</dd></div>
        <div><dt>Fixtures</dt><dd>${teamFixtures.length}</dd></div>
        <div><dt>Squad status</dt><dd><span class="team-status ${squad?.completeness === "complete" ? "complete" : "partial"}">${escapeHtml(squadLabel)}</span></dd></div>
      </dl>
    </section>
    <nav class="team-silo-nav" aria-label="${escapeHtml(team.name)} guide sections"><a href="#overview">Overview</a><a href="#fixtures">Fixtures</a><a href="#squad">Squad</a><a href="#venue">Venue</a><a href="#team-news">News</a></nav>
    <section class="team-silo-section team-overview" id="overview" aria-labelledby="team-overview-title">
      <div><p class="eyebrow">Team overview</p><h2 id="team-overview-title">${escapeHtml(team.name)} CPL 2026 Guide</h2><p>${escapeHtml(team.name)} fans can use this hub to move between the verified 2026 squad, every scheduled match, player profiles, the home venue guide and related tournament updates.</p><p>Captain, coach, overseas signings and playing XI information remain clearly marked until a direct team or tournament source confirms them.</p></div>
      <dl>
        <div><dt>Short code</dt><dd>${escapeHtml(team.code)}</dd></div><div><dt>Captain</dt><dd>${escapeHtml(displayValue(squad?.captain))}</dd></div><div><dt>Coach</dt><dd>${escapeHtml(displayValue(squad?.coach))}</dd></div><div><dt>Verified players</dt><dd>${squad?.players.length || 0}</dd></div>
      </dl>
    </section>
    ${renderDataState({
      label: `${team.name} squad`,
      status: squad?.status || "unconfirmed",
      lastChecked: data.squads.lastChecked,
      message: squad?.players.length
        ? squad.scope
        : "Captain, coach and squad names will appear only after a direct team or tournament source is recorded.",
      sources: squadSources
    })}
    ${renderTeamFixtureStrip(data, team, teamFixtures)}
    ${renderSquadRoster(data, team, squad)}
    <section class="team-silo-split">
      <article class="team-venue-card" id="venue"><div><p class="eyebrow">Home venue</p><h2>${escapeHtml(team.homeVenue)}</h2><p>${escapeHtml(venue?.summary || `${team.homeVenue} is the home venue listed for ${team.name}.`)}</p><a href="${venue ? `/venues/${escapeHtml(venue.slug)}/` : "/venues/"}">Open venue guide <i data-lucide="arrow-right" aria-hidden="true"></i></a></div>${venue?.image ? `<img src="${escapeHtml(venue.image)}" alt="" width="640" height="360" loading="lazy" decoding="async" />` : ""}</article>
      <section class="team-news-list" id="team-news" aria-labelledby="team-news-title"><div class="team-silo-heading"><div><p class="eyebrow">Related coverage</p><h2 id="team-news-title">${escapeHtml(team.code)} News and Guides</h2></div><a href="/news/">All CPL news <i data-lucide="arrow-right" aria-hidden="true"></i></a></div>${teamNews.length ? teamNews.map((item) => `<a href="/news/${escapeHtml(item.slug)}/"><img src="${escapeHtml(item.image)}" alt="" width="120" height="76" loading="lazy" /><span><small>${escapeHtml(item.category)} &middot; ${escapeHtml(item.date)}</small><strong>${escapeHtml(item.title)}</strong></span><i data-lucide="chevron-right" aria-hidden="true"></i></a>`).join("") : `<p>Team-specific updates will appear here when a verified report is published.</p>`}</section>
    </section>
    <section class="team-related-links" aria-label="Related CPL guides"><a href="/teams/">All CPL teams</a><a href="/fixtures/">CPL 2026 schedule</a><a href="/live-score/">CPL live score</a><a href="/points-table/">CPL points table</a></section>
  </main>`;
}

function teamFixturesPage(data, team) {
  const teamFixtures = data.fixtures.filter((match) => match.teamA === team.code || match.teamB === team.code);
  return `<main>
    ${renderPageHero({ title: `${team.name} Fixtures`, eyebrow: "Team Schedule Silo", text: `All ${team.name} CPL 2026 match pages in one clean team fixture hub.` })}
    ${renderEditorialSection({
      title: `${team.name} CPL Schedule and Match Links`,
      paragraphs: [
        `${team.name} fixture searches usually come from fans who already know the team they want to follow. This silo page keeps those users inside the ${team.name} cluster instead of sending every query back to the general schedule.`,
        `Each match link uses team names and venue context in the permalink. Dates stay inside the page content for usefulness, but the URL avoids date, year and match-number patterns so the structure remains evergreen and easier to maintain.`,
        `As match day approaches, each linked preview can expand with squad news, toss updates, playing XI, pitch report, scorecard links and result summaries.`
      ],
      links: [
        { label: team.name, href: `/teams/${team.slug}/` },
        { label: "All CPL Fixtures", href: "/fixtures/" },
        { label: "CPL Live Score", href: "/live-score/" }
      ]
    })}
    <section class="single-panel">${renderFixtures(data.site, teamFixtures, { title: `${team.name} Match Schedule`, headingLink: false })}</section>
  </main>`;
}

function legacyPlayerListing(data) {
  const teamSections = data.teams.map((team) => {
    const teamPlayers = data.players.filter((player) => player.team === team.name);
    if (!teamPlayers.length) return "";
    return `<section class="player-team-group" aria-labelledby="${escapeHtml(team.slug)}-players-title">
      <div class="section-heading">
        <div><p class="eyebrow">${escapeHtml(team.country)} · ${team.code}</p><h2 id="${escapeHtml(team.slug)}-players-title">${escapeHtml(team.name)} players</h2></div>
        <a href="/teams/${escapeHtml(team.slug)}/">View team guide <i data-lucide="arrow-right" aria-hidden="true"></i></a>
      </div>
      <p class="player-team-note">${teamPlayers.length} confirmed player name${teamPlayers.length === 1 ? "" : "s"} in the current CPL 2026 squad record. Roles and portraits are added only when individually sourced and checked.</p>
      <div class="listing-grid player-listing">${teamPlayers.map(renderPlayerListingCard).join("")}</div>
    </section>`;
  }).join("");

  return `<main>
    ${renderPageHero({ title: "CPL 2026 Players", text: "Player hub for CPL 2026 squads, roles, form snapshots and future live tournament stats." })}
    ${renderEditorialSection({
      title: "CPL 2026 Players, Squads and Form Guide",
      paragraphs: data.content.pageCopy.players,
      links: [
        { label: "Recent CPL Top Performers", href: "/player-stats/" },
        { label: "CPL 2026 Teams", href: "/teams/" },
        { label: "CPL Live Score", href: "/live-score/" }
      ]
    })}
    <div class="player-roster-summary" role="status"><strong>${data.players.length}</strong><span>confirmed player records across ${data.teams.length} CPL 2026 teams</span><small>Portraits and role fields are being completed in source-checked batches.</small></div>
    <div class="player-team-groups">${teamSections}</div>
  </main>`;
}

function playerListing(data) {
  const teamsByCode = new Map(data.teams.map((team) => [team.code, team]));
  const playersWithArtworkFirst = data.players
    .map((player, index) => ({ player, index, hasArtwork: Boolean(player.heroPhoto || player.photo) }))
    .sort((left, right) => Number(right.hasArtwork) - Number(left.hasArtwork) || left.index - right.index)
    .map((entry) => entry.player);
  const cards = playersWithArtworkFirst.map((player, index) => renderPlayerListingCard(player, teamsByCode.get(player.teamCode), index < 8)).join("");
  const nationalities = [...new Set(data.players.map((player) => player.nationality).filter(Boolean))].sort();

  const roleActionCards = [
    { role: "batter", title: "BATTER", image: "/assets/images/players/directory/nicholas-pooran.webp", text: "Run scorers who build innings and control the pace." },
    { role: "wicketkeeper", title: "WICKETKEEPER", image: "/assets/images/players/directory/shai-hope.webp", text: "Behind the stumps and in the game every moment." },
    { role: "allrounder", title: "ALL-ROUNDER", image: "/assets/images/players/directory/andre-russell.webp", text: "Contributes with both bat and ball. The complete package." },
    { role: "bowler", title: "FAST BOWLER", image: "/assets/images/players/directory/alzarri-joseph.webp", text: "Bring the pace, bounce and early breakthroughs." },
    { role: "bowler", title: "SPIN BOWLER", image: "/assets/images/players/directory/akeal-hosein.webp", text: "Use spin, skill and guile to turn the game around." }
  ];

  const squadRules = [
    { icon: "users", title: "WEST INDIES PLAYERS", text: "Each team is built around top West Indies talent, forming the core of every CPL squad." },
    { icon: "globe", title: "OVERSEAS PLAYERS", text: "Teams can sign up to 5 overseas players to add firepower, experience and global depth." },
    { icon: "star", title: "BREAKOUT PLAYERS", text: "Keep an eye on rising stars who could be the surprise difference-makers of CPL 2026." },
    { icon: "refresh-cw", title: "ROSTER UPDATES", text: "Squads evolve. Expect updates, injury changes and new signings throughout the season." }
  ];

  const playerFaqs = [
    { question: "How many players are in each CPL 2026 squad?", answer: "Each CPL franchise fields a 17-player squad, including West Indies contract players, overseas stars, and youth development picks." },
    { question: "How many overseas players can each team have?", answer: "Teams can contract up to 5 overseas international players in their official squad." },
    { question: "When will the full squad lists be announced?", answer: "Official squad rosters are confirmed following the CPL draft and regional player draft windows." },
    { question: "Can squads change during the tournament?", answer: "Yes. Temporary replacement players can be brought in for injuries or international duty call-ups." },
    { question: "How are breakout players selected?", answer: "Emerging Under-23 and regional West Indian stars are selected through the CPL youth draft." },
    { question: "Where can I see the latest squad updates?", answer: "All confirmed squad additions, draft picks, and replacements update live on CPL Insider team pages." }
  ];

  return `<main class="players-directory" data-player-directory>
    <section class="pd-hero" aria-labelledby="pd-hero-title">
      <img class="pd-hero-art" src="/assets/images/players/cpl-2026-players-hero.webp" alt="" width="2014" height="781" fetchpriority="high" decoding="async" />
      <div class="pd-hero-copy">
        <p class="eyebrow">CPL 2026</p>
        <h1 id="pd-hero-title"><span>CPL</span> <strong>2026</strong><small>PLAYERS &amp; SQUADS</small></h1>
        <p>Explore every team, player role and the latest squad updates across the Caribbean Premier League 2026 season.</p>
        <div class="pd-hero-chips">
          <div><i data-lucide="users" aria-hidden="true"></i><span><strong>7</strong><small>TEAMS</small></span></div>
          <div><i data-lucide="shirt" aria-hidden="true"></i><span><strong>119</strong><small>SQUAD PLACES</small></span></div>
          <div><i data-lucide="globe" aria-hidden="true"></i><span><strong>5</strong><small>OVERSEAS PER TEAM</small></span></div>
          <div><i data-lucide="star" aria-hidden="true"></i><span><strong>3</strong><small>BREAKOUT PLAYERS</small></span></div>
        </div>
      </div>
    </section>

    <section class="pd-filter-panel" aria-labelledby="pd-filter-title">
      <div class="pd-filter-head">
        <h2 id="pd-filter-title">FIND YOUR PLAYER</h2>
      </div>
      <form class="pd-filter-form" data-player-filters>
        <div class="pd-filter-row">
          <label class="pd-search"><span class="sr-only">Search player by name</span><i data-lucide="search" aria-hidden="true"></i><input type="search" placeholder="Search players by name..." autocomplete="off" data-player-search /></label>
          <label class="pd-team-select"><span class="sr-only">Filter by team</span><select data-player-team aria-label="Filter by team"><option value="all">All Teams</option>${data.teams.map((team) => `<option value="${escapeHtml(team.code)}">${escapeHtml(team.name)}</option>`).join("")}</select></label>
        </div>
        <div class="pd-role-pills" role="tablist" aria-label="Filter by player role">
          <button type="button" class="pd-pill is-active" data-role-pill="all" role="tab" aria-selected="true">ALL ROLES</button>
          <button type="button" class="pd-pill" data-role-pill="batter" role="tab" aria-selected="false">BATTER</button>
          <button type="button" class="pd-pill" data-role-pill="wicketkeeper" role="tab" aria-selected="false">WICKETKEEPER</button>
          <button type="button" class="pd-pill" data-role-pill="allrounder" role="tab" aria-selected="false">ALL-ROUNDER</button>
          <button type="button" class="pd-pill" data-role-pill="bowler" role="tab" aria-selected="false">BOWLER</button>
        </div>
        <select data-player-role hidden><option value="all">All roles</option><option value="batter">Batter</option><option value="wicketkeeper">Wicketkeeper</option><option value="allrounder">Allrounder</option><option value="bowler">Bowler</option></select>
        <select data-player-nationality hidden><option value="all">All nationalities</option>${nationalities.map((n) => `<option value="${escapeHtml(n.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}">${escapeHtml(n)}</option>`).join("")}</select>
        <select data-player-status hidden><option value="all">All squad statuses</option><option value="complete">Complete squad</option><option value="partial">Confirmed to date</option></select>
      </form>
    </section>

    <section class="pd-list-section" id="complete-player-list" aria-labelledby="pd-list-title">
      <div class="pd-list-heading">
        <h2 id="pd-list-title">Complete CPL 2026 Players List</h2>
        <p aria-live="polite" data-player-result-count>${data.players.length} players found</p>
      </div>
      <div class="pd-player-grid" data-player-grid>${cards}</div>
      <p class="pd-empty-state" data-player-empty hidden>No players match the selected filters.</p>
      <nav class="pd-pagination" aria-label="Player directory pages" data-player-pagination>
        <button type="button" data-player-prev><i data-lucide="chevron-left" aria-hidden="true"></i> PREVIOUS</button>
        <div data-player-pages></div>
        <button type="button" data-player-next>NEXT <i data-lucide="chevron-right" aria-hidden="true"></i></button>
      </nav>
    </section>

    <section class="pd-tracker-section" aria-labelledby="pd-tracker-title">
      <div class="pd-section-heading"><h2 id="pd-tracker-title">2026 TEAM SQUAD TRACKER</h2></div>
      <div class="pd-tracker-list">
        ${data.teams.map((team) => {
          const squad = data.squadByTeam.get(team.code);
          const count = squad?.players?.length || 0;
          const captain = squad?.captain || "To be announced";
          return `<div class="pd-tracker-row" style="--team-accent:${escapeHtml(team.accent)}">
            <div class="pd-tracker-team"><img src="${escapeHtml(team.logo)}" alt="${escapeHtml(team.name)} logo" width="48" height="48" loading="lazy" /><strong>${escapeHtml(team.name.toUpperCase())}</strong></div>
            <div class="pd-tracker-captain"><small>CAPTAIN</small><span>${escapeHtml(captain.toUpperCase())}</span></div>
            <div class="pd-tracker-progress"><small>CONFIRMED PLAYERS</small><div class="pd-progress-bar"><span style="width:${Math.min(100, Math.round((count / 17) * 100))}%"></span></div><span>${count} / 17</span></div>
            <a class="pd-tracker-btn" href="/teams/${escapeHtml(team.slug)}/#squad">VIEW FULL SQUAD <i data-lucide="arrow-right" aria-hidden="true"></i></a>
          </div>`;
        }).join("")}
      </div>
    </section>

    <section class="pd-rules-section" aria-labelledby="pd-rules-title">
      <div class="pd-section-heading"><h2 id="pd-rules-title">HOW CPL 2026 SQUADS WORK</h2></div>
      <div class="pd-rules-grid">
        ${squadRules.map((rule) => `<article class="pd-rule-card"><i data-lucide="${rule.icon}" aria-hidden="true"></i><h3>${escapeHtml(rule.title)}</h3><p>${escapeHtml(rule.text)}</p></article>`).join("")}
      </div>
    </section>

    <section class="pd-roles-section" aria-labelledby="pd-roles-title">
      <div class="pd-section-heading"><h2 id="pd-roles-title">PLAYER ROLES EXPLAINED</h2></div>
      <div class="pd-roles-grid">
        ${roleActionCards.map((card) => `<button type="button" class="pd-role-card" data-role-card="${card.role}"><img src="${escapeHtml(card.image)}" alt="" width="320" height="400" loading="eager" decoding="async" /><div class="pd-role-card-content"><h3>${escapeHtml(card.title)}</h3><p>${escapeHtml(card.text)}</p></div></button>`).join("")}
      </div>
    </section>

    <section class="pd-faq-section" aria-labelledby="pd-faq-title">
      <div class="pd-section-heading"><h2 id="pd-faq-title">CPL 2026 PLAYERS FAQ</h2></div>
      <div class="pd-faq-list">
        ${playerFaqs.map((faq) => `<details class="pd-faq-item"><summary>${escapeHtml(faq.question)} <i data-lucide="plus" aria-hidden="true"></i></summary><p>${escapeHtml(faq.answer)}</p></details>`).join("")}
      </div>
    </section>
  </main>`;
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return "To be confirmed";
  const birth = new Date(`${dateOfBirth}T00:00:00Z`);
  const today = new Date();
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday = today.getUTCMonth() < birth.getUTCMonth()
    || (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return `${age} years`;
}

function formatProfileDate(dateOfBirth) {
  if (!dateOfBirth) return "To be confirmed";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${dateOfBirth}T00:00:00Z`));
}

function playerRelatedNews(data, player) {
  const name = player.name.toLowerCase();
  return data.news.filter((item) => `${item.title} ${item.excerpt || ""} ${item.body || ""}`.toLowerCase().includes(name)).slice(0, 3);
}

function playerDetail(data, player) {
  const currentStats = data.currentStatsByPlayer.get(player.slug);
  const team = data.teams.find((item) => item.name === player.team);
  const squad = team ? data.squadByTeam.get(team.code) : null;
  const profile = player.profile || data.playerProfileBySlug.get(player.slug) || {};
  const relatedNews = playerRelatedNews(data, player);
  const profileImage = player.heroPhoto || player.photo;
  const profileImageMarkup = profileImage
    ? `<img src="${escapeHtml(profileImage)}" alt="${escapeHtml(player.imageAlt || `${player.name} ${player.team} CPL player portrait`)}" width="1120" height="1536" decoding="async" fetchpriority="high" />`
    : `<div class="pp-player-placeholder" aria-label="${escapeHtml(player.name)} portrait pending"><strong>${escapeHtml(player.initials)}</strong><span>Portrait pending</span></div>`;
  const career = profile.careerStats || {};
  const squadStatus = profile.squadStatus || (squad?.completeness === "complete" ? "Complete roster" : "Confirmed to date");
  const playingRole = profile.playingRole || player.role;
  const overview = profile.overview || `${player.name} is listed with ${player.team} for CPL 2026. This independent profile keeps confirmed squad information separate from unverified personal details and current-season performance.`;
  const seasonNote = profile.seasonNote || `${player.name} appears in the current ${player.team} squad record. CPL 2026 appearances and performance figures will be added only after official scorecards are available.`;
  const stats = [
    ["swords", "CPL matches", career.matches || "-"],
    ["trophy", "Runs", career.runs || "-"],
    ["timer", "Strike rate", career.strikeRate || "-"],
    ["chart-no-axes-column-increasing", "Highest score", career.highestScore || "-"],
    ["hand", "Catches", career.catches || "-"],
    ["goal", "Stumpings", career.stumpings || "-"]
  ];
  const quickFacts = [
    ["Full name", profile.fullName || player.name],
    ["Date of birth", formatProfileDate(profile.dateOfBirth)],
    ["Age", calculateAge(profile.dateOfBirth)],
    ["Birthplace", profile.birthplace || "To be confirmed"],
    ["Nationality", profile.countryLabel || profile.nationality || "To be confirmed"],
    ["Playing role", playingRole],
    ["Batting style", profile.battingStyle || "To be confirmed"],
    ["Bowling style", profile.bowlingStyle || "To be confirmed"],
    ["CPL debut", profile.cplDebut || "To be confirmed"],
    ["Current CPL team", player.team],
    ...(player.previousTeam && player.previousTeam !== player.team ? [["Previous CPL team", player.previousTeam]] : []),
    ["Squad status", squadStatus]
  ];
  const careerRows = career.matches ? [
    [career.format || "CPL career", career.matches, career.innings || "-", career.runs || "-", career.average || "-", career.strikeRate || "-", career.highestScore || "-"]
  ] : [];
  const performanceRows = profile.recentPerformances || [];
  const keyFacts = [...(profile.keyFacts || [
    ["Role", playingRole],
    ["Current team", player.team],
    ["Squad status", squadStatus]
  ]), ["CPL 2026 statistics", currentStats ? displayValue(currentStats.primaryStat) : "Not started"]];
  const sourceUrl = profile.sourceUrl || player.imageSourcePage;
  const sourceNote = sourceUrl ? `<p class="pp-source-note"><i data-lucide="badge-check" aria-hidden="true"></i> Profile facts and career figures checked against the <a href="${escapeHtml(sourceUrl)}" rel="noopener noreferrer">official player source</a>. Last checked ${escapeHtml(profile.lastChecked || player.lastChecked || data.playerStats.lastChecked)}.</p>` : `<p class="pp-source-note"><i data-lucide="info" aria-hidden="true"></i> Detailed personal and career data is awaiting a verified primary source.</p>`;
  const careerTable = careerRows.length ? `<div class="pp-table-wrap"><table><thead><tr><th>Format</th><th>Mat</th><th>Inns</th><th>Runs</th><th>Avg</th><th>SR</th><th>HS</th></tr></thead><tbody>${careerRows.map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(String(value))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : `<p class="pp-empty">Verified CPL career statistics are not available for this profile yet.</p>`;
  const performancesTable = performanceRows.length ? `<div class="pp-table-wrap"><table><thead><tr><th>Date</th><th>Opponent</th><th>Batting</th><th>Bowling</th></tr></thead><tbody>${performanceRows.map((match) => `<tr><td>${escapeHtml(match.date)}</td><td>${escapeHtml(match.opponent)}</td><td>${escapeHtml(match.batting)}</td><td>${escapeHtml(match.bowling)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="pp-empty">Recent CPL performances will appear after a verified scorecard source is attached.</p>`;
  const newsMarkup = relatedNews.length ? relatedNews.map((item) => `<a class="pp-news-item" href="/news/${escapeHtml(item.slug)}/"><img src="${escapeHtml(item.image)}" alt="" width="116" height="72" loading="lazy" decoding="async" /><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.date)}</small></span><i data-lucide="chevron-right" aria-hidden="true"></i></a>`).join("") : `<p class="pp-empty">No verified player-specific CPL 2026 news has been published yet.</p>`;

  return `<main class="player-profile" style="--team-accent:${escapeHtml(team?.accent || "#7a3ff2")}">
    <section class="pp-hero" aria-labelledby="player-profile-title">
      <div class="pp-identity">
        <img class="pp-team-logo" src="${escapeHtml(team?.logo || "")}" alt="${escapeHtml(team?.name || "")} logo" width="180" height="180" />
        <div class="pp-identity-copy"><p class="eyebrow">CPL 2026 player profile</p><h1 id="player-profile-title">${escapeHtml(player.name)}</h1><p class="pp-role">${escapeHtml(playingRole)}</p><p class="pp-country"><i data-lucide="flag" aria-hidden="true"></i>${escapeHtml(profile.countryLabel || profile.nationality || "Nationality to be confirmed")}</p><dl><div><dt>Current CPL team</dt><dd>${escapeHtml(player.team)}</dd></div><div><dt>CPL 2026 status</dt><dd><span>${escapeHtml(squadStatus)}</span></dd></div><div><dt>Jersey number</dt><dd>${escapeHtml(profile.jerseyNumber || "-")}</dd></div></dl><div class="pp-actions"><a class="primary-button" href="/teams/${escapeHtml(team?.slug || "")}/">View team</a><a class="secondary-button" href="#career-stats">CPL career stats</a></div></div>
      </div>
      <div class="pp-portrait">${profileImageMarkup}</div>
    </section>
    <section class="pp-stat-strip" aria-label="${escapeHtml(player.name)} CPL career summary">${stats.map(([icon, label, value]) => `<div><i data-lucide="${icon}" aria-hidden="true"></i><span><small>${escapeHtml(label)}</small><strong>${escapeHtml(String(value))}</strong></span></div>`).join("")}</section>
    <section class="pp-tabs" data-tabs>
      <div class="pp-tab-list" role="tablist" aria-label="${escapeHtml(player.name)} profile sections">
        ${[["overview", "Overview"], ["career", "Career stats"], ["records", "CPL records"], ["performances", "Performances"], ["news", "News"], ["videos", "Videos"]].map(([id, label], index) => `<button id="pp-tab-${id}" type="button" role="tab" aria-selected="${index === 0}" aria-controls="pp-panel-${id}" tabindex="${index === 0 ? 0 : -1}" data-tab="${id}">${label}</button>`).join("")}
      </div>
      <div class="pp-tab-panels">
        <div id="pp-panel-overview" role="tabpanel" aria-labelledby="pp-tab-overview" data-panel="overview">
          <div class="pp-overview-grid">
            <article class="pp-card pp-overview-card"><h2>Player Overview</h2><p>${escapeHtml(overview)}</p><h3>Quick facts</h3><dl class="pp-quick-facts">${quickFacts.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(String(value))}</dd></div>`).join("")}</dl></article>
            <div class="pp-overview-side"><article class="pp-card"><h2>${escapeHtml(player.name)} in CPL 2026</h2><p>${escapeHtml(seasonNote)}</p><dl class="pp-season-facts">${keyFacts.map(([label, value]) => `<div><dt><i data-lucide="circle-dot" aria-hidden="true"></i>${escapeHtml(label)}</dt><dd>${escapeHtml(String(value))}</dd></div>`).join("")}</dl></article><article class="pp-card" id="career-stats"><h2>CPL Career Statistics</h2>${careerTable}</article></div>
          </div>
          <div class="pp-lower-grid"><article class="pp-card"><h2>Recent CPL Performances</h2><p class="pp-card-note">Previous completed CPL season, not CPL 2026 statistics.</p>${performancesTable}</article><article class="pp-card"><h2>Latest News</h2>${newsMarkup}</article></div>
          ${sourceNote}
        </div>
        <div id="pp-panel-career" role="tabpanel" aria-labelledby="pp-tab-career" data-panel="career" hidden><article class="pp-card"><p class="eyebrow">Verified career record</p><h2>${escapeHtml(player.name)} CPL Career Statistics</h2>${careerTable}${sourceNote}</article></div>
        <div id="pp-panel-records" role="tabpanel" aria-labelledby="pp-tab-records" data-panel="records" hidden><article class="pp-card"><p class="eyebrow">CPL career record</p><h2>${escapeHtml(player.name)} CPL Milestones</h2><div class="pp-record-grid">${[["Matches", career.matches], ["Runs", career.runs], ["Hundreds", career.hundreds], ["Fifties", career.fifties], ["Sixes", career.sixes], ["Highest score", career.highestScore]].map(([label, value]) => `<div><strong>${escapeHtml(value || "-")}</strong><span>${escapeHtml(label)}</span></div>`).join("")}</div>${sourceNote}</article></div>
        <div id="pp-panel-performances" role="tabpanel" aria-labelledby="pp-tab-performances" data-panel="performances" hidden><article class="pp-card"><p class="eyebrow">Previous completed season</p><h2>Recent CPL Performances</h2>${performancesTable}${sourceNote}</article></div>
        <div id="pp-panel-news" role="tabpanel" aria-labelledby="pp-tab-news" data-panel="news" hidden><article class="pp-card"><p class="eyebrow">Related coverage</p><h2>${escapeHtml(player.name)} News</h2>${newsMarkup}</article></div>
        <div id="pp-panel-videos" role="tabpanel" aria-labelledby="pp-tab-videos" data-panel="videos" hidden><article class="pp-card"><p class="eyebrow">Video archive</p><h2>${escapeHtml(player.name)} Videos</h2><p class="pp-empty">No verified video has been added to this player profile yet.</p></article></div>
      </div>
    </section>
    <nav class="team-related-links" aria-label="Related player guides"><a href="/players/">All CPL players</a><a href="/player-stats/">Player statistics</a><a href="/fixtures/">CPL schedule</a><a href="/live-score/">CPL live score</a></nav>
  </main>`;
}

function venuesListing(data) {
  return `<main>${renderPageHero({ title: "CPL 2026 Venues", text: "Venue guide for Caribbean Premier League 2026 match locations." })}${renderEditorialSection({
    title: "CPL 2026 Stadiums and Matchday Venue Guide",
    paragraphs: data.content.pageCopy.venues,
    links: [
      { label: "CPL 2026 Fixtures", href: "/fixtures/" },
      { label: "CPL Tickets Guide", href: "/tickets/" }
    ]
  })}${renderVenues(data.venues)}</main>`;
}

function venueDetail(data, venue) {
  const matchesAtVenue = venueFixtures(data, venue);
  return `<main>
    ${renderPageHero({ title: venue.name, eyebrow: "CPL 2026 Venue", text: venue.summary })}
    ${renderDetailPanel({
      title: `${venue.name} Guide`,
      meta: [["Location", venue.location]],
      body: "Venue pages will include match schedules, pitch notes, travel tips and ticket guidance once final data is confirmed."
    })}
    ${renderEditorialSection({
      title: `${venue.name} CPL 2026 Venue Preview`,
      paragraphs: [
        `${venue.name} is listed as a CPL 2026 venue guide page for fans searching match location, stadium context and travel planning information in ${venue.location}.`,
        `Before launch, this page should be expanded with confirmed matches, pitch behavior, average scores, nearby fan areas, entry guidance and transport notes. That turns the page from a simple venue listing into a practical matchday guide.`,
        `Internal links from fixture pages to ${venue.name} will help users understand where each CPL 2026 match is being played and what to expect from the venue.`
      ],
      links: [
        { label: "All CPL Venues", href: "/venues/" },
        { label: `${venue.name} Fixtures`, href: `/venues/${venue.slug}/fixtures/` },
        { label: "CPL 2026 Schedule", href: "/fixtures/" }
      ]
    })}
    ${matchesAtVenue.length ? `<section class="single-panel">${renderFixtures(data.site, matchesAtVenue, { title: `${venue.name} Fixtures`, headingLink: false })}</section>` : ""}
  </main>`;
}

function venueFixturesPage(data, venue) {
  const matchesAtVenue = venueFixtures(data, venue);
  return `<main>
    ${renderPageHero({ title: `${venue.name} Fixtures`, eyebrow: "Venue Schedule Silo", text: `CPL match pages grouped by ${venue.name}.` })}
    ${renderEditorialSection({
      title: `${venue.name} CPL Match Schedule`,
      paragraphs: [
        `${venue.name} fixture searches have a different intent from broad CPL schedule searches. Users want to know which teams play at this venue, when the match starts and where to find the live score or preview.`,
        `This venue silo connects stadium research to match pages, making the site stronger for long-tail searches around CPL venue, city, ticket planning, pitch report and team-vs-team previews.`,
        `The fixture URLs avoid date, year and match-number strings. Team names and venue context carry the permalink so each page remains readable and search-friendly.`
      ],
      links: [
        { label: venue.name, href: `/venues/${venue.slug}/` },
        { label: "All CPL Venues", href: "/venues/" },
        { label: "All CPL Fixtures", href: "/fixtures/" }
      ]
    })}
    <section class="single-panel">${renderFixtures(data.site, matchesAtVenue, { title: `${venue.name} Match List`, headingLink: false })}</section>
  </main>`;
}

function fixturesPage(data) {
  return renderSchedulePage(data);
}

function fixtureDetail(data, match) {
  const title = `${match.match} - CPL 2026 Match`;
  const teamA = findTeam(data, match.teamA);
  const teamB = findTeam(data, match.teamB);
  const venue = findVenue(data, match.venue);
  const fixtureSource = data.sourcesById.get("official-cpl-2026-fixtures");
  const teamIdentitySource = data.sourcesById.get("official-cpl-2026-barbados-tridents-return");
  return `<main>
    ${renderPageHero({ title, eyebrow: "CPL 2026 Fixture", text: `${match.dateText} at ${match.venue}. Match time: ${match.time}.` })}
    ${renderDetailPanel({
      title: `${match.match} Match Details`,
      meta: [
        ["Date", match.dateText],
        ["Time", match.time],
        ["Host", match.hostCountry],
        ["Venue", match.venue]
      ],
      body: `${match.match} appears in the current CPL 2026 fixture dataset dated 28 April 2026. This match page is prepared for preview content, toss updates, playing XI, live score, result and post-match summary.`
    })}
    ${renderDataState({
      label: "Fixture source",
      status: fixtureSource?.status || "unconfirmed",
      lastChecked: fixtureSource?.lastChecked,
      message: fixtureSource?.url
        ? "This fixture is connected to the recorded primary schedule source."
        : "The direct primary-source article URL is pending editorial entry; live and result fields remain locked.",
      sources: [fixtureSource, teamIdentitySource].filter(Boolean)
    })}
    ${renderEditorialSection({
      title: `${match.match} Preview and Live Score Hub`,
      paragraphs: [
        `Fans searching for ${match.match} CPL 2026 usually want the confirmed match date, start time, host country, venue and scorecard link. This page is structured to answer those questions quickly.`,
        `Before match day, this page should include team news, key players, expected conditions and head-to-head context. On match day, it should update with toss result, playing XI, innings summaries and final result.`,
        `The venue for this fixture is ${match.venue}, with ${match.hostCountry} listed as the host country in the current schedule dataset.`
      ],
      links: [
        { label: "CPL Fixtures", href: "/fixtures/" },
        { label: "CPL Live Score", href: "/live-score/" },
        { label: "CPL Points Table", href: "/points-table/" },
        teamA ? { label: `${teamA.name} Fixtures`, href: `/teams/${teamA.slug}/fixtures/` } : null,
        teamB ? { label: `${teamB.name} Fixtures`, href: `/teams/${teamB.slug}/fixtures/` } : null,
        venue ? { label: `${venue.name} Venue Fixtures`, href: `/venues/${venue.slug}/fixtures/` } : null
      ].filter(Boolean)
    })}
  </main>`;
}

function liveScorePage(data) {
  return `<main>${renderPageHero({ title: "CPL Live Score", text: "Live score, toss, playing XI and scorecard placeholder for CPL 2026 match days." })}${renderEditorialSection({
    title: "CPL Live Score, Scorecard and Match Center",
    paragraphs: data.content.pageCopy.liveScore,
    links: [
      { label: "CPL 2026 Fixtures", href: "/fixtures/" },
      { label: "CPL Points Table", href: "/points-table/" }
    ]
  })}<section class="single-panel">${renderLiveScore(data.site, data.fixtures)}</section>${renderIntentChecklist("Live Score Page Should Include", ["Current match score", "Toss and playing XI", "Innings summary", "Final result", "Points table impact"])}</main>`;
}

function pointsTablePage(data) {
  return `<main>${renderPageHero({ title: "CPL 2026 Points Table", text: "Standings will update when tournament matches begin." })}${renderEditorialSection({
    title: "CPL 2026 Points Table and Net Run Rate Guide",
    paragraphs: data.content.pageCopy.points,
    links: [
      { label: "CPL Fixtures", href: "/fixtures/" },
      { label: "CPL Live Score", href: "/live-score/" }
    ]
  })}<section class="single-panel">${renderPointsTable(data.site)}</section></main>`;
}

function playersStatsPage(data) {
  const currentStats = data.playerStats.players;
  return `<main>${renderPageHero({ title: "Recent CPL Top Performers", text: "Previous-season form context until CPL 2026 live stats begin." })}${renderDataState({
    label: "CPL 2026 player statistics",
    status: currentStats.length ? "verified" : "unconfirmed",
    lastChecked: data.playerStats.lastChecked,
    message: currentStats.length
      ? `${currentStats.length} verified current-season player records are available.`
      : "The 2026 leaderboard remains closed until verified match scorecards are available."
  })}<section class="single-panel">${renderTopPlayers(data.players)}</section></main>`;
}

function faqPage(data) {
  return `<main>${renderPageHero({ title: "CPL 2026 FAQ", text: "Quick answers for dates, teams, live scores and independence disclosure." })}${renderFaq(data.faqs)}</main>`;
}

function newsListing(data) {
  return `<main>
    ${renderPageHero({ title: "CPL 2026 News", text: "News, schedule notes, squad updates and feature stories for CPL 2026." })}
    <section class="listing-grid">
      ${data.news.map((item) => `<article class="panel list-card"><img src="${item.image}" alt="${escapeHtml(item.title)}" loading="lazy" /><span class="tag">${escapeHtml(item.category)}</span><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.excerpt)}</p><a class="secondary-button compact" href="/news/${item.slug}/">Read Story</a></article>`).join("")}
    </section>
  </main>`;
}

function newsDetail(data, item) {
  const bodyParagraphs = item.body
    ? [item.body]
    : [
        `${item.excerpt} This page is structured as a CPL 2026 news article and will be expanded with confirmed facts, dates, quotes, related team links and practical next steps for fans.`,
        `For SEO, each CPL 2026 news story answers the main question in the opening paragraph, then adds context, related fixtures, team implications and links to evergreen guide pages.`,
        `When this story is updated, the published date and internal links stay current so users and search engines can trust the page.`
      ];
  return `<main>
    ${renderPageHero({ title: item.title, eyebrow: item.category, text: item.excerpt })}
    ${item.image ? `<section class="single-panel"><article class="panel"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" style="width:100%;border-radius:6px;margin-bottom:16px;" /><small style="color:#b8c3dd;font-weight:700;">${escapeHtml(item.label)} &nbsp;&middot;&nbsp; ${escapeHtml(item.date)}</small></article></section>` : ""}
    ${renderEditorialSection({
      title: item.title,
      eyebrow: item.category,
      paragraphs: bodyParagraphs,
      links: [
        { label: "CPL 2026 News", href: "/news/" },
        { label: "CPL Fixtures", href: "/fixtures/" },
        { label: "CPL Teams", href: "/teams/" }
      ]
    })}
  </main>`;
}

function howToWatchPage(data) {
  const markets = data.broadcasters.markets;
  const broadcastSources = [...new Map(markets.flatMap((market) => sourceRecordsFor(data, market)).map((source) => [source.id, source])).values()];
  return `<main>${renderPageHero({ title: "How To Watch CPL 2026", text: "Broadcast and streaming guide hub for Caribbean Premier League 2026 viewers." })}${renderEditorialSection({
    title: "CPL 2026 Broadcast and Streaming Guide",
    paragraphs: [
      "This page is prepared as the main how-to-watch hub for CPL 2026. It should be updated with confirmed regional broadcasters, streaming partners, match start times and country-specific availability before the tournament begins.",
      "Fans searching for CPL live streaming, CPL TV channel and CPL broadcast rights need a clear route from fixture pages to viewing options. This guide keeps those searches connected to schedule, live score and team pages.",
      "CPL Insider is an independent fan resource, so broadcaster listings should be labelled as informational and updated when official rights holders publish final 2026 details."
    ],
    links: [
      { label: "CPL 2026 Fixtures", href: "/fixtures/" },
      { label: "CPL Live Score", href: "/live-score/" },
      { label: "CPL Teams", href: "/teams/" }
    ]
  })}${renderDataState({
    label: "CPL 2026 broadcast rights",
    status: data.dataQuality.readiness.broadcasters ? "reviewed" : "unconfirmed",
    lastChecked: data.broadcasters.lastChecked,
    message: data.dataQuality.readiness.broadcasters
      ? "At least one market has a source-validated broadcaster record."
      : "No 2026 broadcaster is named until a direct rights-holder or tournament source is recorded.",
    sources: broadcastSources
  })}<section class="broadcast-directory" data-broadcast-directory>
    <div class="broadcast-controls"><div><p class="eyebrow">Country and region guide</p><h2>TV and streaming availability</h2></div><label for="broadcast-market">Filter market<select id="broadcast-market"><option value="all">All markets</option>${markets.map((market) => `<option value="${escapeHtml(market.market)}">${escapeHtml(market.market)}</option>`).join("")}</select></label></div>
    <div class="broadcast-grid">${markets.map((market) => {
      const source = sourceRecordsFor(data, market)[0];
      return `<article data-market="${escapeHtml(market.market)}"><span class="status-badge neutral">${market.status === "verified" || market.status === "reviewed" ? "Confirmed" : "To be announced"}</span><h3>${escapeHtml(market.market)}</h3><dl><div><dt>TV broadcaster</dt><dd>${escapeHtml(displayValue(market.tvBroadcaster))}</dd></div><div><dt>Streaming platform</dt><dd>${escapeHtml(displayValue(market.streamingPlatform))}</dd></div><div><dt>Subscription</dt><dd>${escapeHtml(displayValue(market.subscription))}</dd></div><div><dt>Devices</dt><dd>${escapeHtml(market.devices.length ? market.devices.join(", ") : "To be announced")}</dd></div><div><dt>Restrictions</dt><dd>${escapeHtml(displayValue(market.restrictions))}</dd></div></dl>${source ? `<a class="broadcast-source" href="${escapeHtml(source.url)}" rel="noopener noreferrer">Official source <i data-lucide="external-link"></i></a>` : ""}</article>`;
    }).join("")}</div>
  </section></main>`;
}

function ticketsPage(data) {
  return `<main>${renderPageHero({ title: "CPL 2026 Tickets", text: "Ticket planning guide for CPL 2026 fixtures, venues and fan travel." })}${renderEditorialSection({
    title: "CPL 2026 Tickets and Matchday Planning",
    paragraphs: [
      "This tickets hub is built to help fans move from the CPL 2026 schedule into venue and matchday planning. Once official ticket links are confirmed, each fixture and venue page can link to the safest purchase route.",
      "Useful ticket content should include match date, venue, host country, seating guidance, travel notes, family sections, accessibility notes and whether a fixture is likely to sell quickly.",
      "Any future commercial or affiliate ticket links should be clearly disclosed. Until then, this page works as a planning guide and internal link hub for fans comparing fixtures and venues."
    ],
    links: [
      { label: "CPL 2026 Fixtures", href: "/fixtures/" },
      { label: "CPL 2026 Venues", href: "/venues/" },
      { label: "Opening Match", href: "/fixtures/jamaica-kingsmen-vs-antigua-and-barbuda-falcons-at-arnos-vale-stadium-st-vincent/" }
    ]
  })}</main>`;
}

function resultsPage(data) {
  const results = data.results.matches;
  return `<main>${renderPageHero({ title: "CPL 2026 Results", text: "Verified match results and scorecard links will appear here after games are completed." })}${renderEditorialSection({
    title: "CPL 2026 Results and Completed Matches",
    paragraphs: [
      "The results hub is intentionally empty before the tournament begins. CPL Insider will not publish placeholder winners, scores or player-of-the-match details as if they were real.",
      "After each completed fixture, this page can show the final score, margin, player of the match and links to the full match centre and updated points table.",
      "Until then, use the schedule for confirmed upcoming matches and the live score hub on match day."
    ],
    links: [{ label: "CPL 2026 Schedule", href: "/fixtures/" }, { label: "CPL Live Score", href: "/live-score/" }, { label: "CPL Points Table", href: "/points-table/" }]
  })}${renderDataState({
    label: "CPL 2026 match results",
    status: results.length ? "verified" : "unconfirmed",
    lastChecked: data.results.lastChecked,
    message: results.length
      ? `${results.length} completed results have passed source validation.`
      : "The results dataset is empty because the tournament has not started."
  })}${results.length
    ? `<section class="verified-results">${results.map((result) => `<article><span class="status-badge">Completed</span><h2>${escapeHtml(result.match)}</h2><p>${escapeHtml(result.summary)}</p><a href="/fixtures/${escapeHtml(result.fixtureSlug)}/">Open verified scorecard</a></article>`).join("")}</section>`
    : `<section class="empty-state"><i data-lucide="clipboard-check"></i><h2>No completed CPL 2026 matches yet</h2><p>Verified results will be added after the tournament starts.</p></section>`}</main>`;
}

function videosPage() {
  return `<main>${renderPageHero({ title: "CPL Videos and Highlights", text: "A video hub for verified highlights, interviews and tournament features." })}${renderEditorialSection({
    title: "CPL Highlights, Interviews and Match Videos",
    paragraphs: [
      "This page is prepared for official or properly licensed video embeds. Video thumbnails load first for performance, and a player should initialize only after a user chooses to watch.",
      "Match highlights will be connected to the relevant fixture, team and player pages so fans can move from a clip to the full tournament context.",
      "No unofficial stream or unlicensed full-match footage is hosted by CPL Insider."
    ],
    links: [{ label: "CPL 2026 News", href: "/news/" }, { label: "CPL Fixtures", href: "/fixtures/" }]
  })}<section class="empty-state"><i data-lucide="play-circle"></i><h2>Verified video library coming soon</h2><p>Published videos will include source, date, duration and match metadata.</p></section></main>`;
}

function evergreenPage({ title, eyebrow, intro, paragraphs, links = [] }) {
  return `<main>${renderPageHero({ title, eyebrow, text: intro })}${renderEditorialSection({ title, eyebrow, paragraphs, links })}</main>`;
}

function searchPage(data) {
  const entries = [
    ...data.teams.map((item) => ({ type: "Team", title: item.name, text: `${item.country} ${item.homeVenue}`, url: `/teams/${item.slug}/` })),
    ...data.players.map((item) => ({ type: "Player", title: item.name, text: `${item.team} ${item.role}`, url: `/players/${item.slug}/` })),
    ...data.fixtures.map((item) => ({ type: "Fixture", title: item.match, text: `${item.dateText} ${item.venue}`, url: `/fixtures/${item.slug}/` })),
    ...data.news.map((item) => ({ type: "News", title: item.title, text: item.excerpt, url: `/news/${item.slug}/` })),
    ...data.venues.map((item) => ({ type: "Venue", title: item.name, text: item.location, url: `/venues/${item.slug}/` }))
  ];
  return `<main class="search-page">${renderPageHero({ title: "Search CPL Insider", text: "Search teams, players, fixtures, news and venue guides." })}<section class="search-tool"><form role="search"><label for="site-search">What are you looking for?</label><div><i data-lucide="search"></i><input id="site-search" name="q" type="search" autocomplete="off" placeholder="Search CPL 2026" /><button type="submit">Search</button></div></form><p class="search-summary" aria-live="polite">Start typing to search the site.</p><div class="search-results"></div><script type="application/json" id="search-index">${JSON.stringify(entries).replace(/</g, "\\u003c")}</script></section></main>`;
}

module.exports = {
  evergreenPage,
  faqPage,
  fixturesPage,
  fixtureDetail,
  howToWatchPage,
  liveScorePage,
  newsDetail,
  newsListing,
  playerDetail,
  playerListing,
  playersStatsPage,
  pointsTablePage,
  resultsPage,
  searchPage,
  teamDetail,
  teamFixturesPage,
  teamListing,
  ticketsPage,
  videosPage,
  venueDetail,
  venueFixturesPage,
  venuesListing,
  renderPlayerListingCard
};
