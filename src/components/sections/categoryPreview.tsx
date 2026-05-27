"use client";

import { useEffect, useState } from "react";
import { type Lang } from "@/lib/i18n";

/**
 * categoryPreview — 카테고리 풀-뷰포트 섹션이 공유하는 데이터 + UI
 * 모듈. 이전 CategoryIndex.tsx에서 마퀴 컴포넌트를 제거한 뒤, 5개 카테고리
 * 섹션 (CategorySection 래퍼)이 사용하는 부분만 추려 분리한 파일.
 */

type VisualSide = "left" | "right";

type CategoryVisualSpec =
  | { type: "photo"; src: string }
  | { type: "cards"; cards: Array<{ labelKey: string; photo: string }> };

type CategoryVisual =
  | { type: "photo"; src: string }
  | { type: "cards"; cards: Array<{ photo: string; label: string }> };

type CategoryCtaSpec =
  | { kind: "link"; href: string; textKey: string }
  | { kind: "register"; textKey: string }
  | { kind: "anchor"; to: string; textKey: string };

type CategoryCta =
  | { kind: "link"; href: string; text: string }
  | { kind: "register"; text: string }
  | { kind: "anchor"; to: string; text: string };

const PARTNER_LOGOS = [
  "/images/partner-name1.png",
  "/images/partner-name2.png",
  "/images/partner-name3.png",
  "/images/partner-name4.png",
  "/images/partner-name5.png",
  "/images/partner-name6.png",
  "/images/partner-name7.png",
  "/images/partner-name8.png",
];

// PRODUCT cards — 운영자에게 받은 단일 사진이 없어 6개 카드 모두 product 메인
// 사진을 공유. 추후 개별 사진 받으면 각 labelKey 옆 photo 경로만 교체.
const PRODUCT_CARDS: Array<{ labelKey: string; photo: string }> = [
  { labelKey: "product.card.care", photo: "/images/category-product.jpg" },
  { labelKey: "product.card.apparel", photo: "/images/category-product.jpg" },
  { labelKey: "product.card.travel", photo: "/images/category-product.jpg" },
  { labelKey: "product.card.hygiene", photo: "/images/category-product.jpg" },
  { labelKey: "product.card.toys", photo: "/images/category-product.jpg" },
  { labelKey: "product.card.bedding", photo: "/images/category-product.jpg" },
];

// ADOPT — 3종 분양 사진 (대형견, 소형견, 고양이) 실제 자산 입고.
const ADOPT_SPECIES: Array<{ labelKey: string; photo: string }> = [
  { labelKey: "adopt.species.large", photo: "/images/category-adopt-large.jpg" },
  { labelKey: "adopt.species.small", photo: "/images/category-adopt-small.jpg" },
  { labelKey: "adopt.species.cat", photo: "/images/category-adopt-cat.jpg" },
];

export type CategoryDetail = {
  visualSide: VisualSide;
  visual: CategoryVisualSpec;
  label: string;
  captionKey: string;
  bodyKey: string;
  cta?: CategoryCtaSpec;
  logoFlow?: string[];
  pointsByLang?: Record<Lang, Array<{ label: string; body: string }>>;
};

