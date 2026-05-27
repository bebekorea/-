"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { useInView } from "@/lib/useInView";
import { useAsset } from "@/lib/useAssets";
import { DURATION, EASE } from "@/lib/motion";
import LocationMap from "./LocationMap";

type ContactTab = "hq" | "logistics";

export default function Contact() {
  const { t, ta } = useLang();
  const { ref, inView } = useInView<HTMLElement>(0.3);
  // Notion Assets "contact_bg" URL — 데스크탑 배경 사진 교체용.
  const contactBgUrl = useAsset("contact_bg", "/images/contact-bg-new.png");
  // Sub-stage 3.5.6 — 모바일 전용 탭 상태. 데스크탑은 지도 2개를 위아래로
  // 동시에 보여주므로 이 상태를 사용하지 않는다.
  const [activeTab, setActiveTab] = useState<ContactTab>("hq");

  return (
    <section
      ref={ref}
      id="contact"
      className="bg-cover bg-center"
      style={{ backgroundImage: `url(${contactBgUrl})` }}
    >
      {/* 데스크탑(>= md) — 기존 풀-뷰포트 좌우 split. 마크업/스타일 변경 없음. */}
      <div className="hidden md:block fp-section relative">
        <div className="absolute inset-0 bg-black/60" />

        {/* Layout mirrors CategoryHoverPreview's full-bleed 50/50 flex
            (visual half + copy half with px-[6vw] internal padding +
            md:max-w-[28vw] inner column). Placing the right-side copy in
            this same scaffolding lands its X position exactly on top of
            where the ADOPT / HOSPITALITY / etc. preview copies sit, so
            scrolling between sections keeps the eye on a stable column. */}
        <div className="relative h-full w-full flex items-stretch text-white z-10">
          {/* Left half — 위아래로 두 개의 카카오 지도 (천안 본사 + 세종
              물류센터). 좌측 패딩은 위 섹션 그리드와 맞춰 6vw 유지하고
              우측은 2vw로 줄여 지도 자체를 더 넓게(최대 42vw) 노출. */}
          {/* md:pt-[9vh] — 헤더 영역(9vh)만큼 위쪽 여백을 두고 items-center로
              나머지 91vh 안에서 위아래 균형 잡힘. */}
          <div className="w-1/2 flex items-center justify-start pl-[6vw] pr-[2vw] pt-[9vh]">
            <div
              className="w-full max-w-[42vw] flex flex-col gap-[1vw]"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0) scale(1)" : "translateY(24px) scale(0.985)",
                transition: `opacity ${DURATION.base}ms ${EASE}, transform ${DURATION.base}ms ${EASE}`,
                willChange: "opacity, transform",
              }}
              aria-label={t("contact.map.alt")}
            >
              {/* 천안 본사 */}
              <div className="relative h-[40vh] overflow-hidden rounded-md ring-1 ring-white/15">
                <LocationMap mx="530693" my="926031" label="베베펫 천안 본사" />
              </div>
              {/* 세종 물류센터 */}
              <div className="relative h-[40vh] overflow-hidden rounded-md ring-1 ring-white/15">
                <LocationMap mx="563246" my="813461" label="베베펫 세종 물류센터" />
              </div>
            </div>
          </div>

          {/* Right half — copy column. Same flex/justify/padding/max-width
              tokens as CategoryHoverPreview's copy half. */}
          <div className="w-1/2 flex items-center justify-center px-[6vw]">
            <div className="w-full max-w-[28vw] space-y-[2vw]">
              {/* Big English title — Jost font, matches Partners (PRODUCTS) style */}
              <h2
                className="text-[clamp(30px,2.5vw,44px)] tracking-[0.02em] font-light"
                style={{ fontFamily: "var(--font-jost)" }}
              >
                {t("contact.title.eng")}
              </h2>

              {/* Lead copy lines */}
              <div className="text-white/85 text-[clamp(12px,0.8333vw,15px)] tracking-[-0.04em] leading-[2em]">
                {ta("contact.lead").map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>

              <dl className="space-y-[1vw] text-[clamp(12px,0.8333vw,15px)]">
                <div>
                  <dt className="text-white/60 mb-1">{t("contact.label.hq")}</dt>
                  <dd className="text-white">{t("contact.value.hq")}</dd>
                </div>
                <div>
                  <dt className="text-white/60 mb-1">{t("contact.label.logistics")}</dt>
                  <dd className="text-white">{t("contact.value.logistics")}</dd>
                </div>
                <div>
                  <dt className="text-white/60 mb-1">{t("contact.label.period")}</dt>
                  <dd className="text-white">{t("contact.value.period")}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 — VISIT 헤더(4섹션 공통 2계층) + 탭 + 지도 + dl.
          배경 사진 + 다크 overlay 제거 → 흰 bg로 다른 모바일 섹션과 동일한 톤. */}
      <div className="md:hidden relative pt-20 pb-10 min-h-[100dvh] bg-white">
        <div
          className="relative z-10 px-5 text-black"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(20px)",
            transition: `opacity ${DURATION.base}ms ${EASE}, transform ${DURATION.base}ms ${EASE}`,
            willChange: "opacity, transform",
          }}
        >
          {/* Toss 스타일 헤더 — 라벨 "방문" (브랜드 그린) + 큰 검정 헤드라인. */}
          <header className="mb-10">
            <p className="text-[0.875rem] tracking-[-0.02em] font-semibold text-[#3aa676] mb-3">
              방문
            </p>
            <h2
              className="text-[1.875rem] leading-[1.3] tracking-[-0.02em] font-bold text-black"
              style={{ textWrap: "balance" }}
            >
              {ta("contact.lead").map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </h2>
          </header>

          {/* 탭 — 본사 / 물류센터. 미니멀 underline 스타일.
              role=tab/tablist + aria-selected로 접근성 처리. */}
          <div className="flex gap-6 mb-4" role="tablist" aria-label={t("contact.map.alt")}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "hq"}
              onClick={() => setActiveTab("hq")}
              className={
                "pb-2 text-[0.875rem] tracking-[-0.02em] border-b transition-colors " +
                (activeTab === "hq"
                  ? "text-black border-black"
                  : "text-black/45 border-transparent hover:text-black/70")
              }
            >
              {t("contact.label.hq")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "logistics"}
              onClick={() => setActiveTab("logistics")}
              className={
                "pb-2 text-[0.875rem] tracking-[-0.02em] border-b transition-colors " +
                (activeTab === "logistics"
                  ? "text-black border-black"
                  : "text-black/45 border-transparent hover:text-black/70")
              }
            >
              {t("contact.label.logistics")}
            </button>
          </div>

          {/* 지도 — active 탭에 따라 한 개만 렌더. LocationMap이 카카오 정적
              임베드라 active 탭 전환 시 컴포넌트가 unmount/remount되며 새
              지도를 로드. */}
          <div className="relative h-[260px] overflow-hidden rounded-md ring-1 ring-black/10 mb-10">
            {activeTab === "hq" ? (
              <LocationMap mx="530693" my="926031" label="베베펫 천안 본사" />
            ) : (
              <LocationMap mx="563246" my="813461" label="베베펫 세종 물류센터" />
            )}
          </div>

          {/* 큰 영문 "VISIT" 타이틀과 lead copy(작은 줄)는 모두 위 헤더로
              격상/이동되었다. 여기서는 dl만 남아 주소·운영시간을 보여준다. */}

          {/* 주소 / 운영시간 dl */}
          <dl className="space-y-4 text-[0.8125rem] leading-[1.5]">
            <div>
              <dt className="text-black/55 mb-1">{t("contact.label.hq")}</dt>
              <dd className="text-black">{t("contact.value.hq")}</dd>
            </div>
            <div>
              <dt className="text-black/55 mb-1">{t("contact.label.logistics")}</dt>
              <dd className="text-black">{t("contact.value.logistics")}</dd>
            </div>
            <div>
              <dt className="text-black/55 mb-1">{t("contact.label.period")}</dt>
              <dd className="text-black">{t("contact.value.period")}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
