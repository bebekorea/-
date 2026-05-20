"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { AssetKey, AssetMap } from "./notion";

/**
 * 자산 (이미지/영상 URL) Client-side fetcher + Context.
 *
 *  AssetsProvider — 앱 루트(layout.tsx)에서 한 번 감싸면, 마운트 시
 *    `/api/assets` 한 번 호출해 Map<AssetKey, string>을 캐시한다.
 *    Notion 미설정 시 빈 객체 → 아래 useAsset() 호출부가 fallback URL 사용.
 *
 *  useAsset(key, fallback) — 자산 URL을 반환. Notion에서 받아온 값이
 *    있으면 그걸, 없으면 fallback. 가장 일반적인 사용 패턴:
 *
 *      const photo = useAsset("category_adopt", "/images/adopt-default.jpg");
 *      <img src={photo} alt="..." />
 */

const AssetsContext = createContext<AssetMap>({});

export function AssetsProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<AssetMap>({});

  useEffect(() => {
    let cancelled = false;
    fetch("/api/assets")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: AssetMap) => {
        if (!cancelled) setMap(data ?? {});
      })
      .catch(() => {
        // 네트워크 실패 시 fallback (빈 객체) 유지.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <AssetsContext.Provider value={map}>{children}</AssetsContext.Provider>;
}

/**
 * 단일 자산 URL을 가져온다. Notion에 있으면 그 URL, 없으면 fallback 반환.
 * fallback이 undefined면 빈 문자열 반환 — 컴포넌트가 src=""로 안 깨지도록.
 */
export function useAsset(key: AssetKey, fallback?: string): string {
  const map = useContext(AssetsContext);
  return map[key] ?? fallback ?? "";
}

/** 여러 자산을 한 번에 가져오는 헬퍼. */
export function useAssetMap(): AssetMap {
  return useContext(AssetsContext);
}

/**
 * useAsset의 메모이즈 버전 — 호출부에서 의존성 배열에 안전하게 넣을 수
 * 있는 안정된 값. 일반적인 케이스에선 useAsset만으로 충분하지만, 다수의
 * 키를 한꺼번에 lookup할 때 유용.
 */
export function useAssetResolver() {
  const map = useContext(AssetsContext);
  return useMemo(
    () => (key: AssetKey, fallback?: string) => map[key] ?? fallback ?? "",
    [map]
  );
}
