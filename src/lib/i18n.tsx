"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Lang = "ko" | "en";

type Dict = Record<string, string | string[]>;

const ko: Dict = {
  // ── Header / Nav ───────────────────────────────────────────────
  "nav.brand": "베베펫",
  "nav.service": "서비스",
  "nav.global": "글로벌",
  "nav.adopt": "입양",
  "nav.location": "병원",
  "nav.partners": "사료/간식",
  "nav.product": "용품",
  "nav.beauty": "미용",
  "nav.press": "공지사항",
  "nav.register": "방문예약등록",

  // ── Hero ───────────────────────────────────────────────────────
  "intro.typing": "당신의 반려가족을 위한 모든 것, 베베펫입니다.",
  "hero.lines": [
    "베베펫에서 시작되는 평생의 동행",
    "건강한 입양부터 의료, 사료, 미용까지",
    "당신의 반려가족을 위한 모든 것",
  ],
  "hero.tagline": "평생 함께할 첫만남",
  "hero.cta.register": "방문예약하기",

  // ── Brand stage 2 — 6대 자산 라벨 + 6개 카드 (제목 + 요약) ───────
  "assets.tagline": "반려동물의 생애 주기 전체를 책임지는 기업",
  "assets.company": "베베펫코리아",
  "assets.label": "베베펫 6대 자산",
  "assets.medical.title": "의료자산",
  "assets.medical.summary": [
    "단순한 입양을 넘어",
    "생명을 책임지는",
    "전문성을 상징합니다.",
  ],
  "assets.global.title": "글로벌 자산",
  "assets.global.summary": [
    "자산유통의 한계를 넘어",
    "최고의 제품을",
    "합리적으로 공급합니다",
  ],
  "assets.beauty.title": "뷰티 자산",
  "assets.beauty.summary": [
    "반려동물의 위생과",
    "스타일을 통해 삶의 질을",
    "높입니다",
  ],
  "assets.system.title": "시스템 자산",
  "assets.system.summary": [
    "각 분야의 전문가가",
    "포진된 기업형 매니징을",
    "지향합니다",
  ],
  "assets.trust.title": "신뢰 자산",
  "assets.trust.summary": [
    "현장에서 쌓아온 실제",
    "데이터와 고객과의 소통",
    "기록입니다.",
  ],
  "assets.philosophy.title": "철학 자산",
  "assets.philosophy.summary": [
    "동물의 복지와 구성원의",
    "권리를 존중하는 투명한",
    "경영을 지향합니다.",
  ],

  // ── Hero stage 3 — 가로로 확장된 brand 영상 위 카피 + 조직도 ──
  "stage3.label": "TRUST",
  "stage3.tagline": [
    "각 분야의 전문가가 모여,",
    "믿을 수 있는 토탈케어 서비스를 제공합니다.",
  ],
  "stage3.orgChart.title": "베베펫코리아 조직도",
  "stage3.orgChart.placeholder": "조직도 이미지 자리 (에셋 입고 후 교체)",

  // ── Category index (#index) ───────────────────────────────────
  "index.cta": "베베펫이 제공하는 서비스를 확인해보세요.",
  "index.caption.adopt": "완벽한 반려 라이프의 시작",
  "index.caption.location": "365일 · 24시간 안심 의료",
  "index.caption.partners": "엄선된 영양 케어",
  "index.caption.product": "건강한 일상을 위한 용품",
  "index.caption.beauty": "전문 미용·스파",
  "index.body.adopt": "전문 수의사 검진을 거친 건강한 가족을 안겨드리는 안심 입양",
  "index.body.location": "정기 진료부터 24시간 응급 상황까지 믿을 수 있는 의료 서비스",
  "index.body.partners": "프리미엄 사료부터 정성 가득한 간식까지, 깐깐하게 고른 푸드 셀렉션",
  "index.body.product": "매 순간을 안전하고 풍요롭게 채워줄 프리미엄 제품",
  "index.body.beauty": "견종과 묘종의 특성에 맞춘 안전하고 섬세한 전문 메디컬 케어",

  // ── Adopt species cards (인덱스 ADOPT 프리뷰의 3분할 카드 라벨) ─
  "adopt.species.large": "대형견",
  "adopt.species.small": "소형견",
  "adopt.species.cat": "고양이",
  "adopt.cta.instagram": "베베펫 인스타그램 보러가기",

  // ── Product cards (인덱스 PRODUCT 프리뷰의 3×2 카드 라벨) ──────
  "product.card.care": "케어용품",
  "product.card.apparel": "의류",
  "product.card.travel": "이동용품",
  "product.card.hygiene": "위생용품",
  "product.card.toys": "장난감",
  "product.card.bedding": "침구·매트",

  // ── Beauty CTA ─────────────────────────────────────────────────
  "beauty.cta.book": "예약하기",

  // ── Global 섹션 (미용 다음의 B2B/파트너십 섹션) ──
  "global.caption": "글로벌 소싱 파트너",
  "global.body":
    "해외 소싱부터 국내 유통까지 풀체인을 자체 운영합니다.\n병원·펫샵 도매 공급, 해외 제조사의 한국 유통 협의를 환영합니다.",
  "global.cta.inquiry": "파트너십 문의",

  // ── Contact (Visit) ────────────────────────────────────────────
  "contact.title.eng": "VISIT",
  "contact.lead": [
    "반려동물을 위한 토탈 케어 서비스",
    "베베펫에서 만나보세요.",
  ],
  "contact.label.hq": "천안 본사",
  "contact.value.hq": "충청남도 천안시 서북구 두정동 864",
  "contact.label.logistics": "세종 물류센터",
  "contact.value.logistics": "세종 금남면 용담리 206-3",
  "contact.label.period": "운영시간",
  "contact.value.period": "매일 10:00 ~ 20:00 (연중무휴)",
  "contact.map.alt": "베베펫 위치 약도",
  // legacy keys (다른 곳에서 쓰일 수 있어 유지)
  "contact.label.loc": "위치",
  "contact.value.loc": "충청남도 천안시 서북구 두정동 864",

  // ── Footer ─────────────────────────────────────────────────────
  "footer.toTop.aria": "맨 위로",
  "footer.privacy": "개인정보처리방침",
  "footer.tagline": "평생 함께할 첫만남, 베베펫이 함께합니다.",
  "footer.company.name": "베베펫코리아",
  "footer.company.address": "충남 천안시 서북구 원두정8길 40 도정빌딩 1층",
  "footer.company.phone": "1577-3401",
  "footer.company.email": "bebepet0409@naver.com",
  // 사업자 정보 키(대표/사업자등록번호/통신판매업신고번호)는 푸터에서 제거
  // 됨 + 실제값 미정이라 i18n에서도 정리. 추후 실데이터 받으면 다시 추가.

  // ── Register Modal ─────────────────────────────────────────────
  "reg.title": "RESERVATION",
  "reg.subtitle": "방문 예약 / 상담 신청",
  "reg.field.name": "이름",
  "reg.field.tel": "연락처",
  "reg.field.address": "지역",
  "reg.field.address.sido": "시/도 선택",
  "reg.field.subject": "상담목적",
  "reg.field.subject.placeholder": "문의하실 내용을 자유롭게 작성해주세요.",
  "reg.agree.privacy": "개인정보 수집·이용에 동의합니다.",
  "reg.agree.privacy.required": "[필수]",
  "reg.submit": "동의하고 신청하기",
  "reg.close": "닫기",
  "reg.success": "방문 예약이 접수되었습니다. (데모)",

  // ── News / Press page ──────────────────────────────────────────
  "news.title": "공지사항",
  "news.search.placeholder": "검색어 입력",
  "news.empty": "공지사항이 없습니다.",
  "news.crumb.home": "HOME",
  "news.back": "목록으로",
  "news.source.link": "원문 보기",
};

