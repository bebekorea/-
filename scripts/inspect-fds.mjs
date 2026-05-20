// Inspect Field Day Sound (fielddaysound.tv) and extract:
//   - Detected JS libraries (GSAP, Lenis, SplitType, etc.)
//   - Marquee mechanics (speed, direction, animation-name, play state)
//   - Per-letter mask-reveal entry animation (transform, transition, stagger)
//   - Per-letter hover scale (transform, transition delay)
//   - Background fade-on-hover (any layered images/videos that change opacity)
//
// Output: docs/research/fielddaysound/inspection.json + screenshots.
// Read-only against the live site; nothing about our project changes.

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../docs/research/fielddaysound");
mkdirSync(OUT_DIR, { recursive: true });

const URL = "https://www.fielddaysound.tv/?ref=godly";

const findings = {
  url: URL,
  capturedAt: new Date().toISOString(),
  libraries: {},
  marquee: {},
  letters: {},
  hover: {},
  background: {},
  scroll: {},
  raw: {},
};

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
});
const page = await ctx.newPage();

console.log("→ navigating");
await page.goto(URL, { waitUntil: "networkidle", timeout: 60_000 });

// 1) Library detection — look at script tags + window globals
findings.libraries = await page.evaluate(() => {
  const scripts = [...document.querySelectorAll("script[src]")].map((s) => s.src);
  const w = /** @type any */ (window);
  return {
    scriptSrcs: scripts,
    hasGSAP: !!w.gsap,
    hasScrollTrigger: !!w.ScrollTrigger || !!(w.gsap && w.gsap.ScrollTrigger),
    hasLenis: !!w.Lenis || !!document.querySelector(".lenis, [data-lenis-prevent]"),
    hasLocomotive: !!w.LocomotiveScroll || !!document.querySelector("[data-scroll-container]"),
    hasSplitType: !!w.SplitType,
    hasSplitText: !!w.SplitText || !!(w.gsap && w.gsap.SplitText),
    hasFramerMotion: !!document.querySelector("[data-framer-component-type]"),
    hasWebflow: !!w.Webflow || !!document.querySelector("[data-wf-page]"),
    hasBarba: !!w.barba,
  };
});

// 2) Topology — find every plausible marquee/horizontal-scrolling container
findings.raw.marqueeCandidates = await page.evaluate(() => {
  const candidates = [];
  const all = document.querySelectorAll("body *");
  all.forEach((el) => {
    const cs = getComputedStyle(el);
    const animName = cs.animationName;
    const overflow = cs.overflowX;
    const text = el.textContent?.trim().slice(0, 80) || "";
    const isFlex = cs.display === "flex";
    const hasKeyframes =
      animName && animName !== "none" && animName !== "" && animName !== "normal";
    const looksMarqueeWidth = el.scrollWidth > el.clientWidth * 1.5;
    if (
      hasKeyframes ||
      (isFlex && looksMarqueeWidth && overflow === "hidden")
    ) {
      candidates.push({
        tag: el.tagName,
        classes: el.className?.toString().slice(0, 200),
        animationName: animName,
        animationDuration: cs.animationDuration,
        animationTimingFunction: cs.animationTimingFunction,
        animationIterationCount: cs.animationIterationCount,
        animationPlayState: cs.animationPlayState,
        animationDirection: cs.animationDirection,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        text: text,
      });
    }
  });
  return candidates.slice(0, 30);
});

// 3) Page-load entry capture — record state at multiple frames as the page settles
console.log("→ capturing entry frames");
const entryCaptures = [];
// Re-navigate so we catch from frame 0 again
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
const start = Date.now();
const sampleAt = [50, 200, 400, 700, 1200, 1800, 2600, 3500];
for (const ms of sampleAt) {
  const remaining = ms - (Date.now() - start);
  if (remaining > 0) await page.waitForTimeout(remaining);
  await page.screenshot({
    path: resolve(OUT_DIR, `entry-${String(ms).padStart(4, "0")}ms.png`),
    fullPage: false,
  });
  // Snapshot transforms on every span that contains visible text in the
  // upper-half hero — that is where the entry reveal happens
  const snap = await page.evaluate(() => {
    const result = [];
    const all = document.querySelectorAll("body *");
    all.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (
        r.top < window.innerHeight * 0.9 &&
        r.bottom > 0 &&
        r.height > 0 &&
        r.height < 300 &&
        el.textContent?.trim() &&
        el.children.length === 0
      ) {
        const cs = getComputedStyle(el);
        const tr = cs.transform;
        const op = cs.opacity;
        if (
          (tr && tr !== "none") ||
          (op && op !== "1")
        ) {
          result.push({
            tag: el.tagName,
            text: el.textContent.trim().slice(0, 40),
            transform: tr,
            opacity: op,
            transition: cs.transition,
            classes: el.className?.toString().slice(0, 120),
          });
        }
      }
    });
    return result.slice(0, 80);
  });
  entryCaptures.push({ atMs: ms, count: snap.length, sample: snap.slice(0, 12) });
}
findings.letters.entryCaptures = entryCaptures;

