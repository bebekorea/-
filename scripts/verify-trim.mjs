import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/research/trim-and-shrink-nav");
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

// Confirm copy block is gone
const copyExists = await page.evaluate(() => {
  // The deleted block had eyebrow="CATEGORIES" + h2 tagline
  const eyebrow = [...document.querySelectorAll("#index p")].find(p => p.textContent?.trim() === "CATEGORIES");
  const tagline = [...document.querySelectorAll("#index h2")].find(h => h.textContent?.includes("일상"));
  return { eyebrow: !!eyebrow, tagline: !!tagline };
});
console.log("Removed copy block check:");
console.log(`  CATEGORIES eyebrow present? ${copyExists.eyebrow} (expected false)`);
console.log(`  tagline h2 present?         ${copyExists.tagline} (expected false)`);

// Measure nav cluster width
const navInfo = await page.evaluate(() => {
  const nav = document.querySelector("header nav");
  if (!nav) return null;
  const r = nav.getBoundingClientRect();
  const items = [...nav.querySelectorAll("a, button")].map(el => {
    const er = el.getBoundingClientRect();
    return { text: el.textContent?.trim(), w: er.width, fontSize: getComputedStyle(el).fontSize };
  });
  return { totalWidth: r.width, items };
});
console.log("\nNav cluster:");
console.log(`  total width: ${navInfo?.totalWidth?.toFixed(1)}px (~${(navInfo.totalWidth / 14.4).toFixed(2)}vw)`);
console.log(`  before-shrink baseline was ~44vw = ~633px`);
console.log("  items:");
navInfo?.items.forEach(i => console.log(`    "${i.text}" w=${i.w.toFixed(1)}px font-size=${i.fontSize}`));

await page.screenshot({ path: resolve(OUT, "settled.png") });
await page.screenshot({ path: resolve(OUT, "header.png"), clip: { x: 0, y: 0, width: 1440, height: 80 } });

await browser.close();
console.log("✓", OUT);
