// Verify header text color at each section as the user scrolls down.

import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForTimeout(1500);

const sections = ["hero", "index", "adopt", "location", "partners", "product", "beauty", "contact"];
for (const id of sections) {
  await page.evaluate((sid) => {
    const c = document.querySelector(".fp-container");
    const el = document.getElementById(sid);
    if (c && el) c.scrollTop = el.offsetTop;
  }, id);
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const a = document.querySelector("header a");
    const dataTheme = document.querySelector("header")?.getAttribute("data-theme");
    return { color: a ? getComputedStyle(a).color : null, theme: dataTheme };
  });
  console.log(`#${id.padEnd(10)} theme=${info.theme.padEnd(6)} color=${info.color}`);
}
await browser.close();
