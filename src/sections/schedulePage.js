const { escapeHtml } = require("../lib/html");
const { buildSchedulePageModel } = require("../lib/scheduleData");

function teamByCode(teams, code) {
  return teams.find((team) => team.code === code) || null;
}

function logoImg(team, size = 36) {
  if (!team?.logo) {
    return `<span class="sch-code-badge">${escapeHtml(team?.code || "TBC")}</span>`;
  }
  return `<img class="sch-team-logo" src="${escapeHtml(team.logo)}" alt="${escapeHtml(team.name || team.code)} logo" width="${size}" height="${size}" loading="lazy" />`;
}

function playerImg(player, className = "") {
  const nextMatchArt = {
    "andre-russell": {
      src: "/assets/images/schedule/andre-russell-next-match-side.webp",
      width: 851,
      height: 1374
    },
    "alzarri-joseph": {
      src: "/assets/images/schedule/alzarri-joseph-next-match-side.webp",
      width: 757,
      height: 1367
    }
  };
  const specialArt = className.includes("sch-next-player") ? nextMatchArt[player?.slug] : null;
  const src = specialArt?.src || player?.heroPhoto || player?.photo;
  if (!src) return "";
  const width = specialArt?.width || 1120;
  const height = specialArt?.height || 1536;
  const slugClass = specialArt ? ` sch-next-player-${escapeHtml(player.slug)}` : "";
  return `<img class="${className}${slugClass}" src="${escapeHtml(src)}" alt="${escapeHtml(player.imageAlt || player.name || "CPL player")}" width="${width}" height="${height}" loading="eager" decoding="async" />`;
}

function renderScheduleHero(model) {
  return `<section class="sch-hero" aria-labelledby="sch-hero-title">
    <div class="sch-hero-bg" aria-hidden="true"></div>
    <div class="sch-hero-inner">
      <div class="sch-hero-copy">
        <p class="sch-hero-eyebrow">REPUBLIC BANK CARIBBEAN PREMIER LEAGUE</p>
        <h1 id="sch-hero-title">
          <span class="sch-hero-title-line">CPL 2026 SCHEDULE,</span>
          <span class="sch-hero-title-line sch-accent">FIXTURES, DATES</span>
          <span class="sch-hero-title-line">AND VENUES</span>
        </h1>
        <p class="sch-hero-lead">Your complete guide to every CPL 2026 match. Check the full schedule, dates, times, venues and playoff fixtures. Filter by team, venue or stage to find exactly what you need.</p>
        <div class="sch-hero-actions">
          <a class="sch-btn sch-btn-primary" href="#next-match"><i data-lucide="zap" aria-hidden="true"></i> NEXT MATCH</a>
          <a class="sch-btn sch-btn-ghost" href="/assets/calendar/cpl-2026-schedule.ics" download><i data-lucide="calendar-plus" aria-hidden="true"></i> ADD TO CALENDAR</a>
        </div>
      </div>
      <div class="sch-hero-art" aria-hidden="true">
        <img
          class="sch-hero-trio"
          src="/assets/images/schedule/cpl-2026-schedule-hero-trio.webp"
          alt=""
          width="1227"
          height="907"
          loading="eager"
          fetchpriority="high"
          decoding="async"
        />
        <div class="sch-hero-trophy"><i data-lucide="trophy" aria-hidden="true"></i></div>
      </div>
    </div>
  </section>`;
}

function renderStatsStrip(model) {
  const s = model.stats;
  const items = [
    { icon: "calendar-days", label: "TOURNAMENT DATES", value: s.tournamentDates },
    { icon: "swords", label: "TOTAL MATCHES", value: String(s.totalMatches) },
    { icon: "trophy", label: "TEAMS", value: String(s.teams) },
    { icon: "map-pin", label: "VENUES", value: String(s.hostDestinations) }
  ];
  return `<section class="sch-stats" aria-label="CPL 2026 schedule overview">
    ${items.map((item) => `<div class="sch-stat">
      <i data-lucide="${item.icon}" aria-hidden="true"></i>
      <div><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></div>
    </div>`).join("")}
  </section>`;
}

