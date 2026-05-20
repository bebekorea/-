// Specifically test Adopt's Instagram link CLICK inside the CategoryIndex
// PREVIEW (hover ADOPT first). Don't strip target=_blank — instead listen
// for new-page (popup) events to confirm the click actually opens.

import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// Listen for new pages (target=_blank navigations)
const popups = [];
ctx.on("page", (p) => {
  popups.push(p.url());
  console.log("  ▸ new page event, url:", p.url());
});

await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForTimeout(1500);
await page.evaluate(() => {
  const c = document.querySelector(".fp-container");
  const el = document.getElementById("index");
  if (c && el) c.scrollTop = el.offsetTop;
});
await page.waitForTimeout(2400);

// Hover ADOPT
const adopt = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("#index button")].filter(b => b.textContent === "ADOPT");
  const r = btns[0].getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
console.log("Hovering ADOPT at", adopt);
await page.mouse.move(adopt.x, adopt.y);
await page.waitForTimeout(2200); // wait for stagger entry

// Read full hit-test for the Instagram link
const linkInfo = await page.evaluate(() => {
  const link = document.querySelector('#index a[href*="instagram.com"]');
  if (!link) return null;
  const r = link.getBoundingClientRect();
  const cx = r.x + r.width / 2;
  const cy = r.y + r.height / 2;
  // What element does the browser say is at that point?
  const top = document.elementFromPoint(cx, cy);
  // Walk up the chain
  const chain = [];
  let el = top;
  while (el && chain.length < 8) {
    chain.push({ tag: el.tagName, cls: el.className?.toString().slice(0, 50), pe: getComputedStyle(el).pointerEvents });
    el = el.parentElement;
  }
  return { rect: { x: r.x, y: r.y, w: r.width, h: r.height }, cx, cy, topElement: top?.tagName, topHref: top?.getAttribute?.("href"), chain };
});
console.log("Link rect:", linkInfo?.rect);
console.log("Click point:", linkInfo?.cx, linkInfo?.cy);
console.log("elementFromPoint at click:", linkInfo?.topElement, linkInfo?.topHref);
console.log("Chain at click point:");
linkInfo?.chain.forEach((c, i) => console.log(`  ${i}. <${c.tag}> "${c.cls}" pointer-events: ${c.pe}`));

// Click via mouse — should trigger target=_blank navigation
console.log("\nClicking link...");
await page.mouse.click(linkInfo.cx, linkInfo.cy);
await page.waitForTimeout(1500);

console.log("\nNew pages opened (popups):", popups);
console.log("Result:", popups.some(u => u.includes("instagram.com")) ? "✓ Instagram opened in new tab" : popups.length > 0 ? "popup but not instagram" : "✗ NO popup, click did nothing");

await browser.close();
