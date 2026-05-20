import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const OUT = "./docs/research/chevron";
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(1500);
await p.evaluate(() => { const c = document.querySelector(".fp-container"); const el = document.getElementById("index"); if (c && el) c.scrollTop = el.offsetTop; });
await p.waitForTimeout(2400);
const info = await p.evaluate(() => {
  const ctaP = [...document.querySelectorAll("#index p")].find(x => x.textContent?.includes("베베펫이 제공"));
  const cta = ctaP?.parentElement;
  const r = cta?.getBoundingClientRect();
  const svg = cta?.querySelector("svg");
  const sr = svg?.getBoundingClientRect();
  return {
    ctaBottom: r ? 900 - (r.y + r.height) : null,
    ctaBottomVh: r ? ((900 - (r.y + r.height)) / 9).toFixed(2) : null,
    svgPresent: !!svg,
    svgSize: sr ? { w: sr.width, h: sr.height } : null,
  };
});
console.log("CTA position:", info);
await p.screenshot({ path: resolve(OUT, "settled.png") });
await b.close();
