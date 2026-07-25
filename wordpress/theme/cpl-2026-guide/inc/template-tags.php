<?php
/**
 * Template helper functions.
 *
 * @package CPL_2026_Guide
 */

if (!defined('ABSPATH')) {
    exit;
}

function cpl2026_render_header(): void
{
    $settings = cpl2026_get_site_settings();
    ?>
    <header class="top-strip">
        <p><?php echo esc_html($settings['tagline']); ?></p>
        <nav aria-label="<?php esc_attr_e('Utility navigation', 'cpl-2026-guide'); ?>">
            <a href="<?php echo cpl2026_page_url('#about'); ?>">About CPL</a>
            <a href="<?php echo cpl2026_page_url('#contact'); ?>">Contact Us</a>
            <a href="<?php echo cpl2026_page_url('faq/'); ?>">FAQ</a>
            <a href="<?php echo cpl2026_page_url('news/'); ?>">Media Center</a>
            <a href="<?php echo cpl2026_page_url('#commercial'); ?>">Store</a>
            <a href="#" aria-label="Facebook">f</a>
            <a href="#" aria-label="X">x</a>
            <a href="#" aria-label="Instagram">ig</a>
            <a href="#">EN</a>
        </nav>
    </header>
    <header class="main-header">
        <a class="brand" href="<?php echo esc_url(home_url('/')); ?>" aria-label="<?php echo esc_attr($settings['name']); ?> home">
            <span class="brand-mark">CPL</span>
            <span class="brand-text"><strong>CPL</strong><small>Caribbean Premier League</small></span>
            <span class="year">2026</span>
        </a>
        <nav class="primary-nav" aria-label="<?php esc_attr_e('Main navigation', 'cpl-2026-guide'); ?>">
            <a class="active" href="<?php echo esc_url(home_url('/')); ?>">Home</a>
            <a href="<?php echo cpl2026_page_url('teams/'); ?>">Teams</a>
            <a href="<?php echo cpl2026_page_url('live-score/'); ?>">Live Score</a>
            <a href="<?php echo cpl2026_page_url('fixtures/'); ?>">Schedule</a>
            <a href="<?php echo cpl2026_page_url('points-table/'); ?>">Points Table</a>
            <a href="<?php echo cpl2026_page_url('players/'); ?>">Players</a>
            <a href="<?php echo cpl2026_page_url('#stats'); ?>">Stats</a>
            <a href="<?php echo cpl2026_page_url('news/'); ?>">News</a>
            <a href="<?php echo cpl2026_page_url('#videos'); ?>">Videos</a>
            <a href="<?php echo cpl2026_page_url('#fan-zone'); ?>">More</a>
        </nav>
        <div class="header-actions">
            <button class="icon-button" type="button" aria-label="<?php esc_attr_e('Search', 'cpl-2026-guide'); ?>"><?php echo cpl2026_render_icon('search'); ?></button>
            <a class="ticket-button" href="<?php echo cpl2026_page_url('#tickets'); ?>">Tickets</a>
        </div>
    </header>
    <?php
}

function cpl2026_render_footer(): void
{
    $settings = cpl2026_get_site_settings();
    ?>
    <footer class="site-footer">
        <div class="footer-brand">
            <span class="brand-mark">CPL</span>
            <p><?php echo esc_html($settings['not_affiliated']); ?> Seven teams, one trophy, endless passion.</p>
        </div>
        <nav>
            <div><strong>Competition</strong><a href="<?php echo cpl2026_page_url('#about'); ?>">About CPL</a><a href="#">History</a><a href="#">Records</a><a href="<?php echo cpl2026_page_url('news/'); ?>">Galleries</a><a href="#">CPL Draft</a></div>
            <div><strong>Match Center</strong><a href="<?php echo cpl2026_page_url('fixtures/'); ?>">Schedule</a><a href="#">Results</a><a href="<?php echo cpl2026_page_url('points-table/'); ?>">Points Table</a><a href="<?php echo cpl2026_page_url('#stats'); ?>">Stats</a><a href="<?php echo cpl2026_page_url('players/'); ?>">Player Stats</a></div>
            <div><strong>Teams</strong><a href="<?php echo cpl2026_page_url('teams/'); ?>">All Teams</a><a href="<?php echo cpl2026_page_url('players/'); ?>">Squads</a><a href="<?php echo cpl2026_page_url('news/'); ?>">Team News</a></div>
            <div><strong>Fans</strong><a href="<?php echo cpl2026_page_url('#tickets'); ?>">Tickets</a><a href="<?php echo cpl2026_page_url('#fan-zone'); ?>">Fan Guide</a><a href="<?php echo cpl2026_page_url('#fan-zone'); ?>">Fan Zone</a><a href="<?php echo cpl2026_page_url('#commercial'); ?>">Merchandise</a></div>
            <div><strong>More</strong><a href="<?php echo cpl2026_page_url('news/'); ?>">News</a><a href="<?php echo cpl2026_page_url('#videos'); ?>">Videos</a><a href="<?php echo cpl2026_page_url('venues/'); ?>">Venues</a><a href="<?php echo cpl2026_page_url('#contact'); ?>">Contact Us</a><a href="<?php echo cpl2026_page_url('faq/'); ?>">FAQs</a></div>
            <div><strong>Resources</strong><span>Tickets</span><span>Travel</span><span>Broadcast</span><span>Merchandise</span></div>
        </nav>
        <div class="legal">
            <span>Copyright 2026 <?php echo esc_html($settings['name']); ?>. <?php echo esc_html($settings['not_affiliated']); ?></span>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
            <a href="#">Cookie Policy</a>
        </div>
    </footer>
    <?php
}
