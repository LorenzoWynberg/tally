const { test, expect } = require("@playwright/test");

// Resolve any CSS colour (oklch included) to sRGB by painting one canvas pixel.
// Inlined, as other specs do, rather than shared.
function measure() {
  const ctx = document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  function rgb(cssColor) {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = cssColor;
    ctx.fillRect(0, 0, 1, 1);
    return Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3));
  }
  function luminance(cssColor) {
    const [r, g, b] = rgb(cssColor);
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
  const cs = (sel) => getComputedStyle(document.querySelector(sel));
  const bg = cs("body").backgroundColor;
  const own = (sel) => contrast(cs(sel).color, cs(sel).backgroundColor);
  const ring = getComputedStyle(document.documentElement)
    .getPropertyValue("--tally-color-ring")
    .trim();
  return {
    background: rgb(bg).join(","),
    count: contrast(cs(".count").color, bg),
    body: contrast(cs("body").color, bg),
    reset: contrast(cs("#reset-button").color, bg),
    tap: own("#tap-button"),
    addFive: own("#add-five-button"),
    subtractOne: own("#subtract-one-button"),
    ring: contrast(ring, bg),
  };
}

async function load(page, scheme) {
  await page.emulateMedia({ colorScheme: scheme });
  await page.goto("/");
  return page.evaluate(measure);
}

// Expected sRGB of the page ground per scheme (oklch resolved by the browser;
// a small per-channel tolerance absorbs rounding differences).
const DARK = [2, 14, 14];
const LIGHT = [243, 250, 250];

function expectNear(actual, expected) {
  const channels = actual.split(",").map(Number);
  expected.forEach((e, i) =>
    expect(Math.abs(channels[i] - e)).toBeLessThanOrEqual(3),
  );
}

test("dark is the default and the light scheme differs", async ({ page }) => {
  const dark = await load(page, "dark");
  const none = await load(page, null);
  const light = await load(page, "light");
  expectNear(dark.background, DARK);
  expectNear(none.background, DARK);
  expectNear(light.background, LIGHT);
  expect(light.background).not.toBe(dark.background);
});

for (const scheme of ["dark", "light"]) {
  test(`${scheme} scheme meets text and ring contrast`, async ({ page }) => {
    const m = await load(page, scheme);
    for (const key of [
      "count",
      "body",
      "reset",
      "tap",
      "addFive",
      "subtractOne",
    ]) {
      expect(m[key], `${scheme} ${key}`).toBeGreaterThanOrEqual(4.5);
    }
    expect(m.ring).toBeGreaterThanOrEqual(3);
  });
}

test("the tap button dominates the reset button", async ({ page }) => {
  await page.goto("/");
  const tap = await page.locator("#tap-button").boundingBox();
  const reset = await page.locator("#reset-button").boundingBox();
  expect(tap.width * tap.height).toBeGreaterThan(reset.width * reset.height);
});