function renderNextMatch(model, teams) {
  const match = model.nextMatch;
  if (!match) return "";
  const teamA = model.nextTeamA || teamByCode(teams, match.teamA);
  const teamB = model.nextTeamB || teamByCode(teams, match.teamB);
  return `<section class="sch-next" id="next-match" aria-labelledby="sch-next-title">
    <div class="sch-next-head">
      <div class="sch-next-brand">
        <span class="sch-next-logo" aria-hidden="true"><i data-lucide="sparkles"></i></span>
        <div>
          <p class="sch-next-kicker">CPL INSIDER</p>
          <h2 id="sch-next-title">NEXT CPL 2026 MATCH</h2>
        </div>
      </div>
      <span class="sch-match-pill">MATCH ${match.matchNumber}</span>
    </div>
    <div class="sch-next-card">
      <div class="sch-next-side sch-next-side-a">
        ${playerImg(model.nextPlayerA, "sch-next-player") || `<div class="sch-next-player-fallback"></div>`}
        <div class="sch-next-team">
          ${logoImg(teamA, 64)}
          <strong>${escapeHtml(teamA?.name || match.teamAName || match.displayFixtureA)}</strong>
        </div>
      </div>
      <div class="sch-next-centre">
        <span class="sch-vs">VS</span>
        <time datetime="${escapeHtml(match.dateISO)}">${escapeHtml(match.longDate || match.tableDate)} &middot; ${escapeHtml(match.localTime)} LOCAL</time>
        <p>${escapeHtml(match.venue)}</p>
      </div>
      <div class="sch-next-side sch-next-side-b">
        <div class="sch-next-team">
          ${logoImg(teamB, 64)}
          <strong>${escapeHtml(teamB?.name || match.teamBName || match.displayFixtureB)}</strong>
        </div>
        ${playerImg(model.nextPlayerB, "sch-next-player") || `<div class="sch-next-player-fallback"></div>`}
      </div>
    </div>
    <div class="sch-next-actions">
      <a class="sch-btn sch-btn-primary" href="/fixtures/${escapeHtml(match.slug)}/">MATCH PREVIEW</a>
      <a class="sch-btn sch-btn-ghost" href="/teams/">TEAM SQUADS</a>
      <a class="sch-btn sch-btn-ghost" href="/venues/">VENUE GUIDE</a>
      <a class="sch-btn sch-btn-live" href="/live-score/"><i data-lucide="radio" aria-hidden="true"></i> LIVE SCORE</a>
    </div>
  </section>`;
}

function renderFilterBar(model, teams) {
  const monthTabs = [
    { id: "all", label: "ALL MATCHES" },
    ...model.months.map((month) => ({ id: month, label: month.toUpperCase() })),
    { id: "by-team", label: "BY TEAM" },
    { id: "by-venue", label: "BY VENUE" },
    { id: "playoffs", label: "PLAYOFFS" }
  ];
  return `<div class="sch-filter-bar" data-sch-tabs>
    <div class="sch-tabs" role="tablist" aria-label="Schedule filters">
      ${monthTabs.map((tab, index) => `<button type="button" class="sch-tab${index === 0 ? " is-active" : ""}" role="tab" data-sch-tab="${escapeHtml(tab.id)}" aria-selected="${index === 0 ? "true" : "false"}">${escapeHtml(tab.label)}</button>`).join("")}
    </div>
    <label class="sch-timezone-select">
      <span class="visually-hidden">Timezone display</span>
      <select data-sch-timezone aria-label="Timezone display">
        <option value="local">VENUE LOCAL TIME</option>
        <option value="gmt">GMT</option>
        <option value="bst">BST</option>
        <option value="est">EST</option>
        <option value="ist">IST</option>
        <option value="pkt">PKT</option>
        <option value="aest">AEST</option>
      </select>
    </label>
  </div>`;
}

