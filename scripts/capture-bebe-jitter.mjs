// Hover HOSPITAL with small cursor jitter (±2-5 px) for 5 seconds and
// sample state every 80ms — reproduce real-hand mouse instability and
// confirm hover state stays stable.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../docs/design-references/bebe-jitter");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

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
await page.screenshot({ path: resolve(OUT, "01-settled.png") });

// Confirm eyebrow gone & bullet gone
const sanity = await page.evaluate(() => {
  const section = document.getElementById("index");
  return {
    eyebrowText: !!section?.textContent?.includes("ALL CATEGORIES"),
    bulletStars: section?.textContent?.match(/✦/g)?.length ?? 0,
    buttonCount: section?.querySelectorAll("button").length ?? 0,
    buttonTexts: [...(section?.querySelectorAll("button") ?? [])]
      .slice(0, 6)
      .map((b) => b.textContent?.trim()),
  };
});
console.log("  sanity:", JSON.stringify(sanity, null, 2));

// Find HOSPITAL center
const target = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll("#index button")].filter((b) =>
    b.textContent?.includes("HOSPITALITY"),
  );
  let best = null;
  let bestDist = Infinity;
  buttons.forEach((b) => {
    const r = b.getBoundingClientRect();
    if (r.width === 0) return;
    const cx = r.x + r.width / 2;
    const d = Math.abs(cx - window.innerWidth / 2);
    if (d < bestDist) {
      bestDist = d;
      best = { rect: r };
    }
  });
  if (!best) return null;
  return {
    x: best.rect.x + best.rect.width / 2,
    y: best.rect.y + best.rect.height / 2,
  };
});
if (!target) {
  console.log("× couldn't find HOSPITAL");
  process.exit(1);
}
await page.mouse.move(target.x, target.y);
await page.waitForTimeout(450);

// 5 seconds of jittery hover, sampling state every ~80ms
const samples = [];
for (let i = 0; i < 60; i++) {
  // Random small jitter ±5 px in both axes
  const jx = (Math.random() - 0.5) * 10;
  const jy = (Math.random() - 0.5) * 6;
  await page.mouse.move(target.x + jx, target.y + jy, { steps: 2 });
  await page.waitForTimeout(80);
  const s = await page.evaluate(() => {
    const section = document.getElementById("index");
    const previewWrapper = section?.children?.[1];
    const layers = previewWrapper
      ? [...previewWrapper.children].map((el) => getComputedStyle(el).opacity)
      : [];
    const marqueeOuter = section?.children[section.children.length - 1];
    const track = marqueeOuter?.querySelector(".animate-marquee-left");
    return {
      layers,
      play: track ? getComputedStyle(track).animationPlayState : null,
    };
  });
  samples.push(s);
}

await page.screenshot({ path: resolve(OUT, "02-after-5s-jitter.png") });

const locOpacities = samples.map((s) => s.layers[1]);
const playStates = samples.map((s) => s.play);
console.log(
  "  location opacity unique values:",
  [...new Set(locOpacities)],
);
console.log("  marquee playState unique values:", [...new Set(playStates)]);
console.log(
  "  result:",
  locOpacities.every((o) => o === "1") ? "✓ no flash on jitter" : "✗ flash detected",
);

await browser.close();
console.log("✓", OUT);
