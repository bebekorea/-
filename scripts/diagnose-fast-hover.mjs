// Reproduce the user's HOSPITALITY-darkens-then-brightens bug.
// Hover within ~300ms of arriving at #index — before Location's
// internal photo wrapper finishes its 2000ms inView entry animation.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/research/fast-hover-bug");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForTimeout(800);

// Scroll to index AND immediately mouse-over HOSPITALITY position
// (cursor was at 0,0; now move to roughly where HOSPITALITY will land)
await Promise.all([
  page.evaluate(() => {
    const c = document.querySelector(".fp-container");
    const el = document.getElementById("index");
    if (c && el) c.scrollTop = el.offsetTop;
  }),
  // Move cursor to a known HOSPITALITY x position — at 4.5vw font, the
  // first label sits around x=20–425, so center roughly 220, y=830.
  page.mouse.move(220, 830),
]);

// Sample Location's INTERNAL photo wrapper opacity every 100ms for 3s,
// starting NOW (just after triggering the scroll + hover).
const samples = [];
for (let i = 0; i < 30; i++) {
  const s = await page.evaluate(() => {
    const section = document.getElementById("index");
    const previewWrapper = section?.children?.[1];
    const locPreviewLayer = previewWrapper?.children?.[1];
    const locSection = locPreviewLayer?.querySelector("#location");
    const photoWrapper = locSection?.querySelector("div.absolute.z-10.overflow-hidden");
    return {
      previewLayerOpacity: locPreviewLayer ? getComputedStyle(locPreviewLayer).opacity : null,
      photoWrapperOpacity: photoWrapper ? getComputedStyle(photoWrapper).opacity : null,
    };
  });
  samples.push({ ms: i * 100, ...s });
  if (i === 0 || i === 5 || i === 15 || i === 29) {
    await page.screenshot({ path: resolve(OUT, `t-${String(i * 100).padStart(4, "0")}ms.png`) });
  }
  await page.waitForTimeout(100);
}

console.log("Time vs Location internal photo wrapper opacity (during fast hover):");
samples.forEach(s => {
  console.log(`  t=${String(s.ms).padStart(4)}ms | previewLayer=${(s.previewLayerOpacity ?? "?").toString().padEnd(8)} | photoWrapper=${s.photoWrapperOpacity ?? "?"}`);
});

await browser.close();
console.log("✓", OUT);
