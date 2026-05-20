import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(1500);
await p.evaluate(() => { const c = document.querySelector(".fp-container"); const el = document.getElementById("index"); if (c && el) c.scrollTop = el.offsetTop; });
await p.waitForTimeout(2400);
const x = await p.evaluate(() => {
  const buttons = [...document.querySelectorAll("#index button")].filter(b => b.textContent && !b.textContent.includes("예약하기"));
  if (buttons.length < 2) return { buttons: buttons.length };
  const cs0 = getComputedStyle(buttons[0]);
  const r0 = buttons[0].getBoundingClientRect();
  const r1 = buttons[1].getBoundingClientRect();
  // Find the actual letter container — first inline span inside button
  const innerSpan0 = buttons[0].querySelector(":scope > span");
  const innerSpan0Rect = innerSpan0?.getBoundingClientRect();
  const innerSpan1 = buttons[1].querySelector(":scope > span");
  const innerSpan1Rect = innerSpan1?.getBoundingClientRect();
  return {
    btn0Class: buttons[0].className,
    btn0Padding: { L: cs0.paddingLeft, R: cs0.paddingRight },
    btn0Rect: { x: r0.x, w: r0.width },
    btn1Rect: { x: r1.x, w: r1.width },
    btn0LastLetterRight: innerSpan0Rect ? innerSpan0Rect.x + innerSpan0Rect.width : null,
    btn1FirstLetterLeft: innerSpan1Rect ? innerSpan1Rect.x : null,
  };
});
console.log(JSON.stringify(x, null, 2));
await b.close();
