const { test, expect } = require("@playwright/test");

test("taps work and stay quiet where vibrate is unsupported", async ({
  page,
}) => {
  const problems = [];
  page.on("pageerror", (e) => problems.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") problems.push(m.text());
  });
  await page.addInitScript(() => {
    delete window.Navigator.prototype.vibrate;
  });
  await page.goto("/");
  expect(await page.evaluate(() => "vibrate" in window.navigator)).toBe(false);
  await page.getByRole("button", { name: "Add five" }).click();
  await page.getByRole("button", { name: "Subtract one" }).click();
  await expect(page.locator("#count")).toHaveText("4");
  expect(problems).toEqual([]);
});
