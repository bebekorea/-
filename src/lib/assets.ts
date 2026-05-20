// 베베펫 6대 자산 데이터 — 데스크탑 ScrollHero stage 2의 가로 카드 그리드와
// 모바일 전용 AssetsMobile 섹션 양쪽에서 공유한다. 카드 인덱스 0–5와
// 디테일 인덱스 0–5는 1:1로 매칭된다 (의료/글로벌/뷰티/시스템/신뢰/철학).

// 가로 6열 카드(데스크탑 stage 2)와 모바일 카드 둘 다에서 사용하는
// 짧은 라벨 + 요약. 본문은 i18n 사전에서 가져온다.
export const ASSET_CARDS: { titleKey: string; summaryKey: string }[] = [
  { titleKey: "assets.medical.title", summaryKey: "assets.medical.summary" },
  { titleKey: "assets.global.title", summaryKey: "assets.global.summary" },
  { titleKey: "assets.beauty.title", summaryKey: "assets.beauty.summary" },
  { titleKey: "assets.system.title", summaryKey: "assets.system.summary" },
  { titleKey: "assets.trust.title", summaryKey: "assets.trust.summary" },
  { titleKey: "assets.philosophy.title", summaryKey: "assets.philosophy.summary" },
];

// PDF "베베펫 웹 수정" p.3–10 카피를 옮긴 자산별 상세 데이터.
// 데스크탑에선 카드 hover 시 좌측 상단 영역에 크로스페이드로 노출되고,
// 모바일에선 각 카드에 항상 펼쳐서 노출된다.
export type AssetDetail = {
  name: Record<"ko" | "en", string>;
  tagline: Record<"ko" | "en", string>;
  points: Record<"ko" | "en", { label: string; body: string }[]>;
};

