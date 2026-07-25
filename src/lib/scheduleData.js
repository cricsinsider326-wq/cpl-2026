/**
 * Pure schedule helpers for the CPL 2026 Fixtures / Schedule page.
 * No DOM - unit-testable against real fixture JSON.
 */

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PLAYOFF_KEYWORDS = ["eliminator", "qualifier", "final", "semi", "playoff"];

function isPlayoffMatch(match) {
  if (!match) return false;
  if (!match.teamA && !match.teamB) return true;
  const haystack = `${match.match || ""} ${match.teamAName || ""} ${match.teamBName || ""}`.toLowerCase();
  return PLAYOFF_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

function isFinalMatch(match) {
  if (!match) return false;
  const haystack = `${match.match || ""} ${match.teamAName || ""}`.toLowerCase();
  return /\bfinal\b/.test(haystack) && !/qualifier|eliminator/.test(haystack);
}

function stageOfMatch(match) {
  if (isFinalMatch(match)) return "final";
  if (isPlayoffMatch(match)) return "playoff";
  return "league";
}

function statusLabel(match) {
  const stage = stageOfMatch(match);
  if (stage === "final") return "FINAL";
  if (stage === "playoff") return "PLAYOFF";
  return "UPCOMING";
}

function actionLabel(match) {
  return stageOfMatch(match) === "league" ? "PREVIEW" : "INFO";
}

function parseMatchDate(match) {
  if (!match?.dateISO) return null;
  const [year, month, day] = match.dateISO.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day, iso: match.dateISO };
}

function formatTableDate(match) {
  const parsed = parseMatchDate(match);
  if (!parsed) return match.dateText || match.date || "";
  const weekday = match.day || "";
  const monthShort = MONTH_NAMES[parsed.month - 1]?.slice(0, 3) || "";
  return `${weekday}, ${monthShort} ${parsed.day}`.replace(/^,\s*/, "").trim();
}

function formatLongDate(match) {
  const parsed = parseMatchDate(match);
  if (!parsed) return match.dateText || match.date || "";
  const month = MONTH_NAMES[parsed.month - 1] || "";
  const weekday = match.day || "";
  return `${weekday}, ${month.slice(0, 3)} ${parsed.day}, ${parsed.year}`.replace(/^,\s*/, "").trim();
}

function formatLocalTime(time) {
  if (!time) return "";
  const cleaned = String(time).trim();
  if (/local/i.test(cleaned)) return cleaned;
  // "7 PM" -> "7:00 PM"
  const match = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return cleaned;
  const hour = match[1];
  const minutes = match[2] || "00";
  const meridiem = match[3].toUpperCase();
  return `${hour}:${minutes} ${meridiem}`;
}

function parseLocalTime(time) {
  const cleaned = formatLocalTime(time);
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();
  if (meridiem === "AM" && hour === 12) hour = 0;
  if (meridiem === "PM" && hour !== 12) hour += 12;
  return { hour, minute };
}

function localUtcOffsetHours(match) {
  const location = `${match?.hostCountry || ""} ${match?.venue || ""}`.toLowerCase();
  return location.includes("jamaica") ? -5 : -4;
}

function fixtureUtcTimestamp(match) {
  const date = parseMatchDate(match);
  const time = parseLocalTime(match?.time || match?.localTime);
  if (!date || !time) return null;
  const sourceOffset = localUtcOffsetHours(match);
  return Date.UTC(date.year, date.month - 1, date.day, time.hour - sourceOffset, time.minute);
}

