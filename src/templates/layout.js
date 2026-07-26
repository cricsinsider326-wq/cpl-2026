const { escapeHtml } = require("../lib/html");
const { breadcrumbItems } = require("../lib/breadcrumbs");

function schemaGraph({ site, teams, faqs, route, pageTitle, structuredData }) {
  const canonical = canonicalUrl(site, route);
  const graph = [
      {
        "@type": "WebSite",
        "@id": `${site.siteUrl}/#website`,
        url: site.siteUrl,
        name: site.name,
        description: site.description,
        publisher: { "@id": `${site.siteUrl}/#organization` },
        inLanguage: "en",
        potentialAction: {
          "@type": "SearchAction",
          target: `${site.siteUrl}/search/?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Organization",
        "@id": `${site.siteUrl}/#organization`,
        name: site.name,
        url: site.siteUrl,
        description: `${site.name} is an independent cricket guide and fan resource. Not affiliated with Caribbean Premier League.`
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems(route, pageTitle).map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: `${site.siteUrl.replace(/\/$/, "")}${item.path}`
        }))
      }
  ];

  if (route === "" || route === "cpl-2026") {
    graph.push({
        "@type": "SportsEvent",
        "@id": `${canonical}#event`,
        name: site.eventName,
        alternateName: site.shortName,
        startDate: site.startDate,
        endDate: site.endDate,
        sport: "Cricket",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: { "@type": "Place", name: "Caribbean" },
        competitor: teams.map((team) => ({ "@type": "SportsTeam", name: team.name }))
    });

    graph.push({
      "@type": "ItemList",
      "@id": `${canonical}#teams-list`,
      name: "CPL 2026 Teams and Franchises",
      itemListElement: teams.map((team, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: team.name,
        url: `${site.siteUrl.replace(/\/$/, "")}/teams/${team.slug}/`
      }))
    });
  }

  if (route === "" || route === "cpl-2026" || route === "faq") {
    const homepageQuestions = new Set([
      "When does CPL 2026 start?",
      "How many teams are playing in CPL 2026?",
      "Where will the CPL 2026 final be played?",
      "How can I watch CPL 2026?",
      "Where can I find CPL 2026 live scores?"
    ]);
    const schemaFaqs = route === "" ? faqs.filter((faq) => homepageQuestions.has(faq.question)) : faqs;
    graph.push({
        "@type": "FAQPage",
        "@id": `${canonical}#faq`,
        mainEntity: schemaFaqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer }
        }))
    });
  }

  if (structuredData) {
    graph.push({
      "@id": `${canonical}#primary-entity`,
      url: canonical,
      ...structuredData
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

function canonicalUrl(site, route = "") {
  const base = (site.siteUrl || "https://example.com").replace(/\/$/, "");
  const cleanRoute = route ? `${route.replace(/^\/|\/$/g, "")}/` : "";
  return `${base}/${cleanRoute}`;
}

function renderLayout({ site, teams, faqs, title, description, body, route = "", robots = "index,follow,max-image-preview:large", structuredData }) {
  const pageTitle = title || `${site.name} - Caribbean Premier League Teams, Fixtures & Players`;
  const pageDescription = description || site.description;
  const canonical = canonicalUrl(site, route);
  const imageBase = (site.siteUrl || "https://cplinsider.com").replace(/\/$/, "");
  const ogImage = route === "players"
    ? `${imageBase}/assets/images/players/cpl-2026-players-hero.webp`
    : route === "" || route === "cpl-2026"
      ? `${imageBase}/assets/images/players/cpl-2026-players-hero.webp`
    : `${imageBase}/assets/images/hero/cpl-2026-css-hero-reference.webp`;
  const cssVersion = "20260726-teams-redesign1";
  const jsVersion = route === "players"
    ? "20260726-players-squads-reference1"
    : "20260726-mobile-perf2";
  const scheduleCssVersion = "20260726-fixtures-audit1";
  const playerDirectoryCssVersion = "20260726-players-squads-reference1";
  const heroPreload = route === ""
    ? '<link rel="preload" href="/assets/images/hero/cpl-2026-player-artwork-720.avif" as="image" type="image/avif" imagesrcset="/assets/images/hero/cpl-2026-player-artwork-720.avif 720w, /assets/images/hero/cpl-2026-player-artwork-1280.avif 1280w" imagesizes="(max-width: 720px) 100vw, 70vw" fetchpriority="high" />'
    : route === "cpl-2026"
      ? '<link rel="preload" href="/assets/images/players/cpl-2026-players-hero.webp" as="image" type="image/webp" fetchpriority="high" />'
      : route === "players"
      ? '<link rel="preload" href="/assets/images/players/cpl-2026-players-hero.webp" as="image" type="image/webp" fetchpriority="high" />'
      : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#050816" />
    <link rel="preload" href="/assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/assets/fonts/barlow-condensed-900-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" type="image/webp" href="/assets/images/brand/cpl-insider-lockup-160.webp" />
    <link rel="apple-touch-icon" href="/assets/images/brand/cpl-insider-lockup-160.webp" />
    <meta name="robots" content="${escapeHtml(robots)}" />
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(pageDescription)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(pageTitle)}" />
    <meta property="og:description" content="${escapeHtml(pageDescription)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:site_name" content="${escapeHtml(site.name)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(pageDescription)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
    ${heroPreload}
    <script type="application/ld+json">${JSON.stringify(schemaGraph({ site, teams, faqs, route, pageTitle, structuredData }))}</script>
    <link rel="stylesheet" href="/assets/fonts.css?v=${cssVersion}" />
    <link rel="stylesheet" href="/assets/styles.css?v=${cssVersion}" />
    <link rel="stylesheet" href="/assets/premium.css?v=${cssVersion}" />
    ${route === "" ? `<link rel="stylesheet" href="/assets/cpl-hub.css?v=${cssVersion}" /><link rel="stylesheet" href="/assets/reference-home.css?v=${cssVersion}" />` : ""}
    ${route === "fixtures" ? `<link rel="stylesheet" href="/assets/schedule.css?v=${scheduleCssVersion}" />` : ""}
    ${route === "players" ? `<link rel="stylesheet" href="/assets/player-directory.css?v=${playerDirectoryCssVersion}" />` : ""}
  </head>
  <body class="${route === "" ? "home-body" : ""}${route === "fixtures" ? " sch-body" : ""}">
    <div class="site-shell">
      ${body}
    </div>
    <script defer src="/assets/app.js?v=${jsVersion}"></script>
  </body>
</html>`;
}

module.exports = { renderLayout };
