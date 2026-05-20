/**
 * Site-wide typography scale. Every section reads from these tokens so
 * the same hierarchy level (display / title / subhead / body / eyebrow)
 * has identical font-size, line-height, letter-spacing across the site.
 *
 * Each token is split into:
 *   - `cls`   : tailwind className (size + line-height + tracking + weight)
 *   - `font`  : optional font-family CSS variable to apply via inline style
 *
 * Sizes use fluid `clamp(min, vw, max)` typography on md+ — the design
 * is tuned around 1440px (vw ideal), but a px floor keeps text legible
 * at ~1024-1280px laptops, and a rem ceiling stops oversize headlines
 * on >1920px monitors. Mobile (<768px) keeps its own rem fallback because
 * the mobile-only layout has a different rhythm. Industry standard pattern
 * — Apple/Loewe/Hermès all use this fluid clamp approach.
 */

type TypoToken = {
  /** className covering size + line-height + tracking + font-weight + casing */
  cls: string;
  /** font-family CSS variable, applied as `style={{ fontFamily }}` */
  font?: string;
};

export const TYPO: Record<
  "eyebrow" | "display" | "title" | "subhead" | "body" | "caption",
  TypoToken
> = {
  /** Tiny English-only label — section eyebrows ("ADOPT", "FOOD"…). */
  eyebrow: {
    cls: "text-[0.75rem] md:text-[clamp(11px,0.7292vw,13px)] leading-[1] tracking-[0.3em] font-medium uppercase",
    font: "var(--font-jost)",
  },

  /** Largest serif headline — section heros (brand.title, Adopt.headline). */
  display: {
    cls: "text-[2.5rem] md:text-[clamp(2rem,3.125vw,3.5rem)] leading-[1.1] tracking-[0.02em] font-light",
    font: "var(--font-serif-kr)",
  },

  /** Smaller serif title — secondary heads, photo-card labels, hero tagline. */
  title: {
    cls: "text-[1.625rem] md:text-[clamp(1.5rem,2.0833vw,2.5rem)] leading-[1.2] tracking-[0.02em] font-light",
    font: "var(--font-serif-kr)",
  },

  /** Mid-weight Korean subhead — emphasises the line under the headline. */
  subhead: {
    cls: "text-[1.25rem] md:text-[clamp(1.125rem,1.6667vw,2rem)] leading-[1.56] tracking-[-0.04em] font-light",
  },

  /** Default body copy — bullet lines, paragraph text.
      Matches the hero.lines setting the user picked as canonical. */
  body: {
    cls: "text-[0.875rem] md:text-[clamp(13px,0.8333vw,15px)] leading-[2] tracking-[-0.02em] font-light",
  },

  /** Smallest body — pill buttons, info table values. */
  caption: {
    cls: "text-[0.8125rem] md:text-[clamp(11px,0.7292vw,13px)] leading-[1.5] tracking-[0.02em] font-medium",
  },
};
