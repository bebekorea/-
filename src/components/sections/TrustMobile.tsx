"use client";

import { useLang } from "@/lib/i18n";
import { useInView } from "@/lib/useInView";
import { useAsset } from "@/lib/useAssets";
import { EASE } from "@/lib/motion";

/**
 * TrustMobile — 모바일 전용 TRUST + 조직도 섹션 (Sub-stage 3.5.3)
 *
 * 데스크탑 ScrollHero stage 3은 풀와이드 brand.mp4 위에 좌측 TRUST 카피 +
 * 조직도 placeholder를 가로 컴포지션으로 얹는다. 모바일은 호버/영상 위
 * 텍스트 가독성을 살릴 컴포지션 자체가 의미 없으므로, 흰 배경 위에 라벨/
 * 태그라인/조직도 placeholder를 세로로 단순 카드화한다.
 *
 * - 루트가 `md:hidden` 이라 데스크탑(>= 768px)에선 DOM 렌더되지 않음
 * - fp-section--auto 자유 높이 — 조직도 placeholder는 데스크탑과 동일한
 *   대시 박스 + 5개 부서 노드 + 1줄 disclaimer 카피를 유지 (3.5.3 스펙)
 * - OrgNode는 모바일 사이즈(rem)로 인라인 정의 — ScrollHero의 vw 기반
 *   데스크탑 OrgNode와 sizing이 완전히 달라 별도 추출하지 않음
 */
export default function TrustMobile() {
  const { t, ta } = useLang();
  const { ref, inView } = useInView<HTMLElement>(0.2);
  // Notion Assets "org_chart" URL — 있으면 placeholder 대신 이미지 노출.
  const orgChartUrl = useAsset("org_chart", "");

  const fadeUp = (idx: number): React.CSSProperties => ({
    opacity: inView ? 1 : 0,
    transform: inView ? "translate3d(0,0,0)" : "translate3d(0,24px,0)",
    transition: `opacity 700ms ${EASE} ${idx * 90}ms, transform 700ms ${EASE} ${idx * 90}ms`,
    willChange: "opacity, transform",
  });

  return (
    <section
      ref={ref}
      id="trust"
      className="md:hidden bg-white text-black pt-20 pb-10 px-6"
    >
      {/* Toss 스타일 헤더 — 라벨 "신뢰" + 큰 헤드라인(2줄 tagline). */}
      <header className="mb-10">
        <p
          className="text-[0.875rem] tracking-[-0.02em] font-semibold text-[#3aa676] mb-3"
          style={fadeUp(0)}
        >
          신뢰
        </p>
        <h2
          className="text-[1.875rem] leading-[1.3] tracking-[-0.02em] font-bold text-black"
          style={{ textWrap: "balance", ...fadeUp(1) }}
        >
          {ta("stage3.tagline").map((line, i) => (
            <span key={i} className="block">{line}</span>
          ))}
        </h2>
      </header>

      {/* 조직도 — fadeUp(2)로 헤더 다음 타이밍. Notion에 org_chart 이미지 URL이
          있으면 <img />, 없으면 placeholder 노드들. */}
      <div style={fadeUp(2)}>
        <p className="text-[0.6875rem] tracking-[0.2em] uppercase text-black/65 font-medium mb-3">
          {t("stage3.orgChart.title")}
        </p>
        {orgChartUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={orgChartUrl}
            alt={t("stage3.orgChart.title")}
            className="w-full h-auto"
          />
        ) : (
          <div
            className="relative w-full"
            style={{
              border: "1px dashed rgba(0,0,0,0.28)",
              borderRadius: "2px",
              background: "rgba(0,0,0,0.025)",
              padding: "1.25rem 1rem",
            }}
            aria-label={t("stage3.orgChart.placeholder")}
          >
            <div className="h-full flex flex-col items-center justify-center gap-2.5">
              <MobileOrgNode label="대표이사" emphasis />
              <div
                aria-hidden="true"
                style={{
                  width: "1px",
                  height: "12px",
                  background: "rgba(0,0,0,0.35)",
                }}
              />
              {/* 모바일 폭이 좁아 5개 부서 노드는 2열 그리드로 자동 줄바꿈 */}
              <div className="grid grid-cols-3 gap-1.5 w-full max-w-[260px]">
                <MobileOrgNode label="의료" />
                <MobileOrgNode label="미용" />
                <MobileOrgNode label="글로벌" />
                <MobileOrgNode label="시스템" />
                <MobileOrgNode label="마케팅" />
              </div>
              <p className="mt-4 text-[0.6875rem] tracking-[-0.01em] text-black/55 text-center">
                {t("stage3.orgChart.placeholder")}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// 모바일 사이즈 OrgNode placeholder. rem 단위로 viewport 폭과 독립.
// 데스크탑(ScrollHero 내부 OrgNode)과 시각 톤은 일치하지만 sizing 단위가
// 달라 별도 정의. emphasis=true (대표이사)는 약간 더 두꺼운 보더/배경.
function MobileOrgNode({
  label,
  emphasis = false,
}: {
  label: string;
  emphasis?: boolean;
}) {
  const stroke = emphasis ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.3)";
  const bg = emphasis ? "rgba(0,0,0,0.04)" : "transparent";
  return (
    <div
      className="flex items-center justify-center"
      style={{
        minWidth: emphasis ? "5rem" : undefined,
        padding: emphasis ? "0.5rem 0.9rem" : "0.4rem 0.5rem",
        border: `1px solid ${stroke}`,
        borderRadius: "2px",
        background: bg,
      }}
    >
      <span
        className="whitespace-nowrap"
        style={{
          fontSize: emphasis ? "0.8125rem" : "0.75rem",
          letterSpacing: "-0.01em",
          fontWeight: emphasis ? 600 : 500,
          color: "#000",
        }}
      >
        {label}
      </span>
    </div>
  );
}
