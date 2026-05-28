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
      ko: "단순한 입양을 넘어, 생명을 끝까지 책임지는 메디컬 전문성입니다.",
      en: "Beyond simple adoption — medical expertise that takes responsibility for every life, to the very end.",
    },
    points: {
      ko: [
        { label: "자체 의료진의 밀착 케어", body: "자체 메디컬 센터 수의사가 입양 전 모든 아이들을 직접 검진하고 보증합니다." },
        { label: "투명한 메디컬 데이터 공개", body: "검진 결과지와 예방접종 기록을 가감 없이 공개하여 초기 불안감을 해소합니다." },
        { label: "평생 안심 의료 파트너십", body: "입양에 그치지 않고 반려생활 전반의 전문 의료 서비스를 지속적으로 지원합니다." },
      ],
      en: [
        { label: "In-house medical, hands-on", body: "Our in-house medical center vet personally examines and vouches for every animal before adoption." },
        { label: "Transparent medical data", body: "Checkup results and vaccination history are shared in full, easing every first-time worry." },
        { label: "Lifelong medical partnership", body: "Professional medical service that extends well beyond adoption, supporting your pet's entire life." },
      ],
    },
  },
  {
    name: { ko: "글로벌 자산", en: "Global" },
    tagline: {
      ko: "유통의 한계를 넘어, 세계 최고 수준의 프리미엄 제품을 가장 합리적으로 공급합니다.",
      en: "Beyond distribution limits — the world's finest premium products supplied at the most reasonable price.",
    },
    points: {
      ko: [
        { label: "수의사 검증 글로벌 소싱", body: "수의사가 성분을 분석하고 글로벌 사업부가 해외 본사와 직접 계약한 브랜드만 선보입니다." },
        { label: "다이렉트 유통 및 신선도", body: "중간 유통을 생략하고 안전한 통관을 거쳐 가장 신선한 상태로 보호자에게 전달합니다." },
        { label: "차별화된 독점 공급 가치", body: "국내에서 구하기 힘든 고품질 기능성 처방식과 프리미엄 용품을 독점 공급합니다." },
      ],
      en: [
        { label: "Vet-verified global sourcing", body: "Vets analyze ingredients and our global team contracts overseas HQs directly — only those brands make the shelf." },
        { label: "Direct distribution, peak freshness", body: "Skipping middle distributors and using the safest customs route, food reaches you at its freshest." },
        { label: "Differentiated exclusive value", body: "Hard-to-find functional prescription diets and premium goods, supplied exclusively." },
      ],
    },
  },
  {
    name: { ko: "뷰티 자산", en: "Beauty" },
    tagline: {
      ko: "반려동물의 위생과 스타일을 넘어, 스트레스 없는 케어로 삶의 질을 높입니다.",
      en: "Beyond hygiene and style — low-stress care that lifts every pet's quality of life.",
    },
    points: {
      ko: [
        { label: "펫 전용 하이엔드 그루밍", body: "품종별 특성을 깊이 이해하는 전문 디자이너가 스트레스를 최소화한 미용을 제공합니다." },
        { label: "메디컬 연계 안전 미용", body: "미용 중 피부나 관절 이상 발견 시 자체 의료진과 즉시 연계하여 대응합니다." },
        { label: "위생적인 도구·환경 관리", body: "모든 미용 도구는 1회 사용 후 소독을 원칙으로 하며 위생적인 작업 공간을 유지합니다." },
      ],
      en: [
        { label: "High-end grooming, pet-first", body: "Designers with deep breed-specific expertise deliver grooming with minimal stress." },
        { label: "Medical-linked safe grooming", body: "Any skin or joint issue noticed during grooming is escalated to our in-house medical team at once." },
        { label: "Sanitary tools & environment", body: "Every grooming tool is sanitized after a single use, and the workspace itself is kept hygienic at all times." },
      ],
    },
  },
  {
    name: { ko: "시스템 자산", en: "System" },
    tagline: {
      ko: "개인이 아닌, 각 분야 전문가 그룹이 협업하는 체계적인 기업형 매니지먼트를 지향합니다.",
      en: "Not a one-person shop — specialist groups across every domain collaborating under enterprise-grade management.",
    },
    points: {
      ko: [
        { label: "전문가 그룹의 협업 체계", body: "무역, 의료, 미용, 마케팅 등 고도화된 조직력으로 개인 숍과 차별화된 퀄리티를 만듭니다." },
        { label: "글로벌 스탠다드 매뉴얼", body: "어떤 채널에서 베베펫을 만나도 동일한 수준의 고품격 전문 서비스를 보장합니다." },
        { label: "체계적인 멤버십 매니지먼트", body: "입양 이후에도 보호자와 반려동물의 생애 주기를 체계적으로 기록하고 관리하는 통합 시스템을 지향합니다." },
      ],
      en: [
        { label: "Specialist-group collaboration", body: "Trade, medical, grooming, and marketing teams collaborate at a level no individual shop can match." },
        { label: "Global-standard manuals", body: "Whatever channel you meet BEBE PET through, the same high-end professional service is guaranteed." },
        { label: "Systematic membership management", body: "Beyond adoption, an integrated system that records and manages each pet's life stages alongside their family." },
      ],
    },
  },
  {
    name: { ko: "신뢰 자산", en: "Trust" },
    tagline: {
      ko: "현장에서 증명된 실제 데이터와 보호자들과의 투명한 소통 기록입니다.",
      en: "Real, on-site proof and transparent dialogue with our pet families.",
    },
    points: {
      ko: [
        { label: "리얼타임 현장 투명 공개", body: "SNS를 통해 아이들의 일상 케어와 매장 위생 소독 현황을 매일 실시간으로 공유합니다." },
        { label: "보호자가 증명하는 가치", body: "실제 입양 가족들의 생생한 후기와 아이들의 성장 모습이 가장 확실한 신뢰의 증거입니다." },
        { label: "축적된 빅데이터의 힘", body: "오픈 이후 축적된 방대한 입양 및 상담 기록은 지역사회가 신뢰하는 기반입니다." },
      ],
      en: [
        { label: "Realtime on-site transparency", body: "Daily live updates across our social channels — pet care routines and store sanitation, all in the open." },
        { label: "Value proven by families", body: "Honest reviews from real adopting families and our pets' growth — the strongest proof of trust." },
        { label: "The power of accumulated data", body: "A vast archive of adoption and consultation records built since opening — the foundation of community trust." },
      ],
    },
  },
  {
    name: { ko: "철학 자산", en: "Philosophy" },
    tagline: {
      ko: "생명 존중을 바탕으로 동물의 복지와 직원의 권리를 모두 존중하는 투명한 경영 원칙입니다.",
      en: "Rooted in respect for life — a transparent management principle honoring both animal welfare and staff rights.",
    },
    points: {
      ko: [
        { label: "엄격한 위생·방역 원칙", body: "아이들이 머무는 모든 공간의 쾌적함을 위해 매일 정기 소독과 멸균 환경을 유지합니다." },
        { label: "생애주기별 맞춤 영양학", body: "월령과 건강 상태에 맞춘 필수 영양소 및 전문가용 보충제 급여 원칙을 철저히 준수합니다." },
        { label: "지속 가능한 상생 경영", body: "투명한 노무 관리로 전문가가 행복한 환경을 만듭니다. 직원의 행복은 최고 수준의 케어로 이어집니다." },
      ],
      en: [
        { label: "Strict hygiene & sanitation", body: "Daily sanitation and a sterile environment in every space our pets occupy — uncompromising standard." },
        { label: "Life-stage nutrition science", body: "Essential nutrients and pro-grade supplements matched precisely to age and health condition." },
        { label: "Sustainable mutual-growth management", body: "Transparent HR creates a space where specialists thrive — and that happiness becomes top-tier care." },
      ],
    },
  },
];
