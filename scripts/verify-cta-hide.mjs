import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/research/cta-hide");
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

// CTA position + opacity in settled state
const settled = await page.evaluate(() => {
  // CTA is the div with "베베펫이 제공하는" text
  const ctaP = [...document.querySelectorAll("#index p")].find(p => p.textContent?.includes("베베펫이 제공"));
  const cta = ctaP?.parentElement;
  if (!cta) return null;
  const r = cta.getBoundingClientRect();
  const cs = getComputedStyle(cta);
  return {
    bottom: 900 - (r.y + r.height),
    rectY: r.y,
    rectH: r.height,
    opacity: cs.opacity,
  };
});
console.log("Settled (no hover):");
console.log(`  CTA bottom from viewport-bottom: ${settled?.bottom?.toFixed(1)}px (~${(settled?.bottom / 9).toFixed(1)}vh)`);
console.log(`  CTA opacity: ${settled?.opacity}`);
await page.screenshot({ path: resolve(OUT, "01-settled.png") });

// Hover ADOPT
const adopt = await page.evaluate(() => {
  const b = [...document.querySelectorAll("#index button")].find(b => b.textContent === "ADOPT");
  const r = b.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await page.mouse.move(adopt.x, adopt.y);
await page.waitForTimeout(1700);
const onAdopt = await page.evaluate(() => {
  const ctaP = [...document.querySelectorAll("#index p")].find(p => p.textContent?.includes("베베펫이 제공"));
  const cta = ctaP?.parentElement;
  return cta ? getComputedStyle(cta).opacity : null;
});
console.log("Hovering ADOPT:");
console.log(`  CTA opacity: ${onAdopt} (expected 0)`);
await page.screenshot({ path: resolve(OUT, "02-hovering-adopt.png") });

// Move cursor INTO the header area (different DOM subtree, fires
// mouseLeave on #index → scheduleClear → after 150ms debounce + the
// 400ms-delayed 2000ms re-fade transition the CTA should be visible
// again). y=20 puts cursor on the fixed Header bar (z-50).
await page.mouse.move(720, 20);
await page.waitForTimeout(2700); // 150ms debounce + 400ms delay + ~2000ms transition
const released = await page.evaluate(() => {
  const ctaP = [...document.querySelectorAll("#index p")].find(p => p.textContent?.includes("베베펫이 제공"));
  const cta = ctaP?.parentElement;
  return cta ? getComputedStyle(cta).opacity : null;
});
console.log("After cursor moves to header area (#index mouseLeave fires):");
console.log(`  CTA opacity: ${released} (expected 1, fades back in)`);
await page.screenshot({ path: resolve(OUT, "03-released.png") });

await browser.close();
console.log("✓", OUT);
