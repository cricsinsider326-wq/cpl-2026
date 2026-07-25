const { escapeHtml } = require("../lib/html");

function renderDataState({ label, status, lastChecked, message, sources = [] }) {
  const confirmed = status === "verified" || status === "reviewed";
  const sourceLinks = sources
    .filter((source) => source?.url)
    .map((source) => `<a href="${escapeHtml(source.url)}" rel="noopener noreferrer">${escapeHtml(source.name || source.publisher || "Primary source")}</a>`)
    .join(", ");

  return `<aside class="data-state ${confirmed ? "is-confirmed" : "is-pending"}" aria-label="${escapeHtml(label)} data status">
    <i data-lucide="${confirmed ? "badge-check" : "clock-3"}"></i>
    <div><span>${escapeHtml(label)}</span><strong>${confirmed ? "Source checked" : "Confirmation pending"}</strong><p>${escapeHtml(message)}</p><small>Last checked: ${escapeHtml(lastChecked || "To be announced")}${sourceLinks ? ` &middot; ${sources.length > 1 ? "Sources" : "Source"}: ${sourceLinks}` : ""}</small></div>
  </aside>`;
}

function displayValue(value) {
  return value === null || value === undefined || value === "" ? "To be announced" : String(value);
}

module.exports = { displayValue, renderDataState };
