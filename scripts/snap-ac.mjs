import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const OUT = "./docs/research/ac-hybrid";
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(1500);
await p.evaluate(() => { const c = document.querySelector(".fp-container"); const el = document.getElementById("index"); if (c && el) c.scrollTop = el.offsetTop; });
await p.waitForTimeout(2400);

const editorial = await p.evaluate(() => {
  const eyebrow = document.querySelector("#index p");
  const h2 = document.querySelector("#index h2");
  const captions = [...document.querySelectorAll("#index button")].map(b => {
    const parent = b.parentElement;
    const cap = parent.querySelector("span");
    return { btn: b.textContent?.trim().slice(0, 20), cap: cap?.textContent?.trim() };
  });
  return {
    eyebrow: eyebrow?.textContent?.trim(),
    h2: h2?.textContent?.replaceAll(/\s+/g, " ").trim(),
    captions,
  };
});
console.log("Editorial block:");
console.log("  eyebrow:", editorial.eyebrow);
console.log("  h2:", editorial.h2);
console.log("\nCaption per marquee item:");
editorial.captions.forEach(c => console.log(`  ${c.btn?.padEnd(15)} → ${c.cap}`));

await p.screenshot({ path: resolve(OUT, "settled.png") });
await b.close();
