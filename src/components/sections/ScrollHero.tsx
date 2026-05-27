"use client";

import { useEffect, useRef, useState } from "react";
import { EASE, STAGGER_MS } from "@/lib/motion";
import { useLang } from "@/lib/i18n";
import { useAsset } from "@/lib/useAssets";
import { ASSET_CARDS, ASSET_DETAILS } from "@/lib/assets";

/**
 * Hero — intro reveal + three wheel-driven stages.
 *
 * Intro (auto, ~3.6s):
 *   line     → horizontal rule draws across (0 → 36vw, scaleX)
 *   copy     → BEBE PET intro typing fades up around the line
 *   fadeOut  → copy fades out, line stays
 *   banner   → full-width thin video band appears centered on the line
 *   full     → band expands vertically to fill the viewport, line fades
 *
 * Stages (wheel-driven):
 *   1 — full-screen vis.mp4 + hero body copy
 *   2 — narrow right panel of brand.mp4 + brand copy on the left
 *   3 — full-width brand.mp4 (panel expands to cover left)
 */

interface ScrollHeroProps {
  /** Whether the hero is the currently active section. When false the
      videos fade out and pause so the transition into the next section
      doesn't show the videos getting cut off mid-frame; when re-entering
      hero from below they resume play and fade back in. Defaults to true. */
  isActive?: boolean;
  onStageChange?: (stage: 0 | 1 | 2 | 3) => void;
  /** Bumped by page.tsx when the user clicks "back to top" — resets the
      hero to stage 1 (the "평생 함께할 첫만남" composition) so returning
      from a deeper section never lands on stage 2/3 mid-state. */
  resetTick?: number;
}

type Phase = "boot" | "line" | "copy" | "fadeOut" | "banner" | "full" | "done";

const PHASE_MS = {
  boot: 300, // brief settle before the typing begins
  line: 1900, // typing-out duration (one char at a time)
  copy: 700, // post-typing hold — cursor still blinking
  hold: 500, // additional read time
  fadeOut: 650,
  banner: 1100, // horizontal unfold
  full: 1000, // vertical unfold
} as const;

const STAGE_TRANS = 750; // wheel-driven stage transition (post-intro) — copy fades, header swap. 550 → 750ms로 살짝 느리게.
// Frame layout uses the same rhythm as the intro's banner/full unfolds, so
// the stage 1↔2↔3 morph feels like it belongs to the same motion language.
// 800ms로 쿨다운 단축 — 1100ms는 Mac 트랙패드 사용자가 두 번째 swipe할 때
// 쿨다운에 막혀 "스크롤이 안 먹는다"는 인상을 받음.
const FRAME_STAGE_TRANS = 800;

// Eases
//   INTRO_EASE — soft easeInOut, used for the line + video expansion AND
//                the stage 1↔2↔3 frame morph (one consistent feel).
//   TEXT_EASE  — easeOutExpo from motion.ts, kept for crisp text fade-ups
const INTRO_EASE = "cubic-bezier(0.65, 0, 0.35, 1)";

const BANNER_HEIGHT = "28vh";

// Stage 2 panel — anchored to the BOTTOM-RIGHT corner of the viewport.
// We pin both the right edge (100vw) and bottom edge (100vh) by expressing
// the panel as a centered transform with left = (100% - W/2) and
// top = (100% - H/2). This way the morph from stage 1 (full screen) → 2
// (small bottom-right box) → 3 (full screen again) animates ONLY the left
// and top edges — the box appears to grow leftward + upward to fill,
// keeping the right + bottom corners glued in place.
const PANEL_W_VW = 22;
const PANEL_H_VH = 80;

// Sub-pixel anti-shimmer overscan. During the morph, width/left/top get
// interpolated to non-integer pixel values; combined with the video's
// object-cover crop this can produce a 1px white shimmer along the
// viewport edge. We over-extend the frame by this many pixels on each
// side so any sub-pixel mis-alignment ends up OUTSIDE the viewport, where
// fp-section's overflow:hidden clips it cleanly.
const FRAME_OVERSCAN_PX = 4;

