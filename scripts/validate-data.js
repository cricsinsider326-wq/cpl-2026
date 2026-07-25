const path = require("path");
const { loadTournamentData } = require("../src/lib/tournamentData");

const root = path.resolve(__dirname, "..");
const data = loadTournamentData(root);
const report = data.dataQuality;

console.log(`Data validation passed with status: ${report.overallStatus}`);
console.log(`Sources: ${report.summary.sources}`);
console.log(`Fixtures: ${report.summary.fixtures}`);
console.log(`Confirmed squads: ${report.summary.confirmedSquads}/${report.summary.totalSquads}`);
console.log(`Complete squads: ${report.summary.completeSquads}/${report.summary.totalSquads}`);
console.log(`Confirmed broadcast markets: ${report.summary.confirmedMarkets}/${report.summary.totalMarkets}`);
console.log(`Confirmed results: ${report.summary.confirmedResults}`);
console.log(`Confirmed 2026 player stats: ${report.summary.confirmedPlayerStats}`);
for (const warning of report.warnings) console.warn(`Warning: ${warning}`);
