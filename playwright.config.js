const { defineConfig, devices } = require("@playwright/test");

// The check runner hands each run a reachable loopback port in PORT.
const PORT = Number(process.env.PORT) || 4321;
const BASE_URL = `http://127.0.0.1:${PORT}`;

module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: { baseURL: BASE_URL },
  webServer: {
    // Serves the repo root exactly as GitHub Pages does: static files, no build.
    command: `npx http-server . -p ${PORT} -a 127.0.0.1 -c-1 --silent`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Touch-emulated Chromium phone: covers tap input on a mobile viewport.
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
  ],
});
