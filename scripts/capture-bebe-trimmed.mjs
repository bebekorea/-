// Verify the trimmed/uncovered marquee:
//   - dark overlay removed (background photo / hovered preview shows fully)
//   - outer overflow-hidden removed (hover scale-up not clipped at top)
//   - CATEGORIES = [ADOPT, HOSPITAL] only
//   - tighter letter-spacing

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/design-references/bebe-trimmed");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto("http://localhost:3000/", {
  waitUntil: "domcontentloaded",
  timeout: 60_000,
});
await page.waitForTimeout(1500);
await page.evaluate(() => {
  const c = document.querySelector(".fp-container");
  const el = document.getElementById("index");
  if (c && el) c.scrollTop = el.offsetTop;
});
await page.waitForTimeout(2200);
await page.screenshot({ path: resolve(OUT, "01-index-settled.png") });

// Inspect: dark overlay should NOT exist
const overlayProbe = await page.evaluate(() => {
  const section = document.getElementById("index");
  const overlays = section?.querySelectorAll(".bg-black\\/55");
  return overlays?.length ?? 0;
});
console.log("  bg-black/55 overlay count in #index:", overlayProbe);

// Inspect: outer marquee container should NOT have overflow:hidden
const overflowProbe = await page.evaluate(() => {
  const strip = document.querySelector(
    "#index div.absolute.z-10.inset-x-0",
  );
  if (!strip) return null;
  return {
    overflow: getComputedStyle(strip).overflow,
    overflowY: getComputedStyle(strip).overflowY,
  };
});
console.log("  marquee outer overflow:", overflowProbe);

// Inspect: CATEGORIES — count buttons in marquee
const labels = await page.evaluate(() => {
  return [...document.querySelectorAll("#index button")].map(
    (b) => b.textContent?.trim(),
  );
});
console.log("  marquee button labels:", labels);

// Hover the first ADOPT button — capture WITHOUT clipping at top
const target = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll("#index button")];
  let best = null;
  let bestDist = Infinity;
  buttons.forEach((b) => {
    const r = b.getBoundingClientRect();
    if (r.width === 0) return;
    const cx = r.x + r.width / 2;
    if (cx < 0 || cx > window.innerWidth) return;
    const d = Math.abs(cx - window.innerWidth / 2);
    if (d < bestDist) {
      bestDist = d;
      best = { rect: r, text: b.textContent?.trim() };
    }
  });
  if (!best) return null;
  return {
    x: best.rect.x + best.rect.width / 2,
    y: best.rect.y + best.rect.height / 2,
    text: best.text,
  };
});
if (target) {
  console.log("  hovering:", target.text, "at", target.x, target.y);
  // Pause auto-marquee to keep target stable for hover capture
  await page.evaluate(() => {
    const t = document.querySelector("#index .animate-marquee-left");
    if (t) t.style.animationPlayState = "paused";
  });
  await page.mouse.move(target.x, target.y);
  await page.waitForTimeout(450);
  await page.screenshot({ path: resolve(OUT, "02-hovered.png") });
}

await browser.close();
console.log("✓", OUT);
