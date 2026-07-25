# CPL Insider replication system

This project has two separate, approval-gated replication workflows. A supplied design remains the source of truth. Generated output is never deployed automatically.

## 1. Image replication

### Exact hero or banner asset

This mode preserves the full supplied composition and converts it to an optimized local WebP. It does not crop, redraw or add text.

```powershell
npm run asset:replicate -- --mode=hero --input="temp/reference/home-hero.png" --slug=home-hero-v2
```

Default output:

```text
assets/images/hero/home-hero-v2.webp
```

Headings, buttons and navigation should still be implemented as HTML/CSS unless the approved reference intentionally contains them as artwork.

### Supplied transparent player artwork

This mode trims the transparent subject, normalizes it to the shared 1120x1536 canvas and exports a transparent WebP.

```powershell
npm run asset:replicate -- --mode=player --input="temp/reference/player.png" --slug=player-slug
```

The command refuses opaque player files so an accidental rectangular background cannot enter the card system.

For built-in generated chroma-key output, remove the key locally before normalization:

```powershell
node scripts/remove-chroma-key.js --input="temp/replication/generated/player.png" --output="temp/replication/generated/player-transparent.png"
```

### OpenAI reference edit

API generation is paid and requires both an API key and explicit approval:

```powershell
$env:OPENAI_API_KEY="your-api-key"
npm run asset:replicate -- --mode=player --input="temp/reference/player.jpg" --slug=player-slug --team-colors="red, black and cyan" --generate --approve
```

The default model is `gpt-image-2`. Override it only when required:

```powershell
$env:OPENAI_IMAGE_MODEL="gpt-image-2"
```

After visual approval, update only the matching player record:

```powershell
npm run asset:replicate -- --mode=player --input="temp/reference/player.png" --slug=player-slug --update-player
```

Generation and data updates are separate on purpose. A generated portrait must be inspected before it becomes a production asset.

## 2. Page replication

Register every supplied screenshot as a page reference:

```powershell
npm run page:replicate -- --reference="temp/reference/players-desktop.png" --page=players --route=/players/ --variant=desktop
npm run page:replicate -- --reference="temp/reference/players-mobile.png" --page=players --route=/players/ --variant=mobile
```

This creates:

- private optimized references in `references/pages/<page>/` (not deployed)
- a machine-readable record in `src/data/pageReplications.json`
- an implementation brief in `docs/page-replications/<page>.md`

The page itself is implemented with the existing reusable HTML sections, data sources and CSS. The screenshot is not shipped as a fake full-page image.

After implementation, compare the rendered route to the supplied reference:

```powershell
npm run build
npm run page:replicate:audit -- --page=players --variant=desktop
```

The audit captures the route at the reference dimensions and writes:

```text
reports/replication/pages/<page>/<variant>/actual.webp
reports/replication/pages/<page>/<variant>/difference.webp
reports/replication/pages/<page>/<variant>/report.json
```

Useful audit controls:

```powershell
npm run page:replicate:audit -- --page=players --variant=desktop --tolerance=28 --max-changed=0.35
```

Pixel comparison is a review aid. Dynamic text, browser font rendering and approved responsive changes can create legitimate differences, so the final decision still requires visual inspection.

## Production gate

Before deployment:

```powershell
npm run check
npm run ui:audit
```

Then use the existing release command. The replication scripts never store HostSPK or OpenAI credentials in repository files.

## Source and rights rules

- Prefer user-owned, licensed or official publisher references.
- Do not hotlink source images in public HTML.
- Google image search can locate a reference but does not grant reuse rights.
- Keep source-page provenance in internal data while serving the final asset from `cplinsider.com`.
- Avoid official logos, sponsors and readable branding in generated player artwork unless usage rights are confirmed.
