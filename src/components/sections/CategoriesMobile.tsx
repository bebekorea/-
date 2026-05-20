"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import { useLang } from "@/lib/i18n";
import { useInView } from "@/lib/useInView";
import { useAssetMap } from "@/lib/useAssets";
import type { AssetKey } from "@/lib/notion";
import { EASE } from "@/lib/motion";
import {
  CATEGORY_DETAILS,
  CategoryMobileCard,
  resolveCategoryPreviewProps,
} from "./categoryPreview";

// 데스크탑 page.tsx에서 <CategorySection /> 6번 호출하던 순서 그대로 유지.
// 한 곳에서 명시함으로써 모바일 캐러셀의 슬라이드 순서를 데스크탑 흐름과
// 1:1로 맞춘다.
// 데스크탑 page.tsx <CategorySection /> 순서와 1:1 일치 — adopt/location/
// product/beauty/partners(사료/간식)/global. 서비스 드롭다운 표시 순서도 동일.
const CATEGORY_ORDER = [
  "adopt",
  "location",
  "product",
  "beauty",
  "partners",
  "global",
] as const;

interface CategoriesMobileProps {
  onOpenRegister: () => void;
  onAnchor?: (id: string) => void;
}

/**
 * CategoriesMobile — 모바일 전용 6개 서비스(카테고리) 캐러셀.
 *
 * 데스크탑은 카테고리마다 풀-뷰포트 섹션(CategorySection × 6)이라 사용자가
 * 6번 스크롤하면서 본다. 모바일은 한 섹션 안에서 swiper로 옆으로 스와이프해
 * 6개 서비스를 짧게 둘러볼 수 있도록 묶었다.
 *
 * - 루트 section은 `md:hidden` — 데스크탑에서는 DOM 미렌더
 * - 각 슬라이드는 CategoryMobileCard 재사용 (단일 진실원천)
 * - swiper-wrapper align-items: stretch + slide height auto → 슬라이드들이
 *   가장 긴 카드 기준으로 통일된 height 공유. swipe 사이 섹션 크기 고정.
 * - 페이지네이션 dots는 카드(다크 배경) 위 흰 톤
 */
export default function CategoriesMobile({
  onOpenRegister,
  onAnchor,
}: CategoriesMobileProps) {
  const { t, lang } = useLang();
  const { ref, inView } = useInView<HTMLElement>(0.2);
  // Notion 자산 맵 — category_<id> 키로 메인 사진 오버라이드.
  const assetMap = useAssetMap();

  const fadeUp = (idx: number): React.CSSProperties => ({
    opacity: inView ? 1 : 0,
    transform: inView ? "translate3d(0,0,0)" : "translate3d(0,24px,0)",
    transition: `opacity 700ms ${EASE} ${idx * 90}ms, transform 700ms ${EASE} ${idx * 90}ms`,
    willChange: "opacity, transform",
  });

  return (
    <section
      ref={ref}
      id="services"
      className="md:hidden bg-white pt-20 pb-6"
    >
      {/* Toss 스타일 헤더 — 라벨 "서비스" + 큰 헤드라인. */}
      <header className="px-6 mb-10">
        <p
          className="text-[0.875rem] tracking-[-0.02em] font-semibold text-[#3aa676] mb-3"
          style={fadeUp(0)}
        >
          서비스
        </p>
        <h2
          className="text-[1.875rem] leading-[1.3] tracking-[-0.02em] font-bold text-black"
          style={{ textWrap: "balance", ...fadeUp(1) }}
        >
          {t("index.cta")}
        </h2>
      </header>

      <div style={fadeUp(2)}>
      <Swiper
        modules={[Pagination]}
        slidesPerView={1.06}
        spaceBetween={0}
        pagination={{ clickable: true }}
        observer
        observeParents
        className="categories-mobile-swiper"
      >
        {CATEGORY_ORDER.map((categoryId) => {
          const detail = CATEGORY_DETAILS[categoryId];
          if (!detail) return null;
          const props = resolveCategoryPreviewProps(detail, t, lang);

          // Asset 오버라이드 — Notion DB에 category_<id> 등록 시 메인 사진 교체.
          const overrideUrl = assetMap[`category_${categoryId}` as AssetKey];
          if (overrideUrl) {
            if (props.visual.type === "photo") {
              props.visual = { ...props.visual, src: overrideUrl };
            } else if (props.visual.type === "cards" && props.visual.cards[0]) {
              props.visual = {
                ...props.visual,
                cards: [
                  { ...props.visual.cards[0], photo: overrideUrl },
                  ...props.visual.cards.slice(1),
                ],
              };
            }
          }
          return (
            <SwiperSlide key={categoryId}>
              {/* Toss 스타일 카드 — px-2 외곽 여백 + rounded-3xl + overflow-hidden.
                  CategoryMobileCard의 photo bg + 다크 그라데이션이 카드 모서리
                  안에서 깔끔하게 클리핑. */}
              <div className="px-2 h-full">
                <div className="rounded-3xl overflow-hidden h-full">
                  <CategoryMobileCard
                    {...props}
                    onOpenRegister={onOpenRegister}
                    onAnchor={onAnchor}
                  />
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
      </div>

      {/* 페이지네이션 dots — 검정 bg 제거. swiper-wrapper만 dark photo 영역이고
          dots는 슬라이드 위에 absolute로 띄워 다크 사진 위 흰 톤으로 보임.
          padding-bottom 0 — dots를 슬라이드 내부 하단으로 끌어올려 검정 띠
          제거. */}
      <style jsx global>{`
        .categories-mobile-swiper {
          padding-bottom: 0;
        }
        .categories-mobile-swiper .swiper-pagination {
          bottom: 16px;
        }
        .categories-mobile-swiper .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.4);
          opacity: 1;
          width: 6px;
          height: 6px;
          margin: 0 4px !important;
          border-radius: 3px;
          transition: width 250ms ease, background 250ms ease;
        }
        .categories-mobile-swiper .swiper-pagination-bullet-active {
          background: #fff;
          width: 18px;
        }
        /* 슬라이드 통일 높이 — align-stretch + slide auto로 모든 슬라이드가
           가장 긴 슬라이드 기준 높이로 통일. 짧은 카드는 다크 사진 bg가
           슬라이드를 가득 채우므로 빈 흰 공간이 보이지 않는다. */
        .categories-mobile-swiper .swiper-wrapper {
          align-items: stretch;
        }
        .categories-mobile-swiper .swiper-slide {
          height: auto;
        }
        /* CategoryMobileCard 루트 div가 슬라이드 height을 100% 채워서
           dark 사진 + 그라데이션이 짧은 카드에서도 슬라이드 전체에 깔리도록.
           컨텐츠는 카드 상단에 위치, 아래쪽 빈 영역은 사진/그라데이션으로
           자연스럽게 덮인다. */
        .categories-mobile-swiper .swiper-slide > div {
          height: 100%;
        }
      `}</style>
    </section>
  );
}
