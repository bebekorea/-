import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/research/final");
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(1500);
await p.evaluate(() => { const c = document.querySelector(".fp-container"); const el = document.getElementById("index"); if (c && el) c.scrollTop = el.offsetTop; });
await p.waitForTimeout(2400);

// Settled (no hover) full screenshot
await p.mouse.move(20, 20);
await p.waitForTimeout(700);
await p.screenshot({ path: resolve(OUT, "00-settled.png") });

// Probe NAV item (not logo) for font-weight
const navInfo = await p.evaluate(() => {
  const navAs = [...document.querySelectorAll("header a")].slice(1, 5); // skip logo
  return navAs.map(a => ({
    text: a.textContent?.trim(),
    fontWeight: getComputedStyle(a).fontWeight,
    color: getComputedStyle(a).color,
    inlineFontWeight: a.style.fontWeight,
  }));
});
console.log("Settled (no hover) — header NAV item info:");
navInfo.forEach(n => console.log(`  "${n.text}" weight=${n.fontWeight} (inline=${n.inlineFontWeight}) color=${n.color}`));

// Hover ADOPT and re-probe
const adopt = await p.evaluate(() => {
  const b = [...document.querySelectorAll("#index button")].find(b => b.textContent === "ADOPT");
  const r = b.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await p.mouse.move(adopt.x, adopt.y);
await p.waitForTimeout(2200);
const navOnAdopt = await p.evaluate(() => {
  const navAs = [...document.querySelectorAll("header a")].slice(1, 5);
  return navAs.map(a => ({
    text: a.textContent?.trim(),
    fontWeight: getComputedStyle(a).fontWeight,
    color: getComputedStyle(a).color,
  }));
});
console.log("\nHovering ADOPT — header NAV item info:");
navOnAdopt.forEach(n => console.log(`  "${n.text}" weight=${n.fontWeight} color=${n.color}`));
await p.screenshot({ path: resolve(OUT, "01-hover-adopt.png") });

// Hover BEAUTY&SPA
const beauty = await p.evaluate(() => {
  const b = [...document.querySelectorAll("#index button")].find(b => b.textContent === "BEAUTY&SPA");
  const r = b.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await p.mouse.move(beauty.x, beauty.y);
await p.waitForTimeout(2200);
const navOnBeauty = await p.evaluate(() => {
  const navAs = [...document.querySelectorAll("header a")].slice(1, 5);
  return navAs.map(a => ({ text: a.textContent?.trim(), fontWeight: getComputedStyle(a).fontWeight, color: getComputedStyle(a).color }));
});
console.log("\nHovering BEAUTY&SPA — header NAV item info:");
navOnBeauty.forEach(n => console.log(`  "${n.text}" weight=${n.fontWeight} color=${n.color}`));
await p.screenshot({ path: resolve(OUT, "02-hover-beauty.png") });

await b.close();
console.log("\n✓", OUT);
