import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const OUT = "./docs/research/cat-bottom-grad";
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(1500);
await p.evaluate(() => { const c = document.querySelector(".fp-container"); const el = document.getElementById("index"); if (c && el) c.scrollTop = el.offsetTop; });
await p.waitForTimeout(2400);

const grad = await p.evaluate(() => {
  const section = document.getElementById("index");
  const divs = [...section.querySelectorAll("div")];
  const g = divs.find(d => {
    const cs = getComputedStyle(d);
    return cs.background.includes("gradient") && cs.background.includes("rgba(0, 0, 0");
  });
  if (!g) return null;
  const r = g.getBoundingClientRect();
  return { height: r.height, vh: (r.height / 9).toFixed(2), background: getComputedStyle(g).background.slice(0, 100) };
});
console.log("Bottom gradient:", grad);
await p.screenshot({ path: resolve(OUT, "settled.png") });
await b.close();
