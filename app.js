(function () {
  "use strict";

  const STORAGE_KEY = "tally.count";
  const TOTAL_KEY = "tally.total";
  const HISTORY_LIMIT = 5;

  const countEl = document.getElementById("count");
  const totalEl = document.getElementById("total-value");
  const dateEl = document.getElementById("today");
  const subtractOneButton = document.getElementById("subtract-one-button");
  const tapButton = document.getElementById("tap-button");
  const addFiveButton = document.getElementById("add-five-button");
  const addTenButton = document.getElementById("add-ten-button");
  const resetButton = document.getElementById("reset-button");
  const liveRegion = document.getElementById("live-region");
  const historySection = document.getElementById("history");
  const historyList = document.getElementById("history-list");

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

  // Raw stored string for a key, or null when storage is unavailable or throws.
  function readRaw(key) {
    if (!hasStorage) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      // Storage became unreadable after the probe: start from zero in memory.
      return null;
    }
  }

  function writeStored(key, value) {
    if (!hasStorage) return;
    try {
      localStorage.setItem(key, String(value));
    } catch {
      // Storage became unwritable mid-session: the in-memory value stays authoritative.
    }
  }

  let count = parseCount(readRaw(STORAGE_KEY));
  // Lifetime taps: only positive steps add to it; reset and -1 never touch it.
  // First run with no stored total seeds it from the current count.
  const rawTotal = readRaw(TOTAL_KEY);
  let total = rawTotal === null ? count : parseCount(rawTotal);
  if (rawTotal === null) writeStored(TOTAL_KEY, total);
  // Session-only: the last few counts reached by this tab's own actions.
  // Never persisted, never touched by other tabs' storage events.
  let recentCounts = [];

  function renderHistory() {
    historyList.replaceChildren(
      ...recentCounts.map(function (value) {
        const item = document.createElement("li");
        item.textContent = String(value);
        return item;
      }),
    );
    historySection.hidden = recentCounts.length === 0;
  }

  function render() {
    countEl.textContent = String(count);
    subtractOneButton.setAttribute(
      "aria-disabled",
      count <= 0 ? "true" : "false",
    );
  }

  function renderTotal() {
    totalEl.textContent = String(total);
  }

  function renderDate() {
    const formatter = new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    dateEl.lang = formatter.resolvedOptions().locale;
    dateEl.textContent = formatter.format(new Date());
  }

  function announce(message) {
    liveRegion.textContent = message;
  }

  function pulse() {
    if (typeof window.navigator.vibrate === "function") {
      window.navigator.vibrate(15);
    }
  }

  function addToCount(step, button) {
    const next = Math.max(0, count + step);
    if (next === count) return;
    pulse();
    count = next;
    recentCounts.unshift(count);
    recentCounts.length = Math.min(recentCounts.length, HISTORY_LIMIT);
    render();
    renderHistory();
    writeStored(STORAGE_KEY, count);
    if (step > 0) {
      total += step;
      writeStored(TOTAL_KEY, total);
      renderTotal();
    }
    announce("Taps: " + count);
    button.focus();
  }

  function reset() {
    if (!window.confirm("Reset the count to zero?")) return;
    count = 0;
    recentCounts = [];
    render();
    renderHistory();
    writeStored(STORAGE_KEY, count);
    announce("Count reset to 0");
    resetButton.focus();
  }

  // Another tab changed the count (or cleared storage, where key is null):
  // mirror it on screen, without writing back or announcing (avoids chatter
  // from another tab's taps).
  window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEY || event.key === null) {
      count = parseCount(event.newValue);
      render();
    }
    if (event.key === TOTAL_KEY || event.key === null) {
      total = parseCount(event.newValue);
      renderTotal();
    }
  });

  subtractOneButton.addEventListener("click", function () {
    addToCount(-1, subtractOneButton);
  });
  tapButton.addEventListener("click", function () {
    addToCount(1, tapButton);
  });
  addFiveButton.addEventListener("click", function () {
    addToCount(5, addFiveButton);
  });
  addTenButton.addEventListener("click", function () {
    addToCount(10, addTenButton);
  });
  resetButton.addEventListener("click", reset);

  render();
  renderTotal();
  renderHistory();
  renderDate();
})();
