import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(1500);

// Section topology
const topo = await p.evaluate(() => {
  const c = document.querySelector(".fp-container");
  return [...c.children].filter(el => el.id).map(el => ({ id: el.id, top: el.offsetTop, h: el.offsetHeight }));
});
console.log("Top-level scroll-snap sections:");
topo.forEach(s => console.log(`  #${s.id.padEnd(10)} offsetTop=${s.top}  height=${s.h}`));

// Bottom gradient should be gone
await p.evaluate(() => { const c = document.querySelector(".fp-container"); const el = document.getElementById("index"); if (c && el) c.scrollTop = el.offsetTop; });
await p.waitForTimeout(2400);
const grad = await p.evaluate(() => {
  const section = document.getElementById("index");
  // Look for any div with background containing gradient and pointer-events:none
  const divs = [...section.querySelectorAll("div")];
  return divs.filter(d => {
    const bg = getComputedStyle(d).background;
    return bg.includes("gradient") && (bg.includes("rgba(0, 0, 0") || bg.includes("rgb(0, 0, 0)"));
  }).length;
});
console.log(`\nBlack gradient overlays in #index: ${grad} (expected 0)`);

await b.close();
