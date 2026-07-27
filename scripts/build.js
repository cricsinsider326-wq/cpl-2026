const fs = require("fs");
const path = require("path");
const { renderLayout } = require("../src/templates/layout");
const { renderFooter } = require("../src/sections/footer");
const { renderHeader } = require("../src/sections/header");
const { renderBreadcrumbs } = require("../src/sections/breadcrumbs");
const { renderHomePage } = require("../src/pages/home");
const pages = require("../src/pages/listPages");
const { buildCalendar } = require("../src/lib/calendar");
const { routeIsIndexable } = require("../src/lib/dataQuality");
const { loadTournamentData } = require("../src/lib/tournamentData");
const { inlineLucideIcons } = require("../src/lib/staticIcons");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writePage(route, html) {
  const outputPath = path.join(dist, route, "index.html");
  ensureDir(outputPath);
  fs.writeFileSync(outputPath, html);
}

function redirectDocument(target, canonical) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex,follow" />
    <meta http-equiv="refresh" content="0;url=${target}" />
    <link rel="canonical" href="${canonical}" />
    <title>CPL 2026 Guide - CPL Insider</title>
  </head>
  <body><p>The CPL 2026 guide is now on the <a href="${target}">CPL Insider homepage</a>.</p></body>
</html>`;
}

function page({ data, route, title, description, main, robots, structuredData }) {
  const currentPath = route ? `/${route}/` : "/";
  return inlineLucideIcons(renderLayout({
    site: data.site,
    teams: data.teams,
    faqs: data.faqs,
    route,
    title,
    description,
    robots,
    structuredData,
    body: `${renderHeader(data.site, currentPath)}${route === "" || route === "cpl-2026" ? "" : renderBreadcrumbs(route, title)}<div id="main-content" tabindex="-1">${main}</div>${renderFooter(data.site)}`
  }));
}

function copyAssets() {
  fs.rmSync(path.join(dist, "assets"), { recursive: true, force: true });
  fs.cpSync(path.join(root, "assets"), path.join(dist, "assets"), {
    recursive: true,
    filter: (source) => !/\.(png|jpe?g)$/i.test(source),
  });
  fs.copyFileSync(path.join(root, ".htaccess"), path.join(dist, ".htaccess"));
}

function writeCalendarFiles(data) {
  const calendarDir = path.join(dist, "assets", "calendar");
  fs.mkdirSync(calendarDir, { recursive: true });
  const generatedAt = Date.now();
  fs.writeFileSync(
    path.join(calendarDir, "cpl-2026-schedule.ics"),
    buildCalendar(data.fixtures, data.site, { generatedAt })
  );
  for (const match of data.fixtures) {
    fs.writeFileSync(
      path.join(calendarDir, `${match.slug}.ics`),
      buildCalendar([match], data.site, {
        name: match.match || "CPL 2026 Match",
        generatedAt
      })
    );
  }
}

function build() {
  const data = loadTournamentData(root);

  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(dist, { recursive: true });
  copyAssets();

  const homeHtml = page({
    data,
    route: "",
    title: "CPL 2026: Schedule, Teams, Live Scores and Latest News",
    description: "Follow CPL 2026 with the latest schedule, team squads, live scores, points table, player profiles, venues, results and viewing information.",
    main: renderHomePage(data)
  });
  writePage("", homeHtml);
  fs.writeFileSync(path.join(root, "index.html"), homeHtml);

  const pageRoutes = [""];
  writePage("cpl-2026", redirectDocument("/", data.site.siteUrl));

  const staticPages = [
    ["teams", "CPL 2026 Teams", pages.teamListing(data)],
    ["players", "CPL 2026 Players & Squads", pages.playerListing(data), "Browse CPL 2026 players and squads by team and role, with verified roster status, player profiles and the latest squad updates."],
    ["fixtures", "CPL 2026 Fixtures", pages.fixturesPage(data)],
    ["live-score", "CPL Live Score", pages.liveScorePage(data)],
    ["points-table", "CPL 2026 Points Table", pages.pointsTablePage(data)],
    ["player-stats", "Recent CPL Top Performers", pages.playersStatsPage(data)],
    ["venues", "CPL 2026 Venues", pages.venuesListing(data)],
    ["how-to-watch", "How To Watch CPL 2026", pages.howToWatchPage(data)],
    ["tickets", "CPL 2026 Tickets", pages.ticketsPage(data)],
    ["faq", "CPL 2026 FAQ", pages.faqPage(data)],
    ["news", "CPL 2026 News", pages.newsListing(data)]
    ,["results", "CPL 2026 Results", pages.resultsPage(data)]
    ,["videos", "CPL Videos and Highlights", pages.videosPage(data)]
  ];
  for (const [route, title, main, description] of staticPages) {
    const indexable = routeIsIndexable(route, data);
    const structuredData = route === "players"
      ? [
          {
            "@type": "ItemList",
            "@id": `${data.site.siteUrl.replace(/\/$/, "")}/players/#player-list`,
            name: "CPL 2026 Players and Squads",
            numberOfItems: data.players.length,
            itemListElement: data.players.map((player, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: player.name,
              url: `${data.site.siteUrl.replace(/\/$/, "")}/players/${player.slug}/`
            }))
          },
          {
            "@type": "FAQPage",
            "@id": `${data.site.siteUrl.replace(/\/$/, "")}/players/#faq`,
            mainEntity: [
              ["How many players are in each CPL 2026 squad?", "Each CPL franchise fields a 17-player squad, including West Indies contract players, overseas stars, and youth development picks."],
              ["How many overseas players can each team have?", "Teams can contract up to 5 overseas international players in their official squad."],
              ["When will the full squad lists be announced?", "Official squad rosters are confirmed following the CPL draft and regional player draft windows."],
              ["Can squads change during the tournament?", "Yes. Temporary replacement players can be brought in for injuries or international duty call-ups."],
              ["How are breakout players selected?", "Emerging Under-23 and regional West Indian stars are selected through the CPL youth draft."],
              ["Where can I see the latest squad updates?", "All confirmed squad additions, draft picks, and replacements update live on CPL Insider team pages."]
            ].map(([question, answer]) => ({
              "@type": "Question",
              name: question,
              acceptedAnswer: { "@type": "Answer", text: answer }
            }))
          }
        ]
      : route === "points-table"
      ? {
          "@type": "ItemList",
          name: "CPL 2026 Points Table",
          itemListOrder: "https://schema.org/ItemListOrderAscending",
          numberOfItems: data.teams.length,
          itemListElement: data.teams.map((team, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "SportsTeam",
              name: team.name,
              url: `${data.site.siteUrl.replace(/\/$/, "")}/teams/${team.slug}/`
            }
          }))
        }
      : undefined;
    writePage(route, page({
      data,
      route,
      title: `${title} - ${data.site.name}`,
      description: description || data.site.description,
      robots: indexable ? undefined : "noindex,follow",
      structuredData,
      main
    }));
    if (indexable) pageRoutes.push(route);
  }

  const evergreenPages = [
    ["history", "CPL History", "Caribbean Premier League history, tournament development and season context.", [
      "The Caribbean Premier League history hub is the starting point for verified season summaries, past finals, franchise changes and notable tournament moments.",
      "Historical statistics should be connected to their source season and kept separate from CPL 2026 live data. This avoids confusing all-time records with current form.",
      "As this archive grows, every season page will link to winners, leading performers, venues and the next chronological season."
    ]],
    ["winners-list", "CPL Winners List", "A season-by-season CPL champions and finals reference.", [
      "This page is reserved for a sourced season-by-season list of CPL champions, runners-up, final venues and player-of-the-match details.",
      "Records will be published only after they have been checked against official season archives. Unverified totals will not be presented as fact.",
      "The winners list will connect to tournament history, team profiles and individual season summaries."
    ]],
    ["records", "CPL Records", "Verified Caribbean Premier League batting, bowling, team and partnership records.", [
      "The CPL records hub will organize career, season, team, batting, bowling and partnership records using consistent definitions.",
      "Every record should show its scope and source. A career record must not be mixed with one-season performance, and a league-stage figure must not be presented as an all-match total.",
      "Until a record is verified, the page will explain the category without inventing a value."
    ]],
    ["past-seasons", "CPL Past Seasons", "Explore Caribbean Premier League season archives and historical summaries.", [
      "Past-season pages give historical searches a dedicated home without crowding the current CPL 2026 hub.",
      "Each archive should include the confirmed schedule, final table, playoffs, champion, leading players and important stories for that season.",
      "Season pages will be added only when enough verified material exists to make each page genuinely useful."
    ]],
    ["about", "About CPL Insider", "About the independent CPL Insider cricket guide and its editorial purpose.", [
      "CPL Insider is an independent fan resource covering tournament schedules, teams, players, venues, results and practical viewing information.",
      "The site is not affiliated with or endorsed by the Caribbean Premier League. Official announcements remain the primary authority for tournament decisions.",
      "Our goal is to organize cricket information clearly, label unconfirmed details and correct errors transparently."
    ]],
    ["contact", "Contact CPL Insider", "Contact CPL Insider about corrections, editorial questions and site feedback.", [
      "Use this page to report an error, suggest a source or ask an editorial question about CPL Insider coverage.",
      "For correction requests, include the page URL, the statement you believe is wrong and a reliable supporting source.",
      "Commercial enquiries should be clearly identified and do not influence editorial coverage. Contact form integration is still to be announced."
    ]],
    ["editorial-policy", "Editorial Policy", "How CPL Insider researches, labels, updates and corrects tournament information.", [
      "CPL Insider prioritizes primary sources such as tournament announcements, team statements, venue information and confirmed broadcaster publications.",
      "Writers must distinguish confirmed facts from expectations, previous-season context and placeholders. Fake live states, scores, squads or commercial claims are not acceptable.",
      "Pages should show meaningful update dates, useful internal links and clear independence disclosures."
    ]],
    ["correction-policy", "Correction Policy", "How to report and how CPL Insider handles factual corrections.", [
      "When a factual error is confirmed, CPL Insider updates the affected page and records a meaningful change in its update history when appropriate.",
      "Correction requests should identify the exact claim and provide a reliable source. Opinion differences are reviewed separately from factual mistakes.",
      "Material corrections should be clear to readers rather than silently hidden."
    ]],
    ["privacy-policy", "Privacy Policy", "How CPL Insider handles newsletter and website visitor information.", [
      "CPL Insider collects only the information needed to provide requested features such as newsletter registration and site analytics.",
      "Email addresses should not be sold, and any future marketing or analytics provider must be disclosed before production use.",
      "The current newsletter interface is a front-end placeholder until a consent-aware email service is connected."
    ]],
    ["terms", "Terms of Use", "Terms for using the independent CPL Insider website and its cricket information.", [
      "CPL Insider provides independently researched cricket information for general informational use. Tournament schedules, squads, broadcast availability and ticket details can change, so readers should check the linked primary source before making travel, viewing or purchasing decisions.",
      "The Caribbean Premier League name, team names, logos and player identities belong to their respective owners. CPL Insider does not claim official tournament status, endorsement or ownership of third-party trademarks.",
      "Automated scraping that degrades site availability, attempts to bypass security controls or republishes substantial original editorial material without permission is not allowed. Links to external services are provided for convenience and remain subject to those services' own terms."
    ]]
  ];
  for (const [route, title, intro, paragraphs] of evergreenPages) {
    const indexable = routeIsIndexable(route, data);
    writePage(route, page({
      data,
      route,
      title: `${title} - ${data.site.name}`,
      description: intro,
      robots: indexable ? undefined : "noindex,follow",
      main: pages.evergreenPage({ title, eyebrow: "CPL Insider", intro, paragraphs, links: [{ label: "CPL 2026 Guide", href: "/cpl-2026/" }, { label: "Contact CPL Insider", href: "/contact/" }] })
    }));
    if (indexable) pageRoutes.push(route);
  }

  writePage("search", page({
    data,
    route: "search",
    title: `Search - ${data.site.name}`,
    description: "Search CPL Insider teams, players, fixtures, news and venue guides.",
    robots: "noindex,follow",
    main: pages.searchPage(data)
  }));

  for (const team of data.teams) {
    const teamPlayers = data.players.filter((player) => player.teamCode === team.code);
    writePage(`teams/${team.slug}`, page({
      data,
      route: `teams/${team.slug}`,
      title: `${team.name} CPL 2026 Squad, Fixtures & Players`,
      description: `${team.name} CPL 2026 team guide with verified squad players, complete fixtures, home venue, player profiles and related news.`,
      structuredData: {
        "@type": "SportsTeam",
        name: team.name,
        sport: "Cricket",
        logo: `${data.site.siteUrl.replace(/\/$/, "")}${team.logo}`,
        location: { "@type": "Place", name: team.country },
        homeLocation: { "@type": "Place", name: team.homeVenue },
        ...(team.officialUrl ? { sameAs: [team.officialUrl] } : {}),
        member: teamPlayers.map((player) => ({
          "@type": "Person",
          name: player.name,
          url: `${data.site.siteUrl.replace(/\/$/, "")}/players/${player.slug}/`
        }))
      },
      main: pages.teamDetail(data, team)
    }));
    pageRoutes.push(`teams/${team.slug}`);

    writePage(`teams/${team.slug}/fixtures`, page({
      data,
      route: `teams/${team.slug}/fixtures`,
      title: `${team.name} Fixtures - CPL 2026 Team Schedule`,
      description: `${team.name} CPL 2026 fixtures, team schedule, venues, match previews and live score links.`,
      main: pages.teamFixturesPage(data, team)
    }));
    pageRoutes.push(`teams/${team.slug}/fixtures`);
  }

  for (const player of data.players) {
    const playerTeam = data.teams.find((team) => team.name === player.team);
    writePage(`players/${player.slug}`, page({
      data,
      route: `players/${player.slug}`,
      title: `${player.name} CPL 2026 Profile, Team, Role & Stats`,
      description: `${player.name} CPL 2026 player profile with verified team, role, squad status, upcoming fixtures and clearly labelled performance updates.`,
      structuredData: {
        "@type": "Person",
        name: player.name,
        jobTitle: player.role,
        ...(player.photo ? { image: `${data.site.siteUrl.replace(/\/$/, "")}${player.photo}` } : {}),
        ...(player.imageSourcePage ? { sameAs: [player.imageSourcePage] } : {}),
        affiliation: {
          "@type": "SportsTeam",
          name: player.team,
          ...(playerTeam ? { url: `${data.site.siteUrl.replace(/\/$/, "")}/teams/${playerTeam.slug}/` } : {})
        }
      },
      main: pages.playerDetail(data, player)
    }));
    pageRoutes.push(`players/${player.slug}`);
  }

  for (const venue of data.venues) {
    writePage(`venues/${venue.slug}`, page({
      data,
      route: `venues/${venue.slug}`,
      title: `${venue.name} - CPL 2026 Venue Guide`,
      description: venue.summary,
      structuredData: {
        "@type": "Place",
        name: venue.name,
        address: { "@type": "PostalAddress", addressCountry: venue.location },
        image: venue.image
      },
      main: pages.venueDetail(data, venue)
    }));
    pageRoutes.push(`venues/${venue.slug}`);

    writePage(`venues/${venue.slug}/fixtures`, page({
      data,
      route: `venues/${venue.slug}/fixtures`,
      title: `${venue.name} Fixtures - CPL 2026 Venue Schedule`,
      description: `${venue.name} CPL 2026 fixtures, venue schedule, match previews and live score links.`,
      main: pages.venueFixturesPage(data, venue)
    }));
    pageRoutes.push(`venues/${venue.slug}/fixtures`);
  }

  for (const match of data.fixtures) {
    writePage(`fixtures/${match.slug}`, page({
      data,
      route: `fixtures/${match.slug}`,
      title: `${match.match} - CPL 2026 Match Preview, Date & Live Score`,
      description: `${match.match} CPL 2026 fixture: ${match.dateText}, ${match.time}, ${match.venue}. Live score and match preview hub.`,
      structuredData: {
        "@type": "SportsEvent",
        name: match.match,
        startDate: match.dateISO,
        eventStatus: "https://schema.org/EventScheduled",
        sport: "Cricket",
        description: `${match.match} in the Caribbean Premier League 2026 at ${match.venue}.`,
        image: `${data.site.siteUrl.replace(/\/$/, "")}/assets/images/hero/cpl-2026-player-artwork-1280.webp`,
        location: {
          "@type": "Place",
          name: match.venue,
          address: {
            "@type": "PostalAddress",
            addressCountry: match.hostCountry
          }
        },
        competitor: [match.teamAName, match.teamBName].filter(Boolean).map((name) => ({ "@type": "SportsTeam", name }))
      },
      main: pages.fixtureDetail(data, match)
    }));
    pageRoutes.push(`fixtures/${match.slug}`);
  }

  for (const item of data.news) {
    writePage(`news/${item.slug}`, page({
      data,
      route: `news/${item.slug}`,
      title: `${item.title} - CPL 2026 News`,
      description: item.excerpt,
      structuredData: {
        "@type": "NewsArticle",
        headline: item.title,
        description: item.excerpt,
        image: `${data.site.siteUrl.replace(/\/$/, "")}${item.image}`,
        datePublished: new Date(item.date).toISOString().slice(0, 10),
        dateModified: "2026-07-15",
        author: { "@type": "Organization", name: data.site.name },
        publisher: { "@id": `${data.site.siteUrl}/#organization` },
        mainEntityOfPage: `${data.site.siteUrl}/news/${item.slug}/`
      },
      main: pages.newsDetail(data, item)
    }));
    pageRoutes.push(`news/${item.slug}`);
  }

  const tvGuideIndex = path.join(dist, "news", "cpl-2026-tv-guide", "index.html");
  fs.copyFileSync(tvGuideIndex, path.join(dist, "news", "cpl-2026-tv-guide.html"));

  writeCalendarFiles(data);
  writeSeoFiles(data.site, pageRoutes);
  writeDeployZip();

  fs.writeFileSync(path.join(dist, "data-quality.json"), JSON.stringify(data.dataQuality, null, 2));

  fs.writeFileSync(path.join(dist, "build-manifest.json"), JSON.stringify({
    builtAt: new Date().toISOString(),
    pages: countHtmlFiles(dist),
    source: "src/data + verified data layer + src/sections + src/pages",
    dataStatus: data.dataQuality.overallStatus,
    readiness: data.dataQuality.readiness
  }, null, 2));
}

