// Reproduce the EDGE-JITTER scenario:
//   1) Move cursor onto HOSPITALITY (mid-button)
//   2) Repeatedly oscillate cursor across the strip's top edge by ±20px
//   3) Capture screenshots at each oscillation extreme
//   4) Hash and compare — without buffer/debounce these would differ
//      (PreviewLayer fading in/out); with the fix they should stay stable.

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/research/edge-jitter");
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
  return best ? { x: best.x + best.width / 2, y_top: best.y, y_center: best.y + best.height / 2 } : null;
});
console.log("HOSPITALITY top edge y:", target.y_top, "center y:", target.y_center);

// Pause auto-marquee so the strip is at a stable horizontal position
// (otherwise the marquee scrolling alone would invalidate the comparison)
await page.evaluate(() => {
  const t = document.querySelector("#index .animate-marquee-left");
  if (t) t.style.animationPlayState = "paused";
});

// Settle on hovering HOSPITALITY mid-button
await page.mouse.move(target.x, target.y_center);
await page.waitForTimeout(1500);

const hashes = [];
const states = [];
for (let i = 0; i < 20; i++) {
  // Alternate Y between 20px ABOVE strip top (simulating jitter that
  // crosses the boundary) and mid-button.
  const y = i % 2 === 0 ? target.y_top - 20 : target.y_center;
  await page.mouse.move(target.x, y, { steps: 1 });
  await page.waitForTimeout(80); // 80ms — long enough for any 0.1s flicker to manifest
  const buf = await page.screenshot({ type: "png" });
  hashes.push(crypto.createHash("sha256").update(buf).digest("hex").slice(0, 12));
  // Read PreviewLayer state to verify hover state
  const s = await page.evaluate(() => {
    const section = document.getElementById("index");
    const previewWrapper = section?.children?.[1];
    return previewWrapper ? [...previewWrapper.children].map(el => getComputedStyle(el).opacity) : [];
  });
  states.push({ y_offset: i % 2 === 0 ? "ABOVE" : "ON", layers: s, hash: hashes[hashes.length - 1] });
}

states.forEach((s, i) => console.log(`  ${i}: cursor ${s.y_offset.padEnd(5)} | location-opacity=${s.layers[1]} | hash=${s.hash}`));

const unique = new Set(hashes);
console.log("\n→ unique hashes:", unique.size, "of 20");
console.log(unique.size <= 2 ? "✓ FLASH MITIGATED — hashes alternate at most between 2 stable states" :
  unique.size > 5 ? "✗ FLASH STILL OCCURS — many distinct frames seen" :
  "≈ partial mitigation");

writeFileSync(resolve(OUT, "report.json"), JSON.stringify(states, null, 2), "utf-8");
await browser.close();
console.log("✓", OUT);
