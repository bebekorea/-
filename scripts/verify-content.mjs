import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/research/restored-content");
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

// Verify thumbnails removed
const thumbCount = await page.evaluate(() => {
  return [...document.querySelectorAll('#index div[aria-hidden="true"]')].filter(d => /aspect-square/.test(d.className)).length;
});
console.log(`Settled state — thumbnail count: ${thumbCount} (expected 0)`);

const items = ["ADOPT", "HOSPITALITY", "FOOD", "PRODUCT", "BEAUTY&SPA"];
const expectations = {
  ADOPT: { hasInstagram: true, hasRegister: false, hasLogoFlow: false, hasCards: false },
  HOSPITALITY: { hasInstagram: false, hasRegister: false, hasLogoFlow: false, hasCards: false },
  FOOD: { hasInstagram: false, hasRegister: false, hasLogoFlow: true, hasCards: false },
  PRODUCT: { hasInstagram: false, hasRegister: false, hasLogoFlow: false, hasCards: true },
  "BEAUTY&SPA": { hasInstagram: false, hasRegister: true, hasLogoFlow: false, hasCards: false },
};

for (const item of items) {
  const btn = await page.evaluate((label) => {
    const b = [...document.querySelectorAll("#index button")].find(b => b.textContent === label);
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, item);
  await page.mouse.move(btn.x, btn.y);
  await page.waitForTimeout(700);
  const found = await page.evaluate(() => {
    const previewWrapper = document.querySelector('#index > div:nth-child(2)');
    const visiblePreview = [...previewWrapper.children].find(el => parseFloat(getComputedStyle(el).opacity) > 0.5);
    if (!visiblePreview) return null;
    return {
      hasInstagram: !!visiblePreview.querySelector('a[href*="instagram.com"]'),
      hasRegister: !![...visiblePreview.querySelectorAll("button")].find(b => b.textContent?.includes("예약하기")),
      hasLogoFlow: !!visiblePreview.querySelector(".animate-marquee-left img[src*='partner-name']"),
      hasCards: visiblePreview.querySelectorAll(".grid-cols-3.grid-rows-2 > div").length === 6,
    };
  });
  const exp = expectations[item];
  const ok = exp && found &&
    found.hasInstagram === exp.hasInstagram &&
    found.hasRegister === exp.hasRegister &&
    found.hasLogoFlow === exp.hasLogoFlow &&
    found.hasCards === exp.hasCards;
  console.log(`  ${item.padEnd(13)} → IG=${found?.hasInstagram} register=${found?.hasRegister} logoFlow=${found?.hasLogoFlow} 6cards=${found?.hasCards} ${ok ? "✓" : "✗"}`);
  await page.screenshot({ path: resolve(OUT, `hover-${item.toLowerCase().replace(/&/g, "_")}.png`) });
}

await browser.close();
console.log("✓", OUT);
