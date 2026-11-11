const { test, expect } = require("@playwright/test");
const { AxeBuilder } = require("@axe-core/playwright");

const STORAGE_KEY = "tally.count";

// The project targets WCAG 2.1 Level AA.
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

function storedCount(page) {
  return page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
}

test("one click on -1 subtracts exactly one", async ({ page }) => {
  await page.goto("/");
  const subtractOne = page.getByRole("button", { name: "Subtract one" });
  const addFive = page.getByRole("button", { name: "Add five" });
  const count = page.locator("#count");

  await addFive.click();
  await expect(count).toHaveText("5");

  await subtractOne.click();
  await expect(count).toHaveText("4");
});

test("the count from -1 survives a reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add five" }).click();
  await page.getByRole("button", { name: "Subtract one" }).click();
  await expect(page.locator("#count")).toHaveText("4");

  await page.reload();

  await expect(page.locator("#count")).toHaveText("4");
  expect(await storedCount(page)).toBe("4");
});

test("-1 at 0 is a no-op: aria-disabled stays true, no native disabled, and nothing is written, announced or changed", async ({
  page,
}) => {
  await page.goto("/");
  const subtractOne = page.getByRole("button", { name: "Subtract one" });
  const count = page.locator("#count");
  const live = page.locator('[aria-live="polite"]');

  await expect(subtractOne).toHaveAttribute("aria-disabled", "true");
  await expect(subtractOne).not.toHaveAttribute("disabled");
  expect(await storedCount(page)).toBeNull();

  // aria-disabled (not the native disabled attribute) leaves the button in
  // the tab order and still able to receive a real click; Playwright's own
  // actionability check refuses a plain click on an aria-disabled element,
  // so force it to prove the click lands and the no-op comes from addToCount.
  await subtractOne.click({ force: true });

  await expect(count).toHaveText("0");
  await expect(subtractOne).toHaveAttribute("aria-disabled", "true");
  await expect(subtractOne).not.toHaveAttribute("disabled");
  expect(await storedCount(page)).toBeNull();
  await expect(live).toHaveText("");
});

test("after -1 lowers the count to 0 on a keyboard press, focus stays on -1 and it stays focusable", async ({
  page,
}) => {
  await page.goto("/");
  const tap = page.getByRole("button", { name: "Add one" });
  const subtractOne = page.getByRole("button", { name: "Subtract one" });

  await tap.click();
  await expect(page.locator("#count")).toHaveText("1");

  await subtractOne.focus();
  await page.keyboard.press("Enter");

  await expect(page.locator("#count")).toHaveText("0");
  await expect(subtractOne).toBeFocused();
  await expect(subtractOne).toHaveAttribute("aria-disabled", "true");

  // Still focusable and operable even while aria-disabled: a fresh keyboard
  // press is a no-op, not inert, since aria-disabled (not native disabled)
  // never removes the element from the tab order.
  await page.keyboard.press("Enter");
  await expect(page.locator("#count")).toHaveText("0");
  await expect(subtractOne).toBeFocused();
});

test("-1 is re-enabled after +1 moves the count off 0", async ({ page }) => {
  await page.goto("/");
  const subtractOne = page.getByRole("button", { name: "Subtract one" });
  const tap = page.getByRole("button", { name: "Add one" });

  await expect(subtractOne).toHaveAttribute("aria-disabled", "true");

  await tap.click();

  await expect(subtractOne).toHaveAttribute("aria-disabled", "false");
});

test("-1's aria-disabled tracks +5 and a confirmed reset", async ({ page }) => {
  await page.goto("/");
  const subtractOne = page.getByRole("button", { name: "Subtract one" });
  const addFive = page.getByRole("button", { name: "Add five" });
  const reset = page.getByRole("button", { name: "Reset" });

  await addFive.click();
  await expect(subtractOne).toHaveAttribute("aria-disabled", "false");

  page.once("dialog", (dialog) => dialog.accept());
  await reset.click();
  await expect(page.locator("#count")).toHaveText("0");
  await expect(subtractOne).toHaveAttribute("aria-disabled", "true");
});

test("a -1 tap in one tab updates another open tab's count and disabled state, display-only", async ({
  page,
  context,
}) => {
  const other = await context.newPage();
  await page.goto("/");
  await other.goto("/");

  await page.getByRole("button", { name: "Add five" }).click();
  await expect(other.locator("#count")).toHaveText("5");
  await expect(
    other.getByRole("button", { name: "Subtract one" }),
  ).toHaveAttribute("aria-disabled", "false");

  await page.getByRole("button", { name: "Subtract one" }).click();

  await expect(other.locator("#count")).toHaveText("4");
  await expect(
    other.getByRole("button", { name: "Subtract one" }),
  ).toHaveAttribute("aria-disabled", "false");
  await expect(other.locator("#live-region")).toHaveText("");
});

test("when every localStorage access throws, -1 still clamps at 0 in memory", async ({
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
  const tap = page.getByRole("button", { name: "Add one" });
  const subtractOne = page.getByRole("button", { name: "Subtract one" });
  await tap.click();
  await expect(page.locator("#count")).toHaveText("1");

  await subtractOne.click();
  await expect(page.locator("#count")).toHaveText("0");
  await expect(subtractOne).toHaveAttribute("aria-disabled", "true");

  await subtractOne.click({ force: true });
  await expect(page.locator("#count")).toHaveText("0");
  expect(errors).toEqual([]);
});

for (const colorScheme of ["light", "dark"]) {
  test(`-1 has no WCAG 2.1 AA violations in the ${colorScheme} facet, disabled and enabled`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/");

    const disabledResults = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();
    expect(disabledResults.violations).toEqual([]);

    await page.getByRole("button", { name: "Add one" }).click();

    const enabledResults = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();
    expect(enabledResults.violations).toEqual([]);
  });
}

for (const width of [320, 768, 1280]) {
  test(`at ${width}px -1, +1 and +5 don't overlap or overflow, and +1 stays centered`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");

    const layout = await page.evaluate(() => {
      const box = (el) => el.getBoundingClientRect();
      const subtractOne = box(document.getElementById("subtract-one-button"));
      const tap = box(document.getElementById("tap-button"));
      const addFive = box(document.getElementById("add-five-button"));
      const centre = (r) => r.left + r.width / 2;
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        viewportCentre: document.documentElement.clientWidth / 2,
        tapCentre: centre(tap),
        subtractOneRight: subtractOne.right,
        tapLeft: tap.left,
        tapRight: tap.right,
        addFiveLeft: addFive.left,
      };
    });

    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
    expect(layout.subtractOneRight).toBeLessThanOrEqual(layout.tapLeft);
    expect(layout.tapRight).toBeLessThanOrEqual(layout.addFiveLeft);
    expect(
      Math.abs(layout.tapCentre - layout.viewportCentre),
    ).toBeLessThanOrEqual(1);
  });
}
