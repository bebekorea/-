"use client";

import { useEffect, useRef } from "react";
import { useLang } from "@/lib/i18n";
import { EASE, STAGGER_MS } from "@/lib/motion";
import { useInView } from "@/lib/useInView";

/**
 * HeroRecap — ScrollHero stage 1의 "메인 첫 화면"을 그대로 재현하는
 * 독립 섹션. TRUST(stage 3) 다음에 한 번 더 큰 브랜드 비주얼로 시선을
 * 정돈한 뒤 #index 마퀴로 넘어가도록 배치된다.
 *
 * ScrollHero와 달리 내부 stage transition이 없고 wheel/touch도 가로채지
 * 않아 page.tsx의 일반 섹션 점프 로직(이전 = ScrollHero, 다음 = #index)에
 * 그대로 맡긴다. 인트로 타이핑/Skip도 없음.
 */

const FADE_MS = 1100;

interface HeroRecapProps {
  isActive?: boolean;
}

export default function HeroRecap({ isActive = true }: HeroRecapProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref, inView } = useInView<HTMLElement>(0.4);
  const { t, ta } = useLang();

  // ScrollHero와 동일한 패턴: 섹션이 활성일 때만 비디오 재생, 그 외엔
  // 일시정지해서 다른 섹션을 보는 동안 디코딩/페인트 비용을 줄인다.
  useEffect(() => {
    if (isActive && inView) {
      videoRef.current?.play().catch(() => {});
    } else {
      videoRef.current?.pause();
    }
  }, [isActive, inView]);

  const heroLines = ta("hero.lines");
  const lines: { text: string; cls?: string; tag?: "p" | "tagline" }[] = [
    { text: heroLines[0] ?? "" },
    { text: heroLines[1] ?? "", cls: "hidden md:block" },
    { text: heroLines[2] ?? "", cls: "hidden md:block" },
    { text: t("hero.tagline"), tag: "tagline", cls: "mt-6 md:mt-[2vw]" },
  ];

  return (
    <section
      ref={ref}
      id="hero-recap"
      className="fp-section bg-black overflow-hidden max-md:hidden"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src="/videos/hero-main.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        style={{
          opacity: isActive ? 1 : 0,
          transition: `opacity ${FADE_MS}ms ${EASE}`,
          transform: "translateZ(0) scale(1.01)",
          willChange: "opacity",
          backfaceVisibility: "hidden",
        }}
      />
      <div
        className="absolute inset-0 bg-black/25"
        style={{
          opacity: isActive ? 1 : 0,
          transition: `opacity ${FADE_MS}ms ${EASE}`,
        }}
      />

      {/* 우측 하단 정렬된 hero copy — ScrollHero stage 1과 시그너처 동일.
          섹션이 inView일 때 한 줄씩 STAGGER_MS 간격으로 페이드 업. */}
      <div className="absolute inset-0 z-30 flex flex-col items-end justify-end text-right text-white pointer-events-none px-5 pb-28 md:px-[5vw] md:pb-[10vh]">
        {lines.map((line, i) => {
          const baseStyle: React.CSSProperties = {
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(-12px)",
            transition: `opacity ${FADE_MS}ms ${EASE} ${i * STAGGER_MS}ms, transform ${FADE_MS}ms ${EASE} ${i * STAGGER_MS}ms`,
          };
          if (line.tag === "tagline") {
            return (
              <span
                key={i}
                className={`block text-[1.5rem] md:text-[clamp(24px,2.0833vw,36px)] leading-[1.2] font-light tracking-[0.02em] ${line.cls ?? ""}`}
                style={baseStyle}
              >
                {line.text}
              </span>
            );
          }
          const baseCls =
            "text-[0.8125rem] md:text-[clamp(12px,0.8333vw,15px)] tracking-[-0.02em] leading-[2em] font-light text-white/85";
          return (
            <p key={i} className={`${baseCls} ${line.cls ?? ""}`} style={baseStyle}>
              {line.text}
            </p>
          );
        })}
      </div>
    </section>
  );
}
