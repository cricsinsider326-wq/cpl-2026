function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugToTitle(slug = "") {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function asset(path) {
  return `/assets/${path.replace(/^assets\//, "")}`;
}

module.exports = {
  asset,
  escapeHtml,
  slugToTitle
};