const en: Dict = {
  // ── Header / Nav ───────────────────────────────────────────────
  "nav.brand": "BEBE PET",
  "nav.service": "SERVICE",
  "nav.global": "GLOBAL",
  "nav.adopt": "ADOPT",
  "nav.location": "HOSPITALITY",
  "nav.partners": "FOOD",
  "nav.product": "PRODUCT",
  "nav.beauty": "BEAUTY & SPA",
  "nav.press": "NOTICE",
  "nav.register": "RESERVATION",

  // ── Hero ───────────────────────────────────────────────────────
  "intro.typing": "Everything for your pet family. BEBE PET.",
  "hero.lines": [
    "A lifelong companionship begins at BEBE PET",
    "From healthy adoption to medical, food, and grooming,",
    "everything for your beloved pet family",
  ],
  "hero.tagline": "A first meeting that lasts forever",
  "hero.cta.register": "Book a Visit",

  // ── Brand stage 2 — 6대 자산 ─────────────────────────────────────
  "assets.tagline": "A company that takes responsibility for every life stage of your pet",
  "assets.company": "BEBE PET KOREA",
  "assets.label": "BEBE PET'S 6 BRAND ASSETS",
  "assets.medical.title": "Medical",
  "assets.medical.summary": [
    "Expertise beyond",
    "simple adoption,",
    "protecting every life.",
  ],
  "assets.global.title": "Global",
  "assets.global.summary": [
    "Beyond distribution limits,",
    "premium products supplied",
    "at a fair price.",
  ],
  "assets.beauty.title": "Beauty",
  "assets.beauty.summary": [
    "Hygiene and style",
    "raising pets'",
    "quality of life.",
  ],
  "assets.system.title": "System",
  "assets.system.summary": [
    "Enterprise-style operation",
    "with specialists across",
    "every domain.",
  ],
  "assets.trust.title": "Trust",
  "assets.trust.summary": [
    "Real data and",
    "customer conversations",
    "built on the ground.",
  ],
  "assets.philosophy.title": "Philosophy",
  "assets.philosophy.summary": [
    "Transparent management",
    "respecting animal welfare",
    "and staff rights.",
  ],

  // ── Hero stage 3 — copy + org chart on the expanded brand video ──
  "stage3.label": "TRUST",
  "stage3.tagline": [
    "Specialists from every field come together",
    "to deliver trusted total-care service.",
  ],
  "stage3.orgChart.title": "BEBE PET KOREA Org Chart",
  "stage3.orgChart.placeholder": "Org chart asset (to be replaced)",

  // ── Category index ─────────────────────────────────────────────
  "index.cta": "Explore the services BEBE PET provides.",
  "index.caption.adopt": "Where your perfect pet life begins",
  "index.caption.location": "Trusted medical care, 24/7 · 365",
  "index.caption.partners": "Curated nutrition care",
  "index.caption.product": "Supplies for healthy everyday life",
  "index.caption.beauty": "Professional grooming · spa",
  "index.body.adopt": "Healthy family members vetted by our veterinarians, brought home with peace of mind",
  "index.body.location": "From routine checkups to 24-hour emergencies — medical service you can trust",
  "index.body.partners": "From premium kibble to thoughtfully made treats — a meticulously curated food selection",
  "index.body.product": "Premium products that fill every moment, safely and abundantly",
  "index.body.beauty": "Safe, refined medical-grade care tailored to each breed",

  // ── Adopt species cards ────────────────────────────────────────
  "adopt.species.large": "Large dogs",
  "adopt.species.small": "Small dogs",
  "adopt.species.cat": "Cats",
  "adopt.cta.instagram": "Visit our Instagram",

  // ── Product cards ──────────────────────────────────────────────
  "product.card.care": "Care",
  "product.card.apparel": "Apparel",
  "product.card.travel": "Travel",
  "product.card.hygiene": "Hygiene",
  "product.card.toys": "Toys",
  "product.card.bedding": "Bedding",

  // ── Beauty CTA ─────────────────────────────────────────────────
  "beauty.cta.book": "Book Now",

  // ── Global section (B2B / partnership) ──
  "global.caption": "Global sourcing partner",
  "global.body":
    "We run the entire chain ourselves, from overseas sourcing through domestic distribution.\nOpen to wholesale supply for clinics and pet shops, and to Korean-distribution talks with overseas manufacturers.",
  "global.cta.inquiry": "Partnership inquiry",

  // ── Contact (Visit) ────────────────────────────────────────────
  "contact.title.eng": "VISIT",
  "contact.lead": [
    "Total care services for your companion animal,",
    "experience it at BEBE PET.",
  ],
  "contact.label.hq": "Cheonan HQ",
  "contact.value.hq": "864 Dujeong-dong, Seobuk-gu, Cheonan, Chungnam",
  "contact.label.logistics": "Sejong logistics center",
  "contact.value.logistics": "206-3 Yongdam-ri, Geumnam-myeon, Sejong",
  "contact.label.period": "Hours",
  "contact.value.period": "Daily 10:00 – 20:00 (open year-round)",
  "contact.map.alt": "BEBE PET location maps",
  "contact.label.loc": "Location",
  "contact.value.loc": "864 Dujeong-dong, Seobuk-gu, Cheonan, Chungnam",

  // ── Footer ─────────────────────────────────────────────────────
  "footer.toTop.aria": "Back to top",
  "footer.privacy": "Privacy Policy",
  "footer.tagline": "A first meeting that lasts forever. BEBE PET is with you.",
  "footer.company.name": "BEBE PET KOREA",
  "footer.company.address": "1F Dojeong Bldg, 40 Wondujeong 8-gil, Seobuk-gu, Cheonan, Chungnam",
  "footer.company.phone": "1577-3401",
  "footer.company.email": "bebepet0409@naver.com",
  // 사업자 정보 키는 푸터에서 제거 + 실제값 미정이라 정리. 추후 실데이터
  // 받으면 footer.biz.ceo / regnum / salesnum 다시 추가.

  // ── Register Modal ─────────────────────────────────────────────
  "reg.title": "RESERVATION",
  "reg.subtitle": "Visit booking & inquiry",
  "reg.field.name": "Name",
  "reg.field.tel": "Phone",
  "reg.field.address": "Region",
  "reg.field.address.sido": "Province / City",
  "reg.field.subject": "Subject",
  "reg.field.subject.placeholder": "Tell us what you'd like to ask about.",
  "reg.agree.privacy": "I agree to the collection and use of personal information.",
  "reg.agree.privacy.required": "[Required]",
  "reg.submit": "Agree & Submit",
  "reg.close": "Close",
  "reg.success": "Your booking has been received. (Demo)",

  // ── News / Press page ──────────────────────────────────────────
  "news.title": "NOTICE",
  "news.search.placeholder": "Search keyword",
  "news.empty": "No notices.",
  "news.crumb.home": "HOME",
  "news.back": "Back to list",
  "news.source.link": "View source",
};

