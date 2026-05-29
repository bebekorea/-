"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import MobileMenu from "@/components/MobileMenu";
import RegisterModal from "@/components/RegisterModal";
import Footer from "@/components/sections/Footer";
import { useLang } from "@/lib/i18n";
import { EASE } from "@/lib/motion";
import type { NewsArticle, ArticleBlock, RichText } from "@/lib/notion";

/** rich_text 조각들을 서식(굵게/기울임/링크 등) 적용해 렌더. */
function renderRich(rich: RichText[]): ReactNode {
  if (rich.length === 0) return " "; // 빈 단락은 줄 간격 유지용 nbsp
  return rich.map((r, i) => {
    const style: React.CSSProperties = {};
    if (r.bold) style.fontWeight = 600;
    if (r.italic) style.fontStyle = "italic";
    const deco = [
      r.underline ? "underline" : "",
      r.strikethrough ? "line-through" : "",
    ]
      .filter(Boolean)
      .join(" ");

    if (r.code) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded bg-black/[0.06] text-[0.9em] font-mono text-black/80"
        >
          {r.text}
        </code>
      );
    }
    if (r.href) {
      return (
        <a
          key={i}
          href={r.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline underline-offset-2 hover:text-black ${deco}`}
          style={style}
        >
          {r.text}
        </a>
      );
    }
    return (
      <span key={i} className={deco} style={style}>
        {r.text}
      </span>
    );
  });
}

/**
 * 블록 배열을 렌더. 연속된 목록 아이템(불릿/번호)은 <ul>/<ol>로 묶는다.
 */
function renderBlocks(blocks: ArticleBlock[]): ReactNode {
  const out: ReactNode[] = [];
  let i = 0;

  const para = "text-[0.9375rem] md:text-[clamp(14px,0.95vw,16px)] leading-[1.85] tracking-[-0.01em] text-black/80";

  while (i < blocks.length) {
    const b = blocks[i];

    // 연속 불릿 목록 묶기
    if (b.type === "bulleted_list_item") {
      const items: ArticleBlock[] = [];
      while (i < blocks.length && blocks[i].type === "bulleted_list_item") {
        items.push(blocks[i]);
        i++;
      }
      out.push(
        <ul
          key={`ul-${i}`}
          className={`list-disc pl-5 my-4 space-y-1.5 ${para}`}
        >
          {items.map((it, k) => (
            <li key={k}>{renderRich((it as { rich: RichText[] }).rich)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // 연속 번호 목록 묶기
    if (b.type === "numbered_list_item") {
      const items: ArticleBlock[] = [];
      while (i < blocks.length && blocks[i].type === "numbered_list_item") {
        items.push(blocks[i]);
        i++;
      }
      out.push(
        <ol
          key={`ol-${i}`}
          className={`list-decimal pl-5 my-4 space-y-1.5 ${para}`}
        >
          {items.map((it, k) => (
            <li key={k}>{renderRich((it as { rich: RichText[] }).rich)}</li>
          ))}
        </ol>
      );
      continue;
    }

    switch (b.type) {
      case "paragraph":
        out.push(
          <p key={i} className={`${para} my-4`}>
            {renderRich(b.rich)}
          </p>
        );
        break;
      case "heading_1":
        out.push(
          <h2
            key={i}
            className="text-[1.375rem] md:text-[clamp(20px,1.5vw,26px)] font-semibold tracking-[-0.02em] text-black mt-10 mb-3 leading-[1.3]"
          >
            {renderRich(b.rich)}
          </h2>
        );
        break;
      case "heading_2":
        out.push(
          <h3
            key={i}
            className="text-[1.1875rem] md:text-[clamp(18px,1.25vw,22px)] font-semibold tracking-[-0.02em] text-black mt-8 mb-2.5 leading-[1.35]"
          >
            {renderRich(b.rich)}
          </h3>
        );
        break;
      case "heading_3":
        out.push(
          <h4
            key={i}
            className="text-[1.0625rem] md:text-[clamp(16px,1.05vw,19px)] font-semibold tracking-[-0.01em] text-black mt-6 mb-2 leading-[1.4]"
          >
            {renderRich(b.rich)}
          </h4>
        );
        break;
      case "quote":
        out.push(
          <blockquote
            key={i}
            className={`border-l-2 border-black/25 pl-4 my-5 italic text-black/70 ${para}`}
          >
            {renderRich(b.rich)}
          </blockquote>
        );
        break;
      case "callout":
        out.push(
          <div
            key={i}
            className={`rounded-lg bg-black/[0.04] px-4 py-3 my-5 ${para}`}
          >
            {renderRich(b.rich)}
          </div>
        );
        break;
      case "code":
        out.push(
          <pre
            key={i}
            className="my-5 overflow-x-auto rounded-lg bg-black/[0.92] px-4 py-3 text-[0.8125rem] leading-[1.6] text-white/90"
          >
            <code className="font-mono">{b.rich.map((r) => r.text).join("")}</code>
          </pre>
        );
        break;
      case "divider":
        out.push(<hr key={i} className="my-8 border-black/10" />);
        break;
      case "image":
        out.push(
          <figure key={i} className="my-6">
            {/* 운영자가 Notion에 올린 이미지. 외부 URL이라 next/image 대신 img 사용. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={b.url}
              alt={b.caption || "공지 이미지"}
              className="w-full rounded-lg"
            />
            {b.caption && (
              <figcaption className="mt-2 text-center text-[0.75rem] text-black/45">
                {b.caption}
              </figcaption>
            )}
          </figure>
        );
        break;
    }
    i++;
  }

  return out;
}

export default function NewsDetailClient({
  article,
  blocks,
}: {
  article: NewsArticle;
  blocks: ArticleBlock[];
}) {
  const { t } = useLang();
  const router = useRouter();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const r1 = requestAnimationFrame(() => {
      const r2 = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(r2);
    });
    return () => cancelAnimationFrame(r1);
  }, []);

  const fadeUp = (idx: number): React.CSSProperties => ({
    opacity: entered ? 1 : 0,
    transform: entered ? "translate3d(0,0,0)" : "translate3d(0,18px,0)",
    transition: `opacity 700ms ${EASE} ${idx * 90}ms, transform 700ms ${EASE} ${idx * 90}ms`,
    willChange: "opacity, transform",
  });

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

      <main className="min-h-screen bg-white pt-[18vh] md:pt-[11vw] pb-16 md:pb-[5vw]">
        <article className="px-5 md:px-[5vw] max-w-[760px] mx-auto">
          {/* 목록으로 돌아가기 */}
          <Link
            href="/news"
            className="inline-flex items-center gap-1 text-[0.75rem] md:text-[clamp(11px,0.7vw,13px)] tracking-[0.02em] text-black/45 hover:text-black mb-6 md:mb-[1.6vw]"
            style={fadeUp(0)}
          >
            <span aria-hidden>←</span> {t("news.back")}
          </Link>

          {/* 제목 */}
          <h1
            className="text-[1.5rem] md:text-[clamp(22px,2vw,34px)] font-semibold tracking-[-0.02em] leading-[1.3] text-black"
            style={fadeUp(1)}
          >
            {article.title}
          </h1>

          {/* 메타: 날짜 · 출처 · (원문 링크) */}
          <div
            className="mt-3 md:mt-[0.8vw] flex items-center gap-3 text-[0.75rem] md:text-[clamp(11px,0.7vw,13px)] text-black/45"
            style={fadeUp(2)}
          >
            <time dateTime={article.date.replaceAll(".", "-")} className="tabular-nums">
              {article.date}
            </time>
            {article.source && (
              <>
                <span className="text-black/20">·</span>
                <span>{article.source}</span>
              </>
            )}
            {article.href && (
              <>
                <span className="text-black/20">·</span>
                <a
                  href={article.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-black"
                >
                  {t("news.source.link")}
                </a>
              </>
            )}
          </div>

          {/* 본문 */}
          <div
            className="mt-7 md:mt-[2vw] pt-7 md:pt-[2vw] border-t border-black/10"
            style={fadeUp(3)}
          >
            {blocks.length > 0 ? (
              renderBlocks(blocks)
            ) : (
              <p className="text-[0.875rem] text-black/40 py-8 text-center">
                {/* 본문 미작성 시 — Notion 페이지를 열어 내용을 추가하세요 */}
                &nbsp;
              </p>
            )}
          </div>
        </article>
      </main>

      <Footer />

      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
    </>
  );
}
