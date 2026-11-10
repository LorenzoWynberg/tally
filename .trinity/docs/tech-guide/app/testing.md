# Testing

Shape: [App structure](structure.md)

`tests/` holds the Playwright suite that `npm test` and `npm run check` run. `playwright.config.js` serves the repo root exactly as GitHub Pages does: a static `http-server`, no build step.

## Targeting a live deployment

`playwright.config.js` reads `BASE_URL` from the environment. When it is set, the suite's `baseURL` comes from it and no `webServer` block is defined at all — Playwright never tries to spawn a local server against a remote URL. This lets the same suite run, unchanged, against a local static server (the default) or against the live GitHub Pages URL, by setting `BASE_URL` before the run.

## No third-party requests

`tests/shell.spec.js` collects every `request.url()` the page makes on load and after a tap, and asserts each one resolves to the page's own origin. This guards the no-tracking, no-build constraint at the network level: a dependency or script that reaches out to any other origin fails this test.
