import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/research/verify-three");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForTimeout(1500);
await page.evaluate(() => {
  const c = document.querySelector(".fp-container");
  const el = document.getElementById("index");
  if (c && el) c.scrollTop = el.offsetTop;
});
await page.waitForTimeout(2400);

console.log("=== Test 1: header color while hovering each marquee item ===");
const items = ["ADOPT", "HOSPITALITY", "FOOD", "PRODUCT", "BEAUTY&SPA"];
const expected = { ADOPT: "rgb(0, 0, 0)", HOSPITALITY: "rgb(0, 0, 0)", FOOD: "rgb(0, 0, 0)", PRODUCT: "rgb(0, 0, 0)", "BEAUTY&SPA": "rgb(255, 255, 255)" };

// First, no hover state on #index
await page.mouse.move(20, 20);
await page.waitForTimeout(400);
const noHoverColor = await page.evaluate(() => getComputedStyle(document.querySelector("header a")).color);
console.log("  no hover           →", noHoverColor, "(expected white rgb(255, 255, 255) since cat&dog bg is darkish)");

for (const item of items) {
  const target = await page.evaluate((label) => {
    const btns = [...document.querySelectorAll("#index button")].filter(b => b.textContent === label);
    const r = btns[0]?.getBoundingClientRect();
    return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null;
  }, item);
  await page.mouse.move(target.x, target.y);
  await page.waitForTimeout(1700); // wait for COLOR_TRANS = DURATION.fast (1400ms)
  const color = await page.evaluate(() => getComputedStyle(document.querySelector("header a")).color);
  const ok = color === expected[item];
  console.log(`  hover ${item.padEnd(13)} →`, color, ok ? "✓" : `✗ expected ${expected[item]}`);
  // Capture
  await page.screenshot({ path: resolve(OUT, `header-on-hover-${item.replace(/&/g, "_").toLowerCase()}.png`), clip: { x: 0, y: 0, width: 1440, height: 100 } });
}

console.log("\n=== Test 2: new copy content ===");
// Reset to no hover
await page.mouse.move(20, 20);
await page.waitForTimeout(700);
const copy = await page.evaluate(() => {
  const section = document.getElementById("index");
  // Find eyebrow / heading / lead
  const eyebrow = section?.querySelector("p")?.textContent?.trim();
  const h2 = section?.querySelector("h2")?.textContent?.trim();
  const leadPs = [...(section?.querySelectorAll("div > p") || [])].slice(1).map(p => p.textContent?.trim()).filter(t => t && t.length > 4);
  return { eyebrow, h2, leadPs };
});
console.log("  eyebrow:", copy.eyebrow);
console.log("  tagline:", copy.h2);
console.log("  lead   :", copy.leadPs);

console.log("\n=== Test 3: KO nav font-weight on light theme ===");
// Hover ADOPT to get light theme
await page.evaluate(() => {
  const btns = [...document.querySelectorAll("#index button")].filter(b => b.textContent === "ADOPT");
  if (btns[0]) {
    const r = btns[0].getBoundingClientRect();
    // Move mouse there
  }
});
const adopt = await page.evaluate(() => {
  const b = [...document.querySelectorAll("#index button")].find(b => b.textContent === "ADOPT");
  const r = b.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await page.mouse.move(adopt.x, adopt.y);
await page.waitForTimeout(1700);
const lightInfo = await page.evaluate(() => {
  const a = document.querySelector("header a");
  return {
    fontWeight: getComputedStyle(a).fontWeight,
    inlineStyle: a.getAttribute("style"),
    lang: document.documentElement.lang || (typeof window !== "undefined" && window.localStorage?.getItem("lang")) || "?",
  };
});
console.log("  light-theme info:", lightInfo);
const lightWeight = lightInfo.fontWeight;
console.log("  KO nav font-weight on light theme (hover ADOPT):", lightWeight, "(expected 600)");

// Move to BEAUTY&SPA for dark theme
const beauty = await page.evaluate(() => {
  const b = [...document.querySelectorAll("#index button")].find(b => b.textContent === "BEAUTY&SPA");
  const r = b.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await page.mouse.move(beauty.x, beauty.y);
await page.waitForTimeout(700);
const darkWeight = await page.evaluate(() => getComputedStyle(document.querySelector("header a")).fontWeight);
console.log("  KO nav font-weight on dark theme (hover BEAUTY&SPA):", darkWeight, "(expected 500)");

// Capture full settled screenshot
await page.mouse.move(20, 20);
await page.waitForTimeout(700);
await page.screenshot({ path: resolve(OUT, "settled.png") });

await browser.close();
console.log("✓", OUT);
