# Tally

Tally is a tap counter web page: tap **+1** to add one, with the count persisted in `localStorage`, kept in sync across open tabs, and reset behind a confirm guard. It ships as plain HTML, CSS and JavaScript with no framework and no build step — `index.html`, `styles.css` and `app.js` at the repo root are exactly what GitHub Pages serves.

## Rules

- [Design tokens](rules/design-tokens.md) — components read `styles.css` roles and scales from `DESIGN.md`, never a literal value
- [Accessibility](rules/accessibility.md) — WCAG 2.1 AA, contrast ratios, and what the live region announces

## Tech guide

- [App structure](tech-guide/app/structure.md) — the DOM shell and how `app.js` wires it up
- [Counter state](tech-guide/app/counter-state.md) — persistence, validation, cross-tab sync and storage-failure handling
- [Count history](tech-guide/app/count-history.md) — the in-memory list of the last five counts
- [Haptics](tech-guide/app/haptics.md) — the short vibration on count-changing taps, absent where unsupported
- [Testing](tech-guide/app/testing.md) — the Playwright suite, targeting a live deployment via `BASE_URL`, and the no-third-party-request guard

## Commands

Run from the `tally/` package root:

- `npm install` — installs dev-only tooling (Prettier, ESLint, Playwright); the shipped page itself has no runtime dependencies
- `npm run dev` — serves the page locally exactly as GitHub Pages does
- `npm run format:check` / `npm run format` — Prettier check / write
- `npm run lint` — ESLint
- `npm test` — the Playwright suite (`npx playwright install chromium` once first, if no browser is installed yet)
- `npm run check` — format check, lint and test, in that order