function renderTeamChip(team, code, size = 28) {
  if (!team && !code) {
    return `<span class="sch-fixture-chip sch-fixture-tbc"><span class="sch-code-badge">TBC</span><b>TBC</b></span>`;
  }
  if (!team) {
    return `<span class="sch-fixture-chip"><span class="sch-code-badge">${escapeHtml(code)}</span><b>${escapeHtml(code)}</b></span>`;
  }
  return `<span class="sch-fixture-chip">
    <img src="${escapeHtml(team.logo || "")}" alt="" width="${size}" height="${size}" loading="lazy" />
    <b>${escapeHtml(team.code || code)}</b>
  </span>`;
}

function renderTableRow(row, teams) {
  const teamA = teamByCode(teams, row.teamA);
  const teamB = teamByCode(teams, row.teamB);
  const statusClass = row.stage === "final" ? "is-final" : row.stage === "playoff" ? "is-playoff" : "is-upcoming";
  return `<tr class="sch-row" data-month="${escapeHtml(row.monthFilter)}" data-team-a="${escapeHtml(row.teamA || "")}" data-team-b="${escapeHtml(row.teamB || "")}" data-venue="${escapeHtml(row.venueShort)}" data-stage="${escapeHtml(row.stage)}" data-match="${escapeHtml(String(row.matchNumber))}" data-date-iso="${escapeHtml(row.dateISO || "")}" data-local-time="${escapeHtml(row.localTime || "")}" data-utc-offset="${escapeHtml(String(row.utcOffsetHours))}">
    <td class="sch-col-match"><span>${row.matchNumber}</span></td>
    <td class="sch-col-date"><time datetime="${escapeHtml(row.dateISO)}" data-sch-date>${escapeHtml(row.tableDate)}</time></td>
    <td class="sch-col-fixture">
      <div class="sch-fixture-pair">
        ${renderTeamChip(teamA, row.displayFixtureA)}
        <span class="sch-fixture-vs">vs</span>
        ${renderTeamChip(teamB, row.displayFixtureB)}
      </div>
    </td>
    <td class="sch-col-venue">${escapeHtml(row.venue)}</td>
    <td class="sch-col-time" data-sch-time>${escapeHtml(row.localTime)}</td>
    <td class="sch-col-status"><span class="sch-status ${statusClass}">${escapeHtml(row.statusLabel)}</span></td>
    <td class="sch-col-action"><a href="/fixtures/${escapeHtml(row.slug)}/">${escapeHtml(row.actionLabel)} <i data-lucide="arrow-right" aria-hidden="true"></i></a></td>
  </tr>`;
}

function renderMobileFixture(row, teams) {
  const teamA = teamByCode(teams, row.teamA);
  const teamB = teamByCode(teams, row.teamB);
  const statusClass = row.stage === "final" ? "is-final" : row.stage === "playoff" ? "is-playoff" : "is-upcoming";
  return `<a class="sch-mobile-fixture" href="/fixtures/${escapeHtml(row.slug)}/" data-sch-mobile-entry data-month="${escapeHtml(row.monthFilter)}" data-team-a="${escapeHtml(row.teamA || "")}" data-team-b="${escapeHtml(row.teamB || "")}" data-venue="${escapeHtml(row.venueShort)}" data-stage="${escapeHtml(row.stage)}" data-date-iso="${escapeHtml(row.dateISO || "")}" data-local-time="${escapeHtml(row.localTime || "")}" data-utc-offset="${escapeHtml(String(row.utcOffsetHours))}">
    <span class="sch-mobile-match-number">MATCH ${escapeHtml(String(row.matchNumber))}</span>
    <time datetime="${escapeHtml(row.dateISO)}" data-sch-date>${escapeHtml(row.tableDate)}</time>
    <span class="sch-mobile-fixture-pair">
      ${renderTeamChip(teamA, row.displayFixtureA, 34)}
      <span class="sch-fixture-vs">VS</span>
      ${renderTeamChip(teamB, row.displayFixtureB, 34)}
    </span>
    <strong class="sch-mobile-time" data-sch-time>${escapeHtml(row.localTime)}</strong>
    <span class="sch-mobile-venue">${escapeHtml(row.venue)}</span>
    <span class="sch-status ${statusClass}">${escapeHtml(row.statusLabel)}</span>
    <i class="sch-mobile-arrow" data-lucide="arrow-right" aria-hidden="true"></i>
  </a>`;
}

