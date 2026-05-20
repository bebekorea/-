import { chromium } from "playwright";
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(1500);
await p.evaluate(() => { const c = document.querySelector(".fp-container"); const el = document.getElementById("index"); if (c && el) c.scrollTop = el.offsetTop; });
await p.waitForTimeout(2400);

const probe = async (label) => {
  const navInfo = await p.evaluate(() => {
    const navAs = [...document.querySelectorAll("header a")].slice(1, 5);
    return navAs.map(a => ({ text: a.textContent?.trim(), weight: getComputedStyle(a).fontWeight, color: getComputedStyle(a).color, inlineWeight: a.style.fontWeight }));
  });
  console.log(label);
  navInfo.forEach(n => console.log(`  "${n.text}" computed-weight=${n.weight} (inline=${n.inlineWeight}) color=${n.color}`));
};

// Light theme — hover ADOPT
const adopt = await p.evaluate(() => {
  const x = [...document.querySelectorAll("#index button")].find(b => b.textContent === "ADOPT");
  const r = x.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await p.mouse.move(adopt.x, adopt.y);
await p.waitForTimeout(2000);
await probe("Light theme (hover ADOPT) — black text:");

// Dark theme — hover BEAUTY&SPA
const beauty = await p.evaluate(() => {
  const x = [...document.querySelectorAll("#index button")].find(b => b.textContent === "BEAUTY&SPA");
  const r = x.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await p.mouse.move(beauty.x, beauty.y);
await p.waitForTimeout(2000);
await probe("\nDark theme (hover BEAUTY&SPA) — white text:");

await b.close();