export const CATEGORY_DETAILS: Record<string, CategoryDetail> = {
  adopt: {
    visualSide: "left",
    visual: { type: "cards", cards: ADOPT_SPECIES },
    label: "ADOPT",
    captionKey: "index.caption.adopt",
    bodyKey: "index.body.adopt",
    cta: {
      kind: "link",
      href: "https://www.instagram.com/bebep_et/",
      textKey: "adopt.cta.instagram",
    },
    pointsByLang: {
      ko: [
        { label: "수의사 전담 관리", body: "자체 동물병원 수의사가 입양 전 건강검진을 직접 진행합니다" },
        { label: "투명한 건강 정보", body: "검진 결과와 예방접종 기록을 빠짐없이 투명하게 공개합니다" },
        { label: "생애주기 의료 지원", body: "입양 후에도 평생 동안 전문 의료 서비스를 책임지고 제공합니다" },
      ],
      en: [
        { label: "Dedicated vet care", body: "Our in-house vet runs a full pre-adoption health check on every animal" },
        { label: "Transparent health records", body: "We share full checkup and vaccination history with every adopter" },
        { label: "Lifelong medical support", body: "Professional veterinary care continues for life after adoption" },
      ],
    },
  },
  location: {
    visualSide: "right",
    visual: {
      type: "photo",
      src: "/images/category-location.jpg",
    },
    label: "HOSPITALITY",
    captionKey: "index.caption.location",
    bodyKey: "index.body.location",
    pointsByLang: {
      ko: [
        { label: "의료팀 구성 공개", body: "진료·간호·원무팀이 각자 역할을 명확히 분담하여 운영합니다" },
        { label: "위생·소독 원칙", body: "쾌적한 환경을 위해 매일 정해진 시간에 매장 전체를 소독합니다" },
        { label: "예방접종·전문 수술 라인업", body: "예방접종부터 전문 수술까지 전 의료 서비스를 갖추고 있습니다" },
      ],
      en: [
        { label: "Open medical team", body: "Clinical, nursing, and front-desk teams operate in clear divisions" },
        { label: "Hygiene & sanitation", body: "The entire store is sanitized at scheduled times every single day" },
        { label: "Vaccines & specialized surgery", body: "From vaccinations to advanced surgery, the full medical lineup is in place" },
      ],
    },
  },
  partners: {
    visualSide: "left",
    visual: {
      type: "photo",
      src: "/images/category-partners.jpg",
    },
    label: "FOOD",
    captionKey: "index.caption.partners",
    bodyKey: "index.body.partners",
    logoFlow: PARTNER_LOGOS,
    pointsByLang: {
      ko: [
        { label: "전문가 소싱", body: "수의사가 성분을 분석한 해외 프리미엄 브랜드를 직접 들여옵니다" },
        { label: "독점적 가치", body: "국내에서 구하기 힘든 고품질 처방식을 독점적으로 공급합니다" },
        { label: "신선도와 안정성", body: "중간 유통을 생략하고 안전한 통관 절차로 신선하게 전달합니다" },
      ],
      en: [
        { label: "Expert sourcing", body: "We import premium overseas brands vetted by our in-house veterinarian" },
        { label: "Exclusive access", body: "Rare prescription diets are supplied exclusively to BEBE PET customers" },
        { label: "Freshness & safety", body: "Skipping middle distributors keeps food fresh through the safest route" },
      ],
    },
  },
  product: {
    visualSide: "left",
    visual: { type: "cards", cards: PRODUCT_CARDS },
    label: "PRODUCT",
    captionKey: "index.caption.product",
    bodyKey: "index.body.product",
    pointsByLang: {
      ko: [
        { label: "카테고리별 직수입 라벨", body: "케어부터 잠자리까지 6개 전 카테고리를 직접 수입해 갖춥니다" },
        { label: "수의사 추천 마크", body: "모든 카테고리 용품을 수의사가 직접 확인하고 추천합니다" },
        { label: "통관 및 검역 안전성", body: "까다로운 통관과 검역을 모두 통과한 안전한 용품만 엄선합니다" },
      ],
      en: [
        { label: "Directly imported, by category", body: "We import all six categories directly, from care to bedding" },
        { label: "Vet-approved mark", body: "Every item in every category is personally vetted by our veterinarian" },
        { label: "Customs & quarantine safety", body: "Only goods cleared by strict customs and quarantine procedures are stocked" },
      ],
    },
  },
  beauty: {
    visualSide: "right",
    visual: {
      type: "photo",
      src: "/images/category-beauty.jpg",
    },
    label: "BEAUTY & SPA",
    captionKey: "index.caption.beauty",
    bodyKey: "index.body.beauty",
    // 예약하기 CTA 제거 — 사용자 요청. 액션은 contact 섹션의 통합 채널로.
    pointsByLang: {
      ko: [
        { label: "전문 디자이너 케어", body: "견종·묘종 특성을 이해한 미용사가 스트레스 없는 케어를 제공합니다" },
        { label: "의료·미용 협업", body: "미용 중 이상 발견 시 즉시 자체 의료진과 공유하여 대응합니다" },
      ],
      en: [
        { label: "Specialist designer care", body: "Groomers trained per breed deliver low-stress grooming sessions" },
        { label: "Medical · grooming bridge", body: "Anything spotted during grooming reaches our in-house vets at once" },
      ],
    },
  },
  global: {
    visualSide: "right",
    visual: {
      type: "photo",
      src: "/images/category-global.jpg",
    },
    label: "GLOBAL",
    captionKey: "global.caption",
    bodyKey: "global.body",
    // 파트너십 문의 CTA 제거 — 사용자 요청. 액션은 contact 섹션의 통합 채널로.
  },
};