function renderCompleteSchedule(model, teams) {
  const teamOptions = teams.map((team) => `<option value="${escapeHtml(team.code)}">${escapeHtml(team.name)}</option>`).join("");
  const venueOptions = model.venues.map((venue) => `<option value="${escapeHtml(venue.name)}">${escapeHtml(venue.name)}</option>`).join("");
  const body = model.monthGroups.map((group) => {
    const rows = group.rows.map((row) => renderTableRow(row, teams)).join("");
    return `<tbody class="sch-month-group" data-month-group="${escapeHtml(group.rows[0]?.monthFilter || "")}">
      <tr class="sch-month-heading"><td colspan="7">${escapeHtml(group.label)}</td></tr>
      ${rows}
    </tbody>`;
  }).join("");
  const mobileGroups = model.monthGroups.map((group) => {
    const month = group.rows[0]?.monthFilter || "";
    return `<details class="sch-mobile-month" data-mobile-month-group="${escapeHtml(month)}">
      <summary>
        <span>${escapeHtml(group.label)}</span>
        <span>${group.rows.length} MATCHES <i data-lucide="chevron-down" aria-hidden="true"></i></span>
      </summary>
      <div class="sch-mobile-fixture-list">
        ${group.rows.map((row) => renderMobileFixture(row, teams)).join("")}
      </div>
    </details>`;
  }).join("");

  return `<section class="sch-table-section" id="complete-schedule" aria-labelledby="sch-table-title" data-sch-schedule>
    ${renderFilterBar(model, teams)}
    <div class="sch-table-head">
      <h2 id="sch-table-title">COMPLETE CPL 2026 SCHEDULE</h2>
      <div class="sch-selects">
        <label><span class="visually-hidden">Filter by team</span>
          <select data-sch-filter="team" aria-label="Filter by team">
            <option value="all">ALL TEAMS</option>
            ${teamOptions}
          </select>
        </label>
        <label><span class="visually-hidden">Filter by venue</span>
          <select data-sch-filter="venue" aria-label="Filter by venue">
            <option value="all">ALL VENUES</option>
            ${venueOptions}
          </select>
        </label>
        <label><span class="visually-hidden">Filter by stage</span>
          <select data-sch-filter="stage" aria-label="Filter by stage">
            <option value="all">ALL STAGES</option>
            <option value="league">LEAGUE</option>
            <option value="playoff">PLAYOFFS</option>
            <option value="final">FINAL</option>
          </select>
        </label>
      </div>
    </div>
    <div class="sch-table-wrap">
      <table class="sch-table">
        <thead>
          <tr>
            <th scope="col">MATCH</th>
            <th scope="col">DATE</th>
            <th scope="col">FIXTURE</th>
            <th scope="col">VENUE</th>
            <th scope="col" data-sch-time-heading>TIME (LOCAL)</th>
            <th scope="col">STATUS</th>
            <th scope="col">ACTION</th>
          </tr>
        </thead>
        ${body}
      </table>
    </div>
    <div class="sch-mobile-schedule" aria-label="CPL 2026 fixtures grouped by month">
      ${mobileGroups}
    </div>
    <div class="sch-table-footer">
      <a class="sch-btn sch-btn-ghost" href="#complete-schedule"><i data-lucide="list" aria-hidden="true"></i> VIEW FULL SCHEDULE</a>
    </div>
    <p class="sch-filter-empty" data-sch-empty hidden>No fixtures match the selected filters.</p>
  </section>`;
}

