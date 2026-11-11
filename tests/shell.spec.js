const { test, expect } = require("@playwright/test");
const { AxeBuilder } = require("@axe-core/playwright");

// The project targets WCAG 2.1 Level AA.
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// Both facets are swept: the design ships a light and a dark set of colour roles,
// and each must meet AA on its own.
const COLOR_SCHEMES = ["light", "dark"];

test("loads, shows 0, both buttons, no console errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");

  await expect(page.locator("#count")).toHaveText("0");
  await expect(page.getByRole("button", { name: "Add one" })).toBeVisible();
  const resetButton = page.getByRole("button", { name: "Reset" });
  await expect(resetButton).toBeVisible();
  await expect(resetButton).toHaveAccessibleName("Reset count to zero");
  await expect(resetButton).toHaveText("Reset");
  expect(errors).toEqual([]);
});

test("has exactly one description meta, with the exact content", async ({
  page,
}) => {
  await page.goto("/");

  const descriptionMeta = page.locator('head meta[name="description"]');
  await expect(descriptionMeta).toHaveCount(1);
  await expect(descriptionMeta).toHaveAttribute(
    "content",
    "Tally: a calm, minimal tap counter. Tap +1 to count; your count is saved on this device.",
  );
});

test("makes no request to any origin but its own, on load and after a tap", async ({
  page,
}) => {
  const urls = [];
  page.on("request", (request) => urls.push(request.url()));

  await page.goto("/");
  await page.getByRole("button", { name: "Add one" }).click();

  const pageOrigin = new URL(page.url()).origin;
  for (const url of urls) {
    expect(new URL(url).origin).toBe(pageOrigin);
  }
});

for (const colorScheme of COLOR_SCHEMES) {
  test(`has no WCAG 2.1 AA violations in the ${colorScheme} facet`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/");
    await page.getByRole("button", { name: "Add one" }).click();

    const results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test(`count and tap-button boundary reach 3:1 against the page in the ${colorScheme} facet`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/");

    const ratios = await page.evaluate(() => {
      // Resolve any CSS colour (oklch included) to sRGB by painting one canvas pixel.
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
      const count = getComputedStyle(document.querySelector(".count")).color;
      const tap = getComputedStyle(document.getElementById("tap-button"));
      const reset = getComputedStyle(document.getElementById("reset-button"));
      return {
        count: contrast(count, bg),
        buttonBoundary: contrast(tap.borderTopColor, bg),
        buttonLabel: contrast(tap.color, tap.backgroundColor),
        resetBoundary: contrast(reset.borderTopColor, bg),
      };
    });

    expect(ratios.count).toBeGreaterThanOrEqual(3);
    expect(ratios.buttonBoundary).toBeGreaterThanOrEqual(3);
    expect(ratios.buttonLabel).toBeGreaterThanOrEqual(4.5);
    expect(ratios.resetBoundary).toBeGreaterThanOrEqual(3);
  });
}

// The story names these three widths: a small phone, a tablet and a desktop.
for (const width of [320, 768, 1024]) {
  test(`at ${width}px the layout has no horizontal scroll and the count leads`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 720 });
    await page.goto("/");

    const layout = await page.evaluate(() => {
      const box = (el) => el.getBoundingClientRect();
      const tap = box(document.getElementById("tap-button"));
      const reset = box(document.getElementById("reset-button"));
      const count = box(document.querySelector(".count"));
      const centre = (r) => r.left + r.width / 2;
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        viewportCentre: document.documentElement.clientWidth / 2,
        tapCentre: centre(tap),
        countCentre: centre(count),
        tapArea: tap.width * tap.height,
        resetArea: reset.width * reset.height,
      };
    });

    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
    expect(
      Math.abs(layout.tapCentre - layout.viewportCentre),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(layout.countCentre - layout.viewportCentre),
    ).toBeLessThanOrEqual(1);
    expect(layout.resetArea).toBeLessThan(layout.tapArea / 4);
  });
}

test("tap button presses with a short ease-out scale, and holds still under reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  const tap = page.getByRole("button", { name: "Add one" });

  await expect(tap).toHaveCSS("touch-action", "manipulation");
  await expect(tap).toHaveCSS("transition-property", "transform");
  const duration = await tap.evaluate((el) =>
    parseFloat(getComputedStyle(el).transitionDuration),
  );
  expect(duration).toBeGreaterThanOrEqual(0.12);
  expect(duration).toBeLessThanOrEqual(0.24);
  const timingFunction = await tap.evaluate(
    (el) => getComputedStyle(el).transitionTimingFunction,
  );
  // An ease-out curve decelerates into its end value: no overshoot, so the
  // easing's control points never exceed 1 (ruling out a linear/ease-in/overshoot swap).
  const bezierPoints = timingFunction.match(/-?[\d.]+/g).map(Number);
  expect(bezierPoints.every((p) => p <= 1)).toBe(true);
  expect(timingFunction).not.toBe("linear");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(tap).toHaveCSS("transition-property", "none");
});