export const ASSET_DETAILS: AssetDetail[] = [
  {
    name: { ko: "의료 자산", en: "Medical" },
    tagline: {
      ko: "단순한 분양을 넘어 생명을 책임지는 전문성을 상징합니다.",
      en: "Beyond simple adoption, expertise that takes responsibility for life.",
    },
    points: {
      ko: [
        { label: "수의사 전담 관리", body: "입양 전 모든 아이의 건강검진을 자체 동물병원에서 수의사가 직접 실시합니다." },
        { label: "투명한 건강 정보", body: "검진 결과지 및 예방접종 기록을 투명하게 공개하여 입양 초기 불안감을 해소합니다." },
        { label: "생애주기 의료 지원", body: "입양 후에도 전문적인 의료 서비스를 지속적으로 제공받을 수 있는 든든한 파트너십을 제공합니다." },
      ],
      en: [
        { label: "Dedicated vet care", body: "Every animal receives a full health check by our in-house veterinarian before adoption." },
        { label: "Transparent records", body: "Checkup results and vaccination history are shared openly to ease new-parent worries." },
        { label: "Lifelong medical support", body: "Continued professional veterinary care after adoption, a partnership for life." },
      ],
    },
  },
  {
    name: { ko: "글로벌 자산", en: "Global" },
    tagline: {
      ko: "유통의 한계를 넘어 최고의 제품을 합리적으로 공급합니다.",
      en: "Beyond distribution limits. Best products, fairly supplied.",
    },
    points: {
      ko: [
        { label: "전문가 소싱", body: "수의사가 성분을 분석하고 글로벌 사업부가 직접 계약한 해외 프리미엄 브랜드를 선보입니다." },
        { label: "신선도와 안전성", body: "중간 유통 단계를 생략하여 가장 신선한 사료를 가장 안전한 통관 절차를 거쳐 보호자에게 전달합니다." },
        { label: "독점적 가치", body: "국내에서 구하기 힘든 고품질 처방식이나 용품을 베베펫 고객만을 위해 독점 공급합니다." },
      ],
      en: [
        { label: "Expert sourcing", body: "Vets analyze ingredients; our global team contracts premium overseas brands directly." },
        { label: "Freshness & safety", body: "We skip middle distributors so food arrives fresh, through the safest customs route." },
        { label: "Exclusive access", body: "Hard-to-find prescription diets and goods, supplied exclusively to BEBE PET customers." },
      ],
    },
  },
  {
    name: { ko: "뷰티 자산", en: "Beauty" },
    tagline: {
      ko: "반려동물의 위생과 스타일을 통해 삶의 질을 높입니다.",
      en: "Lifting quality of life through grooming and style, an aesthetic asset.",
    },
    points: {
      ko: [
        { label: "전문 디자이너 케어", body: "견종·묘종별 특성을 이해하는 전문 미용사가 스트레스를 최소화한 미용 서비스를 제공합니다." },
        { label: "의료·미용 협업", body: "미용 중 피부나 건강 이상 발견 시 즉시 자체 의료진과 공유하는 '안전 미용 시스템'을 운영합니다." },
      ],
      en: [
        { label: "Specialist designers", body: "Groomers trained per breed deliver low-stress grooming sessions." },
        { label: "Medical · grooming bridge", body: "Skin or health issues spotted during grooming go straight to our in-house vets, a true safety net." },
      ],
    },
  },
  {
    name: { ko: "시스템 자산", en: "System" },
    tagline: {
      ko: "각 분야 전문가가 포진된 기업형 매니지먼트를 지향합니다.",
      en: "Not a one-person shop. A corporate management model staffed by specialists.",
    },
    points: {
      ko: [
        { label: "분업화된 전문성", body: "경영지원, 글로벌 무역, 의료, 미용, 마케팅팀이 각자의 영역에서 최상의 결과물을 만듭니다." },
        { label: "표준화된 서비스", body: "어떤 채널을 통해 베베펫을 만나도 동일한 수준의 전문 상담과 서비스를 경험할 수 있는 매뉴얼 경영을 실천합니다." },
      ],
      en: [
        { label: "Specialized divisions", body: "Management, global trade, medical, grooming, and marketing teams each deliver in their lane." },
        { label: "Standardized service", body: "Same expert consultation and service quality across every channel, all manual-driven operations." },
      ],
    },
  },
  {
    name: { ko: "신뢰 자산", en: "Trust" },
    tagline: {
      ko: "현장에서 쌓아온 실제 데이터와 고객과의 소통 기록입니다.",
      en: "Real on-site data and customer dialogue.",
    },
    points: {
      ko: [
        { label: "활발한 SNS 소통", body: "인스타그램 Reels를 통해 아이들의 노는 모습, 식사 시간, 매장 소독 현황 등을 매일 업데이트합니다." },
        { label: "실제 입양 후기", body: "'베베펫 가족'이 된 보호자들의 생생한 목소리와 건강하게 성장하는 아이들의 모습이 가장 강력한 신뢰의 증거입니다." },
        { label: "입양 데이터", body: "오픈 이후 쌓아온 수많은 입양 사례와 상담 기록은 지역사회에서 신뢰받는 브랜드로 자리 잡았음을 보여줍니다." },
      ],
      en: [
        { label: "Active social presence", body: "Daily Instagram Reels showing playtime, meals, and store sanitation. Not staged shots." },
        { label: "Real adoption stories", body: "Honest voices from BEBE PET families and healthy growth of adopted animals, our strongest proof." },
        { label: "Adoption data", body: "Years of adoption cases and consultations show our position as a trusted local brand." },
      ],
    },
  },
  {
    name: { ko: "철학 자산", en: "Philosophy" },
    tagline: {
      ko: "생명을 대하는 올바른 태도와 정직한 경영 원칙을 지향합니다.",
      en: "Right attitudes toward life. Honest principles for running a company.",
    },
    points: {
      ko: [
        { label: "독자적인 개체 관리", body: "쾌적하고 위생적인 매장 환경 유지 — 매일 정기 소독을 실시합니다." },
        { label: "연령별 맞춤 영양", body: "강아지·고양이의 생애 주기에 맞춘 필수 영양소 공급 및 전문가용 보충제 급여 원칙을 준수합니다." },
        { label: "전문 인력의 자부심", body: "수의사·미용사·무역 전문가가 체계적인 조직도 아래 책임감을 가지고 근무합니다." },
        { label: "노동법 준수", body: "투명한 노무 관리와 인센티브 구조로 직원이 행복하게 일할 환경을 만듭니다. 직원의 행복은 더 나은 케어로 이어집니다." },
      ],
      en: [
        { label: "Animal management", body: "A clean, hygienic store environment with daily sanitation as standard practice." },
        { label: "Age-tailored nutrition", body: "Essential nutrients and pro-grade supplements matched to each animal's life stage." },
        { label: "Pride of specialists", body: "Vets, groomers, and trade experts work with responsibility under a clear org structure." },
        { label: "Labor law compliance", body: "Transparent HR and incentive structures so staff thrive. Happy staff means better care." },
      ],
    },
  },
];
