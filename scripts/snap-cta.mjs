import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const OUT = "./docs/research/cta-final";
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(1500);
await p.evaluate(() => { const c = document.querySelector(".fp-container"); const el = document.getElementById("index"); if (c && el) c.scrollTop = el.offsetTop; });
await p.waitForTimeout(2400);
// Crop on the CTA + indicator + marquee region
await p.screenshot({ path: resolve(OUT, "cta-zoom.png"), clip: { x: 400, y: 600, width: 640, height: 300 } });
await b.close();
