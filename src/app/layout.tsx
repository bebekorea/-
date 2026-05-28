import type { Metadata } from "next";
import { Jost, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import { AssetsProvider } from "@/lib/useAssets";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const notoSerifKr = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bebepet.vercel.app"),
  title: "BEBE PET KOREA | 반려동물 토탈 케어 — 입양·병원·사료·미용",
  description:
    "베베펫은 평생 함께할 첫만남부터 입양·병원·사료·미용·스파까지, 반려동물 토탈 케어를 제공합니다. 충청남도 천안 본점에서 만나보세요.",
  icons: { icon: "/images/favicon-new.png" },
  openGraph: {
    title: "BEBE PET KOREA | 반려동물 토탈 케어",
    description:
      "베베펫은 평생 함께할 첫만남부터 입양·병원·사료·미용·스파까지, 반려동물 토탈 케어를 제공합니다.",
    url: "https://bebepet.vercel.app",
    siteName: "BEBE PET KOREA",
    images: [
      {
        url: "/images/contact-bg-new.png",
        width: 1200,
        height: 630,
        alt: "BEBE PET KOREA",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BEBE PET KOREA | 반려동물 토탈 케어",
    description:
      "입양·병원·사료·미용·스파까지, 반려동물 토탈 케어를 제공합니다.",
    images: ["/images/contact-bg-new.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${jost.variable} ${notoSerifKr.variable}`}>
      <body className="font-sans text-text-default antialiased">
        <LanguageProvider>
          <AssetsProvider>{children}</AssetsProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