function formatClock(hour, minute) {
  const meridiem = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${meridiem}`;
}

function formatFixtureForOffset(match, targetOffsetHours) {
  const utcTimestamp = fixtureUtcTimestamp(match);
  if (utcTimestamp === null) {
    return {
      dateText: formatTableDate(match),
      longDate: formatLongDate(match),
      time: formatLocalTime(match?.time || match?.localTime)
    };
  }
  const shifted = new Date(utcTimestamp + (targetOffsetHours * 60 * 60 * 1000));
  const weekday = WEEKDAY_NAMES[shifted.getUTCDay()];
  const month = MONTH_NAMES[shifted.getUTCMonth()];
  const day = shifted.getUTCDate();
  const year = shifted.getUTCFullYear();
  return {
    dateText: `${weekday}, ${month.slice(0, 3)} ${day}`,
    longDate: `${weekday}, ${month.slice(0, 3)} ${day}, ${year}`,
    time: formatClock(shifted.getUTCHours(), shifted.getUTCMinutes())
  };
}

function monthKey(match) {
  const parsed = parseMatchDate(match);
  if (!parsed) return "Unknown";
  return `${MONTH_NAMES[parsed.month - 1]} ${parsed.year}`;
}

function monthFilterKey(match) {
  const parsed = parseMatchDate(match);
  if (!parsed) return "";
  return MONTH_NAMES[parsed.month - 1].toLowerCase();
}

function venueShortName(venue) {
  if (!venue) return "";
  return String(venue).split(",")[0].trim();
}

function venueLocation(venue, hostCountry) {
  if (hostCountry) return hostCountry;
  if (!venue) return "";
  const parts = String(venue).split(",");
  return parts.length > 1 ? parts.slice(1).join(",").trim() : "";
}

/**
 * Enrich fixtures with match numbers, stage, status and display fields.
 */
function buildScheduleRows(fixtures = []) {
  return fixtures.map((match, index) => {
    const stage = stageOfMatch(match);
    const number = index + 1;
    const teamACode = match.teamA || stageCodeLabel(match, "A");
    const teamBCode = match.teamB || stageCodeLabel(match, "B");
    return {
      ...match,
      matchNumber: number,
      stage,
      statusLabel: statusLabel(match),
      actionLabel: actionLabel(match),
      tableDate: formatTableDate(match),
      longDate: formatLongDate(match),
      localTime: formatLocalTime(match.time),
      utcOffsetHours: localUtcOffsetHours(match),
      monthKey: monthKey(match),
      monthFilter: monthFilterKey(match),
      venueShort: venueShortName(match.venue),
      venueLocation: venueLocation(match.venue, match.hostCountry),
      teamACode,
      teamBCode,
      isPlayoff: stage !== "league",
      displayFixtureA: match.teamA || teamACode,
      displayFixtureB: match.teamB || teamBCode || "TBC"
    };
  });
}

function stageCodeLabel(match, side) {
  const name = `${match.match || ""} ${match.teamAName || ""}`.toLowerCase();
  if (/\bfinal\b/.test(name) && !/qualifier|eliminator/.test(name)) {
    return side === "A" ? "FINAL" : "TBC";
  }
  if (name.includes("eliminator")) return side === "A" ? "E" : "TBC";
  if (name.includes("qualifier 1") || name.includes("qualifier one") || name.includes("q1")) {
    return side === "A" ? "Q1" : "TBC";
  }
  if (name.includes("qualifier 2") || name.includes("qualifier two") || name.includes("q2")) {
    return side === "A" ? "Q2" : "TBC";
  }
  if (name.includes("qualifier")) return side === "A" ? "Q" : "TBC";
  return side === "A" ? (match.teamAName || "TBC") : "TBC";
}

function getNextMatch(fixtures = []) {
  if (!fixtures.length) return null;
  const rows = buildScheduleRows(fixtures);
  const upcoming = rows.find((row) => row.stage === "league") || rows[0];
  return upcoming;
}

function groupByMonth(rows = []) {
  const groups = [];
  const index = new Map();
  for (const row of rows) {
    const key = row.monthKey || "Unknown";
    if (!index.has(key)) {
      const group = { key, label: key.toUpperCase(), rows: [] };
      index.set(key, group);
      groups.push(group);
    }
    index.get(key).rows.push(row);
  }
  return groups;
}

function filterScheduleRows(rows = [], { month, team, venue, stage } = {}) {
  return rows.filter((row) => {
    if (month && month !== "all" && row.monthFilter !== month) return false;
    if (team && team !== "all") {
      const codes = [row.teamA, row.teamB].filter(Boolean);
      if (!codes.includes(team)) return false;
    }
    if (venue && venue !== "all") {
      const hay = `${row.venue || ""} ${row.venueShort || ""}`.toLowerCase();
      if (!hay.includes(String(venue).toLowerCase()) && row.venue !== venue) return false;
    }
    if (stage && stage !== "all") {
      if (stage === "playoffs" && row.stage === "league") return false;
      if (stage === "league" && row.stage !== "league") return false;
      if (stage === "final" && row.stage !== "final") return false;
    }
    return true;
  });
}

function teamScheduleSummary(teams = [], fixtures = []) {
  const rows = buildScheduleRows(fixtures);
  return teams.map((team) => {
    const teamRows = rows.filter((row) => row.teamA === team.code || row.teamB === team.code);
    return {
      code: team.code,
      name: team.name,
      slug: team.slug,
      logo: team.logo,
      accent: team.accent,
      country: team.country,
      matchCount: teamRows.length,
      nextMatch: teamRows[0] || null
    };
  });
}

function venueScheduleSummary(venues = [], fixtures = []) {
  const rows = buildScheduleRows(fixtures);
  return venues.map((venue) => {
    const venueRows = rows.filter((row) => {
      const short = venueShortName(row.venue);
      return short === venue.name || (row.venue || "").startsWith(venue.name);
    });
    return {
      name: venue.name,
      slug: venue.slug,
      location: venue.location,
      image: venue.image,
      matchCount: venueRows.length,
      summary: venue.summary
    };
  }).filter((item) => item.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount || a.name.localeCompare(b.name));
}

function hostDestinationCount(fixtures = []) {
  const hosts = new Set(
    fixtures.map((match) => match.hostCountry).filter(Boolean)
  );
  return hosts.size;
}

function finalVenue(fixtures = []) {
  const rows = buildScheduleRows(fixtures);
  const final = rows.find((row) => row.stage === "final");
  if (!final) return { name: "TBC", location: "" };
  return {
    name: final.venueShort || venueShortName(final.venue) || "TBC",
    location: final.venueLocation || final.hostCountry || "",
    full: final.venue || ""
  };
}

function tournamentDateRange(site = {}, fixtures = []) {
  if (site.startDate && site.endDate) {
    const start = formatIsoRangePart(site.startDate);
    const end = formatIsoRangePart(site.endDate);
    return `${start} - ${end}`;
  }
  if (!fixtures.length) return "TBC";
  const first = fixtures[0];
  const last = fixtures[fixtures.length - 1];
  return `${formatTableDate(first)} - ${formatTableDate(last)}`;
}

function formatIsoRangePart(iso) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-").map(Number);
  const monthShort = MONTH_NAMES[month - 1]?.slice(0, 3) || "";
  return `${monthShort.toUpperCase()} ${day}, ${year}`;
}

function roadToFinal(fixtures = []) {
  const rows = buildScheduleRows(fixtures);
  const league = rows.filter((row) => row.stage === "league");
  const eliminator = rows.find((row) => /eliminator/i.test(row.match || ""));
  const q1 = rows.find((row) => /qualifier 1|qualifier one/i.test(row.match || ""));
  const q2 = rows.find((row) => /qualifier 2|qualifier two/i.test(row.match || ""));
  const final = rows.find((row) => row.stage === "final");

  const leagueStart = league[0];
  const leagueEnd = league[league.length - 1];

  return [
    {
      id: "league",
      label: "LEAGUE STAGE",
      date: leagueStart && leagueEnd
        ? `${shortMonthDay(leagueStart)} - ${shortMonthDay(leagueEnd)}`
        : "TBC",
      active: false
    },
    {
      id: "eliminator",
      label: "ELIMINATOR",
      date: eliminator ? shortMonthDay(eliminator) : "TBC",
      active: false
    },
    {
      id: "q1",
      label: "QUALIFIER 1",
      date: q1 ? shortMonthDay(q1) : "TBC",
      active: false
    },
    {
      id: "q2",
      label: "QUALIFIER 2",
      date: q2 ? shortMonthDay(q2) : "TBC",
      active: false
    },
    {
      id: "final",
      label: "FINAL",
      date: final ? shortMonthDay(final) : "TBC",
      active: true
    }
  ];
}

function shortMonthDay(match) {
  const parsed = parseMatchDate(match);
  if (!parsed) return match.date || "";
  return `${MONTH_NAMES[parsed.month - 1].slice(0, 3).toUpperCase()} ${parsed.day}`;
}

function scheduleStats(site = {}, teams = [], fixtures = [], venues = []) {
  const final = finalVenue(fixtures);
  return {
    tournamentDates: tournamentDateRange(site, fixtures),
    teams: teams.length || site.stats?.teams || 0,
    totalMatches: fixtures.length || site.stats?.matches || 0,
    hostDestinations: hostDestinationCount(fixtures) || venues.length || 0,
    finalVenue: final.name,
    finalVenueLocation: final.location,
    lastUpdated: site.lastUpdated || site.buildUpdated || ""
  };
}

function timezoneSamples(match) {
  const sourceOffset = localUtcOffsetHours(match);
  const localLabel = sourceOffset === -5 ? "LOCAL (EST)" : "LOCAL (AST)";
  const localValue = `${formatTableDate(match)}, ${formatLocalTime(match?.time || "7 PM")}`;
  const zones = [
    { code: "local", label: localLabel, offset: null },
    { code: "gmt", label: "GMT", offset: 0 },
    { code: "bst", label: "BST", offset: 1 },
    { code: "est", label: "EST", offset: -5 },
    { code: "ist", label: "IST", offset: 5.5 },
    { code: "pkt", label: "PKT", offset: 5 },
    { code: "aest", label: "AEST", offset: 10 }
  ];
  return zones.map((zone) => {
    if (zone.offset === null) return { ...zone, value: localValue };
    const shifted = formatFixtureForOffset(match, zone.offset);
    return { ...zone, value: `${shifted.dateText}, ${shifted.time}` };
  });
}

function scheduleFaqs(faqs = []) {
  const preferred = [
    /what date does cpl/i,
    /complete cpl 2026 schedule|where can i find the complete/i,
    /what time do cpl matches/i,
    /playoffs be played|where will the cpl 2026 playoffs/i,
    /add.*calendar|calendar/i,
    /fixtures change|can cpl fixtures/i,
    /when does cpl 2026 start/i,
    /how many matches/i,
    /final be played/i
  ];
  const scored = faqs.map((faq, index) => {
    const text = `${faq.question} ${faq.answer}`;
    const score = preferred.reduce((sum, pattern, rank) => (pattern.test(text) ? sum + (20 - rank) : sum), 0);
    return { faq, score, index };
  });
  const picked = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 6)
    .map((item) => item.faq);
  if (picked.length >= 4) return picked;
  return faqs.slice(0, 6);
}

function buildSchedulePageModel({ site, teams, fixtures, venues, faqs = [], players = [] }) {
  const rows = buildScheduleRows(fixtures);
  const next = getNextMatch(fixtures);
  const nextTeamA = teams.find((team) => team.code === next?.teamA) || null;
  const nextTeamB = teams.find((team) => team.code === next?.teamB) || null;
  const playerFor = (teamCode) => {
    if (!teamCode) return null;
    const preferred = ["nicholas-pooran", "andre-russell", "shai-hope", "alzarri-joseph", "kieron-pollard", "shimron-hetmyer"];
    const teamPlayers = players.filter((player) => player.teamCode === teamCode || player.team === teams.find((t) => t.code === teamCode)?.name);
    return preferred
      .map((slug) => teamPlayers.find((player) => player.slug === slug))
      .find(Boolean) || teamPlayers.find((player) => player.heroPhoto || player.photo) || null;
  };

  return {
    stats: scheduleStats(site, teams, fixtures, venues),
    nextMatch: next,
    nextTeamA,
    nextTeamB,
    nextPlayerA: playerFor(next?.teamA),
    nextPlayerB: playerFor(next?.teamB),
    rows,
    monthGroups: groupByMonth(rows),
    teams: teamScheduleSummary(teams, fixtures),
    venues: venueScheduleSummary(venues, fixtures),
    road: roadToFinal(fixtures),
    timezones: timezoneSamples(next),
    faqs: scheduleFaqs(faqs),
    months: [...new Set(rows.map((row) => row.monthFilter).filter(Boolean))]
  };
}

module.exports = {
  actionLabel,
  buildSchedulePageModel,
  buildScheduleRows,
  filterScheduleRows,
  finalVenue,
  fixtureUtcTimestamp,
  formatFixtureForOffset,
  formatLocalTime,
  formatLongDate,
  formatTableDate,
  getNextMatch,
  groupByMonth,
  hostDestinationCount,
  isFinalMatch,
  isPlayoffMatch,
  localUtcOffsetHours,
  monthKey,
  parseLocalTime,
  roadToFinal,
  scheduleFaqs,
  scheduleStats,
  stageOfMatch,
  statusLabel,
  teamScheduleSummary,
  timezoneSamples,
  tournamentDateRange,
  venueScheduleSummary,
  venueShortName
};
