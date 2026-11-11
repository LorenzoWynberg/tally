const { test, expect } = require("@playwright/test");

const STORAGE_KEY = "tally.count";

function storedCount(page) {
  return page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
}

// Resolve any CSS colour (oklch included) to sRGB by painting one canvas pixel.
// Duplicated from tests/shell.spec.js: that file is unmodifiable, so this
// contrast helper is inlined here rather than imported.
function contrastRatios() {
  const ctx = document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  function luminance(cssColor) {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = cssColor;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    const lin = (c) => {
      const s = c / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }
  function contrast(a, b) {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  }
  const bg = getComputedStyle(document.body).backgroundColor;
  const addFive = getComputedStyle(document.getElementById("add-five-button"));
  return {
    label: contrast(addFive.color, addFive.backgroundColor),
    boundary: contrast(addFive.borderTopColor, bg),
  };
}

test("one click on +5 adds exactly five", async ({ page }) => {
  await page.goto("/");
  const addFive = page.getByRole("button", { name: "Add five" });
  const count = page.locator("#count");
  await expect(count).toHaveText("0");

  await addFive.click();
  await expect(count).toHaveText("5");
});

test("the count from +5 survives a reload", async ({ page }) => {
  await page.goto("/");
  const addFive = page.getByRole("button", { name: "Add five" });
  await addFive.click();
  await addFive.click();
  await expect(page.locator("#count")).toHaveText("10");

  await page.reload();

  await expect(page.locator("#count")).toHaveText("10");
  expect(await storedCount(page)).toBe("10");
});

test("a +5 tap in one tab updates another open tab, display-only", async ({
  page,
  context,
}) => {
  const other = await context.newPage();
  await page.goto("/");
  await other.goto("/");

  await page.getByRole("button", { name: "Add five" }).click();

  await expect(other.locator("#count")).toHaveText("5");
  await expect(other.locator("#live-region")).toHaveText("");
});

test("the live region announces the new total after +5", async ({ page }) => {
  await page.goto("/");
  const live = page.locator('[aria-live="polite"]');

  await page.getByRole("button", { name: "Add five" }).click();
  await expect(live).toHaveText("Taps: 5");
});

test("when every localStorage access throws, +5 still works in memory", async ({
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
  const addFive = page.getByRole("button", { name: "Add five" });
  await addFive.click();
  await addFive.click();
  await expect(page.locator("#count")).toHaveText("10");
  expect(errors).toEqual([]);
});

test("Enter and Space on the focused +5 button each add five, and show a visible focus ring", async ({
  page,
}) => {
  await page.goto("/");
  const addFive = page.getByRole("button", { name: "Add five" });
  const count = page.locator("#count");

  await addFive.focus();
  await page.keyboard.press("Enter");
  await expect(count).toHaveText("5");
  await page.keyboard.press("Space");
  await expect(count).toHaveText("10");
  await expect(addFive).toBeFocused();
  await expect(addFive).toHaveCSS("outline-style", "solid");
});

for (const colorScheme of ["light", "dark"]) {
  test(`+5's fill and boundary reach AA contrast in the ${colorScheme} facet`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/");

    const ratios = await page.evaluate(contrastRatios);

    expect(ratios.label).toBeGreaterThanOrEqual(4.5);
    expect(ratios.boundary).toBeGreaterThanOrEqual(3);
  });
}

for (const width of [320, 768, 1280]) {
  test(`at ${width}px +5 does not overlap or overflow, and stays smaller than +1`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");

    const layout = await page.evaluate(() => {
      const box = (el) => el.getBoundingClientRect();
      const tap = box(document.getElementById("tap-button"));
      const addFive = box(document.getElementById("add-five-button"));
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        tapRight: tap.right,
        addFiveLeft: addFive.left,
        tapArea: tap.width * tap.height,
        addFiveArea: addFive.width * addFive.height,
      };
    });

    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
    expect(layout.tapRight).toBeLessThanOrEqual(layout.addFiveLeft);
    expect(layout.addFiveArea).toBeLessThan(layout.tapArea / 4);
  });
}
