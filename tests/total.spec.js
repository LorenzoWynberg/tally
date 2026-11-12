const { test, expect } = require("@playwright/test");
const fs = require("fs");

const COUNT_KEY = "tally.count";
const TOTAL_KEY = "tally.total";

const stored = (page, key) =>
  page.evaluate((k) => localStorage.getItem(k), key);

function seedBefore(page, entries) {
  return page.addInitScript((e) => {
    if (window.sessionStorage.getItem("__seeded__")) return;
    window.sessionStorage.setItem("__seeded__", "1");
    for (const [k, v] of Object.entries(e)) localStorage.setItem(k, v);
  }, entries);
}

const add = (page, name) => page.getByRole("button", { name }).click();

test("the total line sits between the count and the history", async ({
  page,
}) => {
  await page.goto("/");
  const order = await page.evaluate(() => {
    const t = document.getElementById("total");
    const c = document.querySelector(".count");
    const h = document.getElementById("history");
    return {
      afterCount: !!(c.compareDocumentPosition(t) & 4),
      beforeHistory: !!(t.compareDocumentPosition(h) & 4),
    };
  });
  expect(order).toEqual({ afterCount: true, beforeHistory: true });
  await expect(page.locator("#total")).toHaveText(/^Total taps\s+0$/);
});

test("+1 and +5 raise the total and persist it; -1 leaves it", async ({
  page,
}) => {
  await page.goto("/");
  await add(page, "Add one");
  await expect(page.locator("#total-value")).toHaveText("1");
  await add(page, "Add five");
  await expect(page.locator("#total-value")).toHaveText("6");
  expect(await stored(page, TOTAL_KEY)).toBe("6");
  await add(page, "Subtract one");
  await expect(page.locator("#count")).toHaveText("5");
  await expect(page.locator("#total-value")).toHaveText("6");
  expect(await stored(page, TOTAL_KEY)).toBe("6");
  await page.reload();
  await expect(page.locator("#total-value")).toHaveText("6");
});

test("+10 raises the displayed and stored total by 10", async ({ page }) => {
  await page.goto("/");
  await add(page, "Add ten");
  await expect(page.locator("#total-value")).toHaveText("10");
  await expect(page.locator("#count")).toHaveText("10");
  expect(await stored(page, TOTAL_KEY)).toBe("10");
  await add(page, "Add ten");
  await expect(page.locator("#total-value")).toHaveText("20");
  expect(await stored(page, TOTAL_KEY)).toBe("20");
});

test("a missing total is seeded from the stored count", async ({ page }) => {
  await seedBefore(page, { [COUNT_KEY]: "40" });
  await page.goto("/");
  await expect(page.locator("#total-value")).toHaveText("40");
  expect(await stored(page, TOTAL_KEY)).toBe("40");
});

test("a stored total of 0 wins over the count", async ({ page }) => {
  await seedBefore(page, { [COUNT_KEY]: "40", [TOTAL_KEY]: "0" });
  await page.goto("/");
  await expect(page.locator("#total-value")).toHaveText("0");
  expect(await stored(page, TOTAL_KEY)).toBe("0");
});

for (const bad of ["abc", "-3"]) {
  test(`an invalid stored total (${bad}) shows 0`, async ({ page }) => {
    await seedBefore(page, { [TOTAL_KEY]: bad });
    await page.goto("/");
    await expect(page.locator("#total-value")).toHaveText("0");
  });
}

test("with storage unavailable the total runs in memory", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e));
  await page.addInitScript(() => {
    const boom = () => {
      throw new Error("blocked");
    };
    window.Storage.prototype.getItem = boom;
    window.Storage.prototype.setItem = boom;
  });
  await page.goto("/");
  await add(page, "Add five");
  await add(page, "Add one");
  await expect(page.locator("#total-value")).toHaveText("6");
  await expect(page.locator("#count")).toHaveText("6");
  expect(errors).toEqual([]);
});

test("a tap in one tab updates another tab's total silently", async ({
  page,
  context,
}) => {
  const other = await context.newPage();
  await page.goto("/");
  await other.goto("/");
  await add(page, "Add five");
  await expect(other.locator("#total-value")).toHaveText("5");
  await expect(other.locator("#live-region")).toHaveText("");
});

test("reset zeroes the count but never the total", async ({ page }) => {
  await page.goto("/");
  await add(page, "Add five");
  page.once("dialog", (d) => d.dismiss());
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.locator("#count")).toHaveText("5");
  await expect(page.locator("#total-value")).toHaveText("5");

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.locator("#count")).toHaveText("0");
  await expect(page.locator("#total-value")).toHaveText("5");
  expect(await stored(page, TOTAL_KEY)).toBe("5");
});

for (const scheme of ["dark", "light"]) {
  test(`the total text meets 4.5:1 contrast in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/");
    const ratio = await page.evaluate(() => {
      const ctx = document
        .createElement("canvas")
        .getContext("2d", { willReadFrequently: true });
      const lum = (css) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = css;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        const lin = (c) => {
          const s = c / 255;
          return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      };
      const fg = lum(getComputedStyle(document.getElementById("total")).color);
      const bg = lum(getComputedStyle(document.body).backgroundColor);
      const [hi, lo] = [fg, bg].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    });
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
}

test("a very large total does not overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await seedBefore(page, { [TOTAL_KEY]: "9".repeat(15) });
  await page.goto("/");
  await expect(page.locator("#total")).toBeVisible();
  const box = await page.locator("#total").boundingBox();
  expect(box.width).toBeLessThanOrEqual(320);
  const fits = await page.evaluate(
    () =>
      document.documentElement.scrollWidth <=
      document.documentElement.clientWidth,
  );
  expect(fits).toBe(true);
});

test("the total rule defines no new design tokens", async () => {
  const css = fs.readFileSync("styles.css", "utf8");
  const rule = css.match(/\.total\s*\{[^}]*\}/)[0];
  expect(rule).not.toMatch(/--tally-[\w-]+\s*:/);
  expect(rule).not.toMatch(/#[0-9a-f]{3,8}\b|oklch\(/i);
});
