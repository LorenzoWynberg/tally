# Counter state

`app.js` keeps the count in one `let count` variable in module scope, mirrored to `localStorage` under the key `tally.count` as a string. There is no framework state layer: every change to `count` is followed by a direct call to `render()`, which writes `String(count)` into `#count`'s `textContent`.

## Startup and validation

On load, `count` is initialized from `readStored()`, which reads the storage key through `parseCount()`. A stored value is accepted only as a non-negative base-10 integer string matching `/^\d+$/` that also fits `Number.isSafeInteger`; anything else (missing key, `"abc"`, `"-2"`, `"1.5"`) loads as `0`. `parseCount()` is also what the cross-tab storage listener uses to read an incoming value, so an invalid or missing value from any source — not just first load — resolves to `0`.

## Storage-failure resilience

`storageAvailable()` probes `localStorage` once at startup (set and remove a probe key inside a `try`/`catch`) and caches the result in `hasStorage`. When `false` (private browsing, a full quota, or storage disabled), `readStored()` and `writeStored()` both short-circuit to no-ops, and the counter runs entirely in memory for the session — taps still increment and render, they just are not persisted.

Even when `hasStorage` is `true` at startup, a write can still fail later (e.g. quota exceeded mid-session). `writeStored()` wraps its `localStorage.setItem` call in its own `try`/`catch`: on failure it swallows the exception and leaves `count` (the in-memory value) as the authority — the displayed count keeps advancing on every tap rather than rolling back or getting stuck.

## Increment and reset

`increment()` adds one to `count`, renders, persists via `writeStored()`, announces `"Count: <n>"` through the live region, and returns focus to the tap button. It does not re-sync from storage before adding — a `Math.max` reconciliation was tried and removed, since it could resurrect a stale higher count over an authoritative lower one from a concurrent reset in another tab.

`reset()` gates on `window.confirm("Reset the count to zero?")`. Accepting sets `count` to `0`, renders, persists, announces `"Count reset to 0"`, and returns focus to the reset button. Dismissing the confirm leaves `count` and storage untouched.

## Cross-tab sync

A `storage` event fires in every other tab with the same origin when one tab's `localStorage` write succeeds (never in the tab that wrote it). `app.js` listens for it, ignoring any event whose `key` is neither `tally.count` nor `null` (a `null` key means the whole storage area was cleared). On a matching event it sets `count` from `parseCount(event.newValue)` and calls `render()` — display-only: it does not call `writeStored()` (the writing tab already persisted it) and does not call `announce()`, so a tap made in another tab updates this tab's number silently rather than narrating someone else's action.