// 4) After page settles, find the HUGE display-type element (the brand-name
//    marquee). Filter by font-size > 40px and look for a parent with
//    animation-name (the marquee track).
console.log("→ analysing settled marquee");
await page.waitForTimeout(2000);

findings.marquee = await page.evaluate(() => {
  // Find big text elements (likely the marquee letters/words)
  const big = [];
  document.querySelectorAll("body *").forEach((el) => {
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize);
    if (fs >= 50 && el.textContent?.trim() && el.children.length <= 3) {
      big.push({ el, fontSize: fs, cs });
    }
  });
  if (big.length === 0) return { note: "no big-text elements found" };

  // Pick the biggest one in viewport
  big.sort((a, b) => b.fontSize - a.fontSize);
  const target = big[0].el;

  // Walk up to find the animated track parent
  let track = target;
  let trackInfo = null;
  for (let i = 0; i < 8 && track && track !== document.body; i++) {
    const cs = getComputedStyle(track);
    if (cs.animationName && cs.animationName !== "none") {
      trackInfo = {
        depth: i,
        tag: track.tagName,
        classes: track.className?.toString(),
        animationName: cs.animationName,
        animationDuration: cs.animationDuration,
        animationTimingFunction: cs.animationTimingFunction,
        animationDirection: cs.animationDirection,
        animationIterationCount: cs.animationIterationCount,
        animationPlayState: cs.animationPlayState,
        animationFillMode: cs.animationFillMode,
        transform: cs.transform,
        scrollWidth: track.scrollWidth,
        clientWidth: track.clientWidth,
      };
      break;
    }
    track = track.parentElement;
  }

  // Inspect a representative letter / word
  function inspect(el) {
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName,
      text: el.textContent?.trim().slice(0, 60),
      classes: el.className?.toString(),
      fontSize: cs.fontSize,
      fontFamily: cs.fontFamily,
      fontWeight: cs.fontWeight,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
      color: cs.color,
      display: cs.display,
      transform: cs.transform,
      transition: cs.transition,
      transformOrigin: cs.transformOrigin,
      opacity: cs.opacity,
      overflow: cs.overflow,
      overflowX: cs.overflowX,
      overflowY: cs.overflowY,
      position: cs.position,
      whiteSpace: cs.whiteSpace,
    };
  }

  // Find letter-level spans — inline children of the big text element
  const letterLike = [];
  document.querySelectorAll("body *").forEach((el) => {
    const t = el.textContent?.trim() || "";
    if (
      t.length === 1 &&
      el.children.length === 0 &&
      parseFloat(getComputedStyle(el).fontSize) >= 40
    ) {
      letterLike.push(el);
    }
  });
  const sampleLetters = letterLike.slice(0, 6).map(inspect);

  // Find parents of letter-like spans — those are the masks if any
  const maskCandidates = [];
  letterLike.slice(0, 6).forEach((el) => {
    if (el.parentElement) maskCandidates.push(inspect(el.parentElement));
  });

  return {
    track: trackInfo,
    sampleBigText: inspect(target),
    sampleLetters,
    maskCandidates,
    letterCount: letterLike.length,
  };
});

// 5) Hover behaviour — try hovering the biggest text and capture before/after
console.log("→ probing hover state");
const hoverBefore = await page.evaluate(() => {
  let target = null;
  let max = 0;
  document.querySelectorAll("body *").forEach((el) => {
    const fs = parseFloat(getComputedStyle(el).fontSize);
    const r = el.getBoundingClientRect();
    if (
      fs > max &&
      el.textContent?.trim() &&
      r.width > 0 &&
      r.top < window.innerHeight &&
      r.bottom > 0
    ) {
      max = fs;
      target = el;
    }
  });
  if (!target) return null;
  const r = target.getBoundingClientRect();
  // Tag the element for re-finding
  target.setAttribute("data-fds-hover-target", "1");
  return {
    selector: "[data-fds-hover-target='1']",
    boundingRect: { x: r.x, y: r.y, width: r.width, height: r.height },
    fontSize: max,
    text: target.textContent?.trim().slice(0, 60),
  };
});

