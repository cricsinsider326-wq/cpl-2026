# CPL Insider UX, SEO and Content Blueprint

Updated: 15 July 2026

## 1. Existing Homepage Audit

- The supplied hero has strong sports energy and a clear CPL identity, but the old page repeated too many visually similar cards below it.
- Fixtures, highlights and news had unequal content heights, producing dead space and weak reading order.
- The full CPL guide on the homepage mixed urgent match intent with long-form research intent.
- Small labels, heavy uppercase styling and inconsistent panel accents reduced readability.
- Scores, broadcasters and player figures needed clearer confirmed, previous-season and to-be-announced labels.
- FAQ and SportsEvent schema were being emitted on pages where the visible content did not support them.

## 2. Revised Sitemap

Primary navigation:

- `/`
- `/cpl-2026/`
- `/fixtures/`
- `/results/`
- `/teams/`
- `/points-table/`
- `/players/`
- `/news/`
- `/videos/`

Support clusters:

- `/live-score/`
- `/venues/`
- `/how-to-watch/`
- `/tickets/`
- `/faq/`
- `/history/`
- `/winners-list/`
- `/records/`
- `/past-seasons/`

Trust and utility:

- `/about/`
- `/contact/`
- `/editorial-policy/`
- `/correction-policy/`
- `/privacy-policy/`
- `/search/` with `noindex,follow`

Entity silos remain at `/teams/{team}/`, `/players/{player}/`, `/venues/{venue}/` and readable team-versus-team fixture slugs. URLs do not use post dates or match numbers.

## 3. Homepage Information Architecture

1. Utility bar and sticky navigation
2. Supplied CPL 2026 hero artwork
3. Next confirmed fixture
4. Featured highlight with fixtures and news
5. Seven teams
6. Tabbed tournament hub
7. Players, venues and how-to-watch previews
8. Short CPL 2026 pillar preview
9. Four homepage FAQs
10. Newsletter
11. Footer

The homepage answers urgent tasks. Full explanations live in the pillar or supporting pages.

## 4. CPL 2026 Pillar Information Architecture

1. Breadcrumb
2. Keyword-focused H1 and short introduction
3. Real last-updated date
4. Quick facts
5. Sticky section navigation
6. Overview
7. Dates and tournament format
8. Schedule preview
9. Teams
10. Standings explanation
11. Players and statistics labels
12. Venue guides
13. How to watch
14. Tickets
15. History cluster
16. Ten FAQs
17. Source policy, authorship and real update history

## 5. Desktop Homepage Wireframe

```text
+ Utility bar ---------------------------------------------------------+
+ Logo | primary navigation | search | tickets -----------------------+
| Full-width supplied CPL 2026 hero                                  |
+---------------------------------------------------------------------+
| Upcoming | Team A      VS      Team B | venue | actions             |
+---------------------------------------------------------------------+
| Featured 16:9 highlight       | Five upcoming fixtures              |
|                               | Four latest stories                  |
+---------------------------------------------------------------------+
| Seven equal team cards in a horizontal desktop grid                 |
+---------------------------------------------------------------------+
| Tournament hub tabs                                                 |
| Active data panel                                      | CTA panel  |
+---------------------------------------------------------------------+
| Players to watch | Venue guides | How to watch                      |
+---------------------------------------------------------------------+
| Short guide copy and facts                    | stadium image        |
+---------------------------------------------------------------------+
| Four FAQ accordions                                                |
+---------------------------------------------------------------------+
| Newsletter                                                         |
+---------------------------------------------------------------------+
| Organized footer                                                   |
+---------------------------------------------------------------------+
```

## 6. Mobile Homepage Wireframe

```text
+ Logo | search | menu +
| Cropped hero artwork   |
+------------------------+
| Upcoming match         |
| Team A  VS  Team B     |
| Match and ticket CTAs  |
+------------------------+
| Featured highlight     |
+------------------------+
| Upcoming fixtures      |
+------------------------+
| Latest news            |
+------------------------+
| Swipeable teams        |
+------------------------+
| Scrollable hub tabs    |
| Active hub content     |
+------------------------+
| Players                |
| Venues                 |
| How to watch           |
+------------------------+
| Guide preview          |
| FAQ                    |
| Newsletter             |
| Footer                 |
+------------------------+
```

## 7. Design System

- Background: `#050816`
- Secondary surface: `#0B1024`
- Card surface: `#12132E`
- Elevated surface: `#24133F`
- Primary accent: `#FFD400`
- Secondary accent: `#7A3FF2`
- Primary text: `#FFFFFF`
- Body copy: `#D6DBEA`
- Muted text: `#9AA3BC`
- Display font: Barlow Condensed
- Body font: Inter
- Radius: 8px
- Controls: minimum 44px target size
- Spacing: 4, 8, 12, 16, 24, 32, 48, 64 and 96px

Yellow is reserved for important actions and active states. Cyan, green and red are functional rather than decorative.

