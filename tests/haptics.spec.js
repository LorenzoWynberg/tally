const { test, expect } = require("@playwright/test");

function stubVibrate(target) {
  return target.addInitScript(() => {
    window.__vibrations = [];
    window.navigator.vibrate = (...args) => {
      window.__vibrations.push(args);
      return true;
    };
  });
}

function vibrations(page) {
  return page.evaluate(() => window.__vibrations);
}

test("+1 vibrates once with a brief pulse", async ({ page }) => {
  await stubVibrate(page);
  await page.goto("/");
  await page.getByRole("button", { name: "+1, add one" }).click();
  const calls = await vibrations(page);
  expect(calls).toHaveLength(1);
  expect(calls[0]).toHaveLength(1);
  expect(calls[0][0]).toBeGreaterThanOrEqual(10);
  expect(calls[0][0]).toBeLessThanOrEqual(20);
});

test("-1 vibrates only when the count changes", async ({ page }) => {
  await stubVibrate(page);
  await page.goto("/");
  const minus = page.getByRole("button", { name: "Subtract one" });
  await minus.click({ force: true });
  expect(await vibrations(page)).toHaveLength(0);
  await page.getByRole("button", { name: "Add five" }).click();
  await minus.click();
  expect(await vibrations(page)).toHaveLength(2);
});

test("reset does not vibrate", async ({ page }) => {
  await stubVibrate(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Add five" }).click();
  const before = (await vibrations(page)).length;
  for (const accept of [false, true]) {
    page.once("dialog", (d) => (accept ? d.accept() : d.dismiss()));
    await page.getByRole("button", { name: /reset/i }).click();
  }
  expect(await vibrations(page)).toHaveLength(before);
});

test("a storage change from another tab does not vibrate", async ({
  context,
}) => {
  await stubVibrate(context);
  const a = await context.newPage();
  const b = await context.newPage();
  await a.goto("/");
  await b.goto("/");
  await a.getByRole("button", { name: "Add five" }).click();
  await expect(b.locator("#count")).toHaveText("5");
  expect(await vibrations(b)).toHaveLength(0);
});
