const { escapeHtml } = require("../lib/html");
const { breadcrumbItems } = require("../lib/breadcrumbs");

function renderBreadcrumbs(route, title) {
  if (!route) return "";
  const items = breadcrumbItems(route, title);
  return `<nav class="global-breadcrumbs" aria-label="Breadcrumb">
    ${items.map((item, index) => {
      const isLast = index === items.length - 1;
      return `${index ? '<i data-lucide="chevron-right"></i>' : ""}${isLast
        ? `<span aria-current="page">${escapeHtml(item.name)}</span>`
        : `<a href="${escapeHtml(item.path)}">${escapeHtml(item.name)}</a>`}`;
    }).join("")}
  </nav>`;
}

module.exports = { renderBreadcrumbs };
