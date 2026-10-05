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
