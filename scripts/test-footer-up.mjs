import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(1500);

// Scroll to footer (max scroll)
await p.evaluate(() => {
  const c = document.querySelector(".fp-container");
  c.scrollTop = c.scrollHeight - c.clientHeight; // max
});
await p.waitForTimeout(800);
const startTop = await p.evaluate(() => document.querySelector(".fp-container").scrollTop);
console.log("Position before scroll up (at bottom):", startTop);

// Wheel up
await p.evaluate(() => {
  document.querySelector(".fp-container").dispatchEvent(new WheelEvent("wheel", { deltaY: -100, bubbles: true, cancelable: true }));
});
await p.waitForTimeout(1700); // jump anim

const afterTop = await p.evaluate(() => document.querySelector(".fp-container").scrollTop);
const sections = await p.evaluate(() => {
  const c = document.querySelector(".fp-container");
  return [...c.children].filter(el => el.id).map(el => ({ id: el.id, top: el.offsetTop }));
});
console.log("Sections:", sections);
console.log("Position after one scroll-up:", afterTop);
const matched = sections.find(s => Math.abs(s.top - afterTop) < 20);
console.log("Landed on:", matched?.id, matched?.top === 1800 ? "✓ #contact (correct)" : "✗ skipped contact");
await b.close();
