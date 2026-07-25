function renderSocialNewsletter() {
  return `<section class="social-section">
    <h2>Follow CPL</h2>
    <div class="social-grid">
      <article><strong>X (Twitter)</strong><p>The countdown begins! 120 days to go for #CPL2026.</p><time>2h ago</time></article>
      <article><strong>Instagram</strong><img src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=500&q=80" alt="CPL 2026 fan moment in a Caribbean cricket stadium" loading="lazy" /><p>What a vibe!</p></article>
      <article><strong>Facebook</strong><p>Seven teams. One trophy. Millions of memories. #CPL2026</p><time>6h ago</time></article>
      <article><strong>YouTube</strong><img src="https://images.unsplash.com/photo-1593766827228-8737b4534aa6?auto=format&fit=crop&w=500&q=80" alt="CPL 2026 cricket promo video thumbnail" loading="lazy" /><p>CPL 2026 guide preview</p></article>
      <article><strong>TikTok</strong><p>The energy is unmatched! #CPL2026 #CaribbeanVibes</p><time>2d ago</time></article>
    </div>
  </section>
  <section class="newsletter">
    <div><i data-lucide="mail"></i><div><h2>Stay Updated</h2><p>Subscribe to get the latest CPL 2026 news, updates and offers.</p></div></div>
    <form><label class="sr-only" for="email">Email address</label><input id="email" type="email" placeholder="Enter your email" /><button type="submit">Subscribe</button></form>
  </section>`;
}

module.exports = { renderSocialNewsletter };
