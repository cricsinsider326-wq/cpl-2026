const { escapeHtml } = require("../lib/html");

function renderFooter(site) {
  return `<footer class="site-footer">
  <div class="footer-brand" id="contact">
    <div class="footer-logo-lockup"><span class="brand-mark">CPL</span><span><strong>CPL Insider</strong><small>Your Ultimate CPL Guide</small></span></div>
    <p>CPL Insider is an independent fan resource covering CPL fixtures, teams, players, results, venues and viewing information.</p>
  </div>
  <nav>
    <div><strong>Competition</strong><a href="/cpl-2026/">CPL 2026 Complete Guide</a><a href="/history/">History</a><a href="/records/">Records</a><a href="/winners-list/">Winners List</a><a href="/past-seasons/">Past Seasons</a></div>
    <div><strong>Match Center</strong><a href="/fixtures/">Schedule</a><a href="/results/">Results</a><a href="/points-table/">Points Table</a><a href="/player-stats/">Stats</a><a href="/players/">Player Profiles</a></div>
    <div><strong>Teams</strong><a href="/teams/">All Teams</a><a href="/players/">Squads</a><a href="/news/">Team News</a></div>
    <div><strong>Fans</strong><a href="/tickets/">Tickets</a><a href="/venues/">Venue Guides</a><a href="/how-to-watch/">How to Watch</a><a href="/videos/">Highlights</a></div>
    <div><strong>More</strong><a href="/news/">News</a><a href="/videos/">Videos</a><a href="/venues/">Venues</a><a href="/contact/">Contact</a><a href="/faq/">FAQs</a></div>
    <div><strong>Trust</strong><a href="/about/">About CPL Insider</a><a href="/editorial-policy/">Editorial Policy</a><a href="/correction-policy/">Correction Policy</a><a href="/privacy-policy/">Privacy Policy</a><a href="/terms/">Terms of Use</a></div>
  </nav>
  <div class="legal">
    <span>Copyright 2026 ${escapeHtml(site.name)}. CPL Insider is not affiliated with the Caribbean Premier League or its official partners.</span>
    <a href="/privacy-policy/">Privacy Policy</a>
    <a href="/terms/">Terms of Use</a>
    <a href="/editorial-policy/">Editorial Policy</a>
    <a href="/correction-policy/">Correction Policy</a>
    <a href="/contact/">Contact</a>
  </div>
</footer>`;
}

module.exports = { renderFooter };
