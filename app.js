(function () {
  "use strict";

  const STORAGE_KEY = "tally.count";

  const countEl = document.getElementById("count");
  const tapButton = document.getElementById("tap-button");
  const resetButton = document.getElementById("reset-button");
  const liveRegion = document.getElementById("live-region");

  // A stored count is valid only as a non-negative base-10 integer string.
  function parseCount(value) {
    if (typeof value !== "string" || !/^\d+$/.test(value)) return 0;
    const n = Number(value);
    return Number.isSafeInteger(n) ? n : 0;
  }

  // Private mode, a full quota or disabled storage can make any localStorage
  // access throw. The counter then runs in memory for the session, silently.
  function storageAvailable() {
    try {
      const probeKey = "__tally_probe__";
      localStorage.setItem(probeKey, "1");
      localStorage.removeItem(probeKey);
      return true;
    } catch {
      return false;
    }
  }

  const hasStorage = storageAvailable();

  function readStored() {
    if (!hasStorage) return 0;
    try {
      return parseCount(localStorage.getItem(STORAGE_KEY));
    } catch {
      // Storage became unreadable after the probe: start from zero in memory.
      return 0;
    }
  }

  function writeStored(value) {
    if (!hasStorage) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // Storage became unwritable mid-session: the in-memory count stays authoritative.
    }
  }

  let count = readStored();

  function render() {
    countEl.textContent = String(count);
  }

  function announce(message) {
    liveRegion.textContent = message;
  }

  function increment() {
    count += 1;
    render();
    writeStored(count);
    announce("Count: " + count);
    tapButton.focus();
  }

  function reset() {
    if (!window.confirm("Reset the count to zero?")) return;
    count = 0;
    render();
    writeStored(count);
    announce("Count reset to 0");
    resetButton.focus();
  }

  // Another tab changed the count (or cleared storage, where key is null):
  // mirror it on screen, without writing back or announcing.
  window.addEventListener("storage", function (event) {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    count = parseCount(event.newValue);
    render();
  });

  tapButton.addEventListener("click", increment);
  resetButton.addEventListener("click", reset);

  render();
})();
