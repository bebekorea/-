import { notFound } from "next/navigation";
import { fetchArticleDetail } from "@/lib/notion";
import NewsDetailClient from "./NewsDetailClient";

// 목록과 동일하게 60초 캐시. 운영자가 Notion 본문을 수정하면 최대 1분 후 반영.
export const revalidate = 60;

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Notion 미설정/페이지 없음/공지 DB 소속 아님 → null → 404.
  const detail = await fetchArticleDetail(id);
  if (!detail) notFound();

  return (
    <NewsDetailClient article={detail.article} blocks={detail.blocks} />
  );
}
