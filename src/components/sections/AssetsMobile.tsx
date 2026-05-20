"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import { useLang } from "@/lib/i18n";
import { useInView } from "@/lib/useInView";
import { EASE } from "@/lib/motion";
import { ASSET_CARDS, ASSET_DETAILS } from "@/lib/assets";

/**
 * AssetsMobile — 모바일 전용 6대 자산 섹션
 *
 * 데스크탑 ScrollHero stage 2는 가로 6열 카드 + 호버 디테일 패널의 인터랙티브
 * 컴포지션이다. 모바일에선 호버 디바이스가 없고, 사용자가 카드 하나하나에
 * 시선을 집중할 수 있도록 옆으로 넘기는 swiper 캐러셀 1장씩 노출로 재구성.
 *
 * - 컴포넌트 루트가 `md:hidden` 이라 데스크탑(>= 768px)에선 DOM이 렌더되지 않음
 * - autoHeight=true 로 각 슬라이드(=각 카드)별 자연스러운 높이 — points 개수에
 *   따라 카드 길이가 다르므로 강제 고정 X
 * - 페이지네이션 dots는 검정 톤(브랜드 화이트/블랙)으로 커스텀
 * - 데이터(ASSET_CARDS, ASSET_DETAILS)는 lib/assets.ts에서 임포트, 데스크탑
 *   ScrollHero stage 2와 동일한 단일 진실원천
 */
