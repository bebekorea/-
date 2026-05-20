// Tight-sampling inspection of fielddaysound.tv marquee mechanics.
// First pass identified: Nuxt + SplitTextJS, marquee is bottom-of-viewport
// h1.title elements (Tusker 190px), JS-driven (no CSS animation-name).
// This pass: detect loader-end, then sample every 50ms to capture the
// translateX progression on the marquee track AND the per-letter entry
// transforms while they are still in flight.

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../docs/research/fielddaysound");
mkdirSync(OUT_DIR, { recursive: true });

const URL = "https://www.fielddaysound.tv/?ref=godly";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "no-preference",
});
const page = await ctx.newPage();

console.log("→ navigating");
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60_000 });

// Wait for loader to end — detect when a `.title` element appears AND
// its bottom edge is INSIDE the viewport (i.e. the slide-up has begun
// or finished).
console.log("→ waiting for loader to dismiss");
await page.waitForFunction(
  () => {
    const titles = document.querySelectorAll("h1.title");
    if (titles.length === 0) return false;
    const r = titles[0].getBoundingClientRect();
    return r.top < window.innerHeight - 50;
  },
  { timeout: 30_000 },
);

const loaderEndedAt = Date.now();
console.log("→ loader gone — starting tight sampling");

// Tight sample: 50ms intervals for 5s, then 200ms to 10s
const samples = [];
const sampleAndPush = async (label) => {
  const data = await page.evaluate(() => {
    const titles = [...document.querySelectorAll("h1.title")];
    const titleData = titles.map((t) => {
      const cs = getComputedStyle(t);
      const r = t.getBoundingClientRect();
      const chars = [...t.querySelectorAll(".SplitTextJS-char")];
      return {
        text: t.textContent?.trim().slice(0, 20),
        rect: { x: r.x, y: r.y, w: r.width, h: r.height },
        transform: cs.transform,
        opacity: cs.opacity,
        transition: cs.transition,
        firstCharTransform:
          chars[0] && getComputedStyle(chars[0]).transform,
        firstCharOpacity:
          chars[0] && getComputedStyle(chars[0]).opacity,
        firstCharTransition:
          chars[0] && getComputedStyle(chars[0]).transition,
        // Sample a couple more chars for stagger detection
        midCharTransform:
          chars[Math.floor(chars.length / 2)] &&
          getComputedStyle(chars[Math.floor(chars.length / 2)]).transform,
        lastCharTransform:
          chars[chars.length - 1] &&
          getComputedStyle(chars[chars.length - 1]).transform,
      };
    });
    // Walk up from the first title to find the marquee track ancestor
    // — i.e. the element whose width >> its parent's width and whose
    // transform updates over time.
    let track = null;
    if (titles[0]) {
      let el = titles[0].parentElement;
      for (let i = 0; i < 8 && el; i++) {
        const cs = getComputedStyle(el);
        if (
          el.scrollWidth > el.clientWidth + 100 ||
          (cs.transform && cs.transform !== "none")
        ) {
          track = {
            depth: i,
            tag: el.tagName,
            classes: el.className?.toString().slice(0, 200),
            transform: cs.transform,
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            childCount: el.children.length,
          };
          break;
        }
        el = el.parentElement;
      }
    }
    return { titles: titleData, track };
  });
  samples.push({ label, data });
};

// Grid of sample times (ms after loader end)
const sampleAt = [
  0, 50, 100, 150, 200, 300, 400, 500, 700, 900,
  1200, 1500, 1800, 2200, 2700, 3500, 4500, 6000, 8000,
];
const startTime = Date.now();
for (const t of sampleAt) {
  const remaining = t - (Date.now() - loaderEndedAt);
  if (remaining > 0) await page.waitForTimeout(remaining);
  await sampleAndPush(`+${t}ms`);
}

// Now hover a title and capture before/after for the SplitTextJS chars
console.log("→ probing hover on a title");
const target = await page.evaluate(() => {
  const titles = [...document.querySelectorAll("h1.title")];
  // Pick the title closest to viewport center horizontally
  let best = null;
  let bestDist = Infinity;
  titles.forEach((t) => {
    const r = t.getBoundingClientRect();
    if (r.width === 0) return;
    const cx = r.x + r.width / 2;
    const dist = Math.abs(cx - window.innerWidth / 2);
    if (dist < bestDist) {
      bestDist = dist;
      best = t;
    }
  });
  if (!best) return null;
  best.setAttribute("data-fds-h", "1");
  const r = best.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, text: best.textContent?.trim() };
});

