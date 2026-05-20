/* eslint-disable */
// One-shot mobile audit script — captures iPhone-class screenshots of the
// site's primary surfaces against the running dev server so the visual
// audit can use the same image-read flow we use for design references.
//
// Outputs PNGs into ./scripts/mobile-shots/.
import { chromium, devices } from "playwright";
import { mkdirSync, existsSync } from "fs";

const OUT = "./scripts/mobile-shots";
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const BASE = "http://localhost:3000";

const phone = devices["iPhone 14"];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...phone });
  const page = await ctx.newPage();

  // 1) Home — full intro (settle 5s for typing animation)
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(5500); // skip past intro typing
  await page.screenshot({ path: `${OUT}/01_home_hero.png`, fullPage: false });

  // Click skip if visible (force into stage 1)
  const skip = page.getByRole("button", { name: /skip/i });
  if (await skip.isVisible().catch(() => false)) {
    await skip.click().catch(() => {});
    await page.waitForTimeout(1500);
  }

  // Scroll into category section
  await page.evaluate(() => {
    const idx = document.querySelector("#index");
    const c = document.querySelector(".fp-container");
    if (c && idx) c.scrollTo({ top: idx.offsetTop, behavior: "instant" });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/02_home_category.png`, fullPage: false });

  // Scroll into contact section
  await page.evaluate(() => {
    const c = document.querySelector(".fp-container");
    const ct = document.querySelector("#contact");
    if (c && ct) c.scrollTo({ top: ct.offsetTop, behavior: "instant" });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/03_home_visit.png`, fullPage: false });

  // Footer
  await page.evaluate(() => {
    const c = document.querySelector(".fp-container");
    if (c) c.scrollTo({ top: c.scrollHeight, behavior: "instant" });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/04_home_footer.png`, fullPage: false });

  // Mobile menu
  await page.evaluate(() => {
    const c = document.querySelector(".fp-container");
    if (c) c.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(500);
  const hamb = page.getByRole("button", { name: "메뉴" });
  if (await hamb.isVisible().catch(() => false)) {
    await hamb.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/05_mobile_menu.png`, fullPage: false });
    await hamb.click();
    await page.waitForTimeout(400);
  }

  // RegisterModal
  await page.goto(BASE);
  await page.waitForTimeout(5500);
  // Open via header CTA — there's no nav 방문예약등록 visible on mobile (hidden md:block).
  // Trigger via mobile RESERVATION button shown on hero stage 1 (md:hidden visible)
  // OR via clicking the RESERVATION text in MobileMenu.
  await page.getByRole("button", { name: "메뉴" }).click().catch(() => {});
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /방문예약/i }).click().catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/06_register_modal.png`, fullPage: false });

  // News page
  await page.goto(`${BASE}/news`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/07_news.png`, fullPage: true });

  // Privacy page
  await page.goto(`${BASE}/privacy`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/08_privacy.png`, fullPage: false });

  await browser.close();
  console.log("✓ mobile audit screenshots saved to", OUT);
})();
