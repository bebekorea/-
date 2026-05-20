// HIGH-FREQUENCY diagnostic for HOSPITALITY hover flash.
// Samples every animation frame (~16ms) for 4 seconds while hovering
// HOSPITALITY, tracking EVERY observable bit of state that could cause
// visible flashing. Also records video so we can play it back.
//
// What we look for:
//   - Outer PreviewLayer opacity oscillating
//   - Location's INTERNAL photo wrapper opacity / transform changing
//   - Location's section bg-white toggling
//   - hovered React state churning (proxied by data attribute)
//   - Multiple PreviewLayers becoming visible at once (z-fight)
//   - Marquee track transform jumping
//
// Sampling at 16ms with computedStyle reads is heavy but accurate.

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/research/hospitality-flash");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
});
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
await page.waitForTimeout(2400);

// Locate HOSPITALITY
const target = await page.evaluate(() => {
  const buttons = [
    ...document.querySelectorAll("#index button"),
  ].filter((b) => b.textContent?.includes("HOSPITALITY"));
  let best = null;
  let bestDist = Infinity;
  buttons.forEach((b) => {
    const r = b.getBoundingClientRect();
    if (r.width === 0) return;
    const cx = r.x + r.width / 2;
    const d = Math.abs(cx - window.innerWidth / 2);
    if (d < bestDist) {
      bestDist = d;
      best = { rect: r, ref: b };
    }
  });
  if (!best) return null;
  best.ref.setAttribute("data-fds-target", "1");
  return {
    x: best.rect.x + best.rect.width / 2,
    y: best.rect.y + best.rect.height / 2,
  };
});
if (!target) {
  console.log("× HOSPITALITY not found");
  await ctx.close();
  await browser.close();
  process.exit(1);
}

// Move cursor to HOSPITALITY and hold steady (no jitter this time —
// we're chasing internal state churn, not mouse-triggered events).
await page.mouse.move(target.x, target.y);
await page.waitForTimeout(150);

console.log("→ sampling for 4 seconds at ~16ms intervals (steady cursor)");
const startMs = Date.now();
const samples = [];

// Use page.evaluate with a native rAF loop inside the page to capture
// frames from the actual rendering pipeline.
await page.evaluate(() => {
  const w = window;
  w.__captures = [];
  let count = 0;
  const tick = () => {
    if (count >= 250) return; // 250 frames ≈ 4 seconds at 60fps
    const section = document.getElementById("index");
    const previewWrapper = section?.children?.[1];
    const locPreviewLayer = previewWrapper?.children?.[1];
    // Inside locPreviewLayer is <Location> rendered. Find Location's
    // section element + its photo wrapper.
    const locSection = locPreviewLayer?.querySelector("#location");
    // Photo wrapper is the first absolute z-10 div inside locSection
    const photoWrapper = locSection?.querySelector(
      "div.absolute.z-10.overflow-hidden",
    );
    const innerStage1Photo = photoWrapper?.children?.[0];
    const innerStage2Photo = photoWrapper?.children?.[1];
    const innerOverlay = photoWrapper?.children?.[2];
    const target = section?.querySelector("[data-fds-target]");
    const targetRect = target?.getBoundingClientRect();
    const marqueeOuter = section?.children[section.children.length - 1];
    const track = marqueeOuter?.querySelector(".animate-marquee-left");

    w.__captures.push({
      t: performance.now(),
      previewLayerOpacity: locPreviewLayer
        ? getComputedStyle(locPreviewLayer).opacity
        : null,
      locSectionExists: !!locSection,
      locSectionBg: locSection ? getComputedStyle(locSection).backgroundColor : null,
      photoWrapperOpacity: photoWrapper
        ? getComputedStyle(photoWrapper).opacity
        : null,
      photoWrapperWidth: photoWrapper
        ? getComputedStyle(photoWrapper).width
        : null,
      photoWrapperTransform: photoWrapper
        ? getComputedStyle(photoWrapper).transform
        : null,
      stage1PhotoOpacity: innerStage1Photo
        ? getComputedStyle(innerStage1Photo).opacity
        : null,
      stage2PhotoOpacity: innerStage2Photo
        ? getComputedStyle(innerStage2Photo).opacity
        : null,
      overlayOpacity: innerOverlay
        ? getComputedStyle(innerOverlay).opacity
        : null,
      targetRectX: targetRect?.x,
      targetRectW: targetRect?.width,
      trackTransform: track ? getComputedStyle(track).transform : null,
      trackPlay: track ? getComputedStyle(track).animationPlayState : null,
    });
    count++;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

await page.waitForTimeout(4500);

const captures = await page.evaluate(() => /** @type any */ (window).__captures);
console.log(`  collected ${captures.length} frames`);

// Analyse each tracked field
function uniques(field) {
  const set = new Set();
  captures.forEach((c) => set.add(c[field]));
  return [...set];
}
function summarise(field) {
  const u = uniques(field);
  if (u.length <= 1) return `STABLE (${JSON.stringify(u[0])})`;
  // Find the first transition
  const first = captures[0]?.[field];
  let firstChangeFrame = -1;
  for (let i = 0; i < captures.length; i++) {
    if (captures[i][field] !== first) {
      firstChangeFrame = i;
      break;
    }
  }
  // Count changes
  let changes = 0;
  for (let i = 1; i < captures.length; i++) {
    if (captures[i][field] !== captures[i - 1][field]) changes++;
  }
  return `${u.length} unique values, ${changes} transitions, first change at frame ${firstChangeFrame} (~${Math.round((firstChangeFrame * 16))}ms). Sample: ${JSON.stringify(u.slice(0, 4))}`;
}

console.log("\n=== STATE CHURN ANALYSIS ===");
console.log("PreviewLayer.opacity      :", summarise("previewLayerOpacity"));
console.log("Location.section bg-color :", summarise("locSectionBg"));
console.log("Location photo-wrapper opacity:", summarise("photoWrapperOpacity"));
console.log("Location photo-wrapper width :", summarise("photoWrapperWidth"));
console.log("Location photo-wrapper xform :", summarise("photoWrapperTransform"));
console.log("Location stage-1 photo opacity:", summarise("stage1PhotoOpacity"));
console.log("Location stage-2 photo opacity:", summarise("stage2PhotoOpacity"));
console.log("Location dark overlay opacity:", summarise("overlayOpacity"));
console.log("HOSPITALITY rect x        :", summarise("targetRectX"));
console.log("HOSPITALITY rect w        :", summarise("targetRectW"));
console.log("Marquee track transform   :", summarise("trackTransform"));
console.log("Marquee animation playState:", summarise("trackPlay"));

writeFileSync(
  resolve(OUT, "frames.json"),
  JSON.stringify(captures, null, 2),
  "utf-8",
);

await page.screenshot({ path: resolve(OUT, "after.png") });
await ctx.close(); // closes recording
await browser.close();
console.log("✓", OUT);
