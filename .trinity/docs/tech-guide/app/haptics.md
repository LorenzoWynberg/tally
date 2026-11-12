# Haptics

`app.js` defines `pulse()`, which calls `window.navigator.vibrate(15)` — a 15 ms buzz — only when `typeof window.navigator.vibrate === "function"`. Where the Vibration API is missing (desktop browsers, iOS Safari) it does nothing and throws nothing.

`pulse()` is called from `addToCount()` after the no-op short-circuit and before the count changes. So every count-changing tap of `+1`, `+5` and `−1` vibrates once; `−1` at zero returns early and does not. `reset()` does not vibrate. `+5` pulses once, not five times.

Tests live in `tests/haptics.spec.js` (vibrate called with 15 on count-changing taps, not on a no-op) and `tests/haptics-unsupported.spec.js` (taps still work with `navigator.vibrate` removed).
