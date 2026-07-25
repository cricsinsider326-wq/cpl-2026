/**
 * Unit tests for pure schedule helpers against real fixture JSON.
 * Run: node scripts/test-schedule-data.js
 */
const path = require("path");
const assert = require("assert");
const { loadTournamentData } = require("../src/lib/tournamentData");
const {
  buildScheduleRows,
  filterScheduleRows,
  fixtureUtcTimestamp,
  getNextMatch,
  groupByMonth,
  hostDestinationCount,
  isPlayoffMatch,
  roadToFinal,
  scheduleStats,
  stageOfMatch,
  statusLabel,
  teamScheduleSummary,
  timezoneSamples,
  venueScheduleSummary,
  finalVenue
} = require("../src/lib/scheduleData");

const root = path.resolve(__dirname, "..");
const data = loadTournamentData(root);
const fixtures = data.fixtures;
const teams = data.teams;
const venues = data.venues;

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (error) {
    console.error(`  FAIL  ${name}`);
    console.error(`        ${error.message}`);
    process.exitCode = 1;
  }
}

console.log("scheduleData unit tests (real fixtures.json)");

test("loads real fixture dataset with league + playoff rows", () => {
  assert.ok(fixtures.length >= 30, `expected many fixtures, got ${fixtures.length}`);
  const playoffs = fixtures.filter(isPlayoffMatch);
  assert.ok(playoffs.length >= 4, `expected playoff rows, got ${playoffs.length}`);
  assert.ok(fixtures[0].teamA && fixtures[0].teamB, "opening match should have both teams");
});

test("buildScheduleRows assigns sequential match numbers and real team codes", () => {
  const rows = buildScheduleRows(fixtures);
  assert.strictEqual(rows.length, fixtures.length);
  assert.strictEqual(rows[0].matchNumber, 1);
  assert.strictEqual(rows[rows.length - 1].matchNumber, fixtures.length);
  assert.strictEqual(rows[0].teamACode, fixtures[0].teamA);
  assert.strictEqual(rows[0].teamBCode, fixtures[0].teamB);
  assert.ok(rows[0].venue.includes(fixtures[0].venue.split(",")[0]));
  assert.ok(rows[0].localTime);
  assert.ok(rows[0].tableDate);
});

test("month grouping splits August and September from real dateISO values", () => {
  const rows = buildScheduleRows(fixtures);
  const groups = groupByMonth(rows);
  const labels = groups.map((group) => group.key);
  assert.ok(labels.some((label) => /August 2026/i.test(label)), `missing August group: ${labels.join(", ")}`);
  assert.ok(labels.some((label) => /September 2026/i.test(label)), `missing September group: ${labels.join(", ")}`);
  const total = groups.reduce((sum, group) => sum + group.rows.length, 0);
  assert.strictEqual(total, fixtures.length);
});

test("stage and status labels for league vs playoff vs final", () => {
  const rows = buildScheduleRows(fixtures);
  const league = rows.find((row) => row.teamA && row.teamB);
  const final = rows.find((row) => stageOfMatch(row) === "final") || rows.find((row) => /final/i.test(row.match));
  const playoff = rows.find((row) => stageOfMatch(row) === "playoff");
  assert.ok(league, "league row required");
  assert.strictEqual(statusLabel(league), "UPCOMING");
  assert.ok(playoff, "playoff row required");
  assert.strictEqual(statusLabel(playoff), "PLAYOFF");
  assert.ok(final, "final row required");
  assert.strictEqual(statusLabel(final), "FINAL");
  assert.strictEqual(final.displayFixtureB, "TBC");
});

test("getNextMatch returns first real league fixture with venue and time", () => {
  const next = getNextMatch(fixtures);
  assert.ok(next);
  assert.strictEqual(next.teamA, fixtures[0].teamA);
  assert.strictEqual(next.teamB, fixtures[0].teamB);
  assert.ok(next.venue);
  assert.ok(next.localTime);
  assert.strictEqual(next.matchNumber, 1);
});

