"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import MobileMenu from "@/components/MobileMenu";
import RegisterModal from "@/components/RegisterModal";
import Footer from "@/components/sections/Footer";
import { useLang } from "@/lib/i18n";
import { EASE } from "@/lib/motion";

export interface Article {
  id: string | number;
  date: string; // YYYY.MM.DD
  title: string;
  source: string;
  href?: string;
}

/**
 * 이중 언어 fallback 기사들 — Notion CMS가 미설정/실패 시 사용.
 * Notion에 실제 데이터가 채워지면 이 fallback은 무시되고 Notion 데이터가
 * 노출된다. 사용자 언어 토글(KOR/ENG)에 따라 한/영 둘 다 깔끔하게 전환.
 */
interface BilingualArticle {
  id: string;
  date: string;
  ko: { title: string; source: string };
  en: { title: string; source: string };
}

const FALLBACK_BILINGUAL: BilingualArticle[] = [
  {
    id: "fallback-1",
    date: "2026.04.10",
    ko: {
      title: "베베펫, 천안 두정동에 반려동물 토탈 케어 플래그십 오픈",
      source: "한국경제",
    },
    en: {
      title: "BEBE PET opens its total pet-care flagship in Dujeong-dong, Cheonan",
      source: "The Korea Economic Daily",
    },
  },
  {
    id: "fallback-2",
    date: "2026.04.05",
    ko: {
      title: "반려동물 인구 1,500만 시대...프리미엄 펫 케어 시장 급성장",
      source: "매일경제",
    },
    en: {
      title: "Pet population tops 15M in Korea — premium pet-care market accelerates",
      source: "Maeil Business Newspaper",
    },
  },
  {
    id: "fallback-3",
    date: "2026.03.28",
    ko: {
      title: "베베펫, 입양·진료·미용 원스톱 시스템으로 차별화",
      source: "조선일보",
    },
    en: {
      title: "BEBE PET differentiates with a one-stop adopt · vet · grooming system",
      source: "The Chosun Ilbo",
    },
  },
  {
    id: "fallback-4",
    date: "2026.03.20",
    ko: {
      title: "\"가족이 된 반려동물\"...베베펫의 책임 입양 철학",
      source: "동아일보",
    },
    en: {
      title: "\"Pets that become family\" — the responsible-adoption ethos at BEBE PET",
      source: "Donga Ilbo",
    },
  },
  {
    id: "fallback-5",
    date: "2026.03.12",
    ko: {
      title: "베베펫, 24시간 응급 진료 시스템 도입",
      source: "헤럴드경제",
    },
    en: {
      title: "BEBE PET launches a 24/7 emergency veterinary response system",
      source: "Herald Economy",
    },
  },
  {
    id: "fallback-6",
    date: "2026.03.04",
    ko: {
      title: "프리미엄 펫푸드 시장 동향...베베펫 자체 큐레이션 강화",
      source: "이데일리",
    },
    en: {
      title: "Premium pet-food trends — BEBE PET sharpens its in-house curation",
      source: "EDaily",
    },
  },
];

const PAGE_SIZE = 6;

/**
 * NewsClient — 검색 + 페이지네이션 UI.
 *
 *   - articles 길이 > 0이면: Notion에서 받아온 단일 언어 기사 사용
 *   - 비어 있으면: 내장 이중언어 fallback을 lang에 맞춰 노출 (KO/EN 토글)
 */
