import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(1500);
await p.evaluate(() => { const c = document.querySelector(".fp-container"); const el = document.getElementById("index"); if (c && el) c.scrollTop = el.offsetTop; });
await p.waitForTimeout(2400);

// Settled — check key fixtures
const settled = await p.evaluate(() => {
  const ctaP = [...document.querySelectorAll("#index p")].find(x => x.textContent?.includes("베베펫이 제공"));
  const cta = ctaP?.parentElement;
  const cs = cta ? getComputedStyle(cta) : null;
  const r = cta?.getBoundingClientRect();
  const eyebrow = [...document.querySelectorAll("#index p")].find(x => x.textContent?.trim() === "CATEGORIES");
  const tagline = document.querySelector("#index h2");
  const indicator = document.querySelector("#index .animate-scroll-flow");
  const navEl = [...document.querySelectorAll("header a")].slice(1, 2)[0];
  return {
    ctaPresent: !!cta,
    ctaOpacity: cs?.opacity,
    ctaBottom: r ? 900 - (r.y + r.height) : null,
    eyebrow: eyebrow?.textContent?.trim(),
    tagline: tagline?.textContent?.trim(),
    indicatorPresent: !!indicator,
    navColor: navEl ? getComputedStyle(navEl).color : null,
  };
});
console.log("Settled (#index, no hover):");
console.log(JSON.stringify(settled, null, 2));

// Hover ADOPT
const adopt = await p.evaluate(() => {
  const b = [...document.querySelectorAll("#index button")].find(b => b.textContent === "ADOPT");
  const r = b.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await p.mouse.move(adopt.x, adopt.y);
await p.waitForTimeout(2000);
const hovered = await p.evaluate(() => {
  const ctaP = [...document.querySelectorAll("#index p")].find(x => x.textContent?.includes("베베펫이 제공"));
  const cta = ctaP?.parentElement;
  const navEl = [...document.querySelectorAll("header a")].slice(1, 2)[0];
  return {
    ctaOpacity: cta ? getComputedStyle(cta).opacity : null,
    navColor: navEl ? getComputedStyle(navEl).color : null,
    navWeight: navEl ? getComputedStyle(navEl).fontWeight : null,
  };
});
console.log("\nHovering ADOPT:");
console.log(JSON.stringify(hovered, null, 2));
await b.close();
