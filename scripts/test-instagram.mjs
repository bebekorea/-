// Diagnose Instagram link click in BOTH places: CategoryStack's #adopt
// section (vertical scroll) and CategoryIndex's preview (hover ADOPT).

import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// Capture all attempted navigations / new pages
const newPages = [];
ctx.on("page", (p) => {
  newPages.push(p.url());
});

await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForTimeout(1500);

// === Test 1: in CategoryStack's #adopt (vertical scroll) ===
console.log("=== Test 1: #adopt section (vertical scroll) ===");
await page.evaluate(() => {
  const c = document.querySelector(".fp-container");
  const el = document.getElementById("adopt");
  if (c && el) c.scrollTop = el.offsetTop;
});
await page.waitForTimeout(2400); // wait for entry animations

const stackInfo = await page.evaluate(() => {
  // Find the FIRST Instagram link visible in viewport
  const links = [...document.querySelectorAll('a[href*="instagram.com"]')];
  return links.map((l) => {
    const r = l.getBoundingClientRect();
    const cs = getComputedStyle(l);
    return {
      href: l.getAttribute("href"),
      target: l.getAttribute("target"),
      rect: { x: r.x, y: r.y, w: r.width, h: r.height },
      pointerEvents: cs.pointerEvents,
      opacity: cs.opacity,
      visibility: cs.visibility,
      visible: r.x >= 0 && r.y >= 0 && r.x + r.width <= 1440 && r.y + r.height <= 900,
      containerInfo: l.closest("section")?.id,
    };
  });
});
console.log("  All instagram.com links on page:", JSON.stringify(stackInfo, null, 2));

const targetLink = stackInfo.find((l) => l.containerInfo === "adopt" && l.visible);
if (targetLink) {
  console.log("  Clicking link in #adopt at", targetLink.rect.x + targetLink.rect.w / 2, targetLink.rect.y + targetLink.rect.h / 2);
  // Strip target=_blank to keep navigation in same tab for test
  await page.evaluate(() => {
    document.querySelectorAll('a[href*="instagram.com"]').forEach(a => a.removeAttribute("target"));
  });
  // Try clicking
  let pageError = null;
  try {
    await page.mouse.click(
      targetLink.rect.x + targetLink.rect.w / 2,
      targetLink.rect.y + targetLink.rect.h / 2,
    );
  } catch (e) {
    pageError = e.message;
  }
  await page.waitForTimeout(1500);
  console.log("  page URL after click:", page.url());
  console.log("  click error:", pageError);
} else {
  console.log("  ✗ No visible Instagram link in #adopt section");
}

// Reset
await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForTimeout(1500);

// === Test 2: hover ADOPT in marquee → preview ===
console.log("\n=== Test 2: ADOPT preview in CategoryIndex (hover) ===");
await page.evaluate(() => {
  const c = document.querySelector(".fp-container");
  const el = document.getElementById("index");
  if (c && el) c.scrollTop = el.offsetTop;
});
await page.waitForTimeout(2400);

// Find ADOPT button and hover
const adopt = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("#index button")].filter(b => b.textContent === "ADOPT");
  const r = btns[0]?.getBoundingClientRect();
  return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null;
});
await page.mouse.move(adopt.x, adopt.y);
await page.waitForTimeout(2200); // wait for preview entry animation

const previewInfo = await page.evaluate(() => {
  const links = [...document.querySelectorAll('#index a[href*="instagram.com"]')];
  return links.map((l) => {
    const r = l.getBoundingClientRect();
    const cs = getComputedStyle(l);
    return {
      href: l.getAttribute("href"),
      rect: { x: r.x, y: r.y, w: r.width, h: r.height },
      pointerEvents: cs.pointerEvents,
      opacity: cs.opacity,
      visible: r.x >= 0 && r.y >= 0 && r.x + r.width <= 1440 && r.y + r.height <= 900,
    };
  });
});
console.log("  Instagram links inside #index (preview):", JSON.stringify(previewInfo, null, 2));

await browser.close();
