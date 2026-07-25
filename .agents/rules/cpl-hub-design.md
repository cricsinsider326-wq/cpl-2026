# CPL 2026 Hub — Locked Workspace Design Rule

Apply this rule to every task affecting the CPL 2026 hub page.

## Approved visual source
The numbered files in `references/01-hero.png` through `references/10-faq-footer.png` are the approved visual design specification, not loose inspiration.

Match their overall:
- section order and hierarchy
- desktop composition and column proportions
- heading scale and line breaks where practical
- dark navy base with purple and gold accents
- open editorial sports-magazine layout
- image placement, visual density, dividers and CTA treatment
- spacing rhythm and background transitions

## Do not redesign
Do not:
- replace the approved composition with a generic dashboard
- add repeated rounded cards around every content group
- wrap open sections in large bordered containers
- turn asymmetric layouts into equal card grids
- invent a new color system, font scale or button style
- shrink important imagery merely to fit a generic component
- reorder or merge sections without a clear technical necessity
- embed the reference screenshots as webpage sections

## Real implementation
All headings, paragraphs, links, buttons, tabs, tables, FAQs and labels must be real semantic HTML and accessible interactive elements. Reference images are layout blueprints only.

Use:
- one H1
- logical H2/H3 hierarchy
- descriptive alt text
- keyboard-accessible controls
- visible focus states
- responsive and horizontally scrollable data tables where necessary
- reduced-motion support

## Data accuracy
Do not treat names, dates, logos, statistics, players, broadcasters or fixtures visible inside AI-generated references as verified facts.

Prefer, in this order:
1. existing verified project data
2. official assets already in the repository
3. clearly marked placeholders/TBC states

Never invent missing sports data.

## Responsiveness
Desktop should closely reproduce the references. Tablet may simplify columns. Mobile should become a clean single-column flow without horizontal page overflow. Do not preserve desktop composition by making text unreadably small.

## Performance
Reuse existing components and tokens where they do not conflict with the approved design. Avoid unnecessary dependencies and CSS duplication. Optimize images, reserve dimensions, lazy-load below-the-fold imagery, and do not lazy-load the main hero image.

## Verification gate
Before declaring a section complete, compare it in the browser with its numbered reference at desktop width and verify mobile behavior. Fix major mismatches in spacing, scale, alignment, hierarchy, overflow and contrast.
