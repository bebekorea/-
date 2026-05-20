// Capture our BEBE PET CategoryIndex entry animation from the running
// dev server. Scrolls to #index, samples frames while the marquee strip
// slides up from below (translateY 100% -> 0), then captures hover state.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../docs/design-references/bebe-entry");
mkdirSync(OUT_DIR, { recursive: true });

const URL = "http://localhost:3000/";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE:", m.text());
});

console.log("→ navigating to", URL);
await page.goto(URL, { waitUntil: "networkidle", timeout: 30_000 });
await page.waitForTimeout(800);
await page.screenshot({ path: resolve(OUT_DIR, "00-hero.png") });

// fp-container is the scroll container; scroll it to #index.offsetTop
console.log("→ jumping to #index");
const indexTop = await page.evaluate(() => {
  const c = document.querySelector(".fp-container");
  const el = document.getElementById("index");
  if (!c || !el) return null;
  // Reset scroll first so we observe the entry from a fresh state
  c.scrollTop = 0;
  return el.offsetTop;
});
if (indexTop == null) {
  console.log("× couldn't find .fp-container or #index");
  process.exit(1);
}
await page.waitForTimeout(400);

// Programmatically scroll, snapping to the index section start.
// We bypass the wheel-jump handler by setting scrollTop directly so the
// useInView observer fires cleanly without being tangled in the page-level
// jump animation.
await page.evaluate((top) => {
  const c = document.querySelector(".fp-container");
  if (c) c.scrollTop = top;
}, indexTop);

const t0 = Date.now();
const frames = [0, 50, 150, 300, 600, 1000, 1500, 2000, 2500];
for (const ms of frames) {
  const remaining = ms - (Date.now() - t0);
  if (remaining > 0) await page.waitForTimeout(remaining);
  await page.screenshot({
    path: resolve(OUT_DIR, `entry-${String(ms).padStart(4, "0")}ms.png`),
  });
  // Also peek the marquee wrapper transform to confirm the slide is happening
  const t = await page.evaluate(() => {
    const section = document.getElementById("index");
    if (!section) return null;
    // Find the marquee strip (absolute, bottom 0, contains animate-marquee-left)
    const strip = section.querySelector(
      "div.absolute.z-10.inset-x-0.overflow-hidden",
    );
    if (!strip) return null;
    const slide = strip.querySelector(":scope > div");
    if (!slide) return null;
    return getComputedStyle(slide).transform;
  });
  console.log(`  +${ms}ms slide.transform=`, t);
}

// Hover capture — hover the first marquee item
console.log("→ probing hover");
await page.waitForTimeout(500);
const target = await page.evaluate(() => {
  const buttons = document.querySelectorAll("#index button");
  if (buttons.length === 0) return null;
  // Pick a button near the center of viewport
  let best = null;
  let bestDist = Infinity;
  buttons.forEach((b) => {
    const r = b.getBoundingClientRect();
    if (r.width === 0) return;
    const cx = r.x + r.width / 2;
    const dist = Math.abs(cx - window.innerWidth / 2);
    if (dist < bestDist) {
      bestDist = dist;
      best = b;
    }
  });
  if (!best) return null;
  const r = best.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, text: best.textContent?.trim() };
});

if (target) {
  await page.mouse.move(target.x, target.y);
  await page.waitForTimeout(400);
  await page.screenshot({ path: resolve(OUT_DIR, "10-hover.png") });
  console.log("  hovered:", target.text);
}

await browser.close();
console.log("✓ frames in", OUT_DIR);