// Staccato entrance ("탁탁탁") — short duration with progressive delays.
const ENTER_DUR_MS = 520;
const STEP_DELAY_MS = 110;
const ENTER_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export function resolveCategoryPreviewProps(
  d: CategoryDetail,
  t: (key: string) => string,
  lang: Lang,
) {
  const cta: CategoryCta | undefined = d.cta
    ? d.cta.kind === "link"
      ? { kind: "link", href: d.cta.href, text: t(d.cta.textKey) }
      : d.cta.kind === "register"
        ? { kind: "register", text: t(d.cta.textKey) }
        : { kind: "anchor", to: d.cta.to, text: t(d.cta.textKey) }
    : undefined;
  const visual: CategoryVisual =
    d.visual.type === "cards"
      ? {
          type: "cards",
          cards: d.visual.cards.map((c) => ({
            photo: c.photo,
            label: t(c.labelKey),
          })),
        }
      : d.visual;
  return {
    visualSide: d.visualSide,
    visual,
    label: d.label,
    caption: t(d.captionKey),
    body: t(d.bodyKey),
    cta,
    logoFlow: d.logoFlow,
    points: d.pointsByLang?.[lang],
  };
}

/**
 * CategoryMobileCard — 모바일 전용 카테고리 카드 (Sub-stage 3.5.5).
 *
 * 데스크탑 CategoryHoverPreview는 풀-뷰포트(100dvh) 좌우 split이지만,
 * 모바일에선 한 화면에 모든 정보가 안 들어가서 정보가 잘린다. 대신 자유
 * 높이의 세로 카드 1장으로 (이미지 → 라벨 → 캡션 → 본문 → [로고플로우]
 * → 불릿 → CTA) 모든 정보를 펼친다.
 *
 * `resolveCategoryPreviewProps` 가 만든 동일한 props를 받아 처리하므로
 * 데이터 소스는 CATEGORY_DETAILS 단일 진실원천을 유지한다. CategorySection
 * 안에서 `md:hidden` 자식으로 렌더되며 데스크탑에는 영향이 없다.
 */
