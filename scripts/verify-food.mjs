import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const OUT = "./docs/research/food-restructure";
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(1500);
await p.evaluate(() => { const c = document.querySelector(".fp-container"); const el = document.getElementById("index"); if (c && el) c.scrollTop = el.offsetTop; });
await p.waitForTimeout(2400);

const food = await p.evaluate(() => {
  const btn = [...document.querySelectorAll("#index button")].find(b => b.textContent === "FOOD");
  const r = btn.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await p.mouse.move(food.x, food.y);
await p.waitForTimeout(800);

const inspection = await p.evaluate(() => {
  const previewWrapper = document.querySelector('#index > div:nth-child(2)');
  const visiblePreview = [...previewWrapper.children].find(el => parseFloat(getComputedStyle(el).opacity) > 0.5);
  if (!visiblePreview) return null;
  // Visual half - find background image div
  const split = visiblePreview.firstElementChild;
  const flexDir = getComputedStyle(split).flexDirection;
  const visualHalf = flexDir === "row" ? split.children[0] : split.children[1];
  const copyHalf = flexDir === "row" ? split.children[1] : split.children[0];
  const photoBg = visualHalf.querySelector("[style*='background-image']");
  const logoCount = visualHalf.querySelectorAll("img[src*='partner-name']").length;
  // Copy half logoFlow
  const copyLogoFlow = copyHalf.querySelector(".animate-marquee-left");
  const copyLogoCount = copyHalf.querySelectorAll("img[src*='partner-name']").length;
  return {
    flexDir,
    visualHalfHasPhoto: !!photoBg,
    visualHalfPhotoSrc: photoBg ? getComputedStyle(photoBg).backgroundImage.slice(0, 80) : null,
    visualHalfLogoCount: logoCount,
    copyHalfHasLogoFlow: !!copyLogoFlow,
    copyHalfLogoCount: copyLogoCount,
  };
});
console.log("FOOD preview inspection:");
console.log(JSON.stringify(inspection, null, 2));
await p.screenshot({ path: resolve(OUT, "food.png") });
await b.close();
