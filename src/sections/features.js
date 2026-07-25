function renderFeatures() {
  const items = [
    ["mic-2", "World-Class Players", "Global cricket stars"],
    ["crown", "Seven Iconic Teams", "Rivalry, passion, glory"],
    ["sun", "Electric Atmosphere", "Feel the Caribbean vibes"],
    ["radio", "T20 Entertainment", "Fast, fun, unstoppable"],
    ["badge-check", "Caribbean Pride", "Unity, culture, cricket"],
    ["heart-handshake", "Fan First", "You are the 12th man"]
  ];
  return `<section class="feature-strip" aria-label="CPL highlights">
    ${items.map(([icon, title, text]) => `<article><i data-lucide="${icon}"></i><div><strong>${title}</strong><span>${text}</span></div></article>`).join("")}
  </section>`;
}

module.exports = { renderFeatures };
