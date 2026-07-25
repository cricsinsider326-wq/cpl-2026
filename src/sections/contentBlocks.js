const { escapeHtml } = require("../lib/html");

function renderLongFormGuide(guide, topics = []) {
  return `<section class="content-guide" id="cpl-2026-guide">
    <div class="content-copy">
      <p class="eyebrow">CPL 2026 SEO Guide</p>
      <h2>${escapeHtml(guide.title)}</h2>
      <p class="lead-copy">${escapeHtml(guide.intro)}</p>
      ${guide.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
    </div>
    <div class="topic-grid">
      ${topics.map((topic) => `<article><h3>${escapeHtml(topic.heading)}</h3><p>${escapeHtml(topic.text)}</p></article>`).join("")}
    </div>
  </section>`;
}

function renderEditorialSection({ title, eyebrow = "CPL 2026 Guide", paragraphs = [], links = [] }) {
  return `<section class="content-guide compact-guide">
    <div class="content-copy">
      <p class="eyebrow">${escapeHtml(eyebrow)}</p>
      <h2>${escapeHtml(title)}</h2>
      ${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
      ${links.length ? `<div class="internal-link-row">${links.map((link) => `<a href="${link.href}">${escapeHtml(link.label)}</a>`).join("")}</div>` : ""}
    </div>
  </section>`;
}

function renderIntentChecklist(title, items) {
  return `<section class="intent-checklist">
    <h2>${escapeHtml(title)}</h2>
    <div>${items.map((item) => `<article><i data-lucide="check-circle"></i><span>${escapeHtml(item)}</span></article>`).join("")}</div>
  </section>`;
}

module.exports = {
  renderEditorialSection,
  renderIntentChecklist,
  renderLongFormGuide
};
