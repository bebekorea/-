import type { MetadataRoute } from "next";

const SITE_URL = "https://bebepet.vercel.app";

/**
 * Next.js App Router의 동적 sitemap.xml 생성.
 *
 * 빌드 시점에 호출되어 /sitemap.xml로 노출. 운영자가 도메인을 연결하면
 * SITE_URL만 그 도메인으로 바꿔주면 됨.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/news`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
