const { escapeHtml } = require("../lib/html");

function renderPageHero({ title, eyebrow = "CPL 2026 Guide", text }) {
  return `<section class="page-hero">
    <p class="eyebrow">${escapeHtml(eyebrow)}</p>
    <h1>${escapeHtml(title)}</h1>
    ${text ? `<p>${escapeHtml(text)}</p>` : ""}
  </section>`;
}

function renderListingGrid(items, renderItem) {
  return `<section class="listing-grid">${items.map(renderItem).join("")}</section>`;
}

function renderDetailPanel({ title, meta = [], body }) {
  return `<section class="detail-layout">
    <article class="panel detail-panel">
      <h2>${escapeHtml(title)}</h2>
      ${meta.length ? `<dl>${meta.map(([key, value]) => `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>` : ""}
      ${body ? `<p>${escapeHtml(body)}</p>` : ""}
    </article>
  </section>`;
}

module.exports = { renderDetailPanel, renderListingGrid, renderPageHero };