export default function NewsClient({ articles }: { articles: Article[] }) {
  const { t, lang } = useLang();

  // Notion이 비었거나 미설정이면 — 내장 fallback을 현재 언어로 변환.
  const resolved: Article[] =
    articles.length > 0
      ? articles
      : FALLBACK_BILINGUAL.map((b) => ({
          id: b.id,
          date: b.date,
          title: b[lang].title,
          source: b[lang].source,
        }));
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // 페이지 진입 fade-up 애니메이션. 마운트 시 다음 프레임에 entered=true.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const r1 = requestAnimationFrame(() => {
      const r2 = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(r2);
    });
    return () => cancelAnimationFrame(r1);
  }, []);

  // idx별 stagger fade-up — Toss/홈 섹션과 동일 톤(700ms easeOutExpo, 90ms stagger).
  const fadeUp = (idx: number): React.CSSProperties => ({
    opacity: entered ? 1 : 0,
    transform: entered ? "translate3d(0,0,0)" : "translate3d(0,18px,0)",
    transition: `opacity 700ms ${EASE} ${idx * 90}ms, transform 700ms ${EASE} ${idx * 90}ms`,
    willChange: "opacity, transform",
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return resolved;
    return resolved.filter((a) =>
      [a.title, a.source, a.date].some((field) =>
        field.toLowerCase().includes(q)
      )
    );
  }, [query, resolved]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const handleAnchor = (id: string) => {
    router.push(`/#${id}`);
  };

  return (
    <>
      <Header
        theme="light"
        onOpenRegister={() => setRegisterOpen(true)}
        onMenuToggle={() => setMenuOpen((v) => !v)}
        menuOpen={menuOpen}
        onAnchor={handleAnchor}
      />
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenRegister={() => setRegisterOpen(true)}
      />

      <main className="min-h-screen bg-white pt-[18vh] md:pt-[11vw] pb-10 md:pb-[4vw]">
        <div className="px-5 md:px-[5vw]">
          <div className="flex items-end justify-between mb-5 md:mb-[1.8vw]" style={fadeUp(0)}>
            <h1 className="text-[1.75rem] md:text-[clamp(24px,2vw,32px)] tracking-[-0.01em] leading-[1] text-black font-semibold">
              {t("news.title")}
            </h1>
          </div>

          <div className="flex justify-end mb-5 md:mb-[1.5vw]" style={fadeUp(1)}>
            {/* 검색바 폭을 리스트의 date + source 두 컬럼 합쳐진 너비
                (6vw + 10vw + gap)에 맞춰 우측 끝 정렬 유지. 모바일도
                같은 비율로 짧게 — 약 180px(72+96+gap). */}
            <label className="flex items-center gap-2 md:gap-[0.5vw] border-b border-black/30 pb-1 md:pb-[0.3vw] w-[180px] md:w-[17.6vw] focus-within:border-black">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={t("news.search.placeholder")}
                className="flex-1 outline-none bg-transparent text-[0.8125rem] md:text-[clamp(11px,0.75vw,13px)] tracking-[-0.03em] text-black placeholder:text-black/35"
              />
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-black/55"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </label>
          </div>

          <ul className="border-t border-black/15">
            {pageItems.length === 0 ? (
              <li
                className="py-12 text-center text-black/45 text-[0.8125rem] md:text-[clamp(11px,0.75vw,13px)]"
                style={fadeUp(2)}
              >
                {t("news.empty")}
              </li>
            ) : (
              pageItems.map((a, i) => (
                <li
                  key={a.id}
                  // 3컬럼 grid: title(가변) | date(고정) | source(고정).
                  // source/date의 폭을 px/vw로 고정해 KOR↔ENG 전환 시 긴 영문
                  // source(예: "The Korea Economic Daily")가 들어와도 컬럼
                  // 자리가 흔들리지 않도록. source 넘치는 텍스트는 ellipsis.
                  className="border-b border-black/10 py-4 md:py-[1.1vw] grid grid-cols-[1fr_72px_96px] md:grid-cols-[1fr_6vw_10vw] gap-3 md:gap-[1.6vw] items-center"
                  style={fadeUp(2 + i)}
                >
                  <a
                    href={a.href ?? "#"}
                    target={a.href ? "_blank" : undefined}
                    rel={a.href ? "noopener noreferrer" : undefined}
                    className="text-[0.8125rem] md:text-[clamp(12px,0.8125vw,14px)] tracking-[-0.04em] text-black hover:text-black/60 leading-[1.5] truncate"
                  >
                    {a.title}
                  </a>
                  <time
                    dateTime={a.date.replaceAll(".", "-")}
                    className="text-[0.6875rem] md:text-[clamp(10px,0.65vw,12px)] tracking-[0.04em] text-black/55 tabular-nums whitespace-nowrap text-right"
                  >
                    {a.date}
                  </time>
                  <span
                    className="text-[0.6875rem] md:text-[clamp(10px,0.65vw,12px)] tracking-[-0.03em] text-black/45 text-right overflow-hidden text-ellipsis whitespace-nowrap"
                    title={a.source}
                  >
                    {a.source}
                  </span>
                </li>
              ))
            )}
          </ul>

          {/* 페이지네이션 — 1페이지뿐이어도 노출 (총 페이지 인디케이터 역할).
              Notion에 글이 누적되면 2,3페이지 등이 추가 노출됨. */}
          <nav
            className="mt-10 md:mt-[2.4vw] flex justify-center items-center gap-1 md:gap-[0.4vw]"
            style={fadeUp(2 + pageItems.length)}
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className="w-9 h-9 md:w-[2vw] md:h-[2vw] text-[0.8125rem] md:text-[clamp(11px,0.75vw,13px)] tracking-[0.05em] flex items-center justify-center"
                style={{
                  color: n === safePage ? "#000" : "rgba(0,0,0,0.45)",
                  fontWeight: n === safePage ? 600 : 400,
                  borderBottom:
                    n === safePage ? "1px solid #000" : "1px solid transparent",
                }}
                aria-current={n === safePage ? "page" : undefined}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="w-9 h-9 md:w-[2vw] md:h-[2vw] text-[0.8125rem] md:text-[clamp(11px,0.75vw,13px)] text-black/55 disabled:text-black/20 flex items-center justify-center"
              aria-label="Next page"
            >
              »
            </button>
          </nav>
        </div>
      </main>

      <Footer />

      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
    </>
  );
}
