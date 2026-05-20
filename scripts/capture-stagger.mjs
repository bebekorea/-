// Verify: (1) header is WHITE on #index in both settled and hovered
// states, (2) PreviewLayer no longer renders children when not visible,
// (3) on hover, Location's photo wrapper opacity actually transitions
// 0→1 (the "natural" entry — same vocabulary as Adopt below).

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/research/stagger-entry");
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

// Header colour, no hover
const headerSettled = await page.evaluate(() => getComputedStyle(document.querySelector("header a")).color);
console.log("Header (settled, no hover):", headerSettled);

// Verify Location is NOT in DOM when not hovered (mount-on-visible)
const locExistsBeforeHover = await page.evaluate(() => !!document.querySelector("#index #location"));
console.log("Location mounted before hover?", locExistsBeforeHover, "(expected false)");

await page.screenshot({ path: resolve(OUT, "01-settled.png") });

// Hover HOSPITALITY
const target = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll("#index button")].filter(b => b.textContent?.includes("HOSPITALITY"));
  const r = buttons[0]?.getBoundingClientRect();
  return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null;
});
const t0 = Date.now();
await page.mouse.move(target.x, target.y);

// Sample states during hover
const samples = [];
for (const t of [50, 200, 400, 700, 1200, 2000]) {
  const remaining = t - (Date.now() - t0);
  if (remaining > 0) await page.waitForTimeout(remaining);
  const s = await page.evaluate(() => {
    const photoWrapper = document.querySelector("#index #location div.absolute.z-10.overflow-hidden");
    const headerA = document.querySelector("header a");
    return {
      photoWrapperOpacity: photoWrapper ? getComputedStyle(photoWrapper).opacity : null,
      photoWrapperTransform: photoWrapper ? getComputedStyle(photoWrapper).transform : null,
      headerColor: headerA ? getComputedStyle(headerA).color : null,
    };
  });
  samples.push({ t, ...s });
  await page.screenshot({ path: resolve(OUT, `hover-${String(t).padStart(4, "0")}ms.png`) });
}

console.log("\nHover progression (Location's native fade-up):");
console.log("ms".padEnd(5), "photo-op".padEnd(10), "transform".padEnd(50), "header");
for (const s of samples) {
  console.log(
    String(s.t).padEnd(5),
    String(s.photoWrapperOpacity).padEnd(10),
    String(s.photoWrapperTransform).padEnd(50),
    s.headerColor,
  );
}

await browser.close();
console.log("✓", OUT);
