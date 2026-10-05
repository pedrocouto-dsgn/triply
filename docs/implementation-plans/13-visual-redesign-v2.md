# Triply visual redesign v2 — dark + orange
Owner request (2026-10-05): the layout is confusing and too text-heavy. The owner wants it recreated from the references in `Refs/`, more visual (banners, image cards, carousels with image placeholders, donut and other charts), simpler and intuitive. The owner chose the "dark + orange" theme.

## Scope
Allowed: `app/globals.css`, `app/**/page.tsx`, `components/shared/*`, `components/ui/*` (new kit), `features/**/components/*.tsx`, `features/auth/*form.tsx`, `features/planning/labels.ts` (new, presentation labels only), `tests/unit/design-system.test.ts`, `tests/e2e/design-system.spec.ts`, `spec/00-design-system.md`, `eslint.config.mjs` (ignore generated build/test folders only), this plan.
Forbidden: actions, queries, schemas, domain calculations and types, Supabase, proxy, dependencies and lockfile, harness, functional specs.

## Decisions
- No new dependency. Charts are SVG, icons are inline SVG, and images are deterministic illustrated placeholders. No external image service is used.
- Contrast: white text on #ff6b2c fails AA, so text on orange is dark (#1a0b03). Danger buttons get their own `danger-foreground` token, and the contrast test pairs were updated accordingly.
- Copy fix: sign-up no longer says email confirmation is required (spec v1.1 amendment, 2026-09-07).
- Planning reservation/checklist enum values are shown with Portuguese labels. Submitted values are unchanged.

## Validation
See the final validation section below.

## Final validation — 2026-10-05
- `npx tsc --noEmit`: PASS.
- `npx eslint .`: 0 errors, 14 pre-existing warnings (non-UI files). Generated `.next-e2e`, `playwright-report` and `test-results` are now ignored; before this they added 6,558 problems from build output.
- `npm run test`: PASS, 141 tests / 22 files (contrast pairs extended for `elevated`, `link` on background, `danger-foreground`).
- `npm run build`: PASS.
- `npx playwright test`: PASS, 9/9 (375/768/1440 design system, mobile navigation and focus, forms, landing and sign-in at 375px).
- `npm run test:harness`: PASS, 86/86.
- `npm run harness:typecheck`: FAIL, pre-existing and unchanged (missing `execa` and `enquirer` modules in the harness; reproduced on the unmodified tree).
- Visual review: screenshots of landing, sign-in and `/design-system` at 1440px and 375px. A horizontal overflow at 375/768px was fixed by making `.scroll-row` contain absolutely positioned screen-reader text.
- Not exercised: authenticated pages with a live account. They are covered by typecheck, build and the shared components rendered in `/design-system`.

## v2.1 — owner change requests (2026-10-05)
1. Lime green instead of orange, with the layout and colours of `Refs/6483e2cb739e4f9ac22b4310a6d0bdf7.jpg`.
2. Every banner is full width with a bottom gradient. All trip pages share `TripHero` and a pill tab bar.
3. "Rota e destinos" now has its own page, `/trips/{id}/route`. The old `#route` anchor link did not work reliably. Route actions now redirect there and show their status messages.
4. The sidebar collapses and expands, and the preference is stored in localStorage via `useSyncExternalStore`.
5. Real photos: the owner chose Unsplash (new external service, approved by owner choice). It needs the server-only `UNSPLASH_ACCESS_KEY` and falls back to illustrations. The owner's upload always wins.
6. A route card opens a details pop-up (native `<dialog>`).
7. Destination image upload on the edit page shows the recommended size (spec 03 amendment v1.1, additive migration `202610050011_stop_images.sql`, private bucket).

Scope additions: `features/media/*`, `features/route/images.ts`, `image-actions.ts`, `image-types.ts`, `route-carousel.tsx`, `stop-image-form.tsx`, `app/(app)/trips/[tripId]/route/page.tsx`, the route actions redirect target, spec 03 amendment, migration, `.env.example`.

Validation (v2.1): tsc PASS; eslint 0 errors, 14 pre-existing warnings; unit 142/142; build PASS; E2E 9/9; harness 86/86. The route pop-up was tested in the browser (opens, shows details, closes with Esc, no page errors). No horizontal overflow at 375px.
Pending owner actions: apply the migration in Supabase; create an Unsplash access key and set `UNSPLASH_ACCESS_KEY` in `.env.local` and in Vercel.

## v2.2 — owner change requests (2026-10-05)
1. Photos without an API key: Wikipedia REST summary (pt, then en), keyless. If the lead image is a flag, map or montage, the first real photo inside the article is used. Wikimedia only serves standard thumbnail widths (1280/1920), and the requests send an identifying User-Agent. Order: owner upload, then Unsplash (only if `UNSPLASH_ACCESS_KEY` is set), then Wikipedia, then illustration. Attribution: "Wikimedia Commons / Wikipedia" with a link to the article.
2. The pill tab bar was removed from banners because it duplicated the sidebar.
3. "Rota e destinos" was verified in the owner's browser: direct load and sidebar navigation both work. The earlier hang matched the first dev compile (~4.5 s with no feedback), so `app/(app)/trips/[tripId]/loading.tsx` now gives instant feedback.
4. "Gerir viagem" (archive/delete) moved from the overview to trip settings (`#management`).
5. The overview "Precisa de atenção" card became a Checklist card: the first 5 tasks plus a "Ver todas" link to `/planning#checklist-title`. The duplicate checklist ring was replaced by a "Transportes" status donut, and the Checklist stat tile by "Atividades". The next-step callout still uses the attention rules.

Validation (v2.2): tsc PASS; eslint 0 errors, 14 pre-existing warnings; unit 142/142; build PASS; E2E 9/9; harness 86/86. Checked in the owner's session: overview with Wikipedia photos, checklist card and route navigation.

## v2.3 — budget simplification, route insert, map, cover (2026-10-05)
Owner requests: a three-card budget (Objetivo / Já temos / Falta) editable in place; expense cards per category (Alojamento/Transportes/Atividades plus custom) with inline add, edit, paid and remove; destination and category forecasts with add buttons; the same simplification for savings; a cover-photo edit button; a working "+" between and after route cards; a route map in the route banner.

Implementation: `features/finance/budget.ts` (pure, unit-tested), `budget-actions.ts` (inline server actions on the existing schema; history kept through refunds and archiving), `components/budget-ui.tsx` and `budget-view.tsx`. The old finance dashboard, category manager, savings summary and available-funds form were removed (unused). `/trips/{id}/cover` redirects to the first destination's image upload. `create_route_stop_at` (migration 012) inserts chronologically. `components/ui/route-map.tsx` is a dependency-free SVG map: OSM tiles and Nominatim geocoding are keyless and cached.

Validation (v2.3): tsc PASS; eslint 0 errors, 14 pre-existing warnings; unit 145/145 (+3 budget); build PASS; E2E 9/9 (dashboard headings updated to Orçamento / Gastos por categoria); harness 86/86. Checked in the owner's session: budget cards and inline edit opening (nothing saved), route map with Amsterdam and Praga pins.
Pending owner action: apply migration 202610050012 in Supabase.
