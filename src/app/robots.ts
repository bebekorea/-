import type { MetadataRoute } from "next";

const SITE_URL = "https://bebepet.vercel.app";

/**
 * Next.js App Router의 동적 robots.txt 생성.
 *
 * 모든 봇이 모든 페이지 인덱싱 가능. sitemap 위치 명시.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
