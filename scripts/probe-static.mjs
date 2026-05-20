import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(1500);
await p.evaluate(() => { const c = document.querySelector(".fp-container"); const el = document.getElementById("index"); if (c && el) c.scrollTop = el.offsetTop; });
await p.waitForTimeout(2400);

const x = await p.evaluate(() => {
  const buttons = [...document.querySelectorAll("#index button")].filter(btn => !btn.textContent?.includes("예약하기"));
  return buttons.map(btn => {
    const r = btn.getBoundingClientRect();
    return { text: btn.textContent?.trim(), x: r.x, w: r.width, right: r.x + r.width };
  });
});
console.log("Marquee buttons:");
x.forEach(b => console.log(`  ${b.text.padEnd(15)}  x=${b.x.toFixed(1).padStart(7)}  w=${b.w.toFixed(1).padStart(6)}  right=${b.right.toFixed(1).padStart(7)}`));
console.log("\nViewport: 0 — 1440");
console.log("All in viewport:", x.every(b => b.x >= 0 && b.right <= 1440) ? "✓" : "✗");
console.log("Track total span:", x[0]?.x.toFixed(1), "to", x[x.length-1]?.right.toFixed(1));
await b.close();
