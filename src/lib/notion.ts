/**
 * Notion CMS — 공지사항(/news) 페이지의 데이터 소스.
 *
 * 운영 흐름:
 *   1) 운영자가 Notion 데이터베이스에 새 글을 추가 + Published 체크
 *   2) /news 페이지가 서버 컴포넌트로 Notion API 호출 (60초 캐시)
 *   3) 캐시 만료 후 다음 요청 시 자동 재조회
 *
 * 필요한 Notion DB 스키마 (열 이름은 정확히 일치해야 함):
 *   - Title      (title)         — 기사 제목
 *   - Date       (date)          — 발행 날짜
 *   - Source     (rich_text)     — 출처 (예: "한국경제")
 *   - URL        (url, optional) — 원문 링크
 *   - Published  (checkbox)      — 발행 여부 (false면 노출 X)
 *
 * 환경변수 (.env.local):
 *   - NOTION_TOKEN              Internal Integration Token
 *   - NOTION_NEWS_DB_ID         공지사항 DB의 32자리 ID
 *
 * 셋업 단계는 .env.local.example 주석 참조.
 */

import { Client, isFullPage } from "@notionhq/client";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_NEWS_DB_ID = process.env.NOTION_NEWS_DB_ID;
const NOTION_ASSETS_DB_ID = process.env.NOTION_ASSETS_DB_ID;

export type NewsArticle = {
  id: string;
  date: string; // YYYY.MM.DD
  title: string;
  source: string;
  href?: string;
};

let cachedClient: Client | null = null;
function getClient(): Client | null {
  if (!NOTION_TOKEN) return null;
  if (!cachedClient) cachedClient = new Client({ auth: NOTION_TOKEN });
  return cachedClient;
}

/**
 * Notion DB에서 발행된 공지사항을 날짜 내림차순으로 불러온다.
 * 반환 값:
 *   - null  : 환경변수 미설정 또는 호출 에러 (호출부가 fallback 데이터 사용)
 *   - []    : Notion DB가 정상 연결됐고 발행된 글이 0개 (빈 상태 노출)
 *   - [...] : Notion에서 가져온 글 목록
 */
export async function fetchNewsArticles(): Promise<NewsArticle[] | null> {
  const notion = getClient();
  if (!notion || !NOTION_NEWS_DB_ID) {
    // 환경변수가 아직 설정되지 않은 경우 — 운영자에게 알리기 위한 로그.
    if (typeof window === "undefined") {
      console.warn(
        "[notion] NOTION_TOKEN or NOTION_NEWS_DB_ID is not set. " +
          "Returning null so caller can fall back. See .env.local.example."
      );
    }
    return null;
  }

  try {
    // Notion API는 cache 옵션을 직접 안 받지만, Next.js가 fetch 내부적으로
    // revalidate를 지원함. @notionhq/client는 fetch를 사용하므로 next.js의
    // fetchCache 설정이 그대로 적용. 페이지 단위에서 export const revalidate
    // = 60 으로 60초 캐시.
    const res = await notion.databases.query({
      database_id: NOTION_NEWS_DB_ID,
      filter: {
        property: "Published",
        checkbox: { equals: true },
      },
      sorts: [{ property: "Date", direction: "descending" }],
      page_size: 100,
    });

    const articles: NewsArticle[] = [];
    for (const page of res.results) {
      if (!isFullPage(page)) continue;
      const props = page.properties;

      // Title (title 타입) — 첫 번째 text 조각의 plain_text
      const titleProp = props.Title;
      const title =
        titleProp?.type === "title"
          ? titleProp.title.map((t) => t.plain_text).join("")
          : "";

      // Date (date 타입) — start 사용, YYYY.MM.DD 포맷
      const dateProp = props.Date;
      let date = "";
      if (dateProp?.type === "date" && dateProp.date?.start) {
        const d = new Date(dateProp.date.start);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        date = `${y}.${m}.${day}`;
      }

      // Source (rich_text)
      const sourceProp = props.Source;
      const source =
        sourceProp?.type === "rich_text"
          ? sourceProp.rich_text.map((t) => t.plain_text).join("")
          : "";

      // URL (url, optional)
      const urlProp = props.URL;
      const href =
        urlProp?.type === "url" && urlProp.url ? urlProp.url : undefined;

      if (!title || !date) continue; // 필수 필드 누락 시 스킵
      articles.push({
        id: page.id,
        date,
        title,
        source,
        href,
      });
    }

    return articles;
  } catch (err) {
    console.error("[notion] fetchNewsArticles failed:", err);
    return null;
  }
}

