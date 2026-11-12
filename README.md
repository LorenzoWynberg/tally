# Tally

Tally is a tiny tap counter web page: tap the big **+1** button to add one, and the count is remembered in your browser (`localStorage`) across reloads and kept in step across open tabs, with a small confirm-guarded **Reset** to return it to zero. It is plain HTML, CSS and JavaScript with no framework and no build step — the files at the repo root (`index.html`, `styles.css`, `app.js`) are exactly what is served. To work on it, run `npm install` (dev-only tooling: Prettier, ESLint and Playwright), then `npm run check` to run the format check, the linter and the real-browser tests (run `npx playwright install chromium` once first if Playwright has no browser yet). Run `npm run dev` to serve the page locally exactly as GitHub Pages does. The site is served by GitHub Pages straight from the `main` branch at `/` (root), with `.nojekyll` so files are served as-is.

## Theming

Tally is dark-first: the dark scheme is the default (including when a visitor states no preference) and `prefers-color-scheme: light` switches to the light scheme. Every theme token is a `--tally-<group>-<name>` custom property (for example `--tally-color-primary`, `--tally-space-4`). The comment block at the top of `styles.css` lists the old → new name for each renamed property, a breaking change for anyone theming through the old names.
