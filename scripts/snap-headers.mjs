import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/research/header-colors");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForTimeout(1500);

for (const id of ["adopt", "location", "partners", "product"]) {
  await page.evaluate((sid) => {
    const c = document.querySelector(".fp-container");
    const el = document.getElementById(sid);
    if (c && el) c.scrollTop = el.offsetTop;
  }, id);
  await page.waitForTimeout(1700);
  // Crop to just the header strip
  await page.screenshot({
    path: resolve(OUT, `${id}.png`),
    clip: { x: 0, y: 0, width: 1440, height: 100 },
  });
}
await browser.close();
console.log("✓", OUT);
