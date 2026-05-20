import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/research/nav-weight");
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(1500);
await p.evaluate(() => { const c = document.querySelector(".fp-container"); const el = document.getElementById("index"); if (c && el) c.scrollTop = el.offsetTop; });
await p.waitForTimeout(2400);

const adopt = await p.evaluate(() => {
  const b = [...document.querySelectorAll("#index button")].find(b => b.textContent === "ADOPT");
  const r = b.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await p.mouse.move(adopt.x, adopt.y);
await p.waitForTimeout(2000);

const navInfo = await p.evaluate(() => {
  const navAs = [...document.querySelectorAll("header a")].slice(1, 5);
  return navAs.map(a => ({
    text: a.textContent?.trim(),
    weight: getComputedStyle(a).fontWeight,
    color: getComputedStyle(a).color,
  }));
});
console.log("Light theme (hover ADOPT) — KO nav:");
navInfo.forEach(n => console.log(`  "${n.text}" weight=${n.weight} color=${n.color}`));
await p.screenshot({ path: resolve(OUT, "header-adopt.png"), clip: { x: 0, y: 0, width: 1440, height: 100 } });

await b.close();
console.log("✓", OUT);
