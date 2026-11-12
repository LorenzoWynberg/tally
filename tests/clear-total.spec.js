const { test, expect } = require("@playwright/test");

async function tapTwice(page) {
  const tap = page.locator("#tap-button");
  await tap.click();
  await tap.click();
  await expect(page.locator("#total-value")).toHaveText("2");
}

test("accepting the confirm zeroes the total, persisted across reload", async ({
  page,
}) => {
  await page.goto("/");
  await tapTwice(page);
  let message = "";
  page.once("dialog", (d) => {
    message = d.message();
    d.accept();
  });
  await page.getByRole("button", { name: "Clear total", exact: true }).click();
  expect(message).toBe("Clear the total to zero?");
  await expect(page.locator("#total-value")).toHaveText("0");
  expect(await page.evaluate(() => localStorage.getItem("tally.total"))).toBe(
    "0",
  );
  await page.reload();
  await expect(page.locator("#total-value")).toHaveText("0");
});

test("dismissing the confirm changes nothing", async ({ page }) => {
  await page.goto("/");
  await tapTwice(page);
  page.once("dialog", (d) => d.dismiss());
  await page.locator("#clear-total-button").click();
  await expect(page.locator("#total-value")).toHaveText("2");
  expect(await page.evaluate(() => localStorage.getItem("tally.total"))).toBe(
    "2",
  );
});

test("clearing leaves count and history, announces and keeps focus", async ({
  page,
}) => {
  await page.goto("/");
  await tapTwice(page);
  page.once("dialog", (d) => d.accept());
  await page.locator("#clear-total-button").click();
  await expect(page.locator("#count")).toHaveText("2");
  expect(await page.evaluate(() => localStorage.getItem("tally.count"))).toBe(
    "2",
  );
  await expect(page.locator("#history-list li")).toHaveCount(2);
  await expect(page.locator("#live-region")).toHaveText("Total cleared");
  await expect(page.locator("#clear-total-button")).toBeFocused();
});
