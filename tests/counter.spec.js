const { test, expect } = require("@playwright/test");

const STORAGE_KEY = "tally.count";

function storedCount(page) {
  return page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
}

// Every test gets a fresh browser context, so storage starts empty and the count at 0.
test.describe("with working storage", () => {
  test("one click adds exactly one, and five clicks from 0 show 5", async ({
    page,
  }) => {
    await page.goto("/");
    const tap = page.getByRole("button", { name: "Add one" });
    const count = page.locator("#count");
    await expect(count).toHaveText("0");

    await tap.click();
    await expect(count).toHaveText("1");

    for (let i = 0; i < 4; i += 1) await tap.click();
    await expect(count).toHaveText("5");
  });

  test("Enter and Space on the focused tap button each add one, and focus stays", async ({
    page,
  }) => {
    await page.goto("/");
    const tap = page.getByRole("button", { name: "Add one" });
    const count = page.locator("#count");

    await tap.focus();
    await page.keyboard.press("Enter");
    await expect(count).toHaveText("1");
    await page.keyboard.press("Space");
    await expect(count).toHaveText("2");
    await expect(tap).toBeFocused();
  });

  test("the count survives a reload", async ({ page }) => {
    await page.goto("/");
    const tap = page.getByRole("button", { name: "Add one" });
    for (let i = 0; i < 3; i += 1) await tap.click();
    await expect(page.locator("#count")).toHaveText("3");

    await page.reload();

    await expect(page.locator("#count")).toHaveText("3");
    expect(await storedCount(page)).toBe("3");
  });

  test("accepting the reset confirm returns the count to 0 and stores it", async ({
    page,
  }) => {
    await page.goto("/");
    const tap = page.getByRole("button", { name: "Add one" });
    const reset = page.getByRole("button", { name: "Reset" });
    await tap.click();
    await tap.click();

    let message = "";
    page.once("dialog", (dialog) => {
      message = dialog.message();
      dialog.accept();
    });
    await reset.click();

    await expect(page.locator("#count")).toHaveText("0");
    expect(await storedCount(page)).toBe("0");
    expect(message).toBe("Reset the count to zero?");
    await expect(reset).toBeFocused();
  });

  test("dismissing the reset confirm leaves the count and storage unchanged", async ({
    page,
  }) => {
    await page.goto("/");
    const tap = page.getByRole("button", { name: "Add one" });
    await tap.click();
    await tap.click();

    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("button", { name: "Reset" }).click();

    await expect(page.locator("#count")).toHaveText("2");
    expect(await storedCount(page)).toBe("2");
  });

  test("the live region announces each tap and a confirmed reset; the count is not live", async ({
    page,
  }) => {
    await page.goto("/");
    const live = page.locator('[aria-live="polite"]');
    await expect(live).toHaveCount(1);
    await expect(page.locator("#count")).not.toHaveAttribute("aria-live");

    await page.getByRole("button", { name: "Add one" }).click();
    await expect(live).toHaveText("Count: 1");

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Reset" }).click();
    await expect(live).toHaveText("Count reset to 0");
  });

  test("a tap in one tab updates another open tab without a reload", async ({
    page,
    context,
  }) => {
    const other = await context.newPage();
    await page.goto("/");
    await other.goto("/");
    await expect(other.locator("#count")).toHaveText("0");

    await page.getByRole("button", { name: "Add one" }).click();
    await page.getByRole("button", { name: "Add one" }).click();

    await expect(other.locator("#count")).toHaveText("2");
    // The other tab announces the synced count too, so a screen reader
    // user there learns of the change without needing to re-visit it (WCAG 4.1.3).
    await expect(other.locator("#live-region")).toHaveText("Count: 2");
  });

  test("alternating taps in two tabs add up without losing any", async ({
    page,
    context,
  }) => {
    const other = await context.newPage();
    await page.goto("/");
    await other.goto("/");
    const tapHere = page.getByRole("button", { name: "Add one" });
    const tapThere = other.getByRole("button", { name: "Add one" });

    for (let i = 0; i < 5; i += 1) {
      await tapHere.click();
      await tapThere.click();
    }

    await expect(page.locator("#count")).toHaveText("10");
    await expect(other.locator("#count")).toHaveText("10");
    expect(await storedCount(page)).toBe("10");
  });

  test("a storage event for an unrelated key leaves the other tab's count unchanged", async ({
    page,
    context,
  }) => {
    const other = await context.newPage();
    await page.goto("/");
    await other.goto("/");

    await page.evaluate(() => localStorage.setItem("unrelated.key", "99"));
    await page.waitForTimeout(50);

    await expect(other.locator("#count")).toHaveText("0");
  });
});

test.describe("with an invalid stored count", () => {
  for (const stored of ["abc", "-2", "1.5"]) {
    test(`a stored "${stored}" loads as 0`, async ({ page }) => {
      await page.addInitScript(
        ([key, value]) => localStorage.setItem(key, value),
        [STORAGE_KEY, stored],
      );
      await page.goto("/");
      await expect(page.locator("#count")).toHaveText("0");
    });
  }
});

test("when a write fails mid-session, the count still advances and does not roll back", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.addInitScript(() => {
    const native = window.localStorage.setItem.bind(window.localStorage);
    window.localStorage.setItem = function (key, value) {
      if (key === "tally.count") {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      }
      return native(key, value);
    };
  });

  await page.goto("/");
  const tap = page.getByRole("button", { name: "Add one" });
  await tap.click();
  await expect(page.locator("#count")).toHaveText("1");
  await tap.click();
  await expect(page.locator("#count")).toHaveText("2");
  await tap.click();
  await expect(page.locator("#count")).toHaveText("3");
  expect(errors).toEqual([]);
});

test("when every localStorage access throws, the counter still works in memory", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage is disabled", "SecurityError");
      },
    });
  });

  await page.goto("/");
  await expect(page.locator("#count")).toHaveText("0");

  const tap = page.getByRole("button", { name: "Add one" });
  await tap.click();
  await tap.click();
  await expect(page.locator("#count")).toHaveText("2");
  expect(errors).toEqual([]);
});
