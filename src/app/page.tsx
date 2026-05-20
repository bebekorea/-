"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import ScrollHero from "@/components/sections/ScrollHero";
import AssetsMobile from "@/components/sections/AssetsMobile";
import TrustMobile from "@/components/sections/TrustMobile";
import HeroRecap from "@/components/sections/HeroRecap";
import CategorySection from "@/components/sections/CategorySection";
import CategoriesMobile from "@/components/sections/CategoriesMobile";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/sections/Footer";
import RegisterModal from "@/components/RegisterModal";
import MobileMenu from "@/components/MobileMenu";
import { DURATION, EASE, easeOut } from "@/lib/motion";

// Top-level vertical sections that need the WHITE/light header treatment
// because their dominant top-area backdrop is dark. #index back in too —
// header reads better as white over the cat&dog bg + previews on hover.
// Hero handled separately below (depends on stage).
// BEAUTY&SPA used to live on a dark photo backdrop (white header was right);
// it now renders inside the unified white-bg CategoryHoverPreview just like
// the other categories, so its hover preview wants the BLACK header too.
// `services` (모바일 캐러셀)는 어두운 사진 풀-블리드 카드를 노출하므로 dark
// 섹션 — 헤더 white text + back-to-top 흰 버튼이 자연스럽다.
const DARK_SECTIONS = new Set(["hero", "hero-recap", "index", "contact", "services"]);

const JUMP_DURATION = DURATION.jump;

