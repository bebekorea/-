/**
 * Shared motion tokens. All transitions/animations across the site read from
 * these so the entire experience moves with one consistent rhythm.
 *
 *  EASE — easeOutExpo. Starts moving immediately but settles VERY softly,
 *         which is the signature feel of high-end editorial sites.
 */

export const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export const DURATION = {
  /** Small UI transitions: opacity, color swap, intro phase steps */
  fast: 800,
  /** Default for stage transitions (frame layout, copy fade, clip-path) */
  base: 1200,
  /** Section-to-section page jump (PC 휠 스크롤 시 섹션 이동) — 600 → 800ms로
      살짝 느리게. 너무 빠르면 컷처럼 느껴져 어색했음. */
  jump: 800,
} as const;

/** JS easing matching the CSS bezier above (easeOutExpo approximation). */
export const easeOut = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** Stagger delay between consecutive text lines */
export const STAGGER_MS = 80;
