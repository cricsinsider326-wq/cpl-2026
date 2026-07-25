const assert = require("assert");
const path = require("path");
const { buildCalendar } = require("../src/lib/calendar");
const { loadTournamentData } = require("../src/lib/tournamentData");

const root = path.resolve(__dirname, "..");
const data = loadTournamentData(root);
const generatedAt = Date.UTC(2026, 6, 23, 12, 0);
const calendar = buildCalendar(data.fixtures, data.site, { generatedAt });
const eventCount = (calendar.match(/BEGIN:VEVENT/g) || []).length;

assert.ok(calendar.startsWith("BEGIN:VCALENDAR\r\n"), "calendar must use the VCALENDAR envelope");
assert.ok(calendar.endsWith("END:VCALENDAR\r\n"), "calendar must close with a trailing CRLF");
assert.strictEqual(eventCount, data.fixtures.length, "full calendar must contain every fixture");
assert.ok(calendar.includes("DTSTART:20260807T230000Z"), "opening match must convert from AST to UTC");
assert.ok(calendar.includes("DTSTART:20260812T000000Z"), "Jamaica 7 PM fixture must convert from EST to UTC");
assert.ok(calendar.includes("URL:https://cplinsider.com/fixtures/"), "events must link to CPL Insider fixture pages");
assert.ok(!calendar.includes("\nBEGIN:VEVENT\n"), "calendar must not use bare LF line endings");
assert.ok(
  calendar.split("\r\n").every((line) => line.length <= 74),
  "calendar lines must be folded for broad client compatibility"
);

console.log(`Calendar tests passed: ${eventCount} fixture events with UTC start times.`);