/* ────────────────────────────────────────────────────────────────────
 * Assets DB — 로고/카테고리 사진/조직도/Hero 영상 등 시각 자산을 운영자가
 * Notion에서 URL로 관리. 이미지/영상 자체는 외부 호스팅(Imgur/Cloudinary/
 * GitHub raw 등)에 올리고, 직접 링크 URL을 Notion의 URL 필드에 붙여넣는다.
 *
 * Notion DB 스키마 (열 이름 정확히 일치):
 *   - Key       (title)         — 자산 식별자. 예: "logo", "category_adopt",
 *                                  "category_location", "category_partners",
 *                                  "category_product", "category_beauty",
 *                                  "category_global", "org_chart",
 *                                  "hero_video", "contact_bg"
 *   - URL       (url)           — 자산의 직접 링크 URL
 *   - Active    (checkbox)      — false면 무시 (코드의 fallback 사용)
 *   - Notes     (rich_text)     — 운영자 메모용 (선택)
 *
 * 환경변수:
 *   - NOTION_TOKEN              (News와 공용)
 *   - NOTION_ASSETS_DB_ID       Assets DB ID (32자리)
 *
 * 운영자 흐름:
 *   1) 새 이미지/영상을 Imgur/Cloudinary 같은 무료 호스팅에 업로드
 *   2) 그 URL을 복사
 *   3) Notion의 Assets DB에 해당 Key 행 찾아서 URL 필드에 붙여넣기
 *   4) Active 체크 → 60초 후 사이트 반영
 * ──────────────────────────────────────────────────────────────────── */

/** 코드에서 인식하는 자산 키 목록. Notion DB의 Key는 이 중 하나여야 한다. */
export const ASSET_KEYS = [
  "logo",
  "category_adopt",
  "category_location",
  "category_partners",
  "category_product",
  "category_beauty",
  "category_global",
  "org_chart",
  "hero_video",
  "contact_bg",
] as const;
export type AssetKey = (typeof ASSET_KEYS)[number];

export type AssetMap = Partial<Record<AssetKey, string>>;

/**
 * Notion Assets DB에서 Active=true 행들의 Key → URL 매핑을 반환.
 * 환경변수 미설정/실패 시 빈 객체. 호출부는 fallback URL을 갖고 있어야 한다.
 */
export async function fetchAssetMap(): Promise<AssetMap> {
  const notion = getClient();
  if (!notion || !NOTION_ASSETS_DB_ID) {
    if (typeof window === "undefined") {
      console.warn(
        "[notion] NOTION_ASSETS_DB_ID is not set. Asset overrides disabled."
      );
    }
    return {};
  }

  try {
    const res = await notion.databases.query({
      database_id: NOTION_ASSETS_DB_ID,
      filter: { property: "Active", checkbox: { equals: true } },
      page_size: 100,
    });

    const map: AssetMap = {};
    for (const page of res.results) {
      if (!isFullPage(page)) continue;
      const props = page.properties;

      const keyProp = props.Key;
      const key =
        keyProp?.type === "title"
          ? keyProp.title.map((t) => t.plain_text).join("")
          : "";

      const urlProp = props.URL;
      const url = urlProp?.type === "url" && urlProp.url ? urlProp.url : null;

      if (!key || !url) continue;
      if ((ASSET_KEYS as readonly string[]).includes(key)) {
        map[key as AssetKey] = url;
      }
    }
    return map;
  } catch (err) {
    console.error("[notion] fetchAssetMap failed:", err);
    return {};
  }
}
