import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const OUT = "./docs/research/arrow";
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(1500);
await p.evaluate(() => { const c = document.querySelector(".fp-container"); const el = document.getElementById("index"); if (c && el) c.scrollTop = el.offsetTop; });
await p.waitForTimeout(2400);

// Sample arrow position over time
const samples = [];
for (let i = 0; i < 8; i++) {
  await p.waitForTimeout(225); // 8 samples × 225ms = 1800ms = full cycle
  const tr = await p.evaluate(() => {
    const a = document.querySelector("#index .animate-arrow-float");
    return a ? getComputedStyle(a).transform : null;
  });
  samples.push(tr);
}
console.log("Arrow transform over 1.8s cycle:");
samples.forEach((s, i) => console.log(`  +${(i+1)*225}ms: ${s}`));

await p.screenshot({ path: resolve(OUT, "settled.png") });
await b.close();
