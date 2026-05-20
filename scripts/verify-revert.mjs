import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/research/revert-nav-shrink-indicator");
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

const navInfo = await page.evaluate(() => {
  const nav = document.querySelector("header nav");
  const r = nav.getBoundingClientRect();
  const navAs = [...document.querySelectorAll("header nav a, header nav button")].slice(0, 3);
  return {
    width: r.width,
    fontSize: navAs[0] ? getComputedStyle(navAs[0]).fontSize : null,
    letterSpacing: navAs[0] ? getComputedStyle(navAs[0]).letterSpacing : null,
  };
});
console.log("Nav:");
console.log(`  total width: ${navInfo.width.toFixed(0)}px (~${(navInfo.width / 14.4).toFixed(2)}vw, expected ~44vw = ~633px)`);
console.log(`  fontSize: ${navInfo.fontSize} (expected ~11.55px)`);
console.log(`  letter-spacing: ${navInfo.letterSpacing}`);

const indicatorInfo = await page.evaluate(() => {
  const ind = document.querySelector("#index .animate-scroll-flow")?.parentElement;
  if (!ind) return null;
  const r = ind.getBoundingClientRect();
  return { height: r.height, width: r.width };
});
console.log("\nScroll-flow indicator:");
console.log(`  height: ${indicatorInfo?.height?.toFixed(1)}px (was ~43px = 3vw, expected now ~26px = 1.8vw)`);
console.log(`  width:  ${indicatorInfo?.width?.toFixed(1)}px (1px line)`);

const ctaInfo = await page.evaluate(() => {
  const ctaP = [...document.querySelectorAll("#index p")].find(p => p.textContent?.includes("베베펫이 제공"));
  const cta = ctaP?.parentElement;
  if (!cta) return null;
  const r = cta.getBoundingClientRect();
  return { bottom: 900 - (r.y + r.height) };
});
console.log("\nCTA position:");
console.log(`  bottom from viewport-bottom: ${ctaInfo?.bottom?.toFixed(1)}px (~${(ctaInfo.bottom / 9).toFixed(2)}vh, expected ~8vh = 72px)`);

await page.screenshot({ path: resolve(OUT, "settled.png") });
await page.screenshot({ path: resolve(OUT, "header-only.png"), clip: { x: 0, y: 0, width: 1440, height: 80 } });

await browser.close();
console.log("✓", OUT);