function animateScrollTo(container: HTMLElement, targetY: number, duration: number = JUMP_DURATION) {
  const startY = container.scrollTop;
  const distance = targetY - startY;
  if (Math.abs(distance) < 1) return;
  const startTime = performance.now();
  const tick = (now: number) => {
    const t = Math.min((now - startTime) / duration, 1);
    container.scrollTop = startY + distance * easeOut(t);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Direct-children id-bearing sections only — the deck wraps panels that
// each have their own id (#adopt, #location, …) but those live INSIDE the
// horizontal track, not in the vertical scroll, so they shouldn't show up
// as snap-jump targets or active-section candidates.
// Also excludes responsive-hidden sections (display: none) — mobile-only
// sections like #assets render with `md:hidden`, so on desktop they have
// offsetTop=0 and would shift the currentIdx mapping in jump() by one.
// Filtering them out keeps the index in sync with what the user actually
// sees on each breakpoint.
function topLevelSections(container: HTMLElement): HTMLElement[] {
  return ([...container.children] as HTMLElement[]).filter((c) => {
    if (!(c instanceof HTMLElement) || !c.id) return false;
    if (typeof window !== "undefined") {
      const cs = window.getComputedStyle(c);
      if (cs.display === "none") return false;
    }
    return true;
  });
}

export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [heroStage, setHeroStage] = useState<0 | 1 | 2 | 3>(0);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastJumpRef = useRef(0);

  // Bumped on back-to-top so ScrollHero resets to stage 1 ("평생 함께할
  // 첫만남"). Only triggered by the explicit "맨 위로" button now —
  // wheeling up from #index back into hero should LAND on whatever stage
  // the user left, so the user can continue scrolling up through stages
  // 3 → 2 → 1 sequentially instead of being snapped back to stage 1.
  const [heroResetTick, setHeroResetTick] = useState(0);

  // 모바일 viewport 감지 — contact 섹션은 데스크탑(다크 포토 bg)과 모바일
  // (흰 bg) 사이에 헤더/back-to-top 테마가 반대로 가야 한다. services도
  // 같이 — 데스크탑 카테고리 풀 뷰포트 카드 위는 다크지만 모바일은 흰 헤더.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // 페이지 마운트 시 항상 scrollTop=0으로 강제 — 브라우저의 scroll
  // restoration이 이전 위치를 복원하면 ScrollHero/HeroRecap이 viewport
  // 밖에 있어 흰/검은 화면처럼 보이고, 영상도 autoplay 차단으로 일시
  // 멈춤 상태로 노출되는 문제를 차단한다. /privacy → 뒤로가기 시
  // 사용자가 항상 hero 첫 화면에서 시작.
  useEffect(() => {
    const c = containerRef.current;
    if (c) c.scrollTop = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track active section based on scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => {
      const sections = topLevelSections(container);
      const containerRect = container.getBoundingClientRect();
      const midpoint = containerRect.top + containerRect.height / 2;
      let closestId = "hero";
      let closestDist = Infinity;
      sections.forEach((s) => {
        const r = s.getBoundingClientRect();
        const sectionMid = (r.top + r.bottom) / 2;
        const dist = Math.abs(sectionMid - midpoint);
        if (dist < closestDist) {
          closestDist = dist;
          closestId = s.id;
        }
      });
      setActiveSection((prev) => (prev === closestId ? prev : closestId));
    };
    update();
    container.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      container.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Wheel/touch jump between sections (ScrollHero handles its own internal stages)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const jump = (dir: 1 | -1) => {
      const now = Date.now();
      if (now - lastJumpRef.current < JUMP_DURATION + 200) return;
      const sections = topLevelSections(container);
      const cTop = container.scrollTop;
      const maxTop = container.scrollHeight - container.clientHeight;
      // Special case: when the LAST section (Footer) is shorter than the
      // viewport (fp-section--auto), maxScroll never reaches its offsetTop.
      // Without this branch, the offsetTop loop below would identify the
      // CURRENT section as Footer's predecessor, so scrolling UP from the
      // bottom would skip Footer's predecessor and land two sections back.
      let currentIdx: number;
      if (cTop >= maxTop - 5) {
        currentIdx = sections.length - 1;
      } else {
        currentIdx = 0;
        for (let i = 0; i < sections.length; i++) {
          if (sections[i].offsetTop <= cTop + 5) currentIdx = i;
        }
      }
      const nextIdx = currentIdx + dir;
      if (nextIdx < 0 || nextIdx >= sections.length) return;
      lastJumpRef.current = now;
      animateScrollTo(container, sections[nextIdx].offsetTop, JUMP_DURATION);
    };

    // 모바일(< md, 767px 이하)에서는 jump-based 섹션 네비를 통째로 비활성.
    // Stage 3.5 모바일 개편 A안 — "카드 기반 세로 native 스크롤"의 전제로,
    // AssetsMobile처럼 fp-section--auto로 긴 콘텐츠를 가진 섹션을 사용자가
    // 자유롭게 스크롤할 수 있게 해야 한다. 데스크탑(>= 768px)에선 기존
    // 풀-뷰포트 점프 네비를 그대로 유지.
    const isMobileScroll = () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches;

    const onWheel = (e: WheelEvent) => {
      // ScrollHero / Location handlers run first and call preventDefault +
      // stopImmediatePropagation when intercepting a stage transition. So if
      // we get here, the user wants a section-level jump.
      if (Math.abs(e.deltaY) < 5) return;
      if (isMobileScroll()) return;
      e.preventDefault();
      jump(e.deltaY > 0 ? 1 : -1);
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (isMobileScroll()) return;
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isMobileScroll()) return;
      const dy = touchStartY - e.touches[0].clientY;
      if (Math.abs(dy) < 50) return;
      e.preventDefault();
      jump(dy > 0 ? 1 : -1);
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  const scrollTop = useCallback(() => {
    const c = containerRef.current;
    if (c) animateScrollTo(c, 0, JUMP_DURATION);
    setHeroResetTick((v) => v + 1);
  }, []);

  // Routing — 카테고리(adopt/location/partners/product/beauty)는 이제
  // 각자 풀-뷰포트 fp-section을 갖고 있어서 직접 점프한다. `#brand`만
  // ScrollHero 내부 stage 2 근처로 점프하기 위해 특수 처리. `#hero`는
  // 로고/베베펫 네비 클릭 시 처음 진입한 stage 1 상태로 복귀하도록
  // heroResetTick까지 같이 bump한다.
  const scrollToSection = useCallback((id: string) => {
    const c = containerRef.current;
    if (!c) return;
    if (id === "brand") {
      const hero = c.querySelector<HTMLElement>("#hero");
      if (hero) animateScrollTo(c, hero.offsetTop + hero.offsetHeight * 0.65, JUMP_DURATION);
      return;
    }
    if (id === "hero") {
      setHeroResetTick((v) => v + 1);
    }
    const el = c.querySelector<HTMLElement>(`#${id}`);
    if (el) animateScrollTo(c, el.offsetTop, JUMP_DURATION);
  }, []);

  // Header theme:
  //   hero            → stage 1 dark (vis.mp4 backdrop), other stages light
  //   index/beauty/contact → dark (photo bg with overlay)
  //   index w/ active preview → follow the previewed section's bg theme:
  //     ADOPT/HOSPITALITY/FOOD/PRODUCT → light bg → black header
  //     BEAUTY&SPA → dark photo → white header (DARK_SECTIONS)
  //   else            → light by default
  const headerTheme: "light" | "dark" = (() => {
    if (activeSection === "hero") {
      return heroStage === 1 ? "dark" : "light";
    }
    // 모바일에서 contact는 흰 bg (배경 사진 제거됨) → light 헤더.
    // 데스크탑에선 contact가 다크 포토 + overlay 그대로 → dark 헤더 유지.
    if (isMobile && activeSection === "contact") return "light";
    return DARK_SECTIONS.has(activeSection) ? "dark" : "light";
  })();

  return (
    <>
      <Header
        theme={headerTheme}
        onOpenRegister={() => setRegisterOpen(true)}
        onMenuToggle={() => setMenuOpen((v) => !v)}
        menuOpen={menuOpen}
        onAnchor={scrollToSection}
      />
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenRegister={() => setRegisterOpen(true)}
        onAnchor={scrollToSection}
      />

      <main ref={containerRef} className="fp-container">
        <ScrollHero
          isActive={activeSection === "hero"}
          onStageChange={setHeroStage}
          resetTick={heroResetTick}
        />
        {/* Sub-stage 3.5.2 — 모바일 전용 6대자산 세로 카드 섹션.
            컴포넌트 루트가 md:hidden 이라 데스크탑에는 영향 없음. */}
        <AssetsMobile />
        {/* Sub-stage 3.5.3 — 모바일 전용 TRUST + 조직도 세로 카드.
            데스크탑 stage 3 가로 컴포지션의 모바일 단순화 버전. md:hidden. */}
        <TrustMobile />
        <HeroRecap isActive={activeSection === "hero-recap"} />
        {/* 카테고리 단일 섹션 5종 — CategoryIndex 마퀴의 hover 프리뷰를
            그대로 떼어내 풀-뷰포트 섹션으로 펼친다. 사용자는 마퀴까지
            가지 않아도 스크롤만으로 각 카테고리 컴포지션을 차례로 본다.
            기존 마퀴는 이 5개 섹션 아래로 밀려 인덱스/네비 역할을 한다. */}
        <CategorySection
          categoryId="adopt"
          isActive={activeSection === "adopt"}
          onOpenRegister={() => setRegisterOpen(true)}
          onAnchor={scrollToSection}
        />
        <CategorySection
          categoryId="location"
          isActive={activeSection === "location"}
          onOpenRegister={() => setRegisterOpen(true)}
          onAnchor={scrollToSection}
        />
        <CategorySection
          categoryId="product"
          isActive={activeSection === "product"}
          onOpenRegister={() => setRegisterOpen(true)}
          onAnchor={scrollToSection}
        />
        <CategorySection
          categoryId="beauty"
          isActive={activeSection === "beauty"}
          onOpenRegister={() => setRegisterOpen(true)}
          onAnchor={scrollToSection}
        />
        {/* partners(사료/간식)를 마지막으로 이동 — 서비스 드롭다운에서 사료/
            간식이 마지막 항목인데 DOM 순서가 partners 3번째라 클릭 시 위로
            올라가는 어색한 애니메이션 발생. 드롭다운 시각 순서와 DOM 순서를
            일치시켜 클릭 → 자연스러운 아래 방향 스크롤. */}
        <CategorySection
          categoryId="partners"
          isActive={activeSection === "partners"}
          onOpenRegister={() => setRegisterOpen(true)}
          onAnchor={scrollToSection}
        />
        <CategorySection
          categoryId="global"
          isActive={activeSection === "global"}
          onOpenRegister={() => setRegisterOpen(true)}
          onAnchor={scrollToSection}
        />
        {/* 모바일 전용 6개 서비스 캐러셀 — 데스크탑은 위 CategorySection × 6,
            모바일은 이 한 섹션 안에서 옆으로 스와이프. md:hidden 자체 처리. */}
        <CategoriesMobile
          onOpenRegister={() => setRegisterOpen(true)}
          onAnchor={scrollToSection}
        />
        <Contact />
        <Footer />
      </main>

      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} />

      {/* Back-to-top — 섹션 톤에 맞춰 색 반전. 어두운 섹션(services 카드 오버레이,
          contact 다크 오버레이)에서는 흰 버튼 + 검정 화살표로, 밝은 섹션에서는
          기존 검정 버튼 + 흰 화살표로. 헤더 theme 로직과 동일한 DARK_SECTIONS 사용. */}
      <button
        type="button"
        onClick={scrollTop}
        aria-label="맨 위로"
        className="max-md:hidden fixed z-[60] md:bottom-[2vw] md:right-[2vw] md:w-[3vw] md:h-[3vw] rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg"
        style={(() => {
          // 모바일에서 contact는 흰 bg라 dark 톤이 아니므로 검정 버튼 + 흰
          // 화살표 (light 섹션 스타일). 데스크탑 contact는 다크 그대로.
          const treatAsDark =
            DARK_SECTIONS.has(activeSection) &&
            !(isMobile && activeSection === "contact");
          return {
            opacity: activeSection === "hero" ? 0 : 1,
            pointerEvents: (activeSection === "hero" ? "none" : "auto") as React.CSSProperties["pointerEvents"],
            backgroundColor: treatAsDark
              ? "rgba(255,255,255,0.92)"
              : "rgba(0,0,0,0.8)",
            color: treatAsDark ? "#000" : "#fff",
            transition: `opacity ${DURATION.fast}ms ${EASE}, background-color ${DURATION.fast}ms ${EASE}, color ${DURATION.fast}ms ${EASE}`,
          };
        })()}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M7 12V2M7 2L2 7M7 2L12 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </>
  );
}
