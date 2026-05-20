"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether the element is the "current" full-page section in the scroll container.
 * Returns `inView=true` when at least 50% of the element is visible inside its scroll root.
 */
export function useInView<T extends HTMLElement = HTMLElement>(threshold = 0.5) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const root = el.closest(".fp-container") as HTMLElement | null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting && entry.intersectionRatio >= threshold);
      },
      { root, threshold: [threshold, threshold + 0.01] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}
