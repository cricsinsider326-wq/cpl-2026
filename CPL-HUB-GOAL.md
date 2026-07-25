# Goal: Implement the approved CPL 2026 topical hub

## Outcome
Build a continuous, production-ready, responsive and SEO-friendly CPL 2026 hub page that closely reproduces the approved numbered references in `references/` while preserving verified project content, routes and functionality.

## Safety first
- Work in an isolated worktree or a dedicated branch.
- Inspect the repository before editing.
- Do not modify unrelated pages.
- Do not delete existing data or assets.
- Run the existing project checks after changes.

## Inspect before implementation
1. Locate the existing CPL 2026 route/page.
2. Identify the framework, styling approach, data sources, SEO utilities and reusable components.
3. Read `.agents/rules/cpl-hub-design.md` and `references/REFERENCE-MAP.md`.
4. Review all references in numerical order.
5. Identify inconsistent or unverified sports facts in the screenshots and do not copy them blindly.

## Visual fidelity
Treat the numbered references as approved design blueprints.

Preserve:
- section order
- desktop hierarchy
- text/image proportions
- heading scale
- navy, purple and gold visual system
- open editorial composition
- divider, CTA and background treatment

Avoid:
- generic dashboard styling
- repeated equal-sized card grids
- rounded outer containers around every section
- excessive shadows and borders
- replacing open compositions with boxed modules

## Page structure
1. Header and hero
2. About CPL 2026 and tournament format
3. CPL 2026 fixtures and next match
4. CPL 2026 teams and squads
5. CPL 2026 players, squads and role navigation
6. CPL 2026 points table, venues and host destinations
7. CPL 2026 final
8. CPL 2026 tickets and how to watch
9. Latest CPL 2026 updates and previous-season records
10. CPL 2026 FAQs, related guides, sources, editor note and footer

## Content and SEO
- Use real semantic HTML, not flattened screenshot text.
- Use exactly one H1 and logical H2/H3 headings.
- Preserve or improve metadata, canonical URL and internal linking.
- Naturally support topics such as CPL 2026 schedule, fixtures, teams, squads, players, points table, venues, tickets and how to watch.
- Do not keyword-stuff.
- Use accessible FAQ accordions.
- Add structured data only through the project's established SEO system and only when valid.

## Data
Keep schedules, standings, venues, teams, tickets and broadcasters in updateable data structures separate from layout components.
Use existing verified project data and official repository assets. Clearly mark TBC/unconfirmed information. Never invent facts.

## Assets
- Use existing official logos and real player/venue assets when available.
- Do not crop or extract fake logos/players from the AI references.
- Optimize images and reserve dimensions.
- Keep the hero image eager/high priority; lazy-load below-the-fold images.

## Responsive requirements
- Desktop: visually close to references.
- Tablet: simplify multi-column areas without losing hierarchy.
- Mobile: clean single-column flow, touch-friendly controls, no page-level horizontal overflow.
- Wide data tables may use accessible horizontal scrolling.

## Execution phases
Implement in this order and verify each phase before proceeding:

### Phase 1
Shared design tokens/page shell, reference 01 and reference 02.

### Phase 2
Reference 03 and reference 04.

### Phase 3
Reference 05 and reference 06.

### Phase 4
Reference 07 and reference 08.

### Phase 5
Reference 09 and reference 10.

### Phase 6
Full responsive, accessibility, SEO and performance QA.

## Browser verification
Use the browser after each phase. Test at approximately:
- 1440px desktop
- 1024px laptop/tablet landscape
- 768px tablet
- 390px mobile

Compare rendered sections to their references. Correct major differences in section height, margins, heading line breaks, image scale/placement, column proportions, divider positions, visual density, overflow and contrast.

## Completion criteria
Do not mark complete until:
- lint/typecheck/build commands pass, or existing failures are clearly documented
- all 10 sections exist in the correct order
- desktop references are closely matched
- mobile has no page-level horizontal overflow
- navigation/buttons/accordions work
- tables remain readable
- images have alt text and stable dimensions
- verified project data is preserved
- final browser screenshots/recordings and a file-change summary are produced
