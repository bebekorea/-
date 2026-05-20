// Walk the page top-to-bottom, snapshotting each top-level section so we
// can confirm the new vertical stack (CategoryStack) actually shows all
// six panels in order: hero → index → adopt → location → partners
// → product → beauty → contact → footer-ish.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/design-references/bebe-stack");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));

await page.goto("http://localhost:3000/", {
  waitUntil: "domcontentloaded",
  timeout: 60_000,
});
await page.waitForTimeout(1500);

// Enumerate every top-level section the scroll snap considers
const sections = await page.evaluate(() => {
  const c = document.querySelector(".fp-container");
  if (!c) return [];
  return [...c.children]
    .filter((el) => el instanceof HTMLElement && el.id)
    .map((el) => ({ id: el.id, top: el.offsetTop, h: el.offsetHeight }));
});
console.log("→ found sections:", sections);

for (const s of sections) {
  await page.evaluate((top) => {
    const c = document.querySelector(".fp-container");
    if (c) c.scrollTop = top;
  }, s.top);
  await page.waitForTimeout(2400); // entry animations + a beat
  await page.screenshot({ path: resolve(OUT, `${s.id}.png`) });
  console.log("  captured", s.id, "at offsetTop", s.top);
}

await browser.close();
console.log("✓ frames in", OUT);
