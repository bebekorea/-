// Verify the two new behaviours:
// (1) Hover ADOPT, then move cursor INTO the preview area (above the
//     strip), then back DOWN to HOSPITALITY — preview should switch
//     from adopt to location WITHOUT going through a null state in
//     the middle.
// (2) Inside the visible preview, clicking the Instagram link should
//     work (currently dead because of pointer-events: none on the
//     preview wrapper).

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/research/preview-interaction");
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

// Get button positions
const positions = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("#index button")].filter(b =>
    !b.textContent?.includes("예약하기"),
  );
  return btns.map(b => {
    const r = b.getBoundingClientRect();
    return {
      text: b.textContent?.trim(),
      cx: r.x + r.width / 2,
      cy: r.y + r.height / 2,
    };
  });
});
const adopt = positions.find(p => p.text === "ADOPT");
const hospital = positions.find(p => p.text === "HOSPITALITY");

console.log("=== Test 1: hover travels through preview area ===");
// Hover ADOPT
await page.mouse.move(adopt.cx, adopt.cy);
await page.waitForTimeout(250);
const onAdopt = await page.evaluate(() => {
  const wrap = document.getElementById("index").children[1];
  return [...wrap.children].map(d => getComputedStyle(d).opacity);
});
console.log("  After hovering ADOPT:", onAdopt, "(expected layer 0 = adopt = '1')");

// Move cursor UP into preview area (mid section, NOT in marquee strip)
await page.mouse.move(adopt.cx, 400, { steps: 8 });
await page.waitForTimeout(250);
const inPreview = await page.evaluate(() => {
  const wrap = document.getElementById("index").children[1];
  return [...wrap.children].map(d => getComputedStyle(d).opacity);
});
console.log("  After cursor moved UP into preview area (y=400):", inPreview, "(expected adopt still '1')");

// Move cursor down to HOSPITALITY
await page.mouse.move(hospital.cx, hospital.cy, { steps: 8 });
await page.waitForTimeout(250);
const onHospital = await page.evaluate(() => {
  const wrap = document.getElementById("index").children[1];
  return [...wrap.children].map(d => getComputedStyle(d).opacity);
});
console.log("  After hovering HOSPITALITY:", onHospital, "(expected layer 1 = location = '1')");

console.log("\n=== Test 2: Instagram link inside ADOPT preview ===");
// Hover ADOPT and check Instagram link is reachable
await page.mouse.move(adopt.cx, adopt.cy);
await page.waitForTimeout(250);
const linkInfo = await page.evaluate(() => {
  // Find Instagram link in the visible adopt preview
  const adoptPreview = document.getElementById("index")?.children?.[1]?.children?.[0];
  if (!adoptPreview) return null;
  // Check pointer-events on container chain
  let el = adoptPreview;
  const chain = [];
  while (el && el !== document.body) {
    chain.push({ tag: el.tagName, cls: el.className?.toString().slice(0, 60), pe: getComputedStyle(el).pointerEvents });
    el = el.parentElement;
  }
  const link = adoptPreview.querySelector('a[href*="instagram.com"]');
  return {
    chain: chain.slice(0, 5),
    linkExists: !!link,
    linkHref: link?.getAttribute("href"),
    linkPointerEvents: link ? getComputedStyle(link).pointerEvents : null,
    linkRect: link ? (() => { const r = link.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })() : null,
  };
});
console.log("  pointer-events chain:", JSON.stringify(linkInfo?.chain, null, 2));
console.log("  Instagram link exists:", linkInfo?.linkExists);
console.log("  href:", linkInfo?.linkHref);
console.log("  link pointer-events:", linkInfo?.linkPointerEvents);
console.log("  link rect:", linkInfo?.linkRect);

await page.screenshot({ path: resolve(OUT, "adopt-hovered.png") });
await browser.close();
console.log("✓", OUT);
