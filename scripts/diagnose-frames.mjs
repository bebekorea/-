// Capture HOSPITALITY hover at 30ms intervals from a FRESH page load,
// then inspect every property of every layer that could possibly cause
// visible darkening: PreviewLayer opacity, Location bg color, photo
// wrapper opacity, bg-photo opacity (CategoryIndex's own cat&dog bg
// fade-in!), gradient opacity, etc.
// Save 8 screenshots spaced through the transition.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/research/hospitality-frames");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
// New context per run = fresh cache, mimics user's first visit
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForTimeout(800); // let initial paint settle

// Pre-position cursor at where HOSPITALITY will land (so the moment the
// section reveals, cursor is already on it triggering hover)
await page.mouse.move(220, 850);

// Trigger scroll to #index and START sampling at every 30ms
await page.evaluate(() => {
  const c = document.querySelector(".fp-container");
  const el = document.getElementById("index");
  if (c && el) c.scrollTop = el.offsetTop;
});

// Inject high-frequency state observer
await page.evaluate(() => {
  const w = window;
  w.__frames = [];
  let count = 0;
  const tick = () => {
    if (count >= 70) return; // 70 frames * ~30ms = 2.1s
    const section = document.getElementById("index");
    // Walk the layer stack
    const bgPhoto = section?.children?.[0]; // cat&dog div
    const previewWrapper = section?.children?.[1];
    const locPreviewLayer = previewWrapper?.children?.[1];
    const locSection = locPreviewLayer?.querySelector("#location");
    const photoWrapper = locSection?.querySelector("div.absolute.z-10.overflow-hidden");
    const stage1Photo = photoWrapper?.children?.[0];
    const gradient = section?.children?.[2]; // bottom gradient div
    const marqueeOuter = section?.children?.[3];

    w.__frames.push({
      t: performance.now(),
      bgPhotoOpacity: bgPhoto ? getComputedStyle(bgPhoto).opacity : null,
      bgPhotoBgImage: bgPhoto ? getComputedStyle(bgPhoto).backgroundImage?.slice(0, 40) : null,
      previewLayerOpacity: locPreviewLayer ? getComputedStyle(locPreviewLayer).opacity : null,
      locSectionBg: locSection ? getComputedStyle(locSection).backgroundColor : null,
      photoWrapperOpacity: photoWrapper ? getComputedStyle(photoWrapper).opacity : null,
      photoWrapperWidth: photoWrapper ? getComputedStyle(photoWrapper).width : null,
      stage1Opacity: stage1Photo ? getComputedStyle(stage1Photo).opacity : null,
      stage1BgImage: stage1Photo ? getComputedStyle(stage1Photo).backgroundImage?.slice(0, 40) : null,
      gradientOpacity: gradient ? getComputedStyle(gradient).opacity : null,
    });
    count++;
    setTimeout(tick, 30);
  };
  setTimeout(tick, 0);
});

// Wait for sampling to complete
await page.waitForTimeout(2300);

const frames = await page.evaluate(() => /** @type any */ (window).__frames);
const t0 = frames[0].t;
console.log(`Captured ${frames.length} frames over ${(frames[frames.length - 1].t - t0).toFixed(0)}ms`);

// Save 8 screenshots at evenly distributed times
const targets = [50, 150, 300, 500, 800, 1200, 1600, 2000];
console.log("\nState at key timestamps:");
console.log("ms".padEnd(5), "bg".padEnd(8), "prevL".padEnd(8), "photoWrap".padEnd(8), "stage1".padEnd(8), "grad".padEnd(8));
for (const t of targets) {
  const f = frames.find((fr) => fr.t - t0 >= t) ?? frames[frames.length - 1];
  console.log(
    String(t).padEnd(5),
    String(f.bgPhotoOpacity).padEnd(8),
    String(f.previewLayerOpacity).padEnd(8),
    String(f.photoWrapperOpacity).padEnd(8),
    String(f.stage1Opacity).padEnd(8),
    String(f.gradientOpacity).padEnd(8),
  );
}

// Replay and capture screenshots at the same moments
await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForTimeout(800);
await page.mouse.move(220, 850);
const startMs = Date.now();
await page.evaluate(() => {
  const c = document.querySelector(".fp-container");
  const el = document.getElementById("index");
  if (c && el) c.scrollTop = el.offsetTop;
});
for (const t of targets) {
  const remaining = t - (Date.now() - startMs);
  if (remaining > 0) await page.waitForTimeout(remaining);
  await page.screenshot({ path: resolve(OUT, `t-${String(t).padStart(4, "0")}ms.png`) });
}

await browser.close();
console.log("✓", OUT);
