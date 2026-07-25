# CPL Insider Verified Data Pipeline

Updated: 15 July 2026

## Purpose

The static site must never publish a captain, coach, squad member, broadcaster, result or CPL 2026 player statistic as confirmed unless the record is connected to a valid source.

Run the full gate before every deployment:

```powershell
npm run check
```

This runs data validation, the static build and generated-page SEO validation.

## Source Registry

All source references live in `src/data/sources.json`.

A confirmed source requires:

- A unique `id`
- A direct `url`
- `sourceType` such as `primary`
- `status` set to `verified` or `reviewed`
- A real `lastChecked` date

Do not set a source to `verified` when its URL only points to a generic homepage and the claim requires a specific article.

## Squads and Captains

File: `src/data/squads.json`

Before adding captain, coach or player names:

1. Add the direct team or tournament announcement to `sources.json`.
2. Add one source as `sourceId`, or use `sourceIds` when local and overseas players come from separate announcements.
3. Set `completeness` to `partial` or `complete`. A complete 2026 squad must contain 17 players.
4. Set `status` to `reviewed` or `verified`.
5. Add the names exactly as published.
6. Run `npm run check`.

Named squad data without confirmed sources fails the build. Captain and coach fields remain empty until an announcement explicitly names those roles.

## Broadcasters

File: `src/data/broadcasters.json`

Each market can store:

- TV broadcaster
- Streaming platform
- Subscription requirement
- Supported devices
- Geographic restrictions
- Source ID

Named rights information without a confirmed source fails the build. Unknown values remain `null` and render as "To be announced."

## Results

File: `src/data/results.json`

Every result must:

- Reference an existing `fixtureSlug`
- Use `status: completed`
- Include a confirmed `sourceId`
- Include a human-readable match name and summary

The `/results/` page remains `noindex` and outside the sitemap while the results array is empty. It becomes indexable automatically after the first source-validated result is added.

## Player Statistics

File: `src/data/playerStats.json`

Every record must reference an existing player slug and confirmed source. Current-season statistics remain empty before verified scorecards exist. Previous-season figures in `players.json` are always labelled as historical form context.

## Current Readiness

- Fixtures: 39 records connected to the official 28 April 2026 schedule announcement
- Squad records: 7 of 7 source-validated; 3 complete and 4 partial
- Captains and coaches: awaiting explicit official announcements
- Broadcast markets: Caribbean confirmed; 5 other market groups awaiting direct 2026 rights announcements
- Results: 0 confirmed
- CPL 2026 player statistics: 0 confirmed

The build publishes the current machine-readable report at `/data-quality.json`.

## API or CMS Adapter

A future importer should normalize external data into the existing JSON files rather than sending raw API responses into templates.

Recommended flow:

```text
Primary source or sports API
        |
        v
Fetch and cache raw response
        |
        v
Normalize team, player, fixture and venue IDs
        |
        v
Validate source, status and required fields
        |
        v
Write reviewed JSON snapshot
        |
        v
npm run check
        |
        v
Deploy static output
```

If an API fails, preserve the last verified snapshot and show its last-checked timestamp. Never replace verified content with an empty or partially parsed live response.
