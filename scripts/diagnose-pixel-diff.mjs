// Pixel-level flicker hunt:
// Hover HOSPITALITY, wait until all known transitions settle (1.2s),
// then take 30 screenshots back-to-back at 100ms intervals. If any
// frame's bytes differ from a baseline, we have a real visible flicker
// the unrelated state-sampling tests missed.

import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/research/hospitality-pixel");
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
  return best ? { x: best.x + best.width / 2, y: best.y + best.height / 2 } : null;
});

// Hover and wait for ALL transitions to complete (margin)
await page.mouse.move(target.x, target.y);
await page.waitForTimeout(1500); // 380ms PreviewLayer + 220ms letterSpacing + 2000ms Location photo wrapper = 2000ms max

// Take 30 screenshots at 100ms intervals, hash each, compare
const hashes = [];
for (let i = 0; i < 30; i++) {
  const buf = await page.screenshot({ type: "png" });
  const h = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
  hashes.push(h);
  if (i === 0 || i === 14 || i === 29) {
    const fs = await import("node:fs");
    fs.writeFileSync(resolve(OUT, `frame-${String(i).padStart(2, "0")}.png`), buf);
  }
  await page.waitForTimeout(100);
}

const unique = new Set(hashes);
console.log(`captured 30 frames, ${unique.size} distinct images:`);
console.log("  hashes:", hashes.join(" "));
if (unique.size > 1) {
  console.log("⚠ visual flicker detected — the page rendering is changing over time");
  // Find the transition points
  for (let i = 1; i < hashes.length; i++) {
    if (hashes[i] !== hashes[i - 1]) {
      console.log(`  frame ${i} differs from frame ${i - 1}`);
    }
  }
} else {
  console.log("✓ all frames identical — page is visually stable");
}

await browser.close();
console.log("✓", OUT);
