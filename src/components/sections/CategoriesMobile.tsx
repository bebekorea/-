"use client";

import { useLang } from "@/lib/i18n";
import { useInView } from "@/lib/useInView";
import { useAssetMap } from "@/lib/useAssets";
import type { AssetKey } from "@/lib/notion";
import { EASE } from "@/lib/motion";
import {
  CATEGORY_DETAILS,
  resolveCategoryPreviewProps,
} from "./categoryPreview";

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
 * CategoriesMobile — 모바일 전용 카테고리 섹션 (세로 스크롤 에디토리얼).
 *
 * 이전엔 Swiper 가로 캐러셀(슬라이드 한 장씩)로 6개 카테고리를 좁은 캔버스
 * 안에 묶었으나, 클라이언트 요청으로 세로 스크롤 에디토리얼 레이아웃으로
 * 전면 재구성. 소요한남(soyo-hannam.com/contents/architecture.php) 톤을
 * 레이아웃 참고로 받았고, 각 카테고리는 다음 골격으로 노출된다:
 *
 *   1. 카테고리(eyebrow) — 작은 영문 라벨
 *   2. 메인카피 — 큰 헤드라인
 *   3. 서브카피 — 본문
 *   4. 이미지 — 라운드 코너, 풀폭
 *   5. USP 나열 — label + body 페어, 브랜드 그린 마커
 *
 * 각 카드는 자체 InView 훅으로 스크롤 진입 시 stagger fade-up. 위→아래로
 * 자연스럽게 이어지면서 사용자가 6개 서비스를 차근차근 읽어내려가는 흐름.
 *
 * - 루트 section은 `md:hidden` — 데스크탑은 별도 CategorySection × 6 사용
 * - 데이터(caption/body/points)는 CATEGORY_DETAILS 공유 (단일 진실원천)
 */
export default function CategoriesMobile({
  onOpenRegister: _onOpenRegister,
  onAnchor: _onAnchor,
}: CategoriesMobileProps) {
  // 현재 모바일 카드엔 CTA(예약/문의) 미노출 — 클라이언트 이전 결정. 액션은
  // Contact 섹션의 통합 채널로 유도. props는 미래 확장용으로 유지(린트
  // suppression 위해 _ 프리픽스).
  void _onOpenRegister;
  void _onAnchor;

  const { t, lang } = useLang();
  // 섹션 자체에 inView를 걸면 섹션 height(>4000px)이 viewport보다 훨씬
  // 커서 threshold(0.3)가 영원히 충족되지 않아 헤더 카피가 영원히
  // 안 보인다. 헤더 element에 직접 ref를 걸어 threshold가 의미를 갖도록.
  const { ref: headerRef, inView: headerInView } = useInView<HTMLElement>(0.3);

  const headerFadeUp = (idx: number): React.CSSProperties => ({
    opacity: headerInView ? 1 : 0,
    transform: headerInView ? "translate3d(0,0,0)" : "translate3d(0,24px,0)",
    transition: `opacity 700ms ${EASE} ${idx * 90}ms, transform 700ms ${EASE} ${idx * 90}ms`,
    willChange: "opacity, transform",
  });

  return (
    <section
      id="services"
      className="md:hidden bg-white text-black"
    >
      {/* 섹션 헤더 — 위 섹션과 분리되는 시각 마커. inView ref는 헤더 자체에 걸어
          threshold가 헤더 element 기준으로 발화되도록. */}
      <header ref={headerRef} className="px-6 pt-20 pb-12">
        <p
          className="text-[0.875rem] tracking-[-0.02em] font-semibold text-[#3aa676] mb-3"
          style={headerFadeUp(0)}
        >
          서비스
        </p>
        <h2
          className="text-[1.875rem] leading-[1.3] tracking-[-0.02em] font-bold text-black"
          style={{ textWrap: "balance", ...headerFadeUp(1) }}
        >
          {t("index.cta")}
        </h2>
      </header>

      {/* 카드 6장 — 세로로 쌓아 사용자가 스크롤하며 차례로 읽음 */}
      <div className="flex flex-col">
        {CATEGORY_ORDER.map((categoryId) => (
          <CategoryMobileVerticalCard
            key={categoryId}
            categoryId={categoryId}
          />
        ))}
      </div>
    </section>
  );
}

// ─── 개별 카드 컴포넌트 ──────────────────────────────────────

interface CategoryMobileVerticalCardProps {
  categoryId: string;
}

function CategoryMobileVerticalCard({ categoryId }: CategoryMobileVerticalCardProps) {
  const { t, lang } = useLang();
  const assetMap = useAssetMap();
  const { ref, inView } = useInView<HTMLElement>(0.18);

  const detail = CATEGORY_DETAILS[categoryId];
  if (!detail) return null;
  const props = resolveCategoryPreviewProps(detail, t, lang);

  // Asset 오버라이드 — Notion DB의 category_<id> 사진이 있으면 메인 이미지로 사용.
  const overrideUrl = assetMap[`category_${categoryId}` as AssetKey];
  let heroImage =
    props.visual.type === "photo"
      ? props.visual.src
      : props.visual.cards[0]?.photo ?? "";
  if (overrideUrl) heroImage = overrideUrl;

  // 스크롤 진입 stagger fade-up — 700ms × idx 90ms 지연. AssetsMobile과 동일 톤.
  const fadeUp = (idx: number): React.CSSProperties => ({
    opacity: inView ? 1 : 0,
    transform: inView ? "translate3d(0,0,0)" : "translate3d(0,28px,0)",
    transition: `opacity 750ms ${EASE} ${idx * 100}ms, transform 750ms ${EASE} ${idx * 100}ms`,
    willChange: "opacity, transform",
  });

  return (
    <article
      ref={ref}
      className="px-6 pt-10 pb-16"
      aria-label={`${props.label} 카테고리`}
    >
      {/* ── 1. eyebrow — 카테고리 라벨 ── */}
      <p
        className="text-[0.6875rem] tracking-[0.3em] uppercase font-semibold text-[#3aa676] mb-4"
        style={fadeUp(0)}
      >
        {props.label}
      </p>

      {/* ── 2. 메인카피 — 헤드라인 ── */}
      <h3
        className="text-[1.625rem] leading-[1.3] tracking-[-0.02em] font-bold text-black mb-4"
        style={{ textWrap: "balance", ...fadeUp(1) }}
      >
        {props.caption}
      </h3>

      {/* ── 3. 서브카피 — 본문 ── */}
      <p
        className="text-[0.9375rem] leading-[1.7] tracking-[-0.01em] text-black/70 mb-8"
        style={{ textWrap: "pretty", ...fadeUp(2) }}
      >
        {props.body}
      </p>

      {/* ── 4. 이미지 — 라운드 코너, 16:10 비율 ── */}
      {heroImage && (
        <div
          className="relative w-full overflow-hidden rounded-2xl mb-8"
          style={{ aspectRatio: "16 / 10", ...fadeUp(3) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      )}

      {/* ── 5. USP 나열 ── */}
      {props.points && props.points.length > 0 && (
        <ul className="space-y-6">
          {props.points.map((p, i) => (
            <li
              key={i}
              className="flex gap-3"
              style={fadeUp(4 + i)}
            >
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
    </article>
  );
}
