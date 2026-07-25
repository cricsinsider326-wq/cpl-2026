const { escapeHtml } = require("../lib/html");

function renderFaq(faqs) {
  return `<section class="faq-section" id="faq">
    <div class="section-heading"><h2>CPL 2026 FAQ</h2><a href="/faq/">More Questions <i data-lucide="arrow-right"></i></a></div>
    <div class="faq-grid">${faqs.map((faq) => `<details><summary>${escapeHtml(faq.question)}<i data-lucide="plus"></i></summary><p>${escapeHtml(faq.answer)}</p></details>`).join("")}</div>
  </section>`;
}

module.exports = { renderFaq };
