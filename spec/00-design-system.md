# Triply Design System
Version: 2.2 — Deep black + emerald, with light effects
Status: Implemented on 2026-10-05. v2.2 (owner request): colours from `Refs/cores.jpg`. Deep neutral black, emerald green, a soft top highlight on cards, faint green radial glows on the page, and green gradient buttons with a glow. v2.1 (same day, owner request) replaces orange with lime green and follows the "salesforce invoices" reference (`Refs/6483e2cb739e4f9ac22b4310a6d0bdf7.jpg`): charcoal surfaces, lime actions, light-weight large titles, pill tab bar, one light contrast panel. Banners are full width with a bottom gradient into the page; the sidebar can be collapsed. Supersedes v1.0 (Notion dark, 2026-09-07).

## Direction
The owner found v1.0 confusing and text-heavy and asked for a more visual, simpler platform: banners, image cards and carousels with image placeholders, donut and other charts. The owner first chose "dark + orange", then asked for green with the layout and colours of the salesforce invoices reference (v2.1).

Reference synthesis (`Refs/`):
- "Plan your next trip" tablet (orange on near-black): bold uppercase hero, photo cards, orange primary actions. Main palette source.
- IndiGo / Wanderlust dashboards: hero banner with a route bar, destination photo cards with an action corner, icon sidebar.
- Noora travel dashboard: greeting header, image trip cards, leave/return detail blocks.
- SmartShort sidebar: grouped menu, elevated active row with an accent bar.
- Traffic / workflow dashboards: dark stat tiles, charts and timeline bars.
- Dark glass sign-in and Golden Suisse login: split image/form auth, centred glass card.
- Azure Coast card carousel: destination cards with image, meta and price row.

Triply keeps its domain rules. Trips stay multi-stop, money labels stay explicit and nothing is invented in authenticated pages. Images are illustrated placeholders, generated deterministically from the destination or trip name (`components/ui/media.tsx`), so no external image service, upload or dependency is added. They can later be replaced by real photos.

## Semantic tokens
| Token | Value | Role |
| --- | --- | --- |
| background | #0a0b0b + green radial glows | Page canvas (`body`, fixed) |
| foreground | #f2f4f3 | Primary content |
| card | #141615 + top highlight gradient | Cards, panels |
| surface | #0f1110 | Sidebar, inputs, nested rows |
| elevated | #1b1e1d | Active navigation, secondary buttons |
| muted | #232726 | Hover, chart track |
| muted-foreground | #9aa19e | Secondary text |
| primary / primary-hover | #277b5a / #23704f (rendered as gradient #2f9068 → #22694c) | Main action (emerald) |
| primary-foreground | #f1fbf6 | Text on emerald (AA) |
| primary-muted | #10261c | Emerald-tinted badges and icons |
| link / ring / chart-1 | #5fd3a3 / #4ccf98 / #4ccf98 | Bright emerald accents |
| border | #ffffff14 | Structural borders |
| input | #69716e | Control borders |
| light / light-foreground | #eef3f0 / #0a0b0b | Light contrast panel |
| success / warning / destructive | #4ade80 / #fbbf24 / #ff8a8a (with muted backgrounds) | States |
| danger / danger-foreground | #c93a40 / #ffffff | Destructive buttons |
| chart-2…7 | #fbbf24, #2dd4bf, #60a5fa, #a78bfa, #fb7185, #94a3b8 | Other chart series |

Light effects (globals.css): `.bg-card` gets a 4.5% white top-to-transparent gradient and a 1px inner top highlight; `.bg-primary` is a vertical emerald gradient; primary buttons and links get an inner highlight plus a soft green glow (stronger on hover).

Use semantic utilities. Raw hex values are allowed only inside the illustrated scene palette of `media.tsx`. Information never relies only on colour: every chart has a text legend or label with values. Financial labels stay explicit: estimated, forecast, committed, paid and actual.

## Type and spacing
System sans stack (Inter when available). No font download. Display hero copy may be bold uppercase (landing). Page titles 32–48px, section titles 20px, metadata 12px. Tabular numerals for money. Spacing 4/8/12/16/24/32/40/64px. Content up to 1280px (`max-w-7xl`); forms 768px. Desktop sidebar 260px, collapsible to an 84px icon rail (preference stored per browser). Page banners are full-bleed above the content column and fade into the background at the bottom. Mobile: sticky top bar with a native disclosure menu, 16px gutters, no page-level horizontal scroll. Carousels (`.scroll-row`) scroll inside their own region.

Radii: controls 12px, cards 20px, feature panels/banners 28px, buttons and badges fully rounded.

## Components (`components/ui/`)
- `page.tsx`: `button` styles (primary, secondary, ghost, glass), `PageContainer`, `BackLink`, `PageHero` (image banner with eyebrow, title, meta chips, actions), `HeroChip`, `SectionHeader`, `Panel`, `IconBadge`, `Badge`, `StatTile`, `EmptyState`, `Notice`, `FormShell`.
- `charts.tsx` (SVG, no dependency): `DonutChart`, `ChartLegend`, `RingProgress` (role progressbar), `BarList`, `StackedBar`, `ColumnChart`. Each has an accessible label that lists its values.
- `media.tsx`: `DestinationImage` / `SceneArt`, stable illustrated placeholders with a readability gradient.
- `icons.tsx`: inline stroke icon set plus a travel-mode icon map.
- Focus: 2px orange outline, 3px offset. Motion: colour/opacity transitions only; reduced motion honoured.

## Page composition
- Landing: full-width image hero with uppercase headline, CTA and example route bar; inspiration carousel (labelled as examples); feature tiles; example chart preview.
- Auth/onboarding: illustrated image panel and a glass form card.
- Trips: identity header, featured next trip banner with countdown, trip-status donut, stat tiles, image trip cards with an orange action corner, archive section.
- Trip pages: shared `TripHero` (full-width photo banner, back link, title, pill tab bar for overview/route/budget/savings/itinerary/planning/documents/settings).
- Trip overview: image hero with countdown, dates, duration, travellers and stop count; stat tiles; finance donut (paid / committed unpaid / planned unbooked / budget margin) with explicit metrics; savings ring; "next step" lime callout; route carousel of destination photo cards (each opens a details pop-up) with travel-mode connectors; attention list; upcoming itinerary with date badges; reservations donut, checklist ring, documents validity donut. The full route timeline and trip management stay below.
- Finance: stat tiles, budget-usage stacked bar, category donut, destination bar list, cost rows with category colour, history rows.
- Savings: large ring, funding-source donut, stat tiles, pace cards.
- Itinerary: day strip (calendar chips) with an activities-per-day column chart; day cards with date badge, destination thumbnail, transport rows and a time-pill timeline.
- Planning: reservation-status donut, checklist ring with per-category bars, reservation cards with type icons, check-style tasks. Enum values are shown with Portuguese labels.
- Documents: validity donut, type bars, filter bar, document cards with type icon and validity badge.
- Forms: common `FormShell` with back link, icon header and panel.

## Required states and acceptance
Loading, empty, error, success, disabled and destructive states remain visible and accessible. Every existing field, route, action, confirmation and domain helper is retained. Test keyboard focus, mobile navigation, overflow at 375/768px and desktop at 1440px. Public `/design-system` uses synthetic data only. Run typecheck, lint, build, unit, E2E and harness tests. Failures are never reported as PASS.

## History
v1.0 (2026-09-07) adapted the Notion dark reference and used 21st.dev references for the sidebar, trip card, finance rows and timeline (demos 14941, 7957, 8253, 5157). v2.0 replaces its tokens and compositions.