## 8. Reusable Components

- Sticky header and mobile drawer
- Image hero with accessible hotspot links
- Upcoming match card
- Fixture row
- News row
- Deferred video thumbnail
- Team card
- Accessible tournament tabs
- Points preview table
- Player row
- Venue card
- How-to-watch callout
- Guide preview
- FAQ accordion
- Newsletter form state
- Breadcrumbs and sticky table of contents
- Source and update-history block

## 9. SEO Strategy

- One H1 and unique title, description and canonical per generated page.
- Homepage targets the brand and broad CPL 2026 navigation intent.
- `/cpl-2026/` targets the main schedule, teams, points table, results and watch intent.
- Entity pages answer team, player, venue and fixture-specific searches.
- Historical pages remain separate from the current-season cluster.
- Search results are `noindex,follow`.
- Thin country, tag and date archive pages are not generated.
- Confirmed, previous-season and to-be-announced data states are visible in the copy.

## 10. Internal Linking Strategy

- Homepage links to every primary hub.
- Pillar links to schedule, teams, standings, players, venues, viewing, tickets and history.
- Supporting pages link back to the pillar.
- Team pages link to team fixtures and player profiles.
- Fixture pages link to both teams, venue, live score and points table.
- Descriptive anchors are used instead of generic “click here” labels.

## 11. Structured Data Plan

- Every indexable page: WebSite, Organization and BreadcrumbList.
- `/cpl-2026/`: SportsEvent and FAQPage when visible content matches.
- `/faq/`: FAQPage.
- Future news detail pages: NewsArticle with real dates and author data.
- Future video detail pages: VideoObject with real thumbnail, duration and upload date.
- Future player pages: Person only after verified profile fields are available.
- Fake ratings, scores, live status and reviews are prohibited.

## 12. Content Templates

Team template: identity, city/country, captain, coach, home venue, titles, overview, squad, fixtures, results, form, leaders, news, videos, history and FAQ.

Player template: identity, country, team, role, styles, career numbers, current season, recent matches, awards, news, videos and FAQ.

Venue template: overview, map, capacity, pitch, verified averages, toss trends, scheduled matches, entry, transport, parking, facilities, accessibility, accommodation and FAQ.

Match template: status, teams, date, local time, venue, toss, XI, scorecard, innings, partnerships, player of the match, summary, highlights, head-to-head and next fixtures.

Unconfirmed fields display “To be announced” instead of invented content.

## 13. Responsive Behavior

- Desktop content width stays below 1380px.
- Long-form reading width stays near 780px.
- Teams become a swipeable row on tablets and phones.
- Tables scroll horizontally without shrinking text.
- Pillar navigation scrolls horizontally on small screens.
- Multi-column media, support and trust areas stack progressively.
- Body copy remains at least 16px on mobile.

## 14. Accessibility Checklist

- Skip link and semantic landmarks
- One logical H1 per page
- Visible keyboard focus
- 44px interactive targets
- Keyboard-operable tabs with arrow keys
- Native FAQ details and summaries
- Meaningful image alternatives
- Status text in addition to color
- Form labels and live status messages
- Reduced-motion support
- Readable contrast for body and metadata text

## 15. Performance Checklist

- Hero is preloaded as the only critical image.
- Below-fold images use lazy loading and dimensions.
- Video iframe is not loaded before interaction.
- Static generation keeps HTML indexable and fast.
- JavaScript is limited to navigation, tabs, search and forms.
- Layout space is reserved for images and match modules.
- Build validation checks 108 generated pages before deployment.

## 16. Implementation Notes

The existing Node static generator remains the production stack because it already provides server-rendered HTML, clean routes and low JavaScript overhead. The redesign is separated into `homePremium.js`, `cplHub.js` and `premium.css` so future maintenance does not require editing the older stylesheet for every homepage change.

## 17. Placeholder Rules

- “Upcoming” is used only for a confirmed future fixture.
- “Live” is never shown before a real live state exists.
- Points stay at zero until completed results are confirmed.
- Player figures are labelled previous-season context.
- Broadcasters and ticket sellers remain unlisted until confirmed.
- Newsletter submission explains that the service is not connected and stores nothing.

## 18. CMS or Sports API Connection

1. Keep the current JSON models as the stable interface for teams, fixtures, players, venues and news.
2. Add an ingestion service that fetches a trusted API or CMS export.
3. Validate required fields, dates, team codes and status values before writing normalized JSON.
4. Store source URL, source timestamp and verification status with each record.
5. Rebuild only after validation passes.
6. For live data, poll into a cache and expose a stale timestamp; never write direct API responses into presentation templates.
7. Add failure behavior that preserves the last verified state and labels it with its update time.
8. Run `npm run check` before every deploy.

Recommended future data states: `scheduled`, `live`, `innings-break`, `completed`, `abandoned` and `postponed`. Only the data service should set them.