export default function AssetsMobile() {
  const { t, lang } = useLang();
  const { ref, inView } = useInView<HTMLElement>(0.2);

  // Toss 스타일 fade-up 스태거 — 각 자식이 idx*90ms 지연으로 차례로 나타남.
  // 700ms 듀레이션 + easeOutExpo로 부드럽게 정착.
  const fadeUp = (idx: number): React.CSSProperties => ({
    opacity: inView ? 1 : 0,
    transform: inView ? "translate3d(0,0,0)" : "translate3d(0,24px,0)",
    transition: `opacity 700ms ${EASE} ${idx * 90}ms, transform 700ms ${EASE} ${idx * 90}ms`,
    willChange: "opacity, transform",
  });

  return (
    <section
      ref={ref}
      id="assets"
      className="md:hidden bg-white text-black pt-20 pb-6"
    >
      {/* Toss 스타일 헤더 — 작은 한글 라벨(브랜드 그린) + 큰 굵은 한글 헤드라인.
          이전 영문 ASSET eyebrow를 한글 라벨 "자산"으로 대체, 본문이 진짜
          타이틀 역할. text-wrap: balance로 줄바꿈 균형. */}
      <header className="px-6 mb-10">
        <p
          className="text-[0.875rem] tracking-[-0.02em] font-semibold text-[#3aa676] mb-3"
          style={fadeUp(0)}
        >
          자산
        </p>
        <h2
          className="text-[1.875rem] leading-[1.3] tracking-[-0.02em] font-bold text-black"
          style={{ textWrap: "balance", ...fadeUp(1) }}
        >
          {t("assets.tagline")}
        </h2>
      </header>

      {/* 6장 캐러셀 — 옆으로 스와이프해서 한 카드씩 확인.
          autoHeight 사용 안 함 — 슬라이드별로 높이가 달라지면 캐러셀/섹션
          크기가 swipe할 때마다 변해 페이지 레이아웃이 흔들린다 (jarring).
          대신 align-items: stretch로 모든 슬라이드를 가장 긴 슬라이드 높이에
          맞춰 캐러셀/섹션 크기를 고정. 짧은 카드는 아래에 흰 빈 공간이
          생기지만 섹션 bg와 같은 색이라 시각적으로 거슬리지 않는다. */}
      {/* slidesPerView 1.05 — 다음 카드 좌측 가장자리(약 20px)가 viewport
          우측 끝에 노출돼 "옆으로 더 있다" 시각 은유를 만든다. dots만으로는
          swipe 가능함이 즉시 읽히지 않는다는 사용자 피드백 반영. */}
      <div style={fadeUp(2)}>
      <Swiper
        modules={[Pagination]}
        slidesPerView={1.06}
        spaceBetween={0}
        pagination={{ clickable: true }}
        observer
        observeParents
        className="assets-mobile-swiper"
      >
        {ASSET_CARDS.map((card, i) => {
          const detail = ASSET_DETAILS[i];
          const points = detail?.points[lang] ?? [];
          return (
            <SwiperSlide key={card.titleKey}>
              {/* Toss 스타일 카드 — 외곽 mx-2로 양옆 8px 간격, 내부 따뜻한
                  크림 베이지(#faf5ec) + rounded-3xl로 한 장의 카드처럼.
                  회색 톤(#f7f8fa)은 차갑게 느껴져 펫 케어 브랜드 따뜻한 무드와
                  안 맞아 바꿈. h-full로 가장 긴 슬라이드 높이 통일. */}
              <div className="px-2 h-full">
              <div className="bg-[#faf5ec] rounded-3xl px-6 pt-6 pb-7 h-full">
                {/* 번호 + 영문 라벨을 한 줄로 인라인 — 별도 줄로 나누면 카드
                    상단이 비대해진다. 챕터 마커처럼 컴팩트하게. */}
                <p className="text-[0.75rem] tracking-[0.18em] uppercase text-black/65 font-medium mb-2">
                  <span style={{ color: "#3aa676" }}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="mx-2 text-black/30">·</span>
                  <span>{detail?.name.en ?? ""}</span>
                </p>

                {/* 한글 자산 제목 */}
                <h3 className="text-[1.375rem] leading-[1.3] tracking-[-0.01em] font-semibold text-black mb-3">
                  {t(card.titleKey)}
                </h3>

                {/* tagline — Toss 스타일 일관성을 위해 serif KR/font-light 제거,
                    Pretendard 기본 sans로 통일. 섹션 헤드라인(bold sans)과 같은 톤. */}
                <p className="text-[0.9375rem] leading-[1.5] tracking-[-0.01em] text-black/75 mb-6">
                  {detail?.tagline[lang] ?? ""}
                </p>

                {/* 상세 불릿 포인트들 — label + body 페어 */}
                {points.length > 0 && (
                  <ul className="space-y-5">
                    {points.map((p, pi) => (
                      <li key={pi} className="flex gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-[0.55rem] inline-block flex-shrink-0 w-[5px] h-[5px]"
                          style={{ backgroundColor: "#3aa676" }}
                        />
                        <div className="flex-1">
                          <p className="text-[0.9375rem] leading-[1.45] tracking-[-0.01em] font-semibold text-black mb-1.5">
                            {p.label}
                          </p>
                          <p className="text-[0.8125rem] leading-[1.7] tracking-[-0.01em] text-black/70">
                            {p.body}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
      </div>

      {/* 페이지네이션 dots 색상 커스텀 — 브랜드 흑/백 톤.
          active dot은 18px 막대로 늘어나 진행 상황을 시각화.
          padding-bottom 1.75rem — 카드 콘텐츠 끝에서 dots까지의 간격을 좁혀
          dots가 캐러셀의 일부로 자연스럽게 읽히도록. */}
      <style jsx global>{`
        .assets-mobile-swiper {
          padding-bottom: 1.75rem;
        }
        .assets-mobile-swiper .swiper-pagination {
          bottom: 0;
        }
        .assets-mobile-swiper .swiper-pagination-bullet {
          background: rgba(0, 0, 0, 0.22);
          opacity: 1;
          width: 6px;
          height: 6px;
          margin: 0 4px !important;
          border-radius: 3px;
          transition: width 250ms ease, background 250ms ease;
        }
        .assets-mobile-swiper .swiper-pagination-bullet-active {
          background: #000;
          width: 18px;
        }
        /* 슬라이드 통일 높이 — wrapper align-stretch + slide height auto
           조합으로 모든 슬라이드가 가장 긴 슬라이드의 높이로 통일된다.
           swipe 사이 캐러셀/섹션 크기 고정 → 페이지 jitter 없음. */
        .assets-mobile-swiper .swiper-wrapper {
          align-items: stretch;
        }
        .assets-mobile-swiper .swiper-slide {
          height: auto;
        }
      `}</style>
    </section>
  );
}
