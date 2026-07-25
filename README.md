# CPL 2026 Project

This folder is the local static-first build for `cplinsider.com`. The project uses a modular generator so each section, data source and page template can be managed independently before one clean cPanel deployment.

## Project structure

- `src/data/` - teams, players, fixtures, venues, news, FAQs and site settings
- `src/sections/` - reusable page sections such as hero, teams, match center, FAQ and footer
- `src/pages/` - homepage and programmatic page templates
- `scripts/build.js` - builds the static site into `dist/`
- `dist/` - generated deployment-ready static pages
- `assets/` - shared CSS and JavaScript

## Project approach

The production site is a static-first build. Data, reusable sections and programmatic pages are updated locally, validated, built into `dist/`, and then deployed to HostSPK. Player portraits are downloaded and normalized as local WebP assets; the frontend does not hotlink official source images.

Commercial blocks should keep the disclosure visible if tickets, travel, broadcast or merchandise links become affiliate links.

## One-command automation

Run a complete local source sync, build and responsive player-directory audit:

```powershell
npm run cpl:sync
```

Preview every source and validation stage without changing player data or deploying:

```powershell
npm run cpl:sync:dry
```

Run the complete pipeline and deploy after every validation passes:

```powershell
$env:HOSTSPK_USERNAME="your-hostspk-email"
$env:HOSTSPK_PASSWORD="your-hostspk-password"
npm run cpl:release
```

For a fast content/CSS/HTML release that skips official image and role fetching:

```powershell
npm run cpl:fast
```

Useful scoped modes:

```powershell
npm run cpl:sync -- --team=TKR
npm run cpl:sync -- --refresh-images
npm run cpl:sync -- --refresh-roles
npm run cpl:sync -- --dry-run --team=GAW
npm run cpl:release -- --full
```

The runner stops before deployment if source sync, lint, data validation, build validation or responsive filters fail. Every run writes a machine-readable report to `reports/cpl-sync/latest.json`. HostSPK credentials are read from environment variables or the secure deployment prompt and are not stored in the repository.

## Design and image replication

Two reusable workflows are available for supplied designs and player artwork:

```powershell
npm run asset:replicate -- --mode=hero --input="temp/reference/hero.png" --slug=home-hero-v2
npm run asset:replicate -- --mode=player --input="temp/reference/player.png" --slug=player-slug
npm run page:replicate -- --reference="temp/reference/players-desktop.png" --page=players --route=/players/ --variant=desktop
npm run page:replicate:audit -- --page=players --variant=desktop
```

OpenAI image editing is optional, paid and blocked unless both `OPENAI_API_KEY` and `--generate --approve` are present. A generated player image does not update player data unless `--update-player` is supplied after visual approval. Page references are stored locally, implemented as real HTML/CSS components, and checked with rendered screenshot differences.

See `docs/replication-system.md` for the complete workflow and safety rules.

## Suggested next steps

1. Approve or adjust the generated homepage in `dist/index.html`.
2. Replace placeholder images and team logos with licensed/final assets.
3. Verify real CPL 2026 schedule, squads, venues and player data.
4. Keep `Last updated` timestamps current in `src/data/site.json`.
5. Expand primary-source coverage for player portraits that official publishers have not released.
6. Add new programmatic page templates only when each page has verified data and useful standalone content.

## Programmatic SEO structure

See `data/programmatic-pages.json` for the first template plan.

Initial CPL 2026 assumption for build planning: 7 teams, 39 matches, August 7 to September 20, 2026.

## Local preview

Build the site:

```powershell
npm run build
```

Run the local preview server from this folder:

```powershell
npm run serve
```

The server serves `dist/` automatically when it exists.

## Deployment

The generated files in `dist/` are deployed to the `cplinsider.com` `/public_html` document root through the HostSPK File Manager API. The generated canonical URLs, Open Graph URLs, `robots.txt`, and `sitemap.xml` point to `https://cplinsider.com/`.