function renderScheduleByTeam(model) {
  return `<section class="sch-by-team" id="by-team" aria-labelledby="sch-by-team-title">
    <div class="sch-section-head">
      <h2 id="sch-by-team-title">CPL 2026 SCHEDULE BY TEAM</h2>
      <a href="/teams/">VIEW ALL TEAMS <i data-lucide="arrow-right" aria-hidden="true"></i></a>
    </div>
    <div class="sch-team-grid">
      ${model.teams.map((team) => `<a class="sch-team-tile" href="/teams/${escapeHtml(team.slug)}/fixtures/" style="--team-accent:${escapeHtml(team.accent || "#ffd400")}">
        <span class="sch-team-tile-logo"><img src="${escapeHtml(team.logo || "")}" alt="${escapeHtml(team.name)} logo" width="72" height="72" loading="lazy" /></span>
        <strong>${escapeHtml(team.name.toUpperCase())}</strong>
        <small>${team.matchCount} matches</small>
      </a>`).join("")}
    </div>
  </section>`;
}

function renderVenueAndRoad(model) {
  const venues = model.venues.slice(0, 6);
  return `<section class="sch-venue-road" aria-label="Fixtures by venue and road to final">
    <div class="sch-by-venue" id="by-venue">
      <div class="sch-section-head">
        <h2>FIXTURES BY VENUE &amp; HOST DESTINATION</h2>
        <a href="/venues/">VIEW ALL VENUES <i data-lucide="arrow-right" aria-hidden="true"></i></a>
      </div>
      <div class="sch-venue-strip-wrap">
        <div class="sch-venue-strip" id="sch-venue-track">
          ${venues.map((venue) => `<a class="sch-venue-card" href="/venues/${escapeHtml(venue.slug)}/fixtures/">
            <img src="${escapeHtml(venue.image || "")}" alt="${escapeHtml(venue.name)}" width="220" height="140" loading="lazy" />
            <div>
              <strong>${escapeHtml(venue.name.toUpperCase())}</strong>
              <span>${escapeHtml((venue.location || "").toUpperCase())}</span>
              <b>${venue.matchCount} MATCHES</b>
            </div>
          </a>`).join("")}
        </div>
        <button type="button" class="sch-scroll-next" data-scroll-next="sch-venue-track" aria-label="Scroll venues">
          <i data-lucide="chevron-right" aria-hidden="true"></i>
        </button>
      </div>
    </div>
    <div class="sch-road" id="playoffs" aria-labelledby="sch-road-title">
      <div class="sch-section-head">
        <h2 id="sch-road-title">ROAD TO THE CPL 2026 FINAL</h2>
        <a href="#complete-schedule" data-sch-jump="playoffs">VIEW PLAYOFFS <i data-lucide="arrow-right" aria-hidden="true"></i></a>
      </div>
      <ol class="sch-road-path">
        ${model.road.map((step, index) => `<li class="sch-road-step${step.active ? " is-active" : ""}">
          <span class="sch-road-node">${index + 1}</span>
          <strong>${escapeHtml(step.label)}</strong>
          <span>${escapeHtml(step.date)}</span>
        </li>`).join("")}
      </ol>
    </div>
  </section>`;
}

function renderTools(model) {
  const nextCalendar = model.nextMatch?.slug
    ? `/assets/calendar/${escapeHtml(model.nextMatch.slug)}.ics`
    : "/assets/calendar/cpl-2026-schedule.ics";
  return `<section class="sch-tools" id="calendar-tools" aria-label="Timezone and calendar tools">
    <article class="sch-tool-card sch-timezone-card">
      <p class="sch-section-eyebrow">FOLLOW EVERY MATCH</p>
      <h2>MATCH TIMES IN YOUR TIMEZONE</h2>
      <div class="sch-tz-grid">
        ${model.timezones.map((tz, index) => `<button type="button" class="sch-tz-chip${index === 0 ? " is-active" : ""}" data-sch-tz="${escapeHtml(tz.code)}">
          <span>${escapeHtml(tz.label)}</span>
          <strong>${escapeHtml(tz.value)}</strong>
        </button>`).join("")}
      </div>
    </article>
    <article class="sch-tool-card sch-calendar-card">
      <p class="sch-section-eyebrow">SAVE THE DATES</p>
      <h2>CALENDAR TOOLS</h2>
      <div class="sch-calendar-actions">
        <a class="sch-btn sch-btn-primary" href="/assets/calendar/cpl-2026-schedule.ics" download><i data-lucide="calendar-plus" aria-hidden="true"></i> ADD FULL SCHEDULE TO CALENDAR</a>
        <a class="sch-btn sch-btn-ghost" href="${nextCalendar}" download><i data-lucide="calendar" aria-hidden="true"></i> ADD THIS MATCH TO CALENDAR</a>
      </div>
      <p class="sch-tool-note">Downloads use the standard .ics calendar format. Confirm official kick-off times before travel.</p>
    </article>
  </section>`;
}

