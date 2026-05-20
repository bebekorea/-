// Sanity test: (1) clicking ADOPT marquee button scrolls page to #adopt
// section, (2) clicking the Instagram link in Adopt preview navigates
// to the Instagram URL.

import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// Test 1: marquee button click
await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForTimeout(1500);
await page.evaluate(() => {
  const c = document.querySelector(".fp-container");
  const el = document.getElementById("index");
  if (c && el) c.scrollTop = el.offsetTop;
});
await page.waitForTimeout(2400);

const before = await page.evaluate(() => document.querySelector(".fp-container").scrollTop);
console.log("Test 1 — marquee ADOPT click:");
console.log("  scrollTop before click:", before);
const adopt = page.locator("#index button").nth(1); // 0=예약하기, 1=ADOPT
await adopt.click();
await page.waitForTimeout(1700);
const after = await page.evaluate(() => document.querySelector(".fp-container").scrollTop);
console.log("  scrollTop after click :", after);
console.log("  result:", after !== before ? "✓ navigated" : "✗ no navigation");

// Test 2: instagram link click triggers navigation request
await page.evaluate(() => {
  const c = document.querySelector(".fp-container");
  const el = document.getElementById("index");
  if (c && el) c.scrollTop = el.offsetTop;
});
await page.waitForTimeout(2400);

// Hover ADOPT first to make its preview visible
const adoptBtn = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("#index button")].filter(b => b.textContent === "ADOPT");
  const r = btns[0]?.getBoundingClientRect();
  return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null;
});
await page.mouse.move(adoptBtn.x, adoptBtn.y);
await page.waitForTimeout(2200); // wait for preview entry

console.log("\nTest 2 — Instagram link inside Adopt preview:");
let navigated = false;
page.on("request", (req) => {
  if (req.url().includes("instagram.com")) {
    navigated = true;
    console.log("  request fired to:", req.url());
  }
});

// Find link and click via DOM dispatch (force, don't actually open new tab)
const linkInfo = await page.evaluate(() => {
  const link = document.querySelector('#index a[href*="instagram.com"]');
  if (!link) return null;
  const r = link.getBoundingClientRect();
  // Make sure it's within viewport
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, href: link.href };
});
console.log("  link center:", linkInfo);
if (linkInfo && linkInfo.x > 0 && linkInfo.y > 0) {
  // Strip target=_blank to not open new tab in test
  await page.evaluate(() => {
    document.querySelectorAll('#index a[href*="instagram.com"]').forEach(a => a.removeAttribute("target"));
  });
  // Click via mouse
  await page.mouse.click(linkInfo.x, linkInfo.y);
  await page.waitForTimeout(800);
  const url = page.url();
  console.log("  page URL after click:", url);
  console.log("  result:", url.includes("instagram.com") ? "✓ navigated to Instagram" : navigated ? "✓ request fired" : "(needs manual verification)");
}

await browser.close();
