import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(1500);
await p.evaluate(() => { const c = document.querySelector(".fp-container"); const el = document.getElementById("index"); if (c && el) c.scrollTop = el.offsetTop; });
await p.waitForTimeout(2400);

// Click each marquee button by text and verify it scrolls to the right section
const sections = ["ADOPT", "HOSPITALITY", "FOOD", "PRODUCT", "BEAUTY&SPA"];
const expected = { ADOPT: "adopt", HOSPITALITY: "location", FOOD: "partners", PRODUCT: "product", "BEAUTY&SPA": "beauty" };
for (const text of sections) {
  // Reset to #index first
  await p.evaluate(() => {
    const c = document.querySelector(".fp-container");
    const el = document.getElementById("index");
    if (c && el) c.scrollTop = el.offsetTop;
  });
  await p.waitForTimeout(1700);

  await p.evaluate((t) => {
    const btn = [...document.querySelectorAll("#index button")].find(b => b.textContent?.trim() === t);
    btn?.click();
  }, text);
  await p.waitForTimeout(1700);

  const top = await p.evaluate(() => document.querySelector(".fp-container").scrollTop);
  const expId = expected[text];
  const expTop = await p.evaluate((id) => document.getElementById(id)?.offsetTop ?? null, expId);
  const ok = Math.abs(top - expTop) < 20;
  console.log(`  ${text.padEnd(13)} → #${expId.padEnd(10)} expected ${expTop}, actual ${top.toFixed(0)} ${ok ? "✓" : "✗"}`);
}
await b.close();
