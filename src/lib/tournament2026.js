/**
 * Build the canonical CPL 2026 summary used by homepage components.
 * Counts are derived from the same collections that render the site.
 */
function createTournament2026({ site, teams, fixtures, venues }) {
  return Object.freeze({
    season: 2026,
    startDate: site.startDate,
    endDate: site.endDate,
    matchCount: fixtures.length,
    teamCount: teams.length,
    venueCount: venues.length,
    status: "upcoming",
    lastVerifiedAt: site.lastUpdated
  });
}

module.exports = { createTournament2026 };
