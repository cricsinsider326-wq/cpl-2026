const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const errors = [];
const titles = new Map();
const canonicals = new Map();
const pageAudit = [];
const cssVersion = "20260726-home-tone2";

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function match(html, pattern) {
  return (html.match(pattern) || [])[1] || "";
}

const htmlFiles = walk(dist).filter((file) => path.basename(file) === "index.html");

for (const file of htmlFiles) {
  const relative = path.relative(dist, file).replace(/\\/g, "/");
  const html = fs.readFileSync(file, "utf8");
  const title = match(html, /<title>([^<]+)<\/title>/i);
  const description = match(html, /<meta name="description" content="([^"]+)"/i);
  const canonical = match(html, /<link rel="canonical" href="([^"]+)"/i);
  const robots = match(html, /<meta name="robots" content="([^"]+)"/i);
  const h1Count = (html.match(/<h1(?:\s|>)/gi) || []).length;

  if (relative === "cpl-2026/index.html") {
    if (!html.includes('http-equiv="refresh" content="0;url=/"')) errors.push(`${relative}: homepage redirect fallback missing`);
    if (!html.includes('<link rel="canonical" href="https://cplinsider.com"')) errors.push(`${relative}: redirect canonical must point to homepage`);
    continue;
  }

  if (!title) errors.push(`${relative}: missing title`);
  if (!description) errors.push(`${relative}: missing meta description`);
  if (!canonical) errors.push(`${relative}: missing canonical`);
  if (h1Count !== 1) errors.push(`${relative}: expected one H1, found ${h1Count}`);
  if (!html.includes(`/assets/premium.css?v=${cssVersion}`)) errors.push(`${relative}: missing premium CSS version`);
  if (html.includes("\u00c2") || html.includes("\ufffd")) errors.push(`${relative}: visible encoding artifact detected`);
  if (relative !== "index.html" && !html.includes('aria-label="Breadcrumb"')) errors.push(`${relative}: visible breadcrumbs missing`);

  pageAudit.push({ relative, canonical, noindex: robots.includes("noindex") });

  if (title) {
    if (titles.has(title)) errors.push(`${relative}: duplicate title with ${titles.get(title)}`);
    titles.set(title, relative);
  }
  if (canonical) {
    if (canonicals.has(canonical)) errors.push(`${relative}: duplicate canonical with ${canonicals.get(canonical)}`);
    canonicals.set(canonical, relative);
  }

  for (const script of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(script[1]);
    } catch (error) {
      errors.push(`${relative}: invalid JSON-LD (${error.message})`);
    }
  }

  for (const link of html.matchAll(/href="(\/[^"#?]*)[^\"]*"/gi)) {
    const target = link[1];
    if (target.startsWith("/assets/") || /\.(?:xml|txt|json)$/i.test(target)) continue;
    const clean = target.replace(/^\//, "").replace(/\/$/, "");
    const targetFile = clean ? path.join(dist, clean, "index.html") : path.join(dist, "index.html");
    if (!fs.existsSync(targetFile)) errors.push(`${relative}: broken internal link ${target}`);
  }
}

const home = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const pillarRedirect = fs.readFileSync(path.join(dist, "cpl-2026", "index.html"), "utf8");
const sitemap = fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8");
const dataQuality = JSON.parse(fs.readFileSync(path.join(dist, "data-quality.json"), "utf8"));
const htaccess = fs.readFileSync(path.join(dist, ".htaccess"), "utf8");
const tvGuideFallback = fs.readFileSync(path.join(dist, "news", "cpl-2026-tv-guide.html"), "utf8");
const fixturesPage = fs.readFileSync(path.join(dist, "fixtures", "index.html"), "utf8");
const watchPage = fs.readFileSync(path.join(dist, "how-to-watch", "index.html"), "utf8");
const teamPage = fs.readFileSync(path.join(dist, "teams", "jamaica-kingsmen", "index.html"), "utf8");
const completeTeamPage = fs.readFileSync(path.join(dist, "teams", "guyana-amazon-warriors", "index.html"), "utf8");
const tkrTeamPage = fs.readFileSync(path.join(dist, "teams", "trinbago-knight-riders", "index.html"), "utf8");
const playersListingPage = fs.readFileSync(path.join(dist, "players", "index.html"), "utf8");
const playerPage = fs.readFileSync(path.join(dist, "players", "nicholas-pooran", "index.html"), "utf8");
const andrePage = fs.readFileSync(path.join(dist, "players", "andre-russell", "index.html"), "utf8");
const fixtureDetailPage = fs.readFileSync(path.join(dist, "fixtures", "jamaica-kingsmen-vs-antigua-and-barbuda-falcons-at-arnos-vale-stadium-st-vincent", "index.html"), "utf8");
const scheduleNewsPage = fs.readFileSync(path.join(dist, "news", "cpl-2026-schedule-announced", "index.html"), "utf8");
const termsPage = fs.readFileSync(path.join(dist, "terms", "index.html"), "utf8");
const expectedNoIndex = new Set([
  "history/index.html",
  "past-seasons/index.html",
  "records/index.html",
  "search/index.html",
  "videos/index.html",
  "winners-list/index.html"
]);
if (!dataQuality.readiness.results) expectedNoIndex.add("results/index.html");

for (const page of pageAudit) {
  const inSitemap = sitemap.includes(`<loc>${page.canonical}</loc>`);
  if (page.noindex && inSitemap) errors.push(`${page.relative}: noindex page appears in sitemap`);
  if (!page.noindex && !inSitemap) errors.push(`${page.relative}: indexable page missing from sitemap`);
  if (expectedNoIndex.has(page.relative) && !page.noindex) errors.push(`${page.relative}: placeholder route must remain noindex`);
}

if (!home.includes('class="home-page rh-home"') || !home.includes('id="main-content"')) errors.push("Homepage reference layout or skip-link target is missing");
if (!home.includes("<title>CPL 2026: Schedule, Teams, Live Scores and Latest News</title>")) errors.push("Homepage SEO title is incorrect");
if (!home.includes("Follow CPL 2026 with the latest schedule, team squads, live scores, points table, player profiles, venues, results and viewing information.")) errors.push("Homepage meta description is incorrect");
if (!home.includes('"@type":"FAQPage"')) errors.push("Homepage FAQPage schema is missing");
for (const heading of ["CPL 2026 Match Centre", "Next CPL 2026 Match", "CPL 2026 Live Score", "Upcoming CPL 2026 Matches", "Meet the CPL 2026 Teams", "About CPL 2026", "CPL 2026 Points Table", "Latest CPL 2026 News", "Explore CPL 2026", "Players and Squads", "CPL 2026 Players to Watch", "Top CPL 2026 Venue Guides", "How to Watch CPL 2026", "CPL 2026 Tickets and Final", "Frequently Asked Questions"]) {
  if (!home.includes(heading)) errors.push(`Homepage heading missing: ${heading}`);
}
for (const copy of false ? [
  "Follow CPL 2026 in one place. Check upcoming matches, team squads, live scores, standings, player profiles, venue guides and broadcast updates throughout the season.",
  "See who is playing next, when the match starts and where it will take place. Open the match centre for team news, playing conditions, live updates and the final result.",
  "Check the next CPL fixtures with confirmed dates, local start times and venues. Each match links to a dedicated page with team details, match updates and results.",
  "Seven teams will compete across the Caribbean in CPL 2026. Visit each team page to see its squad, captain, coach, key players, home ground, fixtures and franchise record.",
  "Follow the latest CPL standings as the season moves forward. The table tracks matches played, wins, losses, points and net run rate, so you can quickly see which teams are in the playoff race.",
  "Keep up with squad announcements, overseas signings, injuries, replacement players, match previews and official tournament updates.",
  "Find the information you need without searching through the whole site.",
  "CPL 2026 will bring together leading Caribbean players, young talent and overseas stars. Visit each profile to learn about the player’s role, team and recent form.",
  "Explore the Caribbean grounds hosting CPL 2026. Each venue guide covers the stadium location, scheduled matches, seating information and useful details for supporters.",
  "Find out where CPL 2026 will be shown in your country. Broadcast rights differ by region, so every TV channel and streaming service should be marked as confirmed or awaiting an official announcement."
] : []) {
  if (!home.includes(copy)) errors.push(`Homepage supplied copy missing: ${copy.slice(0, 55)}...`);
}
for (const section of ["rh-hero", "rh-match-centre", "rh-next-match", "rh-live-score", "rh-upcoming", "rh-teams", "hub-about", "rh-player-index", "rh-plan", "rh-trust"]) {
  if (!home.includes(section)) errors.push(`Homepage section missing: ${section}`);
}
if (!home.includes("CPL Insider</strong><small>Your Ultimate CPL Guide")) errors.push("Homepage header must use CPL Insider branding");
if ((home.match(/class="rh-team-card"/g) || []).length !== 7) errors.push("Homepage must render all seven teams");
if ((home.match(/class="rh-upcoming-card"/g) || []).length !== 5) errors.push("Homepage must render five upcoming fixture cards");
if ((home.match(/class="rh-player-role-grid"/g) || []).length !== 1 || (home.match(/class="rh-player-role-grid"[\s\S]*?<\/nav>/g) || [])[0]?.match(/<a /g)?.length !== 6) errors.push("Homepage player index must render six role links");
if ((home.match(/class="pm-player-watch-card"/g) || []).length !== 4) errors.push("Homepage Players to Watch must render four cards");
if (!home.includes("The points table will start updating after the first completed match.")) errors.push("Homepage pre-tournament standings note missing");
if (!home.includes('rel="preload" href="/assets/images/hero/cpl-2026-player-artwork.webp"')) errors.push("Homepage must preload the supplied hero image");
if (!home.includes(`/assets/cpl-hub.css?v=${cssVersion}`) || !home.includes(`/assets/reference-home.css?v=${cssVersion}`)) errors.push("Homepage hybrid stylesheets are missing");
if (!pillarRedirect.includes('http-equiv="refresh" content="0;url=/"') || sitemap.includes("/cpl-2026/")) errors.push("Legacy CPL guide route must redirect and stay out of the sitemap");
if (!dataQuality.readiness.results && !fs.readFileSync(path.join(dist, "results", "index.html"), "utf8").includes("No completed CPL 2026 matches yet")) errors.push("Empty results dataset must render a clear not-started state");
if (dataQuality.warnings.length && !fixturesPage.includes("Confirmation pending")) errors.push("Fixture source warning must be visible on the schedule page");
if (!dataQuality.readiness.broadcasters && (!watchPage.includes("broadcast-directory") || !watchPage.includes("To be announced"))) errors.push("Unconfirmed broadcaster markets must render explicit TBA states");
if (!dataQuality.readiness.squads && (!teamPage.includes("Captain") || !teamPage.includes("To be announced"))) errors.push("Unconfirmed squad pages must render captain and squad TBA states");
if (!dataQuality.readiness.playerStats && (!playerPage.includes("CPL 2026 statistics") || !playerPage.includes("Not started"))) errors.push("Player profiles must not present previous-season figures as CPL 2026 stats");
if (!playersListingPage.includes("cpl-2026-players-hero.webp") || !playersListingPage.includes("data-player-directory")) errors.push("Players directory hero or filter controller is missing");
if ((playersListingPage.match(/data-player-card/g) || []).length !== 99) errors.push("Players directory must render all 99 verified player records");
if (!playersListingPage.includes("Complete CPL 2026 Players List") || !playersListingPage.includes("data-player-pagination") || !playersListingPage.includes("data-player-nationality")) errors.push("Players directory list, nationality filter or pagination is missing");
if (!fs.readFileSync(path.join(dist, "assets", "app.js"), "utf8").includes("const pageSize = 30")) errors.push("Players directory must paginate 30 player cards per page");
if (!playersListingPage.includes('rel="preload" href="/assets/images/players/cpl-2026-players-hero.webp"')) errors.push("Players directory must preload its supplied hero image");
if (!fixturesPage.includes("republic-bank-cpl-fixtures-confirmed-for-2026")) errors.push("Fixture page must link to the direct official schedule announcement");
if (dataQuality.summary.confirmedSquads !== 7 || dataQuality.summary.completeSquads !== 3) errors.push("Squad readiness counts do not match the verified source snapshot");
if (!teamPage.includes("Rovman Powell") || !teamPage.includes("12</strong><span>verified names") || !teamPage.includes('team-status partial')) errors.push("Partial squad page must list confirmed Jamaica players and status");
if (!completeTeamPage.includes("Rahmanullah Gurbaz") || !completeTeamPage.includes("17</strong><span>verified names") || !completeTeamPage.includes('team-status complete')) errors.push("Complete squad page must list the verified Guyana roster and status");
if (!tkrTeamPage.includes('class="team-silo"') || !tkrTeamPage.includes("Upcoming TKR Matches") || !tkrTeamPage.includes("Nicholas Pooran") || !tkrTeamPage.includes("Brian Lara Stadium")) errors.push("TKR topic hub is missing fixtures, squad players or venue context");
if (!tkrTeamPage.includes('"@type":"SportsTeam"') || !tkrTeamPage.includes('"member"')) errors.push("TKR team hub must include SportsTeam member schema");
if (!watchPage.includes("Rush Live &amp; Louder") || !watchPage.includes("cpl-and-rush-sports-launch-rush-live-louder")) errors.push("Caribbean broadcast card must show the verified channel and official source");
if ((watchPage.match(/To be announced/g) || []).length < 5) errors.push("Unconfirmed broadcast markets must continue to render TBA values");
if (!termsPage.includes("Terms of Use") || !sitemap.includes("/terms/")) errors.push("Terms of Use page must be generated and indexed");
if (!andrePage.includes("Current CPL team</dt><dd>Jamaica Kingsmen") || !andrePage.includes("Previous CPL team</dt><dd>Trinbago Knight Riders")) errors.push("Transferred player pages must separate current and previous-season teams");
if (!playerPage.includes('class="player-profile"') || !playerPage.includes('class="pp-stat-strip"') || !playerPage.includes('class="pp-tab-list"') || !playerPage.includes("CPL Career Statistics") || !playerPage.includes("Recent CPL Performances")) errors.push("Reference-matched player profile structure is incomplete");
if ((playerPage.match(/role="tab"/g) || []).length !== 6 || (playerPage.match(/role="tabpanel"/g) || []).length !== 6) errors.push("Player profile must render six accessible tabs and panels");
if (!playerPage.includes("2,873") || !playerPage.includes("149.09") || !playerPage.includes("official player source")) errors.push("Nicholas Pooran verified CPL career data or source note is missing");
if (!fixtureDetailPage.includes('"@type":"SportsEvent"')) errors.push("Fixture pages must include SportsEvent structured data");
if (!andrePage.includes('"@type":"Person"')) errors.push("Player pages must include Person structured data");
if (!scheduleNewsPage.includes('"@type":"NewsArticle"')) errors.push("News detail pages must include NewsArticle structured data");
if (scheduleNewsPage.includes("6 Islands") || scheduleNewsPage.includes("six Caribbean islands")) errors.push("Stale schedule host-count copy remains in the news article");
if (!sitemap.includes("/news/cpl-2026-tv-guide/")) errors.push("Renamed TV guide missing from sitemap");
if (sitemap.includes("/news/how-to-watch-cpl-2026-live-stream/") || sitemap.includes("/news/cpl-2026-tv-streaming-guide/")) errors.push("Blocked legacy streaming slug remains in sitemap");
if (!htaccess.includes("Redirect 301 /news/how-to-watch-cpl-2026-live-stream/ https://cplinsider.com/news/cpl-2026-tv-guide/") || !htaccess.includes("Redirect 301 /news/cpl-2026-tv-streaming-guide/ https://cplinsider.com/news/cpl-2026-tv-guide/")) errors.push("Legacy TV guide redirects missing");
if (!htaccess.includes("RewriteRule ^news/cpl-2026-tv-guide/?$ news/cpl-2026-tv-guide.html [L]")) errors.push("Host-compatible TV guide rewrite missing");
if (!tvGuideFallback.includes('<link rel="canonical" href="https://cplinsider.com/news/cpl-2026-tv-guide/"')) errors.push("TV guide flat fallback has the wrong canonical URL");
if (/match-number|match-\d+|\/20\d\d\//i.test(sitemap)) errors.push("Sitemap contains a disallowed match-number or date-style permalink");

if (errors.length) {
  console.error(`Build validation failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const indexableCount = pageAudit.filter((page) => !page.noindex).length;
console.log(`Build validation passed: ${htmlFiles.length} HTML pages, ${indexableCount} indexable pages, ${titles.size} unique titles, valid JSON-LD and clean sitemap slugs.`);
