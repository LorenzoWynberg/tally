const { test, expect } = require("@playwright/test");

const STORAGE_KEY = "tally.count";

function storedCount(page) {
  return page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
}

// Resolve any CSS colour (oklch included) to sRGB by painting one canvas pixel.
// Inlined: tests/shell.spec.js is unmodifiable, so its helper is not imported.
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
  const bodyStyle = getComputedStyle(document.body);
  const bg = bodyStyle.backgroundColor;
  const addTen = getComputedStyle(document.getElementById("add-ten-button"));
  const ring = getComputedStyle(document.documentElement)
    .getPropertyValue("--ring")
    .trim();
  return {
    label: contrast(addTen.color, addTen.backgroundColor),
    boundary: contrast(addTen.borderTopColor, bg),
    ring: contrast(ring, bg),
  };
}

test("one click on +10 adds exactly ten", async ({ page }) => {
  await page.goto("/");
  await page.evaluate((key) => localStorage.setItem(key, "3"), STORAGE_KEY);
  await page.reload();
  await expect(page.locator("#count")).toHaveText("3");
  await page.getByRole("button", { name: "Add ten" }).click();
  await expect(page.locator("#count")).toHaveText("13");
});

test("the count from +10 survives a reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add ten" }).click();
  await expect(page.locator("#count")).toHaveText("10");

  await page.reload();

  await expect(page.locator("#count")).toHaveText("10");
  expect(await storedCount(page)).toBe("10");
});

test("a +10 tap in one tab updates another open tab, display-only", async ({
  page,
  context,
}) => {
  const other = await context.newPage();
  await page.goto("/");
  await other.goto("/");

  await page.getByRole("button", { name: "Add ten" }).click();

  await expect(other.locator("#count")).toHaveText("10");
  await expect(other.locator("#live-region")).toHaveText("");
});

test("the live region announces the new total after +10", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add ten" }).click();
  await expect(page.locator('[aria-live="polite"]')).toHaveText("Taps: 10");
});

test("when every localStorage access throws, +10 still works in memory", async ({
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
  await page.getByRole("button", { name: "Add ten" }).click();
  await expect(page.locator("#count")).toHaveText("10");
  expect(errors).toEqual([]);
});

test("Enter and Space on the focused +10 button each add ten, and show a visible focus ring", async ({
  page,
}) => {
  await page.goto("/");
  const addTen = page.getByRole("button", { name: "Add ten" });
  const count = page.locator("#count");

  await page.getByRole("button", { name: "Add five" }).focus();
  await page.keyboard.press("Tab");
  await expect(addTen).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(count).toHaveText("10");
  await page.keyboard.press("Space");
  await expect(count).toHaveText("20");
  await expect(addTen).toBeFocused();
  await expect(addTen).toHaveCSS("outline-style", "solid");
});

for (const colorScheme of ["light", "dark"]) {
  test(`+10's fill, boundary and focus ring reach AA contrast in the ${colorScheme} facet`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/");

    const ratios = await page.evaluate(contrastRatios);

    expect(ratios.label).toBeGreaterThanOrEqual(4.5);
    expect(ratios.boundary).toBeGreaterThanOrEqual(3);
    expect(ratios.ring).toBeGreaterThanOrEqual(3);
  });
}

test("+10 shares +5's secondary styling", async ({ page }) => {
  await page.goto("/");
  const props = [
    "background-color",
    "color",
    "border-top-color",
    "box-shadow",
    "touch-action",
    "transition",
  ];
  const read = (id) =>
    page.evaluate(
      ({ id, props }) => {
        const cs = getComputedStyle(document.getElementById(id));
        return props.map((p) => cs.getPropertyValue(p));
      },
      { id, props },
    );
  expect(await read("add-ten-button")).toEqual(await read("add-five-button"));
});

test("the action row holds −1, +1, +5, +10 in that order", async ({ page }) => {
  await page.goto("/");
  const ids = await page
    .locator(".actions > button")
    .evaluateAll((els) => els.map((el) => el.id));
  expect(ids).toEqual([
    "subtract-one-button",
    "tap-button",
    "add-five-button",
    "add-ten-button",
  ]);
  await expect(page.getByRole("button", { name: "Add one" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Add five" })).toHaveCount(1);
});

for (const width of [320, 768, 1280]) {
  test(`at ${width}px the four step buttons fit without overlap or overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");

    const layout = await page.evaluate(() => {
      const boxes = [
        "subtract-one-button",
        "tap-button",
        "add-five-button",
        "add-ten-button",
      ].map((id) => document.getElementById(id).getBoundingClientRect());
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        boxes: boxes.map((b) => ({
          left: b.left,
          right: b.right,
          top: b.top,
          bottom: b.bottom,
        })),
      };
    });

    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
    for (const b of layout.boxes) {
      expect(b.left).toBeGreaterThanOrEqual(0);
      expect(b.right).toBeLessThanOrEqual(layout.clientWidth);
    }
    for (let i = 0; i < layout.boxes.length; i++) {
      for (let j = i + 1; j < layout.boxes.length; j++) {
        const p = layout.boxes[i];
        const q = layout.boxes[j];
        const apart =
          p.right <= q.left ||
          q.right <= p.left ||
          p.bottom <= q.top ||
          q.bottom <= p.top;
        expect(apart).toBe(true);
      }
    }
  });
}
