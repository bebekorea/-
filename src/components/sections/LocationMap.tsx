/**
 * LocationMap — Kakao Maps static embed showing the BEBE PET HQ
 * neighborhood. Sourced via Kakao's "공유 → 지도 첨부" share flow so the
 * panel carries the signature Korean cartographic aesthetic the client
 * referenced, on real geography, with proper Korean road and POI
 * labels — and no API key / no Mapbox token / no custom-illustration
 * approximation needed.
 *
 * The MX / MY values are Kakao's WCONGNAMUL-projected coordinates of
 * the flagship pulled directly from the share embed code; we just bump
 * IW × IH × SCALE to retina-class so the image stays sharp at any
 * desktop width. The bottom strip is the attribution Kakao requires
 * for the static map service — toned to the dark contact panel rather
 * than left as the default light grey card.
 */

interface LocationMapProps {
  /** Kakao WCONGNAMUL X coord */
  mx?: string;
  /** Kakao WCONGNAMUL Y coord */
  my?: string;
  /** Marker pill label (e.g. "베베펫 본사"). Pass empty string to hide pin. */
  label?: string;
  /** Zoom level for the "지도 크게 보기" link */
  urlLevel?: number;
  /** Aria label for the wrapper anchor */
  ariaLabel?: string;
}

const DEFAULT_MX = "530693";
const DEFAULT_MY = "926031";

export default function LocationMap({
  mx = DEFAULT_MX,
  my = DEFAULT_MY,
  label = "베베펫 본사",
  urlLevel = 2,
  ariaLabel,
}: LocationMapProps = {}) {
  const largeViewUrl =
    `https://map.kakao.com/?urlX=${mx}&urlY=${my}&urlLevel=${urlLevel}&map_type=TYPE_MAP&map_hybrid=false`;
  // Higher-resolution static-map URL. SCALE=2 + IW/IH=1024×720 is the
  // retina equivalent of the share-embed default (504×310 @ 1.25x);
  // confirmed served by staticmap.kakao.com with a 200 response.
  const staticImg =
    `https://staticmap.kakao.com/map/mapservice?FORMAT=PNG&SCALE=2&MX=${mx}&MY=${my}&S=0&IW=1024&IH=720&LANG=0&COORDSTM=WCONGNAMUL&logo=kakao_logo`;
  const wrapAria = ariaLabel ?? `${label || "베베펫"} 위치 — 카카오맵에서 크게 보기`;
  return (
    <div className="absolute inset-0 flex flex-col bg-[#13110e]">
      {/* Static Kakao map — clickable, opens full Kakao Map in a new
          tab. object-cover lets it adapt to whatever aspect ratio the
          parent panel ends up at without distorting the underlying
          map projection. */}
      <a
        href={largeViewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex-1 overflow-hidden block"
        aria-label={wrapAria}
      >
        <img
          src={staticImg}
          alt={`${label || "베베펫"} 위치 카카오맵`}
          width={1024}
          height={720}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Marker overlay — Kakao's static-map endpoint returns the
            basemap with no pin (S=0), so we paint our own at the
            visual center, which corresponds exactly to the BEBE PET
            HQ coordinates the URL is centered on. object-cover keeps
            the center anchored regardless of panel aspect ratio.
            pointer-events:none lets the click pass through to the
            "open in Kakao Map" wrapping anchor. */}
        {label && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full pointer-events-none flex flex-col items-center"
          aria-hidden="true"
        >
          {/* Korean label pill */}
          <div className="relative mb-1 px-3 py-1 rounded-md bg-white shadow-[0_4px_14px_rgba(0,0,0,0.25)] border border-black/10">
            <span
              className="text-[12px] md:text-[13px] font-bold tracking-[0.02em] text-[#1a1a1a] whitespace-nowrap"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {label}
            </span>
            {/* Pill tail pointing down to the pin */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-[5px] w-[10px] h-[6px] overflow-hidden">
              <div className="w-[10px] h-[10px] bg-white border border-black/10 rotate-45 -mt-[5px] mx-auto" />
            </div>
          </div>
          {/* Red Kakao-style drop pin */}
          <svg width="32" height="40" viewBox="0 0 32 40" aria-hidden="true">
            <defs>
              <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.35" />
              </filter>
            </defs>
            <path
              d="M 16 0 C 7.16 0 0 7.16 0 16 C 0 26.4 16 40 16 40 C 16 40 32 26.4 32 16 C 32 7.16 24.84 0 16 0 Z"
              fill="#e94d3c"
              stroke="#ffffff"
              strokeWidth="1.5"
              filter="url(#pinShadow)"
            />
            <circle cx="16" cy="15" r="5" fill="#ffffff" />
          </svg>
        </div>
        )}
      </a>

      {/* Kakao attribution strip — required by Kakao's static-map
          terms. Re-skinned to match the dark contact panel: low-key
          translucent dark bar with cream-tinted text + the official
          카카오맵 wordmark on the left. */}
      <div className="flex items-center justify-between px-3 py-2 text-[11px] tracking-[0.04em] bg-black/40 backdrop-blur-sm text-white/80 border-t border-white/10">
        <img
          src="//t1.kakaocdn.net/localimg/localimages/07/2018/pc/common/logo_kakaomap.png"
          alt="카카오맵"
          width={72}
          height={16}
          className="opacity-90"
        />
        <a
          href={largeViewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white"
        >
          지도 크게 보기 →
        </a>
      </div>
    </div>
  );
}
