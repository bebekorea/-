// Verify the new scroll-flow indicator under the CTA matches the Hero's:
// the highlight should travel top→bottom on a 2.2s loop, fading in/out
// at the edges. Capture 5 frames spaced through one animation cycle.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/research/scroll-flow");
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

// Locate the indicator track
const trackInfo = await page.evaluate(() => {
  // Find the scroll-flow span inside #index
  const span = document.querySelector("#index .animate-scroll-flow");
  if (!span) return null;
  const track = span.parentElement;
  const r = track.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
console.log("Track rect:", trackInfo);

// Sample the highlight transform at 5 evenly-spaced moments through one cycle
const samples = [0, 440, 880, 1320, 1760, 2200];
for (const t of samples) {
  await page.waitForTimeout(t === 0 ? 100 : 440);
  const probe = await page.evaluate(() => {
    const span = document.querySelector("#index .animate-scroll-flow");
    if (!span) return null;
    const cs = getComputedStyle(span);
    return {
      transform: cs.transform,
      opacity: cs.opacity,
    };
  });
  console.log(`  t=${String(t).padStart(4)}ms | transform=${probe?.transform} | opacity=${probe?.opacity}`);
}

// Capture a focused screenshot of the indicator area
if (trackInfo) {
  await page.screenshot({
    path: resolve(OUT, "indicator-zoom.png"),
    clip: {
      x: Math.max(0, trackInfo.x - 200),
      y: Math.max(0, trackInfo.y - 80),
      width: 400,
      height: trackInfo.h + 160,
    },
  });
}
await page.screenshot({ path: resolve(OUT, "full-page.png") });

await browser.close();
console.log("✓", OUT);