test("filterScheduleRows filters by team, month, and playoffs using real codes", () => {
  const rows = buildScheduleRows(fixtures);
  const sampleTeam = fixtures.find((match) => match.teamA)?.teamA;
  assert.ok(sampleTeam);
  const byTeam = filterScheduleRows(rows, { team: sampleTeam });
  assert.ok(byTeam.length > 0);
  assert.ok(byTeam.every((row) => row.teamA === sampleTeam || row.teamB === sampleTeam));

  const august = filterScheduleRows(rows, { month: "august" });
  assert.ok(august.length > 0);
  assert.ok(august.every((row) => row.monthFilter === "august"));

  const playoffs = filterScheduleRows(rows, { stage: "playoffs" });
  assert.ok(playoffs.length >= 4);
  assert.ok(playoffs.every((row) => row.stage !== "league"));
});

test("teamScheduleSummary counts only real team appearances", () => {
  const summary = teamScheduleSummary(teams, fixtures);
  assert.strictEqual(summary.length, teams.length);
  const tkr = summary.find((item) => item.code === "TKR");
  assert.ok(tkr, "TKR summary required");
  const manual = fixtures.filter((match) => match.teamA === "TKR" || match.teamB === "TKR").length;
  assert.strictEqual(tkr.matchCount, manual);
  assert.ok(tkr.matchCount > 0);
});

test("venueScheduleSummary uses real venue names and positive match counts", () => {
  const summary = venueScheduleSummary(venues, fixtures);
  assert.ok(summary.length > 0);
  summary.forEach((item) => {
    assert.ok(item.matchCount > 0, `${item.name} should have matches`);
    assert.ok(item.name);
  });
  const totalAssigned = summary.reduce((sum, item) => sum + item.matchCount, 0);
  assert.strictEqual(totalAssigned, fixtures.length);
});

test("scheduleStats and finalVenue derive from real data", () => {
  const stats = scheduleStats(data.site, teams, fixtures, venues);
  assert.strictEqual(stats.totalMatches, fixtures.length);
  assert.strictEqual(stats.teams, teams.length);
  assert.ok(stats.hostDestinations >= 1);
  assert.ok(hostDestinationCount(fixtures) >= 1);
  const final = finalVenue(fixtures);
  assert.ok(final.name);
  assert.ok(/Kensington|Oval|Barbados|Providence/i.test(`${final.name} ${final.full} ${final.location}`));
});

test("roadToFinal builds league + playoff path with real dates", () => {
  const road = roadToFinal(fixtures);
  assert.strictEqual(road.length, 5);
  assert.ok(/LEAGUE/i.test(road[0].label));
  assert.ok(/ELIMINATOR/i.test(road[1].label));
  assert.ok(/QUALIFIER 1/i.test(road[2].label));
  assert.ok(/QUALIFIER 2/i.test(road[3].label));
  assert.ok(/FINAL/i.test(road[4].label));
  assert.ok(road[4].active);
  assert.ok(road.every((step) => step.date && step.date !== "TBC"));
});

test("timezone conversion uses venue-local offsets and real rollover dates", () => {
  const opening = fixtures[0];
  assert.strictEqual(fixtureUtcTimestamp(opening), Date.UTC(2026, 7, 7, 23, 0));
  const samples = timezoneSamples(opening);
  assert.strictEqual(samples.find((item) => item.code === "gmt").value, "Fri, Aug 7, 11:00 PM");
  assert.strictEqual(samples.find((item) => item.code === "est").value, "Fri, Aug 7, 6:00 PM");
  assert.strictEqual(samples.find((item) => item.code === "ist").value, "Sat, Aug 8, 4:30 AM");

  const jamaica = fixtures.find((match) => /jamaica/i.test(`${match.hostCountry} ${match.venue}`));
  assert.ok(jamaica, "Jamaica fixture required");
  assert.strictEqual(
    fixtureUtcTimestamp(jamaica),
    Date.UTC(2026, 7, 12, 0, 0),
    "7 PM Jamaica local time should convert to midnight UTC"
  );
});

if (process.exitCode) {
  console.error(`\n${passed} passed before failure`);
  process.exit(1);
}

console.log(`\nAll ${passed} scheduleData tests passed.`);