if (hoverBefore) {
  // Snapshot a few of its letter spans BEFORE hover
  findings.hover.before = await page.evaluate((selector) => {
    const target = document.querySelector(selector);
    if (!target) return [];
    const letters = [...target.querySelectorAll("span")].slice(0, 6);
    return letters.map((el) => {
      const cs = getComputedStyle(el);
      return {
        text: el.textContent?.slice(0, 4),
        transform: cs.transform,
        transition: cs.transition,
        opacity: cs.opacity,
        color: cs.color,
        letterSpacing: cs.letterSpacing,
      };
    });
  }, hoverBefore.selector);

  // Hover and capture again
  await page.mouse.move(
    hoverBefore.boundingRect.x + hoverBefore.boundingRect.width / 2,
    hoverBefore.boundingRect.y + hoverBefore.boundingRect.height / 2,
  );
  await page.waitForTimeout(400);
  await page.screenshot({ path: resolve(OUT_DIR, "hover-state.png") });

  findings.hover.after = await page.evaluate((selector) => {
    const target = document.querySelector(selector);
    if (!target) return [];
    const letters = [...target.querySelectorAll("span")].slice(0, 6);
    return letters.map((el) => {
      const cs = getComputedStyle(el);
      return {
        text: el.textContent?.slice(0, 4),
        transform: cs.transform,
        transition: cs.transition,
        opacity: cs.opacity,
        color: cs.color,
        letterSpacing: cs.letterSpacing,
      };
    });
  }, hoverBefore.selector);

  findings.hover.target = hoverBefore;

  // Also probe parent for letter-spacing change
  findings.hover.parentSpacing = await page.evaluate((selector) => {
    const target = document.querySelector(selector);
    if (!target) return null;
    const cs = getComputedStyle(target);
    return {
      letterSpacing: cs.letterSpacing,
      transition: cs.transition,
    };
  }, hoverBefore.selector);
}

// 6) Background change on hover — look for sibling images/videos whose opacity
//    might toggle. Capture all absolutely-positioned media element styles.
findings.background = await page.evaluate(() => {
  const items = [];
  document.querySelectorAll("img, video").forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.position === "absolute" || cs.position === "fixed") {
      items.push({
        tag: el.tagName,
        src:
          /** @type any */ (el).currentSrc ||
          /** @type any */ (el).src ||
          el.getAttribute("src"),
        opacity: cs.opacity,
        transition: cs.transition,
        transform: cs.transform,
        zIndex: cs.zIndex,
      });
    }
  });
  return items.slice(0, 30);
});

// 7) Smooth-scroll detection
findings.scroll = await page.evaluate(() => {
  const html = document.documentElement;
  const body = document.body;
  return {
    htmlClasses: html.className,
    bodyClasses: body.className,
    htmlScrollBehavior: getComputedStyle(html).scrollBehavior,
    bodyScrollBehavior: getComputedStyle(body).scrollBehavior,
    hasLenisClass: !!document.querySelector(".lenis"),
    htmlHasLenis: html.classList.contains("lenis"),
    bodyHasLenis: body.classList.contains("lenis"),
    customScrollContainer: !!document.querySelector("[data-scroll-container], .scroll-container"),
  };
});

// 8) Final settled screenshot
await page.screenshot({ path: resolve(OUT_DIR, "settled.png"), fullPage: false });
await page.screenshot({ path: resolve(OUT_DIR, "settled-full.png"), fullPage: true });

// Write the report
writeFileSync(
  resolve(OUT_DIR, "inspection.json"),
  JSON.stringify(findings, null, 2),
  "utf-8",
);

console.log("✓ inspection complete →", OUT_DIR);
console.log("  libraries:", JSON.stringify(findings.libraries, null, 2));
console.log("  marquee track:", JSON.stringify(findings.marquee?.track, null, 2));
console.log("  hover before-after sample:", JSON.stringify({
  parent: findings.hover.parentSpacing,
  before: findings.hover.before?.slice(0, 3),
  after: findings.hover.after?.slice(0, 3),
}, null, 2));

await browser.close();
