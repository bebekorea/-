import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/research/ad-combo");
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

// Settled state
const settled = await page.evaluate(() => {
  const thumbs = [...document.querySelectorAll('#index div[aria-hidden="true"]')]
    .filter(d => /aspect-square/.test(d.className))
    .map(d => {
      const r = d.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width };
    });
  return { thumbCount: thumbs.length, thumbs };
});
console.log("Settled — upper-right thumbnails:");
console.log(`  count: ${settled.thumbCount} (expected 4)`);
settled.thumbs.forEach((t, i) => console.log(`    thumb ${i}: x=${t.x.toFixed(0)} y=${t.y.toFixed(0)} w=${t.w.toFixed(0)}`));

await page.screenshot({ path: resolve(OUT, "01-settled.png") });

// Hover each marquee item, capture, check photo side
const items = ["ADOPT", "HOSPITALITY", "FOOD", "PRODUCT", "BEAUTY&SPA"];
const expected = ["left", "right", "left", "right", "left"];
console.log("\nHover preview alternation:");
for (let i = 0; i < items.length; i++) {
  const btn = await page.evaluate((label) => {
    const b = [...document.querySelectorAll("#index button")].find(b => b.textContent === label);
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, items[i]);
  await page.mouse.move(btn.x, btn.y);
  await page.waitForTimeout(700);

  // Find the photo div inside the visible CategoryHoverPreview
  const photoSide = await page.evaluate(() => {
    const previewWrapper = document.querySelector('#index > div:nth-child(2)');
    const visiblePreview = [...previewWrapper.children].find(el => parseFloat(getComputedStyle(el).opacity) > 0.5);
    if (!visiblePreview) return null;
    const split = visiblePreview.firstElementChild;
    if (!split) return null;
    const flexDir = getComputedStyle(split).flexDirection;
    return flexDir === "row" ? "left" : flexDir === "row-reverse" ? "right" : flexDir;
  });
  const ok = photoSide === expected[i];
  console.log(`  ${items[i].padEnd(13)} → photo ${photoSide} (expected ${expected[i]}) ${ok ? "✓" : "✗"}`);
  await page.screenshot({ path: resolve(OUT, `hover-${items[i].toLowerCase().replace(/&/g, "_")}.png`) });
}

await browser.close();
console.log("✓", OUT);
