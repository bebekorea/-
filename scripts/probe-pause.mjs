import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(1500);
await page.evaluate(() => { const c = document.querySelector(".fp-container"); const el = document.getElementById("index"); if (c && el) c.scrollTop = el.offsetTop; });
await page.waitForTimeout(2200);

const target = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll("#index button")].filter(b => b.textContent?.includes("HOSPITAL"));
  const r = buttons[0].getBoundingClientRect();
  return { x: r.x + r.width/2, y: r.y + r.height/2 };
});
await page.mouse.move(target.x, target.y);
await page.waitForTimeout(500);

async function probe() {
  return page.evaluate(() => {
    // The CategoryIndex marquee (the BIG one) lives inside the LAST
    // child of #index — not the first `.animate-marquee-left`, which
    // would actually pick the Partners logo marquee rendered in the
    // hidden PreviewLayer.
    const section = document.getElementById("index");
    const marqueeOuter = section.children[section.children.length - 1];
    const t = marqueeOuter.querySelector(".animate-marquee-left");
    return {
      inlineCss: t.getAttribute("style"),
      computedPlay: getComputedStyle(t).animationPlayState,
      transform: getComputedStyle(t).transform,
    };
  });
}
const a = await probe();
await page.waitForTimeout(800);
const b = await probe();
console.log("t=0  ", JSON.stringify(a, null, 2));
console.log("t=800", JSON.stringify(b, null, 2));
console.log("transform delta:", a.transform === b.transform ? "STATIC ✓" : "MOVED ✗");
await browser.close();
