<?php
/**
 * CPL 2026 Guide theme functions.
 *
 * @package CPL_2026_Guide
 */

if (!defined('ABSPATH')) {
    exit;
}

define('CPL2026_THEME_VERSION', '0.1.0');

function cpl2026_theme_setup(): void
{
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script']);

    register_nav_menus([
        'primary' => __('Primary Navigation', 'cpl-2026-guide'),
        'footer' => __('Footer Navigation', 'cpl-2026-guide'),
    ]);
}
add_action('after_setup_theme', 'cpl2026_theme_setup');

function cpl2026_enqueue_assets(): void
{
    wp_enqueue_style(
        'cpl2026-fonts',
        'https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@500;600;700;800&family=Inter:wght@400;500;600;700;800;900&display=swap',
        [],
        null
    );

    wp_enqueue_style(
        'cpl2026-app',
        get_template_directory_uri() . '/assets/styles.css',
        ['cpl2026-fonts'],
        CPL2026_THEME_VERSION
    );

    wp_enqueue_script(
        'lucide',
        'https://unpkg.com/lucide@latest/dist/umd/lucide.min.js',
        [],
        null,
        true
    );

    wp_enqueue_script(
        'cpl2026-app',
        get_template_directory_uri() . '/assets/app.js',
        ['lucide'],
        CPL2026_THEME_VERSION,
        true
    );
}
add_action('wp_enqueue_scripts', 'cpl2026_enqueue_assets');

function cpl2026_get_site_settings(): array
{
    return [
        'name' => 'CPL 2026 Guide',
        'short_name' => 'CPL 2026',
        'tagline' => 'Independent CPL 2026 guide for teams, fixtures, players and live updates',
        'description' => 'Independent CPL 2026 guide covering Caribbean Premier League teams, fixtures, players, points table, venues, live score updates and fan information.',
        'event_name' => 'Caribbean Premier League 2026',
        'start_date' => '2026-08-07',
        'end_date' => '2026-09-20',
        'last_updated' => 'July 13, 2026',
        'not_affiliated' => 'Independent fan resource; not affiliated with Caribbean Premier League.',
        'commercial_disclosure' => 'Some future links may be affiliate links. We will clearly label paid or partner placements.',
    ];
}

function cpl2026_get_seed_items(string $type): array
{
    if (function_exists('cpl2026_data_get_items')) {
        return cpl2026_data_get_items($type);
    }

    return [];
}

function cpl2026_page_url(string $path = ''): string
{
    return esc_url(home_url('/' . ltrim($path, '/')));
}

function cpl2026_render_icon(string $icon): string
{
    return '<i data-lucide="' . esc_attr($icon) . '"></i>';
}

function cpl2026_json_ld(): void
{
    $settings = cpl2026_get_site_settings();
    $teams = cpl2026_get_seed_items('teams');
    $faqs = cpl2026_get_seed_items('faqs');

    $schema = [
        '@context' => 'https://schema.org',
        '@graph' => [
            [
                '@type' => 'WebSite',
                'name' => $settings['name'],
                'description' => $settings['description'],
                'publisher' => ['@id' => '#cpl-2026-guide'],
                'inLanguage' => 'en',
            ],
            [
                '@type' => 'Organization',
                '@id' => '#cpl-2026-guide',
                'name' => $settings['name'],
                'description' => 'Independent cricket guide and fan resource for CPL 2026. Not affiliated with Caribbean Premier League.',
            ],
            [
                '@type' => 'SportsEvent',
                'name' => $settings['event_name'],
                'alternateName' => $settings['short_name'],
                'startDate' => $settings['start_date'],
                'endDate' => $settings['end_date'],
                'sport' => 'Cricket',
                'eventAttendanceMode' => 'https://schema.org/OfflineEventAttendanceMode',
                'eventStatus' => 'https://schema.org/EventScheduled',
                'location' => ['@type' => 'Place', 'name' => 'Caribbean'],
                'competitor' => array_map(
                    static fn(array $team): array => ['@type' => 'SportsTeam', 'name' => $team['name'] ?? 'CPL Team'],
                    $teams
                ),
            ],
            [
                '@type' => 'FAQPage',
                'mainEntity' => array_map(
                    static fn(array $faq): array => [
                        '@type' => 'Question',
                        'name' => $faq['question'] ?? '',
                        'acceptedAnswer' => ['@type' => 'Answer', 'text' => $faq['answer'] ?? ''],
                    ],
                    $faqs
                ),
            ],
        ],
    ];

    echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . '</script>' . "\n";
}
add_action('wp_head', 'cpl2026_json_ld', 20);

require get_template_directory() . '/inc/template-tags.php';
