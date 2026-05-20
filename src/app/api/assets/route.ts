import { NextResponse } from "next/server";
import { fetchAssetMap } from "@/lib/notion";

// 60초 캐시 — 운영자가 Notion에서 URL 바꾸면 최대 1분 후 사이트 반영.
export const revalidate = 60;

/**
 * GET /api/assets
 *
 * Notion Assets DB에서 Active=true 행들의 Key→URL 매핑을 JSON으로 반환.
 * 클라이언트 컴포넌트(AssetsProvider)가 마운트 시 한 번 호출해 캐시.
 * 환경변수 미설정 시 빈 객체 `{}` 반환.
 */
export async function GET() {
  const map = await fetchAssetMap();
  return NextResponse.json(map, {
    headers: {
      // 브라우저 + 엣지 캐시 60초.
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
