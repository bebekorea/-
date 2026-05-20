"use client";

import { useInView } from "@/lib/useInView";
import { useLang } from "@/lib/i18n";
import { useAsset } from "@/lib/useAssets";
import type { AssetKey } from "@/lib/notion";
import {
  CATEGORY_DETAILS,
  CategoryHoverPreview,
  resolveCategoryPreviewProps,
} from "./categoryPreview";

/**
 * CategorySection — 데스크탑 전용 카테고리 풀-뷰포트 섹션.
 *
 * 모바일 카테고리들은 별도 컴포넌트 CategoriesMobile에서 swiper 캐러셀로
 * 한 화면 옆으로 넘기는 패턴으로 통합 노출되며, 이 컴포넌트는 데스크탑(>= md)
 * 에서만 렌더된다 (`max-md:hidden` → display:none on mobile + page.tsx
 * topLevelSections 필터가 자동 제외).
 *
 * CATEGORY_DETAILS / CategoryHoverPreview / resolveCategoryPreviewProps는
 * categoryPreview.tsx에서 export되어 데스크탑·모바일 양쪽이 같은 데이터를
 * 공유한다.
 */

interface CategorySectionProps {
  categoryId: keyof typeof CATEGORY_DETAILS | string;
  isActive?: boolean;
  onOpenRegister: () => void;
  onAnchor?: (id: string) => void;
}

export default function CategorySection({
  categoryId,
  isActive,
  onOpenRegister,
  onAnchor,
}: CategorySectionProps) {
  const { ref } = useInView<HTMLElement>(0.4);
  const { t, lang } = useLang();
  // Notion에 category_<id>로 등록된 사진 URL이 있으면 placeholder를 덮어씌움.
  // 없으면 빈 문자열 → 아래에서 기존 visual을 그대로 사용.
  const overrideUrl = useAsset(`category_${categoryId}` as AssetKey, "");

  const detail = CATEGORY_DETAILS[categoryId];
  if (!detail) return null;
  const props = resolveCategoryPreviewProps(detail, t, lang);

  // Asset 오버라이드 — type=photo면 src 교체, type=cards면 첫 번째 카드의
  // photo 교체 (모바일 hero 대표 이미지로 사용되므로). 다른 cards는 그대로.
  if (overrideUrl) {
    if (props.visual.type === "photo") {
      props.visual = { ...props.visual, src: overrideUrl };
    } else if (props.visual.type === "cards" && props.visual.cards[0]) {
      props.visual = {
        ...props.visual,
        cards: [
          { ...props.visual.cards[0], photo: overrideUrl },
          ...props.visual.cards.slice(1),
        ],
      };
    }
  }

  return (
    <section
      ref={ref}
      id={categoryId}
      className="fp-section bg-white overflow-hidden max-md:hidden"
    >
      <CategoryHoverPreview
        {...props}
        isActive={isActive}
        onOpenRegister={onOpenRegister}
        onAnchor={onAnchor}
      />
    </section>
  );
}
