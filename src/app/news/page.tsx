import NewsClient, { type Article } from "./NewsClient";
import { fetchNewsArticles } from "@/lib/notion";

// Notion 데이터를 60초 간격으로 재검증 — 운영자가 글을 올린 뒤 최대 1분 후
// 사이트에 반영. 더 빠르게 원하면 revalidate를 낮추거나 운영자 측 webhook을
// 연동해 on-demand revalidation으로 갈 수도 있음.
export const revalidate = 60;

export default async function NewsPage() {
  // Notion에서 발행글 가져오기. 환경변수 미설정/에러 시 null.
  // NewsClient는 빈 배열을 받으면 내장 이중언어 fallback을 lang에 맞춰
  // 보여주므로 여기서 fallback 데이터를 만들 필요 없음.
  const fromNotion = await fetchNewsArticles();
  const articles: Article[] =
    fromNotion === null
      ? []
      : fromNotion.map((a) => ({
          id: a.id,
          date: a.date,
          title: a.title,
          source: a.source,
          href: a.href,
        }));

  return <NewsClient articles={articles} />;
}