function renderFaqExplore(model) {
  const explore = [
    { href: "/teams/", icon: "users", title: "TEAMS & SQUADS", text: "Explore all teams" },
    { href: "/points-table/", icon: "table", title: "POINTS TABLE", text: "Live standings" },
    { href: "/live-score/", icon: "activity", title: "LIVE SCORES", text: "Ball-by-ball updates" },
    { href: "/venues/", icon: "map-pin", title: "VENUES", text: "Stadium guides" },
    { href: "/news/", icon: "newspaper", title: "NEWS", text: "Latest updates" },
    { href: "/tickets/", icon: "ticket", title: "TICKETS", text: "Book tickets" }
  ];
  return `<section class="sch-faq-explore" aria-label="FAQ and explore more">
    <article class="sch-faq-card" aria-labelledby="sch-faq-title">
      <p class="sch-section-eyebrow">PLAN YOUR TOURNAMENT</p>
      <h2 id="sch-faq-title">FREQUENTLY ASKED QUESTIONS</h2>
      <div class="sch-faq-list">
        ${model.faqs.map((faq, index) => `<details class="sch-faq-item"${index === 0 ? " open" : ""}>
          <summary>${escapeHtml(faq.question)}</summary>
          <p>${escapeHtml(faq.answer)}</p>
        </details>`).join("")}
      </div>
      <a class="sch-btn sch-btn-ghost" href="/faq/">VIEW ALL FAQS <i data-lucide="arrow-right" aria-hidden="true"></i></a>
    </article>
    <article class="sch-explore-card" aria-labelledby="sch-explore-title">
      <p class="sch-section-eyebrow">KEEP EXPLORING</p>
      <h2 id="sch-explore-title">EXPLORE MORE CPL 2026</h2>
      <div class="sch-explore-grid">
        ${explore.map((item) => `<a class="sch-explore-item" href="${item.href}">
          <i data-lucide="${item.icon}" aria-hidden="true"></i>
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.text)}</span>
        </a>`).join("")}
      </div>
    </article>
  </section>`;
}

function renderScheduleMeta(model, source) {
  const sourceLink = source?.url
    ? `<a href="${escapeHtml(source.url)}" rel="noopener noreferrer">Official CPL schedule announcement</a>`
    : "Official CPL schedule";
  return `<div class="sch-meta-bar">
    <p><i data-lucide="info" aria-hidden="true"></i> All times are local. Schedule subject to change.</p>
    <p><i data-lucide="badge-check" aria-hidden="true"></i> Source: ${sourceLink}</p>
    <p><i data-lucide="refresh-cw" aria-hidden="true"></i> Last Updated: ${escapeHtml(model.stats.lastUpdated)}</p>
  </div>`;
}

function renderSchedulePage(data) {
  const model = buildSchedulePageModel({
    site: data.site,
    teams: data.teams,
    fixtures: data.fixtures,
    venues: data.venues,
    faqs: data.faqs,
    players: data.players
  });
  const fixtureSource = data.sourcesById?.get("official-cpl-2026-fixtures");

  return `<main class="sch-page">
    ${renderScheduleHero(model)}
    ${renderStatsStrip(model)}
    ${renderNextMatch(model, data.teams)}
    ${renderCompleteSchedule(model, data.teams)}
    ${renderScheduleByTeam(model)}
    ${renderVenueAndRoad(model)}
    ${renderTools(model)}
    ${renderFaqExplore(model)}
    ${renderScheduleMeta(model, fixtureSource)}
  </main>`;
}

module.exports = {
  renderSchedulePage,
  renderCompleteSchedule,
  renderNextMatch,
  renderScheduleByTeam,
  renderVenueAndRoad
};