const hoverProbe = { target };
if (target) {
  hoverProbe.before = await page.evaluate(() => {
    const t = document.querySelector("[data-fds-h='1']");
    if (!t) return null;
    const cs = getComputedStyle(t);
    const chars = [...t.querySelectorAll(".SplitTextJS-char")];
    return {
      title: {
        transform: cs.transform,
        letterSpacing: cs.letterSpacing,
        color: cs.color,
        transition: cs.transition,
      },
      chars: chars.slice(0, 5).map((el) => {
        const cs = getComputedStyle(el);
        return {
          text: el.textContent,
          transform: cs.transform,
          color: cs.color,
          transition: cs.transition,
          transformOrigin: cs.transformOrigin,
        };
      }),
    };
  });

  await page.mouse.move(target.x, target.y);
  // Sample at multiple times after hover starts
  hoverProbe.during = [];
  for (const t of [50, 150, 300, 500, 800]) {
    await page.waitForTimeout(t === 50 ? 50 : t - hoverProbe.during[hoverProbe.during.length - 1]?.atMs || t);
    const at = await page.evaluate(() => {
      const t = document.querySelector("[data-fds-h='1']");
      if (!t) return null;
      const cs = getComputedStyle(t);
      const chars = [...t.querySelectorAll(".SplitTextJS-char")];
      return {
        title: {
          transform: cs.transform,
          letterSpacing: cs.letterSpacing,
          color: cs.color,
        },
        chars: chars.slice(0, 5).map((el) => {
          const cs = getComputedStyle(el);
          return { text: el.textContent, transform: cs.transform, color: cs.color };
        }),
      };
    });
    hoverProbe.during.push({ atMs: t, ...at });
  }

  await page.screenshot({ path: resolve(OUT_DIR, "title-hovered.png") });

  // Move away to release hover, capture release state
  await page.mouse.move(10, 10);
  await page.waitForTimeout(600);
  hoverProbe.afterRelease = await page.evaluate(() => {
    const t = document.querySelector("[data-fds-h='1']");
    if (!t) return null;
    const cs = getComputedStyle(t);
    const chars = [...t.querySelectorAll(".SplitTextJS-char")];
    return {
      title: { transform: cs.transform, color: cs.color },
      chars: chars.slice(0, 5).map((el) => {
        const cs = getComputedStyle(el);
        return { text: el.textContent, transform: cs.transform, color: cs.color };
      }),
    };
  });
}

// Also capture screenshots at the early sample times
console.log("→ replaying entry for screenshot frames");
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForFunction(
  () => {
    const titles = document.querySelectorAll("h1.title");
    if (titles.length === 0) return false;
    const r = titles[0].getBoundingClientRect();
    return r.top < window.innerHeight - 50;
  },
  { timeout: 30_000 },
);
const replayStart = Date.now();
for (const t of [0, 100, 250, 500, 900, 1500, 2500]) {
  const remaining = t - (Date.now() - replayStart);
  if (remaining > 0) await page.waitForTimeout(remaining);
  await page.screenshot({
    path: resolve(OUT_DIR, `marquee-entry-${String(t).padStart(4, "0")}ms.png`),
  });
}

const out = {
  url: URL,
  capturedAt: new Date().toISOString(),
  samples,
  hoverProbe,
};
writeFileSync(
  resolve(OUT_DIR, "inspection-marquee.json"),
  JSON.stringify(out, null, 2),
  "utf-8",
);

console.log("✓ done →", OUT_DIR);
console.log("  first sample (just after loader):");
console.log("   ", JSON.stringify(samples[0]?.data?.titles?.[0], null, 2));
console.log("  late sample:");
console.log(
  "   ",
  JSON.stringify(samples[samples.length - 1]?.data?.titles?.[0], null, 2),
);
console.log("  track over time (translateX):");
samples.forEach((s) => {
  const tr = s.data.track?.transform;
  console.log("   ", s.label, "→", tr);
});
console.log("  hover before chars:", JSON.stringify(hoverProbe.before?.chars?.slice(0, 3), null, 2));
console.log("  hover during[150ms]:", JSON.stringify(hoverProbe.during?.find(d => d.atMs === 150)?.chars?.slice(0, 3), null, 2));

await browser.close();
