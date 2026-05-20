"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DURATION, EASE } from "@/lib/motion";
import { useLang } from "@/lib/i18n";
import { useAsset } from "@/lib/useAssets";

// Spring 대신 tween easeOutExpo로 — spring은 underdamped 설정이라 도착 후
// 살짝 튕기는(위아래 출렁) 잔진동이 발생했음. tween + easeOutExpo는 한 번에
// 부드럽게 settle하고 끝나서 드롭다운에 더 적합.
const NAV_SPRING = {
  type: "tween" as const,
  duration: 0.22,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

type Theme = "light" | "dark";

// Top-level nav order:
//   베베펫 / 서비스 (dropdown) / 글로벌 / 공지사항 / 방문예약등록
// REGISTER ('방문예약등록') is rendered separately as a button.
//
// Each item's fixed `width` is sized to the **Korean** label (with a small
// breathing margin). English labels — which are longer for most items —
// are allowed to overflow each box symmetrically (text-center +
// whitespace-nowrap), so KOR mode reads as the canonical layout and ENG
// mode just swaps text without reflowing the nav.
type NavItem = {
  key: string;
  href: string;
  width: string;
  type?: "dropdown";
};

const NAV_ITEMS: NavItem[] = [
  { key: "nav.brand", href: "#hero", width: "3.6vw" },
  // 서비스 width is bumped a touch to make room for the chevron icon
  // next to the label without crowding the adjacent items.
  { key: "nav.service", href: "#index", width: "4vw", type: "dropdown" },
  { key: "nav.global", href: "#global", width: "3.2vw" },
  { key: "nav.press", href: "/news", width: "4vw" },
];

// Service dropdown — 5 sub-items, each routed to the matching in-page anchor.
// Order is tuned for the 2/2/1 vertical layout: rows are [입양, 병원],
// [용품, 미용], [사료/간식] — the wider 사료/간식 label sits alone on the
// last row so it has room to breathe instead of forcing the panel wider.
const SERVICE_ITEMS: { key: string; href: string }[] = [
  { key: "nav.adopt", href: "#adopt" },
  { key: "nav.location", href: "#location" },
  { key: "nav.product", href: "#product" },
  { key: "nav.beauty", href: "#beauty" },
  { key: "nav.partners", href: "#partners" },
];

const REGISTER_NAV_WIDTH = "6.4vw";

// Total horizontal footprint of the Korean nav:
//   3.6 + 4.0 + 3.2 + 4 + 6.4 = 21.2vw + 4 gaps × 2.0833vw ≈ 29.5vw
// max 값을 함께 둬서 매우 좁은 데스크탑(1024px 이하)에서 nav가 좌우
// 로고/언어토글과 겹치지 않도록 한다 (32vw → 380px max).
const NAV_TOTAL_WIDTH_KO = "30vw";
const NAV_TOTAL_MAX_WIDTH = "560px";

interface HeaderProps {
  theme: Theme;
  onOpenRegister: () => void;
  onMenuToggle?: () => void;
  menuOpen?: boolean;
  onAnchor?: (id: string) => void;
}

const COLOR_TRANS = `color ${DURATION.fast}ms ${EASE}, opacity ${DURATION.fast}ms ${EASE}, background-color ${DURATION.fast}ms ${EASE}`;

export default function Header({ theme, onOpenRegister, onMenuToggle, menuOpen, onAnchor }: HeaderProps) {
  const isDark = theme === "dark";
  const fg = isDark ? "#fff" : "#000";
  const { lang, setLang, t } = useLang();
  // Notion Assets DB의 "logo" 키 URL이 있으면 이미지 로고를 사용,
  // 없으면 기본 BEBE PET wordmark 텍스트 노출.
  const logoUrl = useAsset("logo", "");

  const [serviceOpen, setServiceOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const openService = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setServiceOpen(true);
  };
  // Small grace delay so users can slide pointer from trigger → panel
  // without the menu collapsing mid-traverse. 220ms는 일반적인 마우스
  // 이동 속도(특히 트랙패드)에 여유 있는 값 — 너무 짧으면 깜빡임,
  // 너무 길면 의도치 않은 노출 유지.
  const closeService = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setServiceOpen(false), 220);
  };

  const isKo = lang === "ko";
  // Fluid sizing — clamp(min, vw, max). 좁은 데스크탑(1024-1280px)에서
  // 0.8021vw가 8-10px로 쪼그라드는 가독성 이슈를 막기 위한 px floor,
  // 큰 모니터에서 너무 커지지 않게 ceiling. 디자인 기준선(1440px)에서
  // vw 값이 그대로 발화된다.
  const navTextStyle: React.CSSProperties = {
    color: fg,
    fontSize: isKo ? "clamp(12px, 0.88vw, 15px)" : "clamp(11px, 0.66vw, 13px)",
    letterSpacing: isKo ? "0.18em" : "0.05em",
    fontWeight: isDark ? (isKo ? 400 : 500) : isKo ? 350 : 450,
    transition: COLOR_TRANS,
  };

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#") && onAnchor) {
      e.preventDefault();
      onAnchor(href.substring(1));
    }
  };

  return (
    <header className="fixed top-0 left-0 z-50 w-full pointer-events-none" data-theme={theme}>
      {/* 내부 컨테이너에 frosted-glass 배경을 직접 적용 — 콘텐츠 높이에
          항상 맞춰 backdrop이 형성되므로 viewport 크기가 바뀌어도 텍스트와
          backdrop이 균형 잡힌 비율을 유지한다 (이전엔 backdrop이 9vh 고정
          이라 작은 화면에서 텍스트보다 훨씬 큰 빈 띠가 보였음).
          pointer-events-none으로 빈 영역의 wheel 이벤트는 통과. */}
      <div
        className="relative flex items-center justify-between px-[5vw] py-[1.5625vw] pointer-events-none md:px-[5vw] md:py-[1.5625vw] max-md:px-5 max-md:py-4"
        style={{
          background: isDark ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.55)",
          backdropFilter: "blur(14px) saturate(140%)",
          WebkitBackdropFilter: "blur(14px) saturate(140%)",
          borderBottom: isDark
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid rgba(0,0,0,0.06)",
          transition: COLOR_TRANS,
        }}
      >
        <a
          href="#"
          onClick={(e) => handleAnchorClick(e, "#hero")}
          className="block shrink-0 leading-none select-none font-bold tracking-[0.18em] max-md:text-[15px] md:text-[clamp(14px,1.0417vw,18px)] pointer-events-auto"
          aria-label="BEBE PET"
          style={{
            color: fg,
            transition: COLOR_TRANS,
          }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="BEBE PET"
              className="max-md:h-[18px] md:h-[clamp(18px,1.3vw,24px)] w-auto"
              style={{
                filter: isDark ? "brightness(0) invert(1)" : undefined,
              }}
            />
          ) : (
            "BEBE PET"
          )}
        </a>

        <nav
          className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
          style={{
            width: isKo ? "auto" : NAV_TOTAL_WIDTH_KO,
            maxWidth: NAV_TOTAL_MAX_WIDTH,
          }}
        >
          <ul
            className={`flex items-center ${isKo ? "gap-[2.0833vw]" : "justify-between"}`}
          >
            {NAV_ITEMS.map((item) => {
              const isDropdown = item.type === "dropdown";
              return (
                <li
                  key={item.key}
                  className="relative flex justify-center overflow-visible shrink-0"
                  style={{ width: isKo ? item.width : "auto" }}
                  onMouseEnter={isDropdown ? openService : undefined}
                  onMouseLeave={isDropdown ? closeService : undefined}
                >
                  <a
                    href={item.href}
                    onClick={(e) => item.href.startsWith("#") && handleAnchorClick(e, item.href)}
                    className="inline-flex items-center justify-center gap-[0.3vw] whitespace-nowrap font-medium hover:opacity-70"
                    style={navTextStyle}
                    aria-haspopup={isDropdown ? "true" : undefined}
                    aria-expanded={isDropdown ? serviceOpen : undefined}
                  >
                    <span>{t(item.key)}</span>
                    {isDropdown && (
                      <svg
                        viewBox="0 0 8 5"
                        aria-hidden="true"
                        style={{
                          width: "0.55em",
                          height: "0.36em",
                          flexShrink: 0,
                          transform: serviceOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: `transform 220ms cubic-bezier(0.16,1,0.3,1)`,
                          opacity: 0.75,
                        }}
                      >
                        <path
                          d="M1 1 L4 4 L7 1"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </a>

                  {isDropdown && (
                    <div
                      className="absolute left-1/2 top-full pt-[1vw]"
                      style={{
                        transform: "translateX(-50%)",
                        pointerEvents: serviceOpen ? "auto" : "none",
                      }}
                      onMouseEnter={openService}
                      onMouseLeave={closeService}
                    >
                      {/* Aceternity Navbar Menu의 spring 트랜지션 + layoutId 패턴.
                          기존 가로 알약 → 세로 카드 패널로 교체해서 더 풍성한
                          mega-menu 느낌. AnimatePresence로 mount/unmount도
                          부드럽게. */}
                      <AnimatePresence>
                        {serviceOpen && (
                          <motion.div
                            // 순수 fade — scale/y 모션 제거. scale은 내부 항목이
                            // 같이 확장돼 "움직이는" 느낌, y는 spring 잔진동
                            // 원인이었음. 깔끔하게 opacity만으로 등장/사라짐.
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={NAV_SPRING}
                            style={{
                              transformOrigin: "top center",
                              background: "rgba(255,255,255,0.92)",
                              backdropFilter: "blur(20px) saturate(160%)",
                              WebkitBackdropFilter: "blur(20px) saturate(160%)",
                              border: "1px solid rgba(0,0,0,0.06)",
                              borderRadius: "0.875rem",
                              padding: "0.35vw 0.45vw",
                              boxShadow:
                                "0 24px 48px -18px rgba(0,0,0,0.16), 0 6px 16px -6px rgba(0,0,0,0.08)",
                            }}
                          >
                            <ul className="flex flex-row items-center gap-[0.1vw]">
                              {SERVICE_ITEMS.map((s) => (
                                <li key={s.key}>
                                  <a
                                    href={s.href}
                                    onClick={(e) => {
                                      if (s.href.startsWith("#"))
                                        handleAnchorClick(e, s.href);
                                      setServiceOpen(false);
                                    }}
                                    className="block whitespace-nowrap"
                                    style={{
                                      // 상단 navTextStyle과 동일 — fontSize,
                                      // letterSpacing, fontWeight 모두 매칭.
                                      // dropdown은 흰 패널 위에 있으므로
                                      // light-theme 굵기(350/450)를 사용.
                                      fontSize: isKo ? "clamp(12px, 0.88vw, 15px)" : "clamp(11px, 0.66vw, 13px)",
                                      letterSpacing: isKo ? "0.18em" : "0.05em",
                                      fontWeight: isKo ? 350 : 450,
                                      color: "#0a0a0a",
                                      padding: "0.55vw 1.1vw",
                                      borderRadius: "0.625rem",
                                      transition: `background-color 200ms ${EASE}, color 200ms ${EASE}`,
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor =
                                        "rgba(0,0,0,0.05)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor =
                                        "transparent";
                                    }}
                                  >
                                    {t(s.key)}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </li>
              );
            })}
            <li
              className="flex justify-center overflow-visible shrink-0"
              style={{ width: isKo ? REGISTER_NAV_WIDTH : "auto" }}
            >
              <button
                type="button"
                onClick={onOpenRegister}
                className="block text-center whitespace-nowrap font-medium hover:opacity-70"
                style={navTextStyle}
              >
                {t("nav.register")}
              </button>
            </li>
          </ul>
        </nav>

        <div
          className="hidden md:flex items-center gap-[0.4vw] text-[clamp(11px,0.7292vw,13px)] tracking-[0.12em] font-medium select-none pointer-events-auto"
          style={{ color: fg, transition: COLOR_TRANS }}
          aria-label="Language toggle"
        >
          <button
            type="button"
            onClick={() => setLang("ko")}
            className="hover:opacity-100 cursor-pointer"
            style={{ opacity: lang === "ko" ? 1 : 0.45, transition: `opacity ${DURATION.fast}ms ${EASE}` }}
            aria-pressed={lang === "ko"}
          >
            KOR
          </button>
          <span style={{ opacity: 0.4 }}>|</span>
          <button
            type="button"
            onClick={() => setLang("en")}
            className="hover:opacity-100 cursor-pointer"
            style={{ opacity: lang === "en" ? 1 : 0.45, transition: `opacity ${DURATION.fast}ms ${EASE}` }}
            aria-pressed={lang === "en"}
          >
            ENG
          </button>
        </div>

        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="메뉴"
          className="md:hidden flex flex-col gap-1.5 w-11 h-11 items-center justify-center pointer-events-auto"
        >
          <span
            className={`block w-7 h-[1.5px] ${menuOpen ? "translate-y-[7px] rotate-45" : ""}`}
            style={{
              backgroundColor: menuOpen ? "#000" : fg,
              transition: `background-color ${DURATION.fast}ms ${EASE}, transform ${DURATION.fast}ms ${EASE}`,
            }}
          />
          <span
            className={`block w-7 h-[1.5px] ${menuOpen ? "opacity-0" : ""}`}
            style={{
              backgroundColor: menuOpen ? "#000" : fg,
              transition: `background-color ${DURATION.fast}ms ${EASE}, opacity ${DURATION.fast}ms ${EASE}`,
            }}
          />
          <span
            className={`block w-7 h-[1.5px] ${menuOpen ? "-translate-y-[7px] -rotate-45" : ""}`}
            style={{
              backgroundColor: menuOpen ? "#000" : fg,
              transition: `background-color ${DURATION.fast}ms ${EASE}, transform ${DURATION.fast}ms ${EASE}`,
            }}
          />
        </button>
      </div>
    </header>
  );
}