function absoluteUrl(site, route = "") {
  const base = (site.siteUrl || "https://example.com").replace(/\/$/, "");
  const cleanRoute = route ? `${route.replace(/^\/|\/$/g, "")}/` : "";
  return `${base}/${cleanRoute}`;
}

function writeSeoFiles(site, routes) {
  const base = (site.siteUrl || "https://cplinsider.com").replace(/\/$/, "");
  const urls = routes
    .map((route) => `  <url><loc>${absoluteUrl(site, route)}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod><changefreq>${route === "" ? "daily" : "weekly"}</changefreq><priority>${route === "" ? "1.0" : "0.8"}</priority></url>`)
    .join("\n");

  fs.writeFileSync(path.join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  fs.writeFileSync(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
  fs.writeFileSync(path.join(dist, "manifest.json"), JSON.stringify({
    name: "CPL Insider",
    short_name: "CPL Insider",
    start_url: "/",
    display: "standalone",
    background_color: "#050816",
    theme_color: "#050816",
    icons: [{
      src: "/assets/images/brand/cpl-insider-lockup-310.webp",
      sizes: "310x96",
      type: "image/webp"
    }]
  }));
}

function writeDeployZip() {
  const zipPath = path.join(root, "cpl-2026-dist.zip");
  fs.rmSync(zipPath, { force: true });
}

function countHtmlFiles(dir) {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countHtmlFiles(full);
    if (entry.isFile() && entry.name.endsWith(".html")) count += 1;
  }
  return count;
}

build();
