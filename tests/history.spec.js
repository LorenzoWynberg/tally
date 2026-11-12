const { test, expect } = require("@playwright/test");
const { AxeBuilder } = require("@axe-core/playwright");

const STORAGE_KEY = "tally.count";
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function seed(page, n) {
  await page.goto("/");
  await page.evaluate(
    ([k, v]) => localStorage.setItem(k, v),
    [STORAGE_KEY, String(n)],
  );
  await page.reload();
}

const items = (page) => page.locator("#history-list li");

test("a fresh load with a persisted count shows no history", async ({
  page,
}) => {
  await seed(page, 7);
  await expect(page.locator("#count")).toHaveText("7");
  await expect(items(page)).toHaveCount(0);
  await expect(page.locator("#history")).toBeHidden();
});

test("one tap adds one entry equal to the count", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add one" }).click();
  await expect(items(page)).toHaveText(["1"]);
});

test("entries read most recent first from a persisted start", async ({
  page,
}) => {
  await seed(page, 10);
  const tap = page.getByRole("button", { name: "Add one" });
  await tap.click();
  await tap.click();
  await tap.click();
  await expect(items(page)).toHaveText(["13", "12", "11"]);
});

test("only the last five entries are kept", async ({ page }) => {
  await page.goto("/");
  const tap = page.getByRole("button", { name: "Add one" });
  for (let i = 0; i < 7; i++) await tap.click();
  await expect(items(page)).toHaveText(["7", "6", "5", "4", "3"]);
});

test("history is never persisted", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add five" }).click();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toEqual([STORAGE_KEY]);
});

test("-1 at 0 adds no entry", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Subtract one" })
    .click({ force: true });
  await expect(items(page)).toHaveCount(0);
});

test("a confirmed reset empties history, a dismissed one keeps it", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add five" }).click();
  await expect(items(page)).toHaveCount(1);

  page.once("dialog", (d) => d.dismiss());
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(items(page)).toHaveCount(1);

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(items(page)).toHaveCount(0);
  await expect(page.locator("#history")).toBeHidden();
});

test("another tab's taps and resets leave this tab's history alone", async ({
  page,
  context,
}) => {
  const other = await context.newPage();
  await page.goto("/");
  await other.goto("/");
  await page.getByRole("button", { name: "Add one" }).click();
  await expect(items(page)).toHaveText(["1"]);

  await other.getByRole("button", { name: "Add five" }).click();
  await expect(page.locator("#count")).toHaveText("6");
  await expect(items(page)).toHaveText(["1"]);

  other.once("dialog", (d) => d.accept());
  await other.getByRole("button", { name: "Reset" }).click();
  await expect(page.locator("#count")).toHaveText("0");
  await expect(items(page)).toHaveText(["1"]);
});

test("the list is a named ordered list with no live region", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add one" }).click();
  const list = page.getByRole("list", { name: "Recent counts" });
  await expect(list).toHaveCount(1);
  expect(await list.evaluate((el) => el.tagName)).toBe("OL");
  await expect(list).not.toHaveAttribute("aria-live");
  await expect(page.locator('[aria-live="polite"]')).toHaveCount(1);
});

for (const width of [320, 1280]) {
  test(`at ${width}px history does not overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await seed(page, 99999);
    const add = page.getByRole("button", { name: "Add five" });
    for (let i = 0; i < 6; i++) await add.click();
    await expect(items(page)).toHaveCount(5);
    await expect(page.locator("#count")).toBeVisible();
    await expect(page.locator("#tap-button")).toBeVisible();
    await expect(page.locator("#history-list")).toBeVisible();
    const o = await page.evaluate(() => ({
      s: document.documentElement.scrollWidth,
      c: document.documentElement.clientWidth,
    }));
    expect(o.s).toBeLessThanOrEqual(o.c);
  });
}

for (const colorScheme of ["light", "dark"]) {
  test(`history has no WCAG 2.1 AA violations in ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/");
    await page.getByRole("button", { name: "Add five" }).click();
    await expect(items(page)).toHaveCount(1);
    const results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
