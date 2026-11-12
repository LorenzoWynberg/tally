# Count history

Below the count, a "Recent counts" list shows the last five counts this tab reached. It lives in memory only: nothing is written to `localStorage`, and a reload empties it.

## State

`app.js` holds `recentCounts`, an array in module scope capped at `HISTORY_LIMIT` (5). `renderHistory()` rebuilds the `<ol id="history-list">` from it with `replaceChildren` and sets `hidden` on the `<section id="history">` while the array is empty, so the section is absent on a fresh load.

## What gets recorded

- `addToCount()` does `unshift(count)` after applying a change, then trims the array to five. Newest count comes first. A no-op (clamped `-1` at zero) returns early and records nothing.
- `reset()` empties `recentCounts` after a confirmed reset, then calls `renderHistory()`. A dismissed confirm changes nothing.
- The cross-tab `storage` listener does not touch `recentCounts`: history reflects only this tab's own actions.

## Markup and styling

The list is an ordered list labelled by its `<h2>` heading through `aria-labelledby`. `.history[hidden]` is set to `display: none` explicitly, since the class otherwise could override the `hidden` attribute. Styles use `--muted`, spacing and text scale tokens only. The live region does not announce history.

Tests are in `tests/history.spec.js`, including a mixed add and subtract case.