export default function ScrollHero({ isActive = true, onStageChange, resetTick }: ScrollHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const visRef = useRef<HTMLVideoElement>(null);
  const brandRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>("boot");
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [typedChars, setTypedChars] = useState(0);
  const stageRef = useRef<1 | 2 | 3>(1);
  const phaseRef = useRef<Phase>("line");
  const lastWheelRef = useRef(0);
  // The chained intro timers are owned by a ref so the Skip button (and any
  // other early-exit path) can clear every still-pending phase transition.
  // Without this, a click that jumps straight to "done" would still see
  // setPhase("banner")/"full" fire moments later and visibly snap the hero
  // backwards into the intro.
  const introTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // While true, every transition that would normally morph the video frame
  // (or fade the video itself) is suppressed to 0ms. Used by the Skip
  // button so the jump from typing → stage 1 lands instantly at full
  // screen instead of running through the banner-unfurl + vertical-grow
  // animation. Reset on the next paint so subsequent stage 1↔2↔3 morphs
  // animate normally.
  const [skipped, setSkipped] = useState(false);
  // Stage 2 6대 자산 카드: 호버된 카드 인덱스. 활성 카드는 또렷, 나머지는
  // 0.35로 dim — 잡지/에디토리얼식 포커스 인터랙션.
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  // 디테일 패널은 hoveredCard와 별개로 관리. 카드 01 → 02처럼 다른
  // 카드로 호버가 바뀔 때도 fade-out → 컨텐츠 교체 → fade-in의 부드러운
  // 인터랙션이 나오도록, "현재 화면에 그려져 있는 카드 인덱스"와
  // "보이는지 여부"를 분리해서 단계별로 토글한다.
  const [displayedDetail, setDisplayedDetail] = useState<number | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  // Stage 2 텍스트(상단 카피 + 6장 카드) 노출 게이트. stage가 2로 바뀐
  // 직후엔 영상 프레임이 아직 좌측을 덮고 있어서 텍스트가 영상 위에
  // 미리 떠 보이는 현상이 생긴다. 프레임 morph가 충분히 진행된 뒤에
  // true로 올려 텍스트 fade-in을 시작한다. 떠날 때(stage !== 2)는
  // 지연 없이 즉시 false로 내려 영상이 다시 펴지기 전에 텍스트가 사라진다.
  const [stage2TextOn, setStage2TextOn] = useState(false);
  const { t, ta, lang } = useLang();
  // Notion Assets 자산 URL — 비어 있으면 코드의 기본 /videos/brand.mp4 사용,
  // 비어 있으면 placeholder org chart 사용.
  const heroVideoUrl = useAsset("hero_video", "");
  const orgChartUrl = useAsset("org_chart", "/images/org-chart-a.png");
  // Hero 중앙 로고 — BEBE PET 흰색 세로 워드마크 SVG (.ai 원본의 SVG 변환).
  // Notion Assets DB의 "logo" URL이 등록되면 그걸로 덮어쓰기.
  const heroLogoUrl = useAsset("logo", "/images/logo-wh-ver.svg");
  const introTypingText = t("intro.typing");

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Header theme follows phase + stage:
  //   intro (line / copy / fadeOut / banner) → 0 (light bg, dark text)
  //   full → 1 (video taking over, dark bg)
  //   done → actual stage
  useEffect(() => {
    if (phase === "done") {
      onStageChange?.(stage);
    } else if (phase === "full") {
      onStageChange?.(1);
    } else {
      onStageChange?.(0);
    }
  }, [phase, stage, onStageChange]);

  useEffect(() => {
    visRef.current?.play().catch(() => {});
    brandRef.current?.play().catch(() => {});
  }, []);

  // Pause / resume the videos as the hero section enters and leaves
  // viewport. Combined with the opacity-fade on each <video> below this
  // gives a clean cross-section handoff: the video stops playing exactly
  // as it fades out, and starts again the moment the user returns.
  useEffect(() => {
    if (isActive) {
      visRef.current?.play().catch(() => {});
      brandRef.current?.play().catch(() => {});
    } else {
      visRef.current?.pause();
      brandRef.current?.pause();
    }
  }, [isActive]);

  // Drive the character-by-character typing during the 'line' phase. Each
  // character lands on a separate setTimeout so the reveal completes exactly
  // at the line→copy boundary regardless of language length.
  useEffect(() => {
    if (phase !== "line") return;
    const total = introTypingText.length;
    if (total === 0) return;
    const charDuration = PHASE_MS.line / total;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= total; i++) {
      timers.push(setTimeout(() => setTypedChars(i), charDuration * i));
    }
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [phase, introTypingText]);

  // Auto intro sequence — chained timeouts, each phase starts when the previous ends.
  // sessionStorage 플래그로 같은 세션 내 재마운트(예: /privacy 갔다가
  // 뒤로가기) 시 인트로 자동 스킵. 플래그는 컴포넌트가 한 번이라도
  // 마운트되면 즉시 기록 — 인트로 완료 여부와 무관하게 같은 세션에선
  // 흰 화면 부트 단계가 두 번 보이지 않도록.
  useEffect(() => {
    const INTRO_KEY = "bbp-intro-seen";
    const seen =
      typeof window !== "undefined" && sessionStorage.getItem(INTRO_KEY) === "1";
    if (typeof window !== "undefined") {
      sessionStorage.setItem(INTRO_KEY, "1");
    }
    if (seen) {
      // 즉시 done 상태로. 타이핑 완료 표시 + frame 즉시 풀스크린.
      setTypedChars(introTypingText.length);
      setSkipped(true);
      setPhase("done");
      lastWheelRef.current = Date.now();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setSkipped(false));
      });
      return;
    }
    const offsets: { phase: Phase; at: number }[] = [];
    let acc = 0;
    acc += PHASE_MS.boot;
    offsets.push({ phase: "line", at: acc });
    acc += PHASE_MS.line;
    offsets.push({ phase: "copy", at: acc });
    acc += PHASE_MS.copy + PHASE_MS.hold;
    offsets.push({ phase: "fadeOut", at: acc });
    acc += PHASE_MS.fadeOut;
    offsets.push({ phase: "banner", at: acc });
    acc += PHASE_MS.banner;
    offsets.push({ phase: "full", at: acc });
    acc += PHASE_MS.full;
    offsets.push({ phase: "done", at: acc });

    const timers = offsets.map(({ phase: p, at }) =>
      setTimeout(() => {
        setPhase(p);
        if (p === "done") {
          lastWheelRef.current = Date.now();
          if (typeof window !== "undefined") {
            sessionStorage.setItem(INTRO_KEY, "1");
          }
        }
      }, at),
    );
    introTimersRef.current = timers;
    return () => {
      timers.forEach(clearTimeout);
      introTimersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Skip — bypass the intro and land on stage 1. Clears every pending
  // phase timer first so a half-finished chain can't snap us back into
  // the intro after we've already moved on. Sets `skipped` so the frame
  // jumps to full screen instantly (no banner-unfurl / vertical-grow);
  // two rAFs later the flag clears so subsequent stage morphs animate
  // normally.
  const skipIntro = () => {
    if (phaseRef.current === "done") return;
    introTimersRef.current.forEach(clearTimeout);
    introTimersRef.current = [];
    setSkipped(true);
    // Intentionally NOT setting typedChars to full here. Combined with
    // the typing wrapper using a 0ms transition while `skipped` is true,
    // this avoids a 1-frame flash of the fully-typed line as the wrapper
    // jumps from opacity:1 to 0 — it just vanishes instantly.
    setStage(1);
    setPhase("done");
    lastWheelRef.current = Date.now();
    if (typeof window !== "undefined") {
      sessionStorage.setItem("bbp-intro-seen", "1");
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setSkipped(false));
    });
  };

  // Stage 2 텍스트 게이트. stage가 2가 된 직후 프레임 morph가 거의
  // 끝나는 지점(약 75%)까지 기다렸다가 텍스트를 노출한다. 그러면
  // 1→2 (전체화면 → 우측 작은 박스) / 3→2 (하단 풀와이드 → 우측 작은 박스)
  // 어느 방향이든 영상이 좌측 영역을 충분히 비워준 뒤에 텍스트가 들어온다.
  // stage 2를 떠날 때는 지연 없이 즉시 false로 — 영상이 다시 펴지기
  // 전에 텍스트가 사라져야 겹침이 안 보인다. hover 상태도 함께 초기화.
  useEffect(() => {
    const isStage2 = phase === "done" && stage === 2;
    if (isStage2) {
      const t = setTimeout(() => setStage2TextOn(true), Math.round(FRAME_STAGE_TRANS * 0.5));
      return () => clearTimeout(t);
    }
    setStage2TextOn(false);
    setHoveredCard(null);
  }, [phase, stage]);

  // 카드 hover 인덱스 → 디테일 패널 단계 토글.
  // 1) hover 해제: 즉시 fade-out, 280ms 후 컨텐츠 언마운트
  // 2) 첫 hover (현재 표시 중인 디테일 없음): 다음 프레임에 fade-in
  // 3) 다른 카드로 hover 이동: fade-out → 180ms 후 컨텐츠 교체 + fade-in
  useEffect(() => {
    if (hoveredCard === null) {
      setDetailVisible(false);
      const t = setTimeout(() => setDisplayedDetail(null), 280);
      return () => clearTimeout(t);
    }
    if (displayedDetail === null) {
      setDisplayedDetail(hoveredCard);
      const raf = requestAnimationFrame(() => setDetailVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    if (hoveredCard === displayedDetail) {
      setDetailVisible(true);
      return;
    }
    setDetailVisible(false);
    const t = setTimeout(() => {
      setDisplayedDetail(hoveredCard);
      requestAnimationFrame(() => setDetailVisible(true));
    }, 180);
    return () => clearTimeout(t);
  }, [hoveredCard, displayedDetail]);

  // 모바일 viewport(< md, 767px 이하)에서는 stage를 항상 1로 고정한다.
  // 데스크탑에서 stage 2/3까지 advance한 뒤 창을 좁히는 케이스에서 프레임이
  // 어색한 우하단 박스 / 하단 밴드 상태로 남는 것을 방지. 휠/터치 stage
  // 핸들러는 별도로 모바일에서 비활성화되므로 정상 사용 시엔 호출되지 않고,
  // 리사이즈 엣지케이스 보호용으로만 동작한다.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      if (mq.matches && stageRef.current !== 1) setStage(1);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Back-to-top reset. page.tsx bumps `resetTick` whenever the floating
  // "맨 위로" button is clicked. We reset stage to 1 so the user lands on
  // the "평생 함께할 첫만남" composition rather than whatever stage they
  // last left the hero in. Skip the very first run (mount) so the initial
  // intro isn't stomped on.
  const resetMountRef = useRef(true);
  useEffect(() => {
    if (resetMountRef.current) {
      resetMountRef.current = false;
      return;
    }
    if (phaseRef.current !== "done") {
      // If somehow the user triggered top-reset mid-intro, fast-forward
      // through the rest of the chain so the destination is consistent.
      introTimersRef.current.forEach(clearTimeout);
      introTimersRef.current = [];
      setTypedChars(introTypingText.length);
      setPhase("done");
    }
    setStage(1);
    lastWheelRef.current = Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTick]);

  // Wheel/touch interception for stage transitions (post-intro only)
  useEffect(() => {
    const sec = sectionRef.current;
    if (!sec) return;
    const scroller = sec.closest(".fp-container") as HTMLElement | null;
    if (!scroller) return;

    const isInView = () => {
      const r = sec.getBoundingClientRect();
      // 매우 관대한 in-view 검사 — 섹션의 중심이 viewport 안에 들어있는지만
      // 체크. Mac 레티나/브라우저 줌/관성 스크롤 등 sub-pixel 변동에 강함.
      // 또한 top/bottom 양 끝 정렬 강제 대신 "겹치기만 하면 OK"로 완화.
      const vh = window.innerHeight;
      const sectionMidInView = r.top < vh && r.bottom > 0;
      return sectionMidInView;
    };

    const tryAdvance = (dir: 1 | -1, ev: Event) => {
      if (!isInView()) return;
      // Block all wheel/touch advancement during the intro
      if (phaseRef.current !== "done") {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        return;
      }
      const now = Date.now();
      if (now - lastWheelRef.current < FRAME_STAGE_TRANS) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        return;
      }
      const next = stageRef.current + dir;
      if (dir > 0) {
        if (next <= 3) {
          ev.preventDefault();
          ev.stopImmediatePropagation();
          setStage(next as 1 | 2 | 3);
          lastWheelRef.current = now;
        }
      } else {
        if (next >= 1) {
          ev.preventDefault();
          ev.stopImmediatePropagation();
          setStage(next as 1 | 2 | 3);
          lastWheelRef.current = now;
        }
      }
    };

    // Wheel "gesture" 감지.
    // 트랙패드/마우스 휠은 한 번의 사용자 입력이라도 관성으로 수십~수백
    // 개의 wheel 이벤트를 1~3초에 걸쳐 발사한다. 기존 FRAME_STAGE_TRANS
    // 쿨다운(1.1s)만으로는 이 관성 이벤트가 cooldown 경계를 여러 번
    // 넘기면서 같은 제스처 안에서 stage 1→2→3가 모두 advance되고,
    // 이어서 stage 3 시점의 휠이 또 들어와 Page 핸들러로 새어 나가
    // #index까지 한 번에 점프하는 버그가 생긴다 (Skip 직후처럼 cooldown
    // 시작 시점과 첫 휠이 가까울 때 특히 잘 재현됨).
    //
    // 해결: 마지막 이벤트로부터 GESTURE_QUIET_MS 이상 조용했다가 들어온
    // 첫 이벤트만 "새 제스처"로 보고 tryAdvance 한 번 호출. 같은 제스처
    // 내 모든 후속 이벤트(관성 포함)는 preventDefault + stopImmediate-
    // Propagation으로 Page 핸들러까지 차단해서 단일 제스처 = 단일 advance/
    // jump를 보장한다.
    // 제스처 단위 차단은 hero가 in-view일 때만 적용해야 한다. 그 외
     // 섹션에서 wheelGestureCaught를 전역적으로 토글하면, 같은 휠 제스처
     // 내 후속 이벤트가 Page 핸들러까지 차단되어 다른 섹션 사이에서
     // 스크롤이 "한 번씩만 먹는" 느낌이 난다. hero 밖에서는 그냥 즉시
     // 리턴해서 Page의 일반 jump 로직(자체 쿨다운 보유)에 맡긴다.
    // GESTURE_QUIET_MS — 마지막 휠 이벤트로부터 이 시간 이상 조용했다 들어
    // 오는 첫 이벤트만 "새 제스처"로. Mac 트랙패드 관성이 1-2s이지만 사용자
    // 가 빨리 다시 swipe하는 케이스에서 200ms는 막힘. 120ms로 단축.
    const GESTURE_QUIET_MS = 120;
    let lastWheelEventTime = 0;
    let wheelGestureCaught = false;
    // 모바일(< md, 767px 이하) + 인트로 완료 상태에서는 hero의 stage 전환
    // 핸들러를 통째로 비활성화한다. 이벤트를 건드리지 않고 그대로 흘려
    // 보내면 page.tsx의 섹션 점프 핸들러가 받아 hero → hero-recap으로 자연
    // 스럽게 이동한다. 인트로 진행 중에는 (phase !== "done") 기존 차단 로직
    // 을 유지해 인트로가 끊기지 않도록.
    const skipForMobile = () =>
      phaseRef.current === "done" &&
      window.matchMedia("(max-width: 767px)").matches;

    const onWheel = (e: WheelEvent) => {
      // Mac 트랙패드는 가벼운 손가락 터치에서 deltaY가 1~3 정도로 미세하게
      // 들어와 5 임계값으로 무시되면 사용자는 "스크롤이 먹지 않는다"고 느낌.
      // 1 미만은 거의 의도 없는 값으로 보고 무시.
      if (Math.abs(e.deltaY) < 1) return;
      if (!isInView()) return;
      if (skipForMobile()) return;
      const now = Date.now();
      if (now - lastWheelEventTime > GESTURE_QUIET_MS) {
        wheelGestureCaught = false;
      }
      lastWheelEventTime = now;
      if (wheelGestureCaught) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      tryAdvance(e.deltaY > 0 ? 1 : -1, e);
      wheelGestureCaught = true;
    };

    let touchStartY = 0;
    let touchGestureCaught = false;
    const onTouchStart = (e: TouchEvent) => {
      if (!isInView()) return;
      if (skipForMobile()) return;
      touchStartY = e.touches[0].clientY;
      touchGestureCaught = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isInView()) return;
      if (skipForMobile()) return;
      if (touchGestureCaught) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      const dy = touchStartY - e.touches[0].clientY;
      if (Math.abs(dy) < 30) return;
      tryAdvance(dy > 0 ? 1 : -1, e);
      touchGestureCaught = true;
    };

    scroller.addEventListener("wheel", onWheel, { passive: false });
    scroller.addEventListener("touchstart", onTouchStart, { passive: true });
    scroller.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      scroller.removeEventListener("wheel", onWheel);
      scroller.removeEventListener("touchstart", onTouchStart);
      scroller.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  // ─── Visual state derived from phase + stage ────────────────────
  // Section background stays light throughout — in stages 1 & 3 the full-screen
  // video covers it anyway, and in stage 2 the left 75% shows this background
  // behind the black brand copy (so it must be light, not dark).
  const sectionBg = "bg-white";

  // Intro wordmark visibility — fades in at start of 'line' phase, holds
  // through 'copy', fades out during 'fadeOut'. No accompanying line/graphic;
  // the text alone is the focal point.
  const introCopyVisible = phase === "line" || phase === "copy";

  // Video frame: hidden during line/copy/fadeOut, banner-shaped during 'banner',
  // full-screen from 'full' onward (including stage 1/2/3)
  const showVideo = phase === "banner" || phase === "full" || phase === "done";

  // Centered transform-based positioning so width grows symmetrically out of
  // the line during 'banner', then height grows during 'full'.
  // Every visible state's width/height is over-extended by FRAME_OVERSCAN_PX*2
  // so the box's edges sit a few pixels outside the viewport on every side
  // (clipped by fp-section overflow:hidden). This kills the sub-pixel
  // shimmer that otherwise crawls along the right edge during the morph.
  const OS = FRAME_OVERSCAN_PX * 2;
  let frameStyle: React.CSSProperties;
  const CENTER_TF = "translate(-50%, -50%)";
  if (phase === "banner") {
    frameStyle = {
      top: "50%",
      left: "50%",
      width: `calc(100vw + ${OS}px)`,
      height: `calc(${BANNER_HEIGHT} + ${OS}px)`,
      transform: CENTER_TF,
      opacity: 1,
    };
  } else if (
    phase === "full" ||
    (phase === "done" && stage === 1)
  ) {
    // Stage 1: full-screen vis.mp4
    frameStyle = {
      top: "50%",
      left: "50%",
      width: `calc(100vw + ${OS}px)`,
      height: `calc(100vh + ${OS}px)`,
      transform: CENTER_TF,
      opacity: 1,
    };
  } else if (phase === "done" && stage === 2) {
    // Stage 2 — bottom-right corner box. Right edge pinned at 100vw,
    // bottom edge pinned at 100vh; only the left + top edges move during
    // the stage 1↔2 morph.
    frameStyle = {
      top: `calc(100% - ${PANEL_H_VH / 2}vh)`,
      left: `calc(100% - ${PANEL_W_VW / 2}vw)`,
      width: `calc(${PANEL_W_VW}vw + ${OS}px)`,
      height: `calc(${PANEL_H_VH}vh + ${OS}px)`,
      transform: CENTER_TF,
      opacity: 1,
    };
  } else if (phase === "done" && stage === 3) {
    // Stage 3 — bottom band. Same height + bottom edge as stage 2, but the
    // width is now 100vw, so the morph from stage 2 only animates the LEFT
    // edge (78vw → 0). Top stays at the same line as stage 2 (no upward
    // expansion), so the upper portion of the viewport remains the white
    // section background with the left-side brand copy on top.
    frameStyle = {
      top: `calc(100% - ${PANEL_H_VH / 2}vh)`,
      left: "50%",
      width: `calc(100vw + ${OS}px)`,
      height: `calc(${PANEL_H_VH}vh + ${OS}px)`,
      transform: CENTER_TF,
      opacity: 1,
    };
  } else {
    // line / copy / fadeOut — width 0 (invisible), centered, ready to sweep
    frameStyle = {
      top: "50%",
      left: "50%",
      width: 0,
      height: BANNER_HEIGHT,
      transform: CENTER_TF,
      opacity: 0,
    };
  }

  const frameTransitionMs = skipped
    ? 0
    : phase === "banner"
      ? PHASE_MS.banner
      : phase === "full"
        ? PHASE_MS.full
        : FRAME_STAGE_TRANS;
  const videoFadeMs = skipped ? 0 : STAGE_TRANS;

  const showVis = stage <= 1;
  const showBrand = stage >= 2;

  return (
    <section
      ref={sectionRef}
      className={`fp-section ${sectionBg} transition-colors duration-[800ms]`}
      id="hero"
    >
      {/* ── Intro typewriter copy — chars reveal one at a time, then fade out ── */}
      <div
        className="absolute left-1/2 top-1/2 z-25 pointer-events-none -translate-x-1/2 -translate-y-1/2 max-w-[90vw] text-center px-5"
        style={{
          opacity: introCopyVisible ? 1 : 0,
          // 0ms transition while `skipped` is true so the wrapper hides
          // synchronously with the frame snap — without this the user
          // would see the typed-so-far text linger for 650ms after they
          // pressed Skip, which is the awkward flash being eliminated.
          transition: `opacity ${skipped ? 0 : PHASE_MS.fadeOut}ms ${INTRO_EASE}`,
        }}
      >
        <span className="text-black text-[1.125rem] md:text-[clamp(20px,1.6667vw,28px)] leading-[1.5] tracking-[-0.025em] font-light">
          {introTypingText.slice(0, typedChars)}
          {(phase === "line" || phase === "copy") && (
            <span
              className="inline-block w-[1.5px] md:w-[0.12vw] bg-black/75 align-middle ml-[3px] animate-blink"
              style={{ height: "1em" }}
            />
          )}
        </span>
      </div>

      {/* ── Video frame ─────────────────────────────────────────── */}
      {/* `willChange` + `translateZ(0)` promote both the frame and each video
          to their own GPU compositing layer. Without this the browser repaints
          the videos on every layout tick during the morph, which shows up as a
          choppy / low-FPS feel. With it, the videos decode + paint on the
          compositor thread and the morph is just a transform on top. */}
      <div
        className="absolute z-10 overflow-hidden"
        style={{
          ...frameStyle,
          transitionProperty: "top, left, width, height, opacity, transform",
          transitionDuration: `${frameTransitionMs}ms`,
          transitionTimingFunction: INTRO_EASE,
          willChange: "top, left, width, height, transform",
          backfaceVisibility: "hidden",
        }}
      >
        <video
          ref={visRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: showVis && showVideo && isActive ? 1 : 0,
            transition: `opacity ${videoFadeMs}ms ${EASE}`,
            // scale(1.01) over-fills the frame by ~0.5% on every side so the
            // object-cover crop line falls outside the visible box, hiding
            // the sub-pixel shimmer that surfaces during morph interpolation.
            transform: "translateZ(0) scale(1.01)",
            transformOrigin: "center center",
            willChange: "opacity, transform",
            backfaceVisibility: "hidden",
          }}
          src="/videos/hero-main.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <video
          ref={brandRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: showBrand && showVideo && isActive ? 1 : 0,
            transition: `opacity ${videoFadeMs}ms ${EASE}`,
            transform: "translateZ(0) scale(1.01)",
            transformOrigin: "center center",
            willChange: "opacity, transform",
            backfaceVisibility: "hidden",
          }}
          src={heroVideoUrl || "/videos/hero-sub.mp4"}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        {/* Dark overlay only on stage 1 (white hero copy on top of vis.mp4).
            Stage 3 keeps the left-side brand copy in BLACK on top of the
            full-bleed brand.mp4, so we leave the video un-dimmed there. */}
        <div
          className="absolute inset-0 bg-black/25"
          style={{
            opacity: phase === "done" && stage === 1 && isActive ? 1 : 0,
            transition: `opacity ${videoFadeMs}ms ${EASE}`,
          }}
        />
      </div>

      {/* ── Hero 중앙 로고 placeholder (stage 1) ─
          이전 텍스트(베베펫에서 시작되는 평생의 동행 / 평생 함께할 첫만남)는
          제거하고, 클라이언트 요청에 따라 화면 중앙에 로고를 노출.
          Notion Assets DB에 "logo" URL이 등록되면 <img>로, 없으면 점선
          박스 placeholder로 노출. 운영자가 자산 입고하면 자동 교체됨. */}
      {(() => {
        const visible = phase === "done" && stage === 1;
        return (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
            style={{
              opacity: visible ? 1 : 0,
              transition: `opacity ${STAGE_TRANS}ms ${EASE}`,
            }}
            aria-hidden={!visible}
          >
            {heroLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroLogoUrl}
                alt="BEBE PET"
                className="max-md:max-h-[120px] md:max-h-[clamp(140px,18vw,260px)] w-auto"
              />
            ) : (
              <div
                className="flex items-center justify-center text-white/80"
                style={{
                  width: "clamp(140px, 16vw, 240px)",
                  aspectRatio: "1 / 1",
                  border: "1px dashed rgba(255,255,255,0.5)",
                  borderRadius: "8px",
                  fontSize: "clamp(13px, 0.9vw, 16px)",
                  letterSpacing: "0.25em",
                  fontWeight: 500,
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(2px)",
                }}
              >
                LOGO
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Hero 우측 하단 — 스크롤 인디케이터만 (텍스트 카피는 제거됨) ─ */}
      <div className="absolute inset-0 z-30 flex flex-col items-end justify-end text-right text-white pointer-events-none px-5 pb-10 md:px-[5vw] md:pb-[10vh]">
        {/* Minimal scroll indicator — thin vertical track + a soft highlight
            looping top→bottom. Visible only on stage 1; fades with the rest
            of the hero copy on stage advance. */}
        {(() => {
          const visible = phase === "done" && stage === 1;
          return (
            <div
              className="mt-10 md:mt-[3vw] relative w-px h-12 md:h-[3.5vw] bg-white/25 overflow-hidden"
              style={{
                opacity: visible ? 1 : 0,
                transition: `opacity ${STAGE_TRANS}ms ${EASE} ${4 * STAGGER_MS}ms`,
              }}
              aria-hidden="true"
            >
              <span className="absolute inset-x-0 top-0 h-1/3 bg-white animate-scroll-flow" />
            </div>
          );
        })()}
      </div>

      {/* ── 6대 자산 (stage 2 only) ───────────────────────────────────
          이전 "동 행, 가족이 되어 ..." 카피 자리.
          - 회사명(베베펫코리아) 헤드라인 + 라벨 + 6개 카드(가로 한 줄)
          - 영상이 우측 좁은 패널로 줄어든 stage 2에서만 노출
          - stage 3로 영상이 좌측을 휩쓸 때는 함께 페이드 아웃
          - 좌측 정렬·하단 정렬·스태거 페이드 업은 이전 카피 시그너처 유지 */}
      {/* 모바일에서는 hidden — Sub-stage 3.5.2에서 모바일 전용 6대자산 세로
          카드 리스트로 별도 재구성될 예정. 데스크탑(md 이상)에서는 기존
          stage 2 컴포지션(6장 가로 카드 + 호버 디테일) 그대로 유지. */}
      <div
        className="absolute z-20 hidden md:flex flex-col gap-10 md:gap-[3vh] px-5 md:pl-[11.1111vw] pt-10 md:pt-[5vh] pb-16 md:pb-[10vh]"
        style={{
          top: `${100 - PANEL_H_VH}vh`,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: phase === "done" && stage === 2 ? "auto" : "none",
        }}
      >
        {(() => {
          const visible = stage2TextOn;
          const lineStyle = (i: number): React.CSSProperties => ({
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(-18px)",
            transition: `opacity ${STAGE_TRANS}ms ${EASE} ${i * STAGGER_MS}ms, transform ${STAGE_TRANS}ms ${EASE} ${i * STAGGER_MS}ms`,
          });
          // 표시 중인 디테일은 displayedDetail이 결정한다 (hoveredCard는
          // "사용자 의도" 만 표현). 카드 전환 시 useEffect가 fade-out →
          // 교체 → fade-in 사이클로 displayedDetail/detailVisible을 토글.
          const detail = displayedDetail !== null ? ASSET_DETAILS[displayedDetail] : null;
          const showDetail = !!detail;
          // "베베펫코리아" 기본 블록은 사용자가 카드를 호버하는 즉시
          // 사라져야 한다 — 그래야 디테일이 등장할 빈 자리가 미리 비워진다.
          const userHovering = hoveredCard !== null;
          return (
            <>
              {/* ── 상단 그룹: 기본은 태그라인 + "베베펫코리아",
                     카드 hover 시 같은 자리에 해당 자산의 상세 패널이
                     크로스페이드로 들어온다. 두 블록을 absolute로 겹쳐
                     opacity로만 전환 — 레이아웃 점프 없음. ── */}
              <div className="relative max-w-[58vw]" style={{ color: "#000", minHeight: "22vw" }}>
                {/* 기본: 베베펫코리아 */}
                <div
                  style={{
                    opacity: visible && !userHovering ? 1 : 0,
                    transition: `opacity 320ms ${INTRO_EASE}`,
                    pointerEvents: userHovering ? "none" : "auto",
                  }}
                >
                  <p
                    className="text-[1rem] md:text-[clamp(15px,1.08vw,19px)] tracking-[-0.02em] text-black mb-2 md:mb-[0.45vw]"
                    style={lineStyle(0)}
                  >
                    {t("assets.tagline")}
                  </p>
                  <p
                    className="text-[3.75rem] md:text-[clamp(48px,3.9vw,68px)] leading-[1.2] tracking-[0.02em] font-light"
                    style={lineStyle(1)}
                  >
                    {t("assets.company")}
                  </p>
                </div>

                {/* Hover: 자산 상세 패널. detailVisible은 useEffect가
                    fade-out → 컨텐츠 교체 → fade-in 단계에서 토글하므로,
                    카드 01 → 02 전환 시에도 자연스러운 스르륵 인터랙션이
                    이어진다. */}
                <div
                  className="absolute inset-0"
                  style={{
                    opacity: detailVisible ? 1 : 0,
                    transform: detailVisible ? "translateY(0)" : "translateY(8px)",
                    transition: `opacity 260ms ${INTRO_EASE}, transform 320ms ${INTRO_EASE}`,
                    pointerEvents: detailVisible ? "auto" : "none",
                  }}
                >
                  {detail && (
                    <>
                      <p
                        className="text-[0.75rem] md:text-[clamp(12px,0.8333vw,15px)] tracking-[0.18em] uppercase text-black/70 font-medium mb-2 md:mb-[0.6vw]"
                      >
                        <span style={{ color: "#3aa676" }}>{String((displayedDetail ?? 0) + 1).padStart(2, "0")}</span> · {detail.name[lang]}
                      </p>
                      <p className="text-[1.5rem] md:text-[clamp(20px,1.7vw,28px)] leading-[1.3] tracking-[-0.01em] font-light text-black mb-4 md:mb-[1.3vw]">
                        {detail.tagline[lang]}
                      </p>
                      <ul className="space-y-2.5 md:space-y-[0.7vw] max-w-[44vw]">
                        {detail.points[lang].map((p, i) => (
                          <li key={i} className="flex gap-3 md:gap-[0.7vw]">
                            {/* 불릿: 라벨의 첫 글자 baseline에 정렬되는
                                작은 정사각형 마커. 브랜드 포인트 컬러
                                초록색으로 시선 유도. */}
                            <span
                              aria-hidden="true"
                              style={{
                                display: "inline-block",
                                flexShrink: 0,
                                width: "0.32vw",
                                height: "0.32vw",
                                marginTop: "0.55vw",
                                backgroundColor: "#3aa676",
                              }}
                            />
                            <div className="flex-1">
                              <span className="block text-[0.85rem] md:text-[clamp(12px,0.85vw,15px)] tracking-[-0.01em] font-semibold leading-[1.45] text-black">
                                {p.label}
                              </span>
                              <span className="block text-[0.75rem] md:text-[clamp(11px,0.73vw,13px)] tracking-[-0.01em] leading-[1.6] text-black/75 mt-0.5 md:mt-[0.15vw]">
                                {p.body}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>

              {/* ── 하단 그룹: 라벨 + 6개 자산 카드 (에디토리얼) ──
                  · 박스/보더 제거. 카드 사이는 1px 세로 디바이더.
                  · 각 카드 상단: 큰 번호(01–06) + 제목 + 본문.
                  · Hover 시: 비활성 카드는 0.35로 dim, 활성 카드는 살짝
                    위로 떠오르며 번호 아래 검정 액센트 바가 좌→우로 자란다.
                    pointerEvents가 stage===2 일 때만 켜지므로 다른 stage에서는
                    호버 효과가 동작하지 않는다. */}
              {/* max-w 산출:
                  좌측 패딩 11.11vw + 그리드 폭 ≤ 영상 좌측 가장자리(78vw)
                  → 그리드 폭 ≤ ~66vw. 영상까지 시각적 여유 약 3vw를 두려고
                  64vw로 고정 — 카드 6개가 영상 박스를 침범하지 않는다.
                  mt-[4vh]로 상단 태그라인 블록과의 간격을 살짝 띄움. */}
              <div className="max-w-[64vw] md:mt-[3vh]" style={{ color: "#000" }}>
                <p
                  className="text-[0.9375rem] md:text-[clamp(12px,0.8333vw,15px)] tracking-[0.18em] uppercase text-black/70 mb-4 md:mb-[1.2vw] font-medium"
                  style={lineStyle(2)}
                >
                  {t("assets.label")}
                </p>
                <div
                  // -ml-[0.9vw]로 그리드 전체를 좌측으로 살짝 이동 — 카드 안
                  // 좌측 padding(0.9vw)을 상쇄해 첫 카드의 "01"이 위 라벨
                  // ("BEBE PET'S 6 BRAND ASSETS")의 시작 X와 정렬되도록.
                  className="grid grid-cols-3 md:grid-cols-6 md:-ml-[0.9vw]"
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {ASSET_CARDS.map((card, i) => {
                    const isHover = hoveredCard === i;
                    const isDim = hoveredCard !== null && !isHover;
                    return (
                      <div
                        key={card.titleKey}
                        onMouseEnter={() => setHoveredCard(i)}
                        style={{
                          ...lineStyle(3 + i),
                          opacity: visible ? (isDim ? 0.35 : 1) : 0,
                          transform: visible
                            ? isHover
                              ? "translateY(-4px)"
                              : "translateY(0)"
                            : "translateY(-18px)",
                          transition: `opacity 280ms ${INTRO_EASE}, transform 320ms ${INTRO_EASE}`,
                          padding: "0 0.9vw 0.2vw 0.9vw",
                          borderLeft: i === 0 ? "none" : "1px solid rgba(0,0,0,0.14)",
                          background: "transparent",
                          minHeight: "7vw",
                          cursor: "pointer",
                          position: "relative",
                        }}
                        className="flex flex-col"
                      >
                        {/* 번호만 — 액센트 바(_/하이픈 모양) 제거 */}
                        <div className="mb-2 md:mb-[0.7vw]">
                          <span
                            style={{
                              fontSize: "1.25vw",
                              lineHeight: 1,
                              letterSpacing: "0.02em",
                              fontWeight: 500,
                              color: "#3aa676",
                            }}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </div>

                        {/* 제목 */}
                        <span
                          className="block text-[0.95rem] md:text-[clamp(13px,0.9375vw,16px)] tracking-[-0.01em] font-semibold leading-[1.2] mb-1 md:mb-[0.4vw] text-black"
                        >
                          {t(card.titleKey)}
                        </span>

                        {/* 본문 (모든 라인 노출, 자연 줄바꿈) */}
                        <div className="text-[0.7rem] md:text-[clamp(10px,0.6771vw,12px)] tracking-[-0.01em] leading-[1.55] text-black/80">
                          {ta(card.summaryKey).map((line, li) => (
                            <p key={li}>{line}</p>
                          ))}
                        </div>

                        {/* hover 힌트 아이콘 — 카드 우측 하단 화살표. 기본 흐릿,
                            hover 시 진해지고 살짝 이동. */}
                        <svg
                          aria-hidden="true"
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            position: "absolute",
                            right: "1.8vw",
                            bottom: "0.6vw",
                            color: "#000",
                            opacity: isHover ? 0.85 : 0.3,
                            transform: isHover
                              ? "translate(2px, -2px)"
                              : "translate(0, 0)",
                            transition: `opacity 240ms ${INTRO_EASE}, transform 240ms ${INTRO_EASE}`,
                            pointerEvents: "none",
                          }}
                        >
                          <path d="M3 11L11 3M11 3H5M11 3V9" />
                        </svg>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* ── Stage 3 콘텐츠 (가로로 확장된 brand.mp4 위에 오버레이) ──
          영상 밴드(하단 68vh) 위에 직접 얹는다. 영상이 어두운 톤이라
          텍스트는 흰색 + 가독성을 위한 미세 그라데이션 오버레이. 좌측엔
          TRUST 카피, 우측엔 조직도 플레이스홀더가 한 컴포지션으로 배치.
          z-30으로 video(z-10) 위에 오게 한다. */}
      <div
        className="absolute z-30 hidden md:flex items-stretch"
        style={{
          top: `${100 - PANEL_H_VH}vh`,
          left: 0,
          right: 0,
          bottom: 0,
          padding: "6vh 11.1111vw 5vh 11.1111vw",
          pointerEvents: phase === "done" && stage === 3 ? "auto" : "none",
        }}
      >
        {/* 영상 위 텍스트 가독성을 위한 좌→우 그라데이션 오버레이.
            영상 자체는 그대로 두고 좌측만 살짝 어둡게 — 우측 조직도
            영역도 부드럽게 dim. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.45) 100%)",
            opacity: phase === "done" && stage === 3 ? 1 : 0,
            transition: `opacity ${STAGE_TRANS}ms ${INTRO_EASE}`,
          }}
        />
        {(() => {
          const visible = phase === "done" && stage === 3;
          const fadeStyle = (i: number): React.CSSProperties => ({
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(-18px)",
            transition: `opacity ${STAGE_TRANS}ms ${INTRO_EASE} ${i * STAGGER_MS}ms, transform ${STAGE_TRANS}ms ${INTRO_EASE} ${i * STAGGER_MS}ms`,
          });
          return (
            <>
              {/* TRUST 라벨 + 태그라인 + 조직도 — 모두 좌측 컬럼에
                  세로로 쌓이는 단일 뭉치. 우측 영역은 영상 그대로 노출. */}
              <div className="relative flex-1 flex flex-col justify-start max-w-[44vw]">
                <p
                  className="text-[clamp(13px,0.9375vw,16px)] tracking-[0.22em] uppercase text-white/70 font-medium mb-[1vw]"
                  style={fadeStyle(0)}
                >
                  {t("stage3.label")}
                </p>
                <div
                  className="text-[clamp(24px,2vw,32px)] leading-[1.35] tracking-[-0.01em] font-light text-white"
                  style={fadeStyle(1)}
                >
                  {ta("stage3.tagline").map((line, li) => (
                    <p key={li}>{line}</p>
                  ))}
                </div>

                {/* 조직도 — Notion Assets "org_chart" URL이 있으면 그 이미지,
                    없으면 placeholder OrgNode 묶음을 노출. */}
                <div
                  className="w-full max-w-[28vw] mt-[4vh]"
                  style={fadeStyle(2)}
                >
                  <p className="text-[clamp(11px,0.7292vw,13px)] tracking-[0.18em] uppercase text-white/65 font-medium mb-[0.6vw]">
                    {t("stage3.orgChart.title")}
                  </p>
                  {orgChartUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={orgChartUrl}
                      alt={t("stage3.orgChart.title")}
                      className="w-full h-auto"
                    />
                  ) : (
                    <div
                      className="relative w-full"
                      style={{
                        aspectRatio: "16 / 9",
                        border: "1px dashed rgba(255,255,255,0.35)",
                        borderRadius: "2px",
                        background: "rgba(255,255,255,0.06)",
                        backdropFilter: "blur(6px)",
                        WebkitBackdropFilter: "blur(6px)",
                        padding: "1.2vw",
                      }}
                      aria-label={t("stage3.orgChart.placeholder")}
                    >
                      <div className="h-full flex flex-col items-center justify-center gap-[0.6vw]">
                        <OrgNode label="대표이사" emphasis onVideo />
                        <div style={{ width: "1px", height: "0.8vw", background: "rgba(255,255,255,0.45)" }} />
                        <div className="flex items-stretch gap-[0.55vw]">
                          <OrgNode label="의료" onVideo />
                          <OrgNode label="미용" onVideo />
                          <OrgNode label="글로벌" onVideo />
                          <OrgNode label="시스템" onVideo />
                          <OrgNode label="마케팅" onVideo />
                        </div>
                        <p className="mt-[0.6vw] text-[clamp(10px,0.625vw,12px)] tracking-[-0.01em] text-white/55">
                          {t("stage3.orgChart.placeholder")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Skip — small, low-key intro bypass. Pinned below the centered
          typing line and shifted ~14.5vw to the right of center.
          Visibility is tied to the same phases as the typing wrapper
          (line + copy). The translateY only applies BEFORE typing starts
          (phase="boot"); from line phase onward the button is locked at
          y=0 and exit happens via opacity only — matching the typing
          line, which also fades in place rather than dropping. While
          `skipped` is true the transition collapses to 0ms so a Skip
          click vanishes synchronously with the typing line and the
          frame snap. */}
      {(() => {
        const skipReady = phase === "line" || phase === "copy";
        const exitMs = skipped ? 0 : PHASE_MS.fadeOut;
        // Pre-entry only: 8px below resting position. Once typing starts
        // the transform commits to y=0 and stays there, so the exit fade
        // doesn't drag the button down.
        const yOffset = phase === "boot" ? "8px" : "0px";
        return (
          <button
            type="button"
            onClick={skipIntro}
            aria-label="Skip intro"
            className="absolute z-40 left-1/2 flex items-center gap-1.5 md:gap-[0.4vw] text-black hover:opacity-70 top-[calc(50%+28px)] md:top-[calc(50%+2.6vw)]"
            style={{
              transform: `translate(calc(-50% + 14.5vw), ${yOffset})`,
              opacity: skipReady ? 1 : 0,
              pointerEvents: skipReady ? "auto" : "none",
              transition: `opacity ${exitMs}ms ${INTRO_EASE}, transform ${exitMs}ms ${INTRO_EASE}`,
            }}
          >
            <span className="text-[0.6875rem] md:text-[clamp(10px,0.6771vw,12px)] tracking-[0.22em] uppercase font-medium">
              Skip
            </span>
            <span
              aria-hidden="true"
              className="text-[0.6875rem] md:text-[clamp(10px,0.6771vw,12px)] font-medium tracking-[-0.05em]"
            >
              {">>"}
            </span>
          </button>
        );
      })()}
    </section>
  );
}

// Stage 3 조직도 플레이스홀더용 작은 박스. 실제 조직도 이미지가
// 들어오면 이 컴포넌트와 사용처(OrgNode들)는 <img />로 치환된다.
// onVideo=true면 어두운 영상 위에 얹히는 흰색 톤 변형을 쓴다.
function OrgNode({
  label,
  emphasis = false,
  onVideo = false,
}: {
  label: string;
  emphasis?: boolean;
  onVideo?: boolean;
}) {
  const stroke = onVideo
    ? emphasis
      ? "rgba(255,255,255,0.9)"
      : "rgba(255,255,255,0.55)"
    : emphasis
      ? "rgba(0,0,0,0.7)"
      : "rgba(0,0,0,0.3)";
  const bg = onVideo
    ? emphasis
      ? "rgba(255,255,255,0.18)"
      : "rgba(255,255,255,0.08)"
    : emphasis
      ? "rgba(0,0,0,0.04)"
      : "transparent";
  const fg = onVideo ? "#fff" : "#000";
  return (
    <div
      className="flex items-center justify-center"
      style={{
        minWidth: emphasis ? "4.4vw" : "3.2vw",
        padding: emphasis ? "0.5vw 0.8vw" : "0.4vw 0.55vw",
        border: `1px solid ${stroke}`,
        borderRadius: "2px",
        background: bg,
      }}
    >
      <span
        className="whitespace-nowrap"
        style={{
          fontSize: emphasis ? "0.7292vw" : "0.6771vw",
          letterSpacing: "-0.01em",
          fontWeight: emphasis ? 600 : 500,
          color: fg,
        }}
      >
        {label}
      </span>
    </div>
  );
}
