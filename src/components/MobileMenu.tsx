"use client";

import { useLang } from "@/lib/i18n";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  onOpenRegister: () => void;
  onAnchor?: (id: string) => void;
}

const TOP_NAV: { key: string; href: string }[] = [
  { key: "nav.brand", href: "#hero" },
];

const SERVICE_ITEMS: { key: string; href: string }[] = [
  { key: "nav.adopt", href: "#adopt" },
  { key: "nav.location", href: "#location" },
  { key: "nav.product", href: "#product" },
  { key: "nav.beauty", href: "#beauty" },
  { key: "nav.partners", href: "#partners" },
];

const BOTTOM_NAV: { key: string; href: string }[] = [
  { key: "nav.global", href: "#global" },
  { key: "nav.press", href: "/news" },
];

export default function MobileMenu({ open, onClose, onOpenRegister, onAnchor }: MobileMenuProps) {
  const { lang, setLang, t } = useLang();
  if (!open) return null;
  const handleAnchor = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#") && onAnchor) {
      e.preventDefault();
      onAnchor(href.substring(1));
    }
    onClose();
  };
  return (
    <div className="fixed inset-0 z-40 bg-white md:hidden flex flex-col pt-20 px-7 overflow-y-auto">
      {/* 모든 탭 타겟에 min-h-[44px] + inline-flex items-center로 WCAG
          모바일 터치 권장(44×44px) 충족. text 사이즈는 유지. */}
      {TOP_NAV.map((item) => (
        <a
          key={item.key}
          href={item.href}
          onClick={(e) => handleAnchor(e, item.href)}
          className="min-h-[44px] flex items-center text-[1rem] tracking-[0.18em] text-black font-medium"
        >
          {t(item.key)}
        </a>
      ))}

      {/* 서비스 — header + indented sub-items. chevron-down으로 하위 항목이
          있음을 시각적으로 명시. */}
      <div className="min-h-[44px] flex items-center gap-2 text-[1rem] tracking-[0.18em] text-black font-medium">
        <span>{t("nav.service")}</span>
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          aria-hidden="true"
          className="opacity-60"
        >
          <path
            d="M1 1 L5 5 L9 1"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex flex-col pl-4">
        {SERVICE_ITEMS.map((item) => (
          <a
            key={item.key}
            href={item.href}
            onClick={(e) => handleAnchor(e, item.href)}
            className="min-h-[44px] flex items-center text-[0.9375rem] tracking-[0.18em] text-black/75 font-normal"
          >
            {t(item.key)}
          </a>
        ))}
      </div>

      {BOTTOM_NAV.map((item) => (
        <a
          key={item.key}
          href={item.href}
          onClick={(e) => handleAnchor(e, item.href)}
          className="min-h-[44px] flex items-center text-[1rem] tracking-[0.18em] text-black font-medium"
        >
          {t(item.key)}
        </a>
      ))}

      <button
        type="button"
        onClick={() => {
          onClose();
          onOpenRegister();
        }}
        className="min-h-[44px] flex items-center text-[1rem] tracking-[0.18em] text-black font-medium text-left"
      >
        {t("nav.register")}
      </button>

      <div className="mt-3 flex items-center gap-1 text-[0.875rem] tracking-[0.12em] text-black font-medium">
        <button
          type="button"
          onClick={() => setLang("ko")}
          style={{ opacity: lang === "ko" ? 1 : 0.4 }}
          aria-pressed={lang === "ko"}
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
        >
          KOR
        </button>
        <span style={{ opacity: 0.3 }}>|</span>
        <button
          type="button"
          onClick={() => setLang("en")}
          style={{ opacity: lang === "en" ? 1 : 0.4 }}
          aria-pressed={lang === "en"}
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
        >
          ENG
        </button>
      </div>

      <a
        href="tel:1577-3401"
        className="mt-auto mb-8 inline-flex items-center gap-2 min-h-[44px] text-[0.875rem] font-medium text-black"
      >
        ☎ 1577-3401
      </a>
    </div>
  );
}
