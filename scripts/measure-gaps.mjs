import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(1500);
await p.evaluate(() => { const c = document.querySelector(".fp-container"); const el = document.getElementById("index"); if (c && el) c.scrollTop = el.offsetTop; });
await p.waitForTimeout(2400);

const m = await p.evaluate(() => {
  const ctaP = [...document.querySelectorAll("#index p")].find(x => x.textContent?.includes("베베펫이 제공"));
  const indicator = document.querySelector("#index .animate-scroll-flow")?.parentElement;
  const marqueeFood = [...document.querySelectorAll("#index button")].find(b => b.textContent === "FOOD");
  const txt = ctaP?.getBoundingClientRect();
  const ind = indicator?.getBoundingClientRect();
  const food = marqueeFood?.getBoundingClientRect();
  return {
    text: txt ? { top: txt.y, bottom: txt.y + txt.height, h: txt.height } : null,
    indicator: ind ? { top: ind.y, bottom: ind.y + ind.height, h: ind.height } : null,
    marquee: food ? { top: food.y, bottom: food.y + food.height, h: food.height } : null,
    textToIndicator: ind && txt ? ind.y - (txt.y + txt.height) : null,
    indicatorToMarquee: food && ind ? food.y - (ind.y + ind.height) : null,
  };
});
console.log(JSON.stringify(m, null, 2));
await b.close();
