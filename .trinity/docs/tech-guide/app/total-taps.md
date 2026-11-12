# Total taps

The `Total taps` line (`#total`, with the number in `#total-value`) shows lifetime taps: a second counter kept beside the count in `app.js`.

## Storage and seeding

`total` is mirrored to `localStorage` under `tally.total`, written through the same `writeStored()` helper as the count, so storage failures fall back to memory the same way (see [Counter state](counter-state.md)). On load, a stored value goes through `parseCount()`. When the key is absent, `total` is seeded from the current `count` and written back once.

## What changes it

`addToCount(step, button)` adds `step` to `total` only when `step > 0`, so `+1`, `+5` and `+10` (`#add-ten-button`) all feed it. `-1` and reset never touch it, and the total is not clamped or recomputed from the count.

## Cross-tab sync

The `storage` listener also handles `tally.total` (and a `null` key for a cleared area): it sets `total` from `parseCount(event.newValue)` and calls `renderTotal()`. Like the count, this is display-only and silent: no write, no announcement.
