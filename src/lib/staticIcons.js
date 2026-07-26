const { icons } = require("../../assets/vendor/lucide-1.27.0.min.js");

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function pascalCase(name) {
  return name.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
}

function renderAttributes(attributes = {}) {
  return Object.entries(attributes)
    .filter(([key, value]) => key !== "key" && value !== undefined && value !== null)
    .map(([key, value]) => `${key}="${escapeAttribute(value)}"`)
    .join(" ");
}

function renderNode(node) {
  const [tag, attributes = {}, children = []] = node;
  const renderedChildren = Array.isArray(children) ? children.map(renderNode).join("") : "";
  return `<${tag}${Object.keys(attributes).length ? ` ${renderAttributes(attributes)}` : ""}>${renderedChildren}</${tag}>`;
}

function inlineLucideIcons(html) {
  return html.replace(/<i\b([^>]*\bdata-lucide="([^"]+)"[^>]*)><\/i>/gi, (markup, rawAttributes, iconName) => {
    const icon = icons[pascalCase(iconName)];
    if (!icon) return markup;

    const className = rawAttributes.match(/\bclass="([^"]*)"/i)?.[1];
    const style = rawAttributes.match(/\bstyle="([^"]*)"/i)?.[1];
    const svgAttributes = {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      class: `lucide lucide-${iconName}${className ? ` ${className}` : ""}`,
      "aria-hidden": "true",
      focusable: "false",
      ...(style ? { style } : {})
    };

    return `<svg ${renderAttributes(svgAttributes)}>${icon.map(renderNode).join("")}</svg>`;
  });
}

module.exports = { inlineLucideIcons };