export function CategoryMobileCard({
  visual,
  label,
  caption,
  body,
  cta,
  logoFlow,
  points,
  onOpenRegister,
  onAnchor,
}: {
  visualSide?: VisualSide; // 데스크탑 좌우 결정용 — 모바일에선 사용하지 않음
  visual: CategoryVisual;
  label: string;
  caption: string;
  body: string;
  cta?: CategoryCta;
  logoFlow?: string[];
  points?: Array<{ label: string; body: string }>;
  onOpenRegister: () => void;
  onAnchor?: (id: string) => void;
}) {
  // 히어로 이미지 URL 결정 — photo는 visual.src, cards는 첫 카드 이미지를
  // 카테고리 대표로 사용. cards 그리드는 카드 안 칩 리스트로 라벨만 보존.
  const heroImage =
    visual.type === "photo"
      ? visual.src
      : visual.cards[0]?.photo ?? "";

  return (
    // 모바일 카드 = 풀-블리드 사진 배경 + 텍스트 오버레이.
    // 카테고리 별 사진을 큰 시각 임팩트로 노출, 모든 글자는 다크 그라데이션
    // 위 흰 글씨. 사진과 텍스트가 한 평면에 통합되어 카드가 한 장의 포스터
    // 처럼 읽힌다. 카드 간 시각 구분은 사진 자체의 분위기 차이로.
    // h-full — CategoriesMobile에서 rounded wrapper가 swiper-slide 높이를
    // 채울 수 있도록 height 체인 유지.
    <div
      className="relative bg-cover bg-center overflow-hidden h-full"
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      {/* 다크 그라데이션 오버레이 — 카드 전체 글자 가독성 보장.
          상단 0.5 → 하단 0.8로 본문/불릿이 모인 하단부를 더 어둡게. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.65) 55%, rgba(0,0,0,0.82) 100%)",
        }}
      />

      {/* 콘텐츠 (z-10으로 오버레이 위) — pt-12로 상단 사진 여유, pb-8로
          dots와의 간격을 타이트하게. */}
      <div className="relative z-10 px-5 pt-12 pb-8 text-white">
        {/* ─ 라벨 (eyebrow) ─ */}
        <p className="text-[0.6875rem] tracking-[0.3em] uppercase font-medium text-white/85 mb-3">
          {label}
        </p>

        {/* ─ 캡션 (큰 타이틀) — Toss 스타일 일관성: font-bold + tracking 좁힘. */}
        <h3 className="text-[1.625rem] leading-[1.25] tracking-[-0.02em] font-bold mb-5 text-white">
          {caption}
        </h3>

        {/* ─ 본문 — lead 카피. text-wrap: pretty로 줄바꿈 시 orphan(끝줄에
            짧은 단어 한 개) 방지 → 자연스러운 균형 줄바꿈. ─ */}
        <p
          className="text-[0.9375rem] tracking-[-0.01em] leading-[1.7] text-white/85 mb-7"
          style={{ textWrap: "pretty" }}
        >
          {body}
        </p>

        {/* ─ 로고 플로우 (partners 카테고리에만) ─
            어두운 배경에선 brightness(0) invert(1)로 흰 실루엣 변환. */}
        {logoFlow && (
          <div className="overflow-hidden mb-7 py-2 -mx-5">
            <div
              className="flex items-center animate-marquee-left will-change-transform"
              style={{ width: "max-content", animationDuration: "26s" }}
            >
              {[...logoFlow, ...logoFlow].map((src, i) => (
                <div
                  key={i}
                  className="shrink-0 px-5 flex items-center justify-center h-7"
                >
                  <img
                    src={src}
                    alt=""
                    aria-hidden="true"
                    className="max-h-full w-auto object-contain opacity-90"
                    style={{ filter: "brightness(0) invert(1)" }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─ 불릿 포인트들. CTA 버튼이 제거됐으므로 mb-0(자연 끝). ─ */}
        {points && points.length > 0 && (
          <ul className="space-y-5">
            {points.map((p, i) => (
              <li key={i} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-[0.55rem] inline-block flex-shrink-0 w-[5px] h-[5px]"
                  style={{ backgroundColor: "#3aa676" }}
                />
                <div className="flex-1">
                  <p className="text-[0.9375rem] leading-[1.45] tracking-[-0.01em] font-semibold text-white mb-1.5">
                    {p.label}
                  </p>
                  <p className="text-[0.8125rem] leading-[1.7] tracking-[-0.01em] text-white/75">
                    {p.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* CTA 버튼(인스타그램·예약·문의) 모바일에서 제거 — 사용자 요청.
            카드는 이제 이미지 + 텍스트 정보만 노출하고 액션은 contact
            섹션의 통합 채널로 유도. */}
      </div>
    </div>
  );
}

export function CategoryHoverPreview({
  visualSide,
  visual,
  label,
  caption,
  body,
  cta,
  logoFlow,
  points,
  isActive,
  onOpenRegister,
  onAnchor,
}: {
  visualSide: VisualSide;
  visual: CategoryVisual;
  label: string;
  caption: string;
  body: string;
  cta?: CategoryCta;
  logoFlow?: string[];
  points?: Array<{ label: string; body: string }>;
  isActive?: boolean;
  onOpenRegister: () => void;
  onAnchor?: (id: string) => void;
}) {
  // 진입 애니메이션 — 이전엔 mount 시점에 한 번만 실행됐는데, 데스크탑에서
  // 모든 CategorySection이 동시에 마운트되므로 사용자가 스크롤로 섹션에
  // 도달할 때 이미 애니메이션이 끝나 있어 "정적" 으로 보였다. isActive
  // (activeSection === 해당 카테고리)에 연결해 매번 진입 시 재발동되도록.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (isActive) {
      // 진입 시 다음 프레임에 entered=true → CSS transition 발동
      const r1 = requestAnimationFrame(() => {
        const r2 = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(r2);
      });
      return () => cancelAnimationFrame(r1);
    } else {
      // 섹션 벗어나면 다음 진입 때 다시 애니메이션 발동되도록 리셋
      setEntered(false);
    }
  }, [isActive]);

  const visualTravel = visualSide === "left" ? -32 : 32;
  const visualStyle: React.CSSProperties = {
    opacity: entered ? 1 : 0,
    transform: entered
      ? "translate3d(0,0,0) scale(1)"
      : `translate3d(${visualTravel}px,0,0) scale(0.985)`,
    transition: `opacity ${ENTER_DUR_MS}ms ${ENTER_EASE}, transform ${ENTER_DUR_MS}ms ${ENTER_EASE}`,
    willChange: "opacity, transform",
  };

  const step = (n: number): React.CSSProperties => ({
    opacity: entered ? 1 : 0,
    transform: entered ? "translate3d(0,0,0)" : "translate3d(0,18px,0)",
    transition: `opacity ${ENTER_DUR_MS}ms ${ENTER_EASE} ${n * STEP_DELAY_MS}ms, transform ${ENTER_DUR_MS}ms ${ENTER_EASE} ${n * STEP_DELAY_MS}ms`,
    willChange: "opacity, transform",
  });

  return (
    <div
      className="absolute inset-0 bg-white flex max-md:flex-col"
      style={{
        flexDirection: visualSide === "left" ? "row" : "row-reverse",
      }}
    >
      <div
        className="md:w-1/2 md:h-full max-md:w-full max-md:h-[40vh] relative overflow-hidden"
        style={visualStyle}
      >
        {visual.type === "photo" && (
          <div
            className="absolute inset-x-0 bottom-0 bg-cover bg-center"
            style={{
              top: "10vh",
              backgroundImage: `url(${visual.src})`,
            }}
            aria-hidden="true"
          />
        )}
        {visual.type === "cards" && (
          <div
            className={`absolute inset-x-0 bottom-0 grid gap-[0.4vw] p-[0.4vw] ${
              visual.cards.length === 3
                ? "grid-cols-1 grid-rows-3"
                : "grid-cols-3 auto-rows-fr"
            }`}
            style={{ top: "10vh" }}
          >
            {visual.cards.map((c, i) => (
              <div
                key={i}
                className="relative overflow-hidden bg-cover bg-center"
                style={{
                  backgroundImage: `url(${c.photo})`,
                  opacity: entered ? 1 : 0,
                  transform: entered ? "scale(1)" : "scale(0.94)",
                  transition: `opacity ${ENTER_DUR_MS}ms ${ENTER_EASE} ${i * 60}ms, transform ${ENTER_DUR_MS}ms ${ENTER_EASE} ${i * 60}ms`,
                }}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent pointer-events-none"
                />
                <span
                  className="absolute left-2 md:left-[0.6vw] top-2 md:top-[0.6vw] text-white text-[0.75rem] md:text-[clamp(12px,0.875vw,15px)] tracking-[0.02em] font-light"
                  style={{ fontFamily: "var(--font-serif-kr)" }}
                >
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="md:w-1/2 flex items-start justify-center max-md:py-10 pt-20 md:pt-[24vh] px-5 md:px-[6vw]">
        <div className="md:w-[28vw] md:max-w-[28vw] md:shrink-0">
          <p
            className="text-[0.6875rem] md:text-[clamp(11px,0.7292vw,13px)] tracking-[0.3em] uppercase font-medium text-black/75 mb-4 md:mb-[1.5vw]"
            style={{ fontFamily: "var(--font-jost)", ...step(1) }}
          >
            {label}
          </p>
          <h2
            className="text-[1.875rem] md:text-[clamp(30px,2.5vw,44px)] tracking-[-0.01em] font-light leading-[1.2] mb-4 md:mb-[1.4vw] text-black"
            style={{ fontFamily: "var(--font-jost)", ...step(2) }}
          >
            {caption}
          </h2>
          <p
            className="text-[0.875rem] md:text-[clamp(13px,0.9375vw,16px)] tracking-[-0.04em] leading-[1.9] text-black/80 mb-6 md:mb-[1.8vw] whitespace-pre-line"
            style={step(3)}
          >
            {body}
          </p>
          {logoFlow && (
            <div className="overflow-hidden mb-6 md:mb-[1.8vw] py-2 md:py-[0.6vw]" style={step(5)}>
              <div
                className="flex items-center animate-marquee-left will-change-transform"
                style={{
                  width: "max-content",
                  animationDuration: "26s",
                }}
              >
                {[...logoFlow, ...logoFlow].map((src, i) => (
                  <div
                    key={i}
                    className="shrink-0 px-[1.6vw] flex items-center justify-center"
                    style={{ height: "1.8vw" }}
                  >
                    <img
                      src={src}
                      alt=""
                      aria-hidden="true"
                      className="max-h-full w-auto object-contain opacity-70"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {cta?.kind === "link" && (
            <a
              href={cta.href}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-instagram-hover inline-flex items-center gap-2 md:gap-[0.6vw] px-5 py-2.5 md:px-[1.6vw] md:py-[0.7vw] rounded-full text-[0.8125rem] md:text-[clamp(11px,0.7813vw,14px)] tracking-[-0.02em] text-black mb-8 md:mb-[2.5vw]"
              style={step(5)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
              </svg>
              {cta.text}
            </a>
          )}
          {cta?.kind === "register" && (
            <button
              type="button"
              onClick={onOpenRegister}
              className="btn-green-hover inline-flex items-center gap-2 md:gap-[0.6vw] px-5 py-2.5 md:px-[1.6vw] md:py-[0.7vw] rounded-full text-[0.8125rem] md:text-[clamp(11px,0.7813vw,14px)] tracking-[-0.02em] text-black mb-8 md:mb-[2.5vw]"
              style={step(5)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M3 10h18" />
                <path d="M8 2v4" />
                <path d="M16 2v4" />
              </svg>
              {cta.text}
            </button>
          )}
          {cta?.kind === "anchor" && (
            <button
              type="button"
              onClick={() => onAnchor?.(cta.to)}
              className="btn-green-hover inline-flex items-center gap-2 md:gap-[0.6vw] px-5 py-2.5 md:px-[1.6vw] md:py-[0.7vw] rounded-full text-[0.8125rem] md:text-[clamp(11px,0.7813vw,14px)] tracking-[-0.02em] text-black mb-8 md:mb-[2.5vw]"
              style={step(5)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
                <path d="M3 6l9 7 9-7" />
              </svg>
              {cta.text}
            </button>
          )}
          {points && points.length > 0 && (
            <ul
              className="space-y-3 md:space-y-[0.85vw] mt-10 md:mt-[3vw]"
              style={step(6)}
            >
              {points.map((p, i) => (
                <li key={i} className="flex gap-3 md:gap-[0.7vw]">
                  <span
                    aria-hidden="true"
                    style={{
                      display: "inline-block",
                      flexShrink: 0,
                      width: "0.32vw",
                      height: "0.32vw",
                      marginTop: "0.55vw",
                      backgroundColor: "#3aa676",
                    }}
                  />
                  <div className="flex-1">
                    <span className="block text-[0.85rem] md:text-[clamp(12px,0.85vw,15px)] tracking-[-0.01em] font-semibold leading-[1.45] text-black">
                      {p.label}
                    </span>
                    <span className="block text-[0.75rem] md:text-[clamp(11px,0.73vw,13px)] tracking-[-0.01em] leading-[1.6] text-black/75 mt-0.5 md:mt-[0.15vw]">
                      {p.body}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
