const routeLabels = {
  "cpl-2026": "CPL 2026",
  teams: "Teams",
  players: "Players",
  fixtures: "Schedule",
  results: "Results",
  "live-score": "Live Score",
  "points-table": "Points Table",
  "player-stats": "Player Statistics",
  venues: "Venues",
  news: "News",
  videos: "Videos",
  "how-to-watch": "How to Watch",
  tickets: "Tickets",
  faq: "FAQ",
  history: "History",
  records: "Records",
  "winners-list": "Winners List",
  "past-seasons": "Past Seasons",
  about: "About",
  contact: "Contact",
  "editorial-policy": "Editorial Policy",
  "correction-policy": "Correction Policy",
  "privacy-policy": "Privacy Policy",
  "terms": "Terms of Use",
  search: "Search"
};

function cleanPageTitle(title = "") {
  return title
    .replace(/\s+-\s+CPL Insider$/i, "")
    .replace(/\s+-\s+CPL 2026.*$/i, "")
    .trim();
}

function humanize(segment) {
  return routeLabels[segment] || segment
    .split("-")
    .map((word) => word ? `${word[0].toUpperCase()}${word.slice(1)}` : "")
    .join(" ");
}

function breadcrumbItems(route = "", pageTitle = "") {
  const segments = route.split("/").filter(Boolean);
  const items = [{ name: "Home", path: "/" }];
  let current = "";

  segments.forEach((segment, index) => {
    current += `/${segment}`;
    const isLast = index === segments.length - 1;
    items.push({
      name: isLast ? cleanPageTitle(pageTitle) || humanize(segment) : humanize(segment),
      path: `${current}/`
    });
  });

  return items;
}

module.exports = { breadcrumbItems };
