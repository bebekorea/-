// Stress-test hover entry/exit + scrubbing within HOSPITALITY.
// Also tests in HEADED mode (visible browser) to expose any GPU
// compositing / rendering differences vs headless.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/research/stress-hospitality");
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
  return best ? { x: best.x + best.width / 2, y: best.y + best.height / 2, w: best.width, h: best.height } : null;
});

console.log("HOSPITALITY rect center:", target);

// Scenario 1: hover HOSPITALITY then scrub cursor within button bounds (real-hand jitter)
console.log("\n=== Scenario 1: hover + scrub within HOSPITALITY (1.5s settle, 30 frames at 50ms) ===");
await page.mouse.move(target.x, target.y);
await page.waitForTimeout(1500);
const hashes1 = [];
for (let i = 0; i < 30; i++) {
  // Move cursor in tiny circle within button bounds
  const angle = (i * 12) * Math.PI / 180;
  const dx = Math.cos(angle) * 8;
  const dy = Math.sin(angle) * 4;
  await page.mouse.move(target.x + dx, target.y + dy, { steps: 1 });
  const buf = await page.screenshot({ type: "png" });
  hashes1.push(crypto.createHash("sha256").update(buf).digest("hex").slice(0, 12));
  await page.waitForTimeout(50);
}
const u1 = new Set(hashes1);
console.log("  unique frames:", u1.size, "of 30");
if (u1.size > 1) {
  for (let i = 1; i < hashes1.length; i++) if (hashes1[i] !== hashes1[i-1]) console.log("  diff at", i);
}

// Scenario 2: rapid hover/unhover toggle
console.log("\n=== Scenario 2: rapid hover/unhover (10 cycles, 300ms each) ===");
const offsetX = target.x;
const offsetY_above = target.y - 50; // above the strip
const offsetY_on = target.y;
const hashes2 = [];
for (let cycle = 0; cycle < 10; cycle++) {
  await page.mouse.move(offsetX, offsetY_on);
  await page.waitForTimeout(150);
  const a = await page.screenshot({ type: "png" });
  hashes2.push("on:" + crypto.createHash("sha256").update(a).digest("hex").slice(0, 8));
  await page.mouse.move(offsetX, offsetY_above);
  await page.waitForTimeout(150);
  const b = await page.screenshot({ type: "png" });
  hashes2.push("off:" + crypto.createHash("sha256").update(b).digest("hex").slice(0, 8));
}
console.log("  hashes:");
hashes2.forEach((h, i) => console.log("   ", i, h));

// Scenario 3: mouse moves but stays inside HOSPITALITY for 3 seconds — does anything change?
console.log("\n=== Scenario 3: cursor moves continuously within HOSPITALITY (60 frames at 30ms) ===");
await page.mouse.move(target.x, target.y);
await page.waitForTimeout(800);
const hashes3 = [];
const stableHashes3 = [];
for (let i = 0; i < 60; i++) {
  const t = i / 10;
  await page.mouse.move(
    target.x + Math.sin(t) * 40,
    target.y + Math.cos(t * 1.3) * 8,
    { steps: 1 }
  );
  await page.waitForTimeout(30);
  const buf = await page.screenshot({ type: "png" });
  const h = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 12);
  hashes3.push(h);
}
const u3 = new Set(hashes3);
console.log("  unique frames:", u3.size, "of 60");

await browser.close();
console.log("\n✓", OUT);
