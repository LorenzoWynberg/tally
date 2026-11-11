# App structure

`index.html` holds the whole DOM shell: a visually-hidden `<h1>`, the `#today` date paragraph right below the title, the count (`#count`, inside a visually-hidden-labelled `<p class="count">`), the `#tap-button` (labelled "+1, add one" via `aria-label`), the `#reset-button`, and the `#live-region` paragraph (`aria-live="polite"`, `aria-atomic="true"`, visually hidden). It carries a `Content-Security-Policy` meta tag restricting sources to `'self'` (plus `data:` for images) and disabling form submission.

`app.js` is a single IIFE that queries these elements by id, wires `click` listeners on both buttons, renders the current count into `#count` on load and after every change, and renders today's date into `#today` once on load via `renderDate()`. `renderDate()` formats `new Date()` with `Intl.DateTimeFormat(undefined, { day: "numeric", month: "long", year: "numeric" })` — the visitor's own locale and timezone — and sets `#today`'s `lang` attribute to `formatter.resolvedOptions().locale` before writing the text, so a locale other than the page's hardcoded `<html lang="en">` is still announced correctly by a screen reader. It has no module system and no build step: the file served by GitHub Pages is the file in the repo.

`styles.css` is the only stylesheet; see [design tokens](../../rules/design-tokens.md) for how it is organized around `DESIGN.md`'s roles and scales rather than literal values.

For how the count itself is held, persisted and synced, see [counter state](counter-state.md).
