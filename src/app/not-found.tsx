"use client";

import Link from "next/link";

/**
 * 404 페이지 — 존재하지 않는 경로 접근 시 표시.
 * 미니멀 에디토리얼 톤으로 베베펫 브랜드 일관성 유지.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-5">
      <div className="text-center max-w-md">
        <p className="text-[0.75rem] tracking-[0.3em] uppercase text-black/55 mb-4 font-medium">
          404
        </p>
        <h1 className="text-[1.75rem] md:text-[2.25rem] tracking-[-0.01em] font-bold text-black mb-3">
          페이지를 찾을 수 없습니다.
        </h1>
        <p className="text-[0.9375rem] leading-[1.6] text-black/70 mb-8">
          요청하신 페이지가 이동되었거나 더 이상 존재하지 않습니다.
        </p>
        <Link
          href="/"
          className="inline-block text-[0.875rem] tracking-[-0.02em] font-semibold text-white bg-black px-6 py-3 hover:bg-black/85 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
