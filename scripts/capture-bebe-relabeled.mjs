// Verify new marquee labels, faster speed, gap between items.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/design-references/bebe-relabeled");
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
await page.waitForTimeout(2400); // wait for entry slide + marquee hold

// Read the new labels and animation speed
const info = await page.evaluate(() => {
  const section = document.getElementById("index");
  const buttons = [...(section?.querySelectorAll("button") ?? [])].filter(
    (b) => b.textContent && !b.textContent.includes("예약하기"),
  );
  const labels = buttons.map((b) => b.textContent?.trim());
  const marqueeOuter = section?.children[section.children.length - 1];
  const track = marqueeOuter?.querySelector(".animate-marquee-left");
  // Measure inter-button gap by reading two adjacent buttons' rects
  let gap = null;
  if (buttons.length >= 2) {
    const r0 = buttons[0].getBoundingClientRect();
    const r1 = buttons[1].getBoundingClientRect();
    gap = r1.x - (r0.x + r0.width);
  }
  return {
    labels,
    duration: track ? getComputedStyle(track).animationDuration : null,
    gap,
  };
});
console.log("  labels:", info.labels);
console.log("  animation-duration:", info.duration);
console.log("  inter-button gap (px):", info.gap);

await page.screenshot({ path: resolve(OUT, "01-settled.png") });

// Sample track transform at two times to estimate actual speed
async function readTrack() {
  return page.evaluate(() => {
    const section = document.getElementById("index");
    const marqueeOuter = section?.children[section.children.length - 1];
    const track = marqueeOuter?.querySelector(".animate-marquee-left");
    return {
      tr: track ? getComputedStyle(track).transform : null,
      width: track?.scrollWidth ?? 0,
    };
  });
}
const a = await readTrack();
await page.waitForTimeout(1500);
const b = await readTrack();
const matchA = /matrix\([^)]+\)/.exec(a.tr ?? "")?.[0];
const matchB = /matrix\([^)]+\)/.exec(b.tr ?? "")?.[0];
console.log("  track t=0  :", matchA, "scrollW:", a.width);
console.log("  track t=1.5:", matchB, "scrollW:", b.width);

await browser.close();
console.log("✓", OUT);
