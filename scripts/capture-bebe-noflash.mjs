// Hover HOSPITAL for 3s while sampling the visible state of every
// PreviewLayer at 100ms intervals. If the flash bug is fixed, the
// "location" PreviewLayer should be opacity 1 for the entire window
// after the initial fade-in, with no oscillation. Also capture before/
// after frames to confirm edge gradients are gone.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/design-references/bebe-noflash");
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

// Verify edge fade gradient divs are gone
const edgeFades = await page.evaluate(() => {
  const section = document.getElementById("index");
  return section
    ? section.querySelectorAll(".bg-gradient-to-l, .bg-gradient-to-r").length
    : -1;
});
console.log("  edge-fade gradient divs in #index:", edgeFades);

// Find HOSPITAL button center
const target = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll("#index button")].filter((b) =>
    b.textContent?.trim().includes("HOSPITAL"),
  );
  if (buttons.length === 0) return null;
  // Pick whichever HOSPITAL is most centered horizontally
  let best = null;
  let bestDist = Infinity;
  buttons.forEach((b) => {
    const r = b.getBoundingClientRect();
    if (r.width === 0) return;
    const cx = r.x + r.width / 2;
    const d = Math.abs(cx - window.innerWidth / 2);
    if (d < bestDist) {
      bestDist = d;
      best = { rect: r };
    }
  });
  if (!best) return null;
  return {
    x: best.rect.x + best.rect.width / 2,
    y: best.rect.y + best.rect.height / 2,
  };
});
if (!target) {
  console.log("× couldn't find HOSPITAL button");
  process.exit(1);
}
console.log("  hovering HOSPITAL at", target.x, target.y);

// Move cursor onto HOSPITAL and hold
await page.mouse.move(target.x, target.y);
await page.waitForTimeout(500);
await page.screenshot({ path: resolve(OUT, "01-hovered-initial.png") });

// Sample the PreviewLayer state every 100ms for 3 seconds
const samples = [];
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(100);
  const sample = await page.evaluate(() => {
    const section = document.getElementById("index");
    const previewWrapper = section?.children?.[1]; // second child = PreviewLayer container
    const layers = previewWrapper
      ? [...previewWrapper.children].map((el, i) => ({
          i,
          opacity: getComputedStyle(el).opacity,
        }))
      : [];
    // Also read the marquee track animationPlayState
    const track = section?.querySelector(".animate-marquee-left");
    return {
      layers,
      trackPlay: track ? getComputedStyle(track).animationPlayState : null,
    };
  });
  samples.push(sample);
}

// Analyse stability: location PreviewLayer (index 1) should be at opacity 1
// throughout, marquee track should be paused throughout.
const locOpacities = samples.map((s) => s.layers[1]?.opacity);
const playStates = samples.map((s) => s.trackPlay);
const uniqueOpacities = [...new Set(locOpacities)];
const uniquePlays = [...new Set(playStates)];

console.log("  location PreviewLayer opacities (30 samples):", uniqueOpacities);
console.log("  marquee track playState (30 samples):", uniquePlays);
console.log(
  "  flash check:",
  uniqueOpacities.length === 1 && uniqueOpacities[0] === "1"
    ? "✓ stable opacity 1 — no flash"
    : `✗ unstable: ${JSON.stringify(uniqueOpacities)}`,
);
console.log(
  "  pause check:",
  uniquePlays.length === 1 && uniquePlays[0] === "paused"
    ? "✓ marquee stays paused"
    : `✗ marquee resumed mid-hover: ${JSON.stringify(uniquePlays)}`,
);

await page.screenshot({ path: resolve(OUT, "02-hovered-after-3s.png") });

// Cursor leaves the strip — should clear hover and resume marquee
await page.mouse.move(10, 10);
await page.waitForTimeout(800);
const afterLeave = await page.evaluate(() => {
  const section = document.getElementById("index");
  const previewWrapper = section?.children?.[1];
  const layers = previewWrapper
    ? [...previewWrapper.children].map((el) => getComputedStyle(el).opacity)
    : [];
  const track = section?.querySelector(".animate-marquee-left");
  return {
    layers,
    trackPlay: track ? getComputedStyle(track).animationPlayState : null,
  };
});
console.log("  after cursor leaves strip:");
console.log("    layer opacities:", afterLeave.layers);
console.log("    track playState:", afterLeave.trackPlay);

await browser.close();
console.log("✓", OUT);
