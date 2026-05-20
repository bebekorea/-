// Capture the new hover settle-in animation: translateY 20px → 0 +
// scale 0.97 → 1 over 360ms while opacity is instant. Also verify
// header is BLACK (theme=light) on #index.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/research/hover-animation");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForTimeout(1500);
await page.evaluate(() => {
  const c = document.querySelector(".fp-container");
  const el = document.getElementById("index");
  if (c && el) c.scrollTop = el.offsetTop;
});
await page.waitForTimeout(2400);

// Verify header color
const headerColor = await page.evaluate(() => {
  const a = document.querySelector("header a");
  return a ? getComputedStyle(a).color : null;
});
console.log("Header text color on #index:", headerColor, "(expected rgb(0, 0, 0))");

// Settle screenshot (no hover)
await page.screenshot({ path: resolve(OUT, "01-settled-no-hover.png") });

// Hover HOSPITALITY at the very edge of the moment to capture animation
const target = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll("#index button")].filter(b => b.textContent?.includes("HOSPITALITY"));
  const r = buttons[0]?.getBoundingClientRect();
  return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null;
});
const t0 = Date.now();
await page.mouse.move(target.x, target.y);

// Capture frames during the 360ms transform animation
const captures = [50, 120, 220, 380, 600];
for (const t of captures) {
  const remaining = t - (Date.now() - t0);
  if (remaining > 0) await page.waitForTimeout(remaining);
  await page.screenshot({ path: resolve(OUT, `hover-${String(t).padStart(4, "0")}ms.png`) });
  // Also read PreviewLayer transform
  const s = await page.evaluate(() => {
    const section = document.getElementById("index");
    const previewWrapper = section?.children?.[1];
    const locPL = previewWrapper?.children?.[1];
    return locPL ? {
      transform: getComputedStyle(locPL).transform,
      opacity: getComputedStyle(locPL).opacity,
    } : null;
  });
  console.log(`  t=${String(t).padStart(4)}ms | opacity=${s?.opacity} | transform=${s?.transform}`);
}

await browser.close();
console.log("✓", OUT);
