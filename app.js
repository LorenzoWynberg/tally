(function () {
  "use strict";

  const STORAGE_KEY = "tally.count";

  const countEl = document.getElementById("count");
  const dateEl = document.getElementById("today");
  const subtractOneButton = document.getElementById("subtract-one-button");
  const tapButton = document.getElementById("tap-button");
  const addFiveButton = document.getElementById("add-five-button");
  const addTenButton = document.getElementById("add-ten-button");
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
    subtractOneButton.setAttribute(
      "aria-disabled",
      count <= 0 ? "true" : "false",
    );
  }

  function renderDate() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    dateEl.lang = formatter.resolvedOptions().locale;
    dateEl.textContent = formatter.format(now);
    const pad = (n) => String(n).padStart(2, "0");
    dateEl.setAttribute(
      "datetime",
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    );
  }

  function announce(message) {
    liveRegion.textContent = message;
  }

  function addToCount(step, button) {
    const next = Math.max(0, count + step);
    if (next === count) return;
    count = next;
    render();
    writeStored(count);
    announce("Taps: " + count);
    button.focus();
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
  // mirror it on screen, without writing back or announcing (avoids chatter
  // from another tab's taps).
  window.addEventListener("storage", function (event) {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    count = parseCount(event.newValue);
    render();
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
  renderDate();
})();
