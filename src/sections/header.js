const { escapeHtml } = require("../lib/html");

function renderHeader(site, currentPath = "/") {
  const nav = [
    ["Home", "/"],
    ["Schedule", "/fixtures/"],
    ["Live Score", "/live-score/"],
    ["Teams", "/teams/"],
    ["Points Table", "/points-table/"],
    ["Players", "/players/"],
    ["News", "/news/"]
  ];
  const moreNav = [
    ["Complete Guide", "/cpl-2026/"],
    ["Results", "/results/"],
    ["Venues", "/venues/"],
    ["How to Watch", "/how-to-watch/"],
    ["Tickets", "/tickets/"],
    ["Videos", "/videos/"],
    ["FAQ", "/faq/"]
  ];
  const isActive = (href) => href === "/" ? currentPath === "/" : currentPath === href || currentPath.startsWith(href);
  const moreActive = moreNav.some(([, href]) => isActive(href));

  return `<a class="skip-link" href="#main-content">Skip to content</a><header class="top-strip">
  <div class="utility-messages"><span><i data-lucide="sparkles"></i>Independent fan resource</span><span><i data-lucide="clock-3"></i>Match times shown in venue local time</span></div>
  <nav aria-label="Utility navigation">
    <a href="/about/">About</a>
    <a href="/contact/">Contact</a>
    <a href="/editorial-policy/">Editorial Policy</a>
  </nav>
</header>
<header class="main-header">
  <div class="main-header-inner">
    <a class="brand" href="/" aria-label="${escapeHtml(site.name)} home">
      <span class="brand-symbol" aria-hidden="true"><img src="/assets/images/brand/cpl-insider-lockup-310.webp" srcset="/assets/images/brand/cpl-insider-lockup-160.webp 160w, /assets/images/brand/cpl-insider-lockup-310.webp 310w" sizes="(max-width: 700px) 160px, 310px" alt="" width="310" height="100" decoding="async" /></span>
      <span class="brand-copy"><strong>CPL Insider</strong><small>Your Ultimate CPL Guide</small></span>
    </a>
    <nav class="primary-nav" id="primary-nav" aria-label="Main navigation">
      ${nav.map(([label, href]) => `<a class="${isActive(href) ? "active" : ""}" href="${href}"${isActive(href) ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
      <details class="nav-more"><summary class="${moreActive ? "active" : ""}">More <i data-lucide="chevron-down"></i></summary><div>${moreNav.map(([label, href]) => `<a class="${isActive(href) ? "active" : ""}" href="${href}"${isActive(href) ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</div></details>
    </nav>
    <div class="header-actions">
      <a class="icon-button" href="/search/" aria-label="Search CPL Insider"><i data-lucide="search"></i></a>
      <a class="ticket-button" href="/tickets/"><i data-lucide="ticket"></i>Tickets</a>
      <button class="nav-toggle" type="button" aria-label="Open navigation menu" aria-controls="primary-nav" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>`;
}

module.exports = { renderHeader };
