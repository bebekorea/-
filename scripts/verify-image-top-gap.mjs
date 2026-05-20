import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/research/image-top-gap");
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

const items = ["ADOPT", "HOSPITALITY", "FOOD", "PRODUCT", "BEAUTY&SPA"];
const expectedY = Math.round(900 * 0.08); // 8vh = 72px on 900px viewport

console.log(`Expected top gap of image content: ~${expectedY}px (8vh of 900)\n`);
for (const item of items) {
  const btn = await page.evaluate((label) => {
    const b = [...document.querySelectorAll("#index button")].find(b => b.textContent === label);
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, item);
  await page.mouse.move(btn.x, btn.y);
  await page.waitForTimeout(700);

  const measure = await page.evaluate(() => {
    const previewWrapper = document.querySelector('#index > div:nth-child(2)');
    const visiblePreview = [...previewWrapper.children].find(el => parseFloat(getComputedStyle(el).opacity) > 0.5);
    if (!visiblePreview) return null;
    const split = visiblePreview.firstElementChild;
    if (!split) return null;
    const visualHalf = [...split.children][0];
    if (!visualHalf) return null;
    // The first inner descendant with backgroundImage or grid
    const inner = visualHalf.firstElementChild;
    if (!inner) return null;
    const r = inner.getBoundingClientRect();
    const halfRect = visualHalf.getBoundingClientRect();
    return {
      innerTop: Math.round(r.top),
      visualHalfTop: Math.round(halfRect.top),
      gap: Math.round(r.top - halfRect.top),
    };
  });
  console.log(`  ${item.padEnd(13)} → visualHalf.top=${measure?.visualHalfTop} inner.top=${measure?.innerTop} gap=${measure?.gap}px`);
  await page.screenshot({ path: resolve(OUT, `hover-${item.toLowerCase().replace(/&/g, "_")}.png`) });
}

await browser.close();
console.log("\n✓", OUT);
