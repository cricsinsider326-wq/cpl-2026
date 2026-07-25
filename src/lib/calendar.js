const { fixtureUtcTimestamp } = require("./scheduleData");

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatIcsUtc(timestamp) {
  const date = new Date(timestamp);
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    "T",
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
    "Z"
  ].join("");
}

function escapeIcs(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldIcsLine(line) {
  if (line.length <= 74) return [line];
  const parts = [line.slice(0, 74)];
  let remaining = line.slice(74);
  while (remaining.length) {
    parts.push(` ${remaining.slice(0, 73)}`);
    remaining = remaining.slice(73);
  }
  return parts;
}

function eventLines(match, site, generatedAt) {
  const start = fixtureUtcTimestamp(match);
  if (start === null) return [];
  const end = start + (4 * 60 * 60 * 1000);
  const siteUrl = (site.siteUrl || "https://cplinsider.com").replace(/\/$/, "");
  const matchUrl = `${siteUrl}/fixtures/${match.slug}/`;
  const title = `CPL 2026: ${match.match || `${match.teamAName || "TBC"} vs ${match.teamBName || "TBC"}`}`;
  return [
    "BEGIN:VEVENT",
    `UID:${escapeIcs(match.slug)}@cplinsider.com`,
    `DTSTAMP:${formatIcsUtc(generatedAt)}`,
    `DTSTART:${formatIcsUtc(start)}`,
    `DTEND:${formatIcsUtc(end)}`,
    `SUMMARY:${escapeIcs(title)}`,
    `LOCATION:${escapeIcs(match.venue)}`,
    `DESCRIPTION:${escapeIcs(`Fixture details and updates: ${matchUrl}`)}`,
    `URL:${matchUrl}`,
    "STATUS:CONFIRMED",
    "END:VEVENT"
  ];
}

function buildCalendar(fixtures, site, { name = "CPL 2026 Schedule", generatedAt = Date.now() } = {}) {
  const events = fixtures.flatMap((match) => eventLines(match, site, generatedAt));
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CPL Insider//CPL 2026 Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(name)}`,
    "X-WR-TIMEZONE:UTC",
    ...events,
    "END:VCALENDAR",
  ];
  return `${lines.flatMap(foldIcsLine).join("\r\n")}\r\n`;
}

module.exports = {
  buildCalendar,
  escapeIcs,
  foldIcsLine,
  formatIcsUtc
};
