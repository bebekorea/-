// Verify drag + click semantics on the bottom marquee.
// Each test gets its OWN fresh navigation so dragX state from a prior
// drag doesn't leak into the click test.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/design-references/bebe-drag");
mkdirSync(OUT, { recursive: true });

async function jumpToIndexAndSettle(page) {
  await page.goto("http://localhost:3000/", {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const c = document.querySelector(".fp-container");
    const el = document.getElementById("index");
    if (c && el) c.scrollTop = el.offsetTop;
  });
  await page.waitForTimeout(2200);
}

const browser = await chromium.launch({ headless: true });

// ---- TEST 1: pure click on a marquee item should route to onAnchor ----
{
  console.log("=== TEST 1: pure tap routes through onAnchor ===");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await jumpToIndexAndSettle(page);

  await page.evaluate(() => {
    const w = window;
    w.__btnClicks = [];
    document.querySelectorAll("#index button").forEach((b) => {
      b.addEventListener("click", (e) =>
        w.__btnClicks.push({
          text: e.currentTarget.textContent?.trim().slice(0, 30),
        }),
      );
    });
  });

  // Find a button that's near viewport center horizontally and visible
  const btn = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("#index button")];
    let best = null;
    let bestDist = Infinity;
    buttons.forEach((b) => {
      const r = b.getBoundingClientRect();
      if (r.width === 0) return;
      const cx = r.x + r.width / 2;
      if (cx < 0 || cx > window.innerWidth) return;
      const d = Math.abs(cx - window.innerWidth / 2);
      if (d < bestDist) {
        bestDist = d;
        best = { rect: r, text: b.textContent?.trim() };
      }
    });
    if (!best) return null;
    return {
      x: best.rect.x + best.rect.width / 2,
      y: best.rect.y + best.rect.height / 2,
      text: best.text,
    };
  });
  console.log("  target button:", btn?.text, "at", btn?.x, btn?.y);

  // Pause auto-marquee so the button doesn't slide out from under us
  await page.evaluate(() => {
    const t = document.querySelector("#index .animate-marquee-left");
    if (t) t.style.animationPlayState = "paused";
  });

  await page.mouse.move(btn.x, btn.y);
  await page.waitForTimeout(80);
  await page.mouse.down();
  await page.waitForTimeout(40);
  await page.mouse.up();
  await page.waitForTimeout(1700);

  const observed = await page.evaluate(() => window.__btnClicks ?? []);
  const scroll = await page.evaluate(
    () => document.querySelector(".fp-container")?.scrollTop ?? 0,
  );
  console.log("  click events:", JSON.stringify(observed));
  console.log("  scrollTop after click:", scroll);
  console.log(
    "  RESULT:",
    observed.length > 0 ? "✓ click routed" : "✗ click blocked",
  );
  await page.screenshot({ path: resolve(OUT, "test1-after-click.png") });
  await ctx.close();
}

// ---- TEST 2: drag pulls the marquee with multiplier 2.5x ----
{
  console.log("\n=== TEST 2: drag pulls marquee at 2.5x ===");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await jumpToIndexAndSettle(page);

  const start = await page.evaluate(() => {
    const strip = document.querySelector(
      "#index div.absolute.z-10.inset-x-0.overflow-hidden",
    );
    const r = strip.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  console.log("  drag from", start);

  const readWrap = () =>
    page.evaluate(() => {
      const strip = document.querySelector(
        "#index div.absolute.z-10.inset-x-0.overflow-hidden",
      );
      const wrap = strip?.children?.[0]?.children?.[0];
      return wrap ? getComputedStyle(wrap).transform : null;
    });

  console.log("  pre-drag wrap:", await readWrap());
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) {
    await page.mouse.move(start.x - (200 * i) / 8, start.y, { steps: 4 });
  }
  console.log("  end-drag wrap:", await readWrap());
  await page.mouse.up();
  await page.waitForTimeout(200);
  console.log("  post-release wrap:", await readWrap());
  await page.screenshot({ path: resolve(OUT, "test2-after-drag.png") });
  await ctx.close();
}

await browser.close();
console.log("\n✓ all frames in", OUT);
