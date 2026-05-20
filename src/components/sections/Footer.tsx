"use client";

import { useLang } from "@/lib/i18n";
import { useAsset } from "@/lib/useAssets";

const INSTAGRAM_URL = "https://www.instagram.com/bebep_et/";

/**
 * Footer — compact editorial layout.
 *   - Brand wordmark + tagline on the left
 *   - Instagram icon + back-to-top in a single cluster at top-right
 *   - All contact info collapsed into ONE inline middot-separated
 *     paragraph (address · phone · email · hours)
 *   - Legal strip (compliance line + copyright + privacy) at the bottom,
 *     separated by the only horizontal rule in the footer
 *
 * Vertical rhythm trimmed (py-10 instead of py-14, smaller wordmark,
 * tighter mb between blocks) so the whole footer reads at a glance
 * without scrolling.
 */
export default function Footer() {
  const { t } = useLang();
  // Notion Assets "logo" URL — 있으면 이미지, 없으면 wordmark.
  const logoUrl = useAsset("logo", "");
  return (
    <footer
      id="footer"
      className="fp-section--auto bg-white py-10 md:py-[2.6vw] px-5 md:px-[5vw] relative"
    >
      {/* ── Legal strip — sole horizontal rule. 모든 콘텐츠가 이 가로선
          아래에 위치. 라인 위는 비워둬 contact 섹션과의 여백만 강조.
          폰트 정리: BEBE PET wordmark만 Jost(브랜드), 모든 본문/라벨/값은
          Pretendard로 통일. tagline의 serif KR도 제거. */}
      <div className="pt-6 md:pt-[1.4vw] border-t border-black/10">
        {/* Brand block — wordmark(좌) + 개인정보처리방침 + Instagram(우).
            PC에서 개인정보처리방침 옆에 Instagram 아이콘. 모바일에선 Instagram을
            기존 위치(copyright row)에 유지 — md:hidden / hidden md:flex 분기. */}
        <div className="mb-7 md:mb-[1.6vw]">
          <div className="flex items-baseline justify-between mb-2 md:mb-[0.6vw]">
            <div
              className="leading-none select-none font-bold tracking-[0.18em] text-black max-md:text-[1.25rem] md:text-[clamp(18px,1.4vw,24px)]"
              aria-label="BEBE PET"
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="BEBE PET"
                  className="max-md:h-[24px] md:h-[clamp(20px,1.6vw,28px)] w-auto"
                />
              ) : (
                "BEBE PET"
              )}
            </div>
            <div className="flex items-center gap-3 md:gap-[1vw]">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram @bebep_et"
                className="hidden md:inline-flex text-black/75 hover:text-black transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
                </svg>
              </a>
              <a
                href="/privacy"
                className="text-[0.75rem] md:text-[clamp(11px,0.7292vw,13px)] text-black font-semibold hover:opacity-70 transition-opacity tracking-[-0.02em]"
              >
                {t("footer.privacy")}
              </a>
            </div>
          </div>
          <p className="text-[0.8125rem] md:text-[clamp(12px,0.8333vw,15px)] tracking-[-0.02em] text-black/70 max-w-[560px] leading-[1.5]">
            {t("footer.tagline")}
          </p>
        </div>

        {/* Contact info — 라벨/값 모두 Pretendard 동일 폰트 + 동일 사이즈.
            라벨은 black/50로 톤만 낮춰서 위계 표현. grid 2열 정렬 유지. */}
        <dl className="mb-6 md:mb-[1.6vw] grid grid-cols-[auto_1fr] gap-x-5 md:gap-x-[1.6vw] gap-y-2 md:gap-y-[0.6vw] text-[0.8125rem] md:text-[clamp(12px,0.8333vw,15px)] tracking-[-0.02em] leading-[1.5]">
          <dt className="text-black/50">주소</dt>
          <dd className="text-black/85">
            {t("footer.company.address")}
          </dd>

          <dt className="text-black/50">대표전화</dt>
          <dd>
            <a
              href={`tel:${t("footer.company.phone").replace(/[^0-9+]/g, "")}`}
              className="text-black/85 hover:text-black"
            >
              {t("footer.company.phone")}
            </a>
          </dd>

          <dt className="text-black/50">이메일</dt>
          <dd>
            <a
              href={`mailto:${t("footer.company.email")}`}
              className="text-black/85 hover:text-black"
            >
              {t("footer.company.email")}
            </a>
          </dd>
        </dl>

        {/* copyright (LEFT) + Instagram icon (RIGHT, 모바일에서만).
            PC에서는 Instagram이 상단(개인정보처리방침 옆)으로 이동되어
            여기선 copyright만 표시. */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0 text-[0.6875rem] md:text-[clamp(11px,0.7292vw,13px)] tracking-[-0.01em]">
          <span className="text-black/55">
            © 2026 BEBE PET KOREA. ALL RIGHTS RESERVED.
          </span>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram @bebep_et"
            className="md:hidden text-black/75 hover:text-black transition-colors"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
