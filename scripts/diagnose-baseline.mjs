// Sanity test: capture baseline (no hover) vs hovered HOSPITALITY.
// They MUST be different — if not, hover isn't actually applying.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import fs from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/research/baseline-vs-hover");
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

// Move cursor far away (corner)
await page.mouse.move(20, 20);
await page.waitForTimeout(800);
const baseline = await page.screenshot({ type: "png" });
fs.writeFileSync(resolve(OUT, "baseline.png"), baseline);
const hashBaseline = crypto.createHash("sha256").update(baseline).digest("hex").slice(0, 16);

// Pause auto-marquee so we have a stable comparison position
await page.evaluate(() => {
  const t = document.querySelector("#index .animate-marquee-left");
  if (t) t.style.animationPlayState = "paused";
});
await page.waitForTimeout(50);
const baselinePaused = await page.screenshot({ type: "png" });
fs.writeFileSync(resolve(OUT, "baseline-paused.png"), baselinePaused);
const hashBaselinePaused = crypto.createHash("sha256").update(baselinePaused).digest("hex").slice(0, 16);

// Now hover HOSPITALITY
const target = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll("#index button")].filter(b => b.textContent?.includes("HOSPITALITY"));
  let best = null, bestDist = Infinity;
  buttons.forEach(b => {
    const r = b.getBoundingClientRect();
    if (r.width === 0) return;
    const cx = r.x + r.width / 2;
    const d = Math.abs(cx - window.innerWidth / 2);
    if (d < bestDist) { bestDist = d; best = r; }
  });
  return best ? { x: best.x + best.width / 2, y: best.y + best.height / 2 } : null;
});
console.log("HOSPITALITY center:", target);
await page.mouse.move(target.x, target.y);
await page.waitForTimeout(1500); // settle
const hovered = await page.screenshot({ type: "png" });
fs.writeFileSync(resolve(OUT, "hovered.png"), hovered);
const hashHovered = crypto.createHash("sha256").update(hovered).digest("hex").slice(0, 16);

// Read state to confirm hover actually fired
const state = await page.evaluate(() => {
  const section = document.getElementById("index");
  const previewWrapper = section?.children?.[1];
  const layers = previewWrapper ? [...previewWrapper.children].map(el => getComputedStyle(el).opacity) : [];
  return { layers };
});
console.log("PreviewLayer opacities (after hover):", state.layers);

console.log("hash baseline       :", hashBaseline);
console.log("hash baseline-paused:", hashBaselinePaused);
console.log("hash hovered        :", hashHovered);
console.log("baseline vs hovered:", hashBaseline === hashHovered ? "IDENTICAL ✗" : "DIFFER ✓");
console.log("paused vs hovered  :", hashBaselinePaused === hashHovered ? "IDENTICAL ✗" : "DIFFER ✓");

await browser.close();
console.log("✓", OUT);