const dictionaries: Record<Lang, Dict> = { ko, en };

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (key: string) => string;
  ta: (key: string) => string[];
}

const LanguageContext = createContext<LangContextValue | null>(null);
const STORAGE_KEY = "bebepet-lang";

// External store wired into useSyncExternalStore so hydration is consistent
// without needing a setState-in-effect on mount.
const subscribers = new Set<() => void>();

function readLangFromStorage(): Lang {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "en" ? "en" : "ko";
  } catch {
    return "ko";
  }
}

function writeLangToStorage(l: Lang) {
  try {
    window.localStorage.setItem(STORAGE_KEY, l);
  } catch {
    // ignore
  }
  subscribers.forEach((cb) => cb());
}

function subscribeLang(cb: () => void) {
  subscribers.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    subscribers.delete(cb);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore<Lang>(
    subscribeLang,
    readLangFromStorage,
    () => "ko",
  );

  // Reflect lang on <html lang="..."> for accessibility / SEO
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang === "en" ? "en" : "ko";
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    writeLangToStorage(l);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "ko" ? "en" : "ko");
  }, [lang, setLang]);

  const value = useMemo<LangContextValue>(() => {
    const t = (key: string): string => {
      const v = dictionaries[lang][key];
      if (typeof v === "string") return v;
      if (Array.isArray(v)) return v.join(" ");
      return key;
    };
    const ta = (key: string): string[] => {
      const v = dictionaries[lang][key];
      if (Array.isArray(v)) return v;
      if (typeof v === "string") return [v];
      return [];
    };
    return { lang, setLang, toggleLang, t, ta };
  }, [lang, setLang, toggleLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLang must be used within a LanguageProvider");
  }
  return ctx;
}
