"use client";

import { useEffect, useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { useLang } from "@/lib/i18n";
import { DURATION, EASE } from "@/lib/motion";

// EmailJS 발송 설정 — .env.local에 키 채워주세요.
// 1) https://www.emailjs.com 가입 → Add Email Service (Naver/Gmail 등 bebepet0409@naver.com 연결)
// 2) Email Templates → 새 템플릿 작성, To Email = bebepet0409@naver.com, 본문에 {{name}} {{tel}} {{sido}} {{subject}} 변수
// 3) Service ID, Template ID, Public Key를 아래 환경변수에 넣고 dev 서버 재시작
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ?? "";
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ?? "";
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ?? "";

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
}

const SIDO_LIST = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
];

// Right-side drawer. Two-state mount:
//   `mounted`  — whether the panel exists in the DOM at all
//   `visible`  — whether it should be on-screen (drives the transform)
//
// On open: setMounted(true), then wait one paint frame and setVisible(true).
//   Mounting at translateX(100%) first and *then* flipping to 0 on the next
//   frame is what makes the browser actually animate the transition — if we
//   mounted with translateX(0) directly, the panel would just snap on.
// On close: setVisible(false) immediately, and unmount only after the
//   slide-out transition finishes (`DURATION.fast` ms later).
export default function RegisterModal({ open, onClose }: RegisterModalProps) {
  const { t } = useLang();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [sido, setSido] = useState("");

  // 폼 입력 상태 — EmailJS 변수로 전달하기 위해 controlled 입력으로 관리.
  const [name, setName] = useState("");
  const [tel1, setTel1] = useState("010");
  const [tel2, setTel2] = useState("");
  const [tel3, setTel3] = useState("");
  const [subject, setSubject] = useState("");
  // 제출 상태 — idle/sending/error. 성공 시 즉시 닫고 alert만 띄움.
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "error">("idle");

  // Imperative two-stage open/close — drives the slide-in animation
  // by toggling `mounted` and `visible` across frames. Lint suppression
  // is intentional: this effect IS the bridge between the parent's
  // `open` prop (an external system from the modal's perspective) and
  // the modal's animation state.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      // double rAF — first frame paints the panel off-screen,
      // second frame flips visible=true so the transition kicks in.
      const id1 = requestAnimationFrame(() => {
        const id2 = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(id2);
      });
      return () => cancelAnimationFrame(id1);
    } else {
      setVisible(false);
      const timer = window.setTimeout(() => setMounted(false), DURATION.fast);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end"
      style={{
        pointerEvents: visible ? "auto" : "none",
      }}
      aria-hidden={visible ? undefined : true}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity ${DURATION.fast}ms ${EASE}`,
        }}
      />

      {/* Drawer panel — slides in from the right edge.
          role="dialog" + aria-modal="true" + aria-labelledby로 모달 의미를
          명시. h2 id="reg-modal-title"이 모달 제목을 가리킴. */}
      <div
        className="relative h-full w-full md:w-[34vw] md:min-w-[440px] md:max-w-[560px] bg-white overflow-y-auto overflow-x-hidden shadow-2xl"
        style={{
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: `transform ${DURATION.fast}ms ${EASE}`,
          willChange: "transform",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reg-modal-title"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t("reg.close")}
          className="absolute top-5 right-5 md:top-[1.5vw] md:right-[1.5vw] w-11 h-11 md:w-9 md:h-9 flex items-center justify-center text-black/70 hover:text-black z-10"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            // 환경변수 체크 — .env.local에 EmailJS 키를 채우지 않은 상태로
            // 폼이 호출되면 명확한 에러를 띄워 사용자(개발자)가 셋업을 인지.
            if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
              console.warn(
                "[RegisterModal] EmailJS env vars are not set. " +
                  "Add NEXT_PUBLIC_EMAILJS_SERVICE_ID, NEXT_PUBLIC_EMAILJS_TEMPLATE_ID, " +
                  "NEXT_PUBLIC_EMAILJS_PUBLIC_KEY to .env.local and restart the dev server."
              );
              alert("이메일 전송 설정이 필요합니다. 관리자에게 문의해주세요.");
              return;
            }
            setSubmitState("sending");
            try {
              await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                {
                  name,
                  tel: `${tel1}-${tel2}-${tel3}`,
                  sido,
                  subject,
                },
                { publicKey: EMAILJS_PUBLIC_KEY }
              );
              setSubmitState("idle");
              // 폼 리셋
              setName("");
              setTel1("010");
              setTel2("");
              setTel3("");
              setSido("");
              setSubject("");
              alert(t("reg.success"));
              onClose();
            } catch (err) {
              console.error("[RegisterModal] EmailJS send failed:", err);
              setSubmitState("error");
              alert("전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
            }
          }}
          className="px-6 py-14 md:px-[2.5vw] md:py-[3vw] space-y-7 md:space-y-[1.6vw]"
        >
          <header className="mb-8 md:mb-[2vw]">
            <h2
              id="reg-modal-title"
              className="text-[1.75rem] md:text-[clamp(24px,2.1vw,36px)] tracking-[0.04em] leading-[1] text-black font-light"
            >
              {t("reg.title")}
            </h2>
            <p className="mt-2 md:mt-[0.5vw] text-[0.8125rem] md:text-[clamp(12px,0.8333vw,15px)] tracking-[-0.04em] text-black/70">
              {t("reg.subtitle")}
            </p>
          </header>

          {/* 이름 */}
          <Field label={t("reg.field.name")}>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-b border-black/25 py-2 outline-none text-black text-[0.9375rem] md:text-[clamp(13px,0.9vw,16px)] focus:border-black"
            />
          </Field>

          {/* 전화번호 — controlled input. EmailJS 전송 시 "010-XXXX-XXXX"로 조합. */}
          <Field label={t("reg.field.tel")}>
            <div className="flex items-center gap-2 text-black text-[0.9375rem] md:text-[clamp(13px,0.9vw,16px)]">
              <input
                value={tel1}
                onChange={(e) => setTel1(e.target.value.replace(/\D/g, ""))}
                maxLength={3}
                inputMode="numeric"
                size={3}
                className="w-[60px] md:w-[4vw] shrink-0 border-b border-black/25 py-2 text-center outline-none focus:border-black"
              />
              <span className="text-black/40 shrink-0">-</span>
              <input
                value={tel2}
                onChange={(e) => setTel2(e.target.value.replace(/\D/g, ""))}
                maxLength={4}
                inputMode="numeric"
                size={4}
                required
                className="flex-1 min-w-0 border-b border-black/25 py-2 text-center outline-none focus:border-black"
              />
              <span className="text-black/40 shrink-0">-</span>
              <input
                value={tel3}
                onChange={(e) => setTel3(e.target.value.replace(/\D/g, ""))}
                maxLength={4}
                inputMode="numeric"
                size={4}
                required
                className="flex-1 min-w-0 border-b border-black/25 py-2 text-center outline-none focus:border-black"
              />
            </div>
          </Field>

          {/* 지역 — custom dropdown that always opens downward */}
          <Field label={t("reg.field.address")}>
            <SelectField
              value={sido}
              onChange={setSido}
              placeholder={t("reg.field.address.sido")}
              options={SIDO_LIST}
            />
          </Field>

          {/* 상담목적 — free-text textarea (replaced the previous fixed
              4-option radio chip list per client request). */}
          <Field label={t("reg.field.subject")}>
            <textarea
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              rows={3}
              placeholder={t("reg.field.subject.placeholder")}
              className="w-full border border-black/20 rounded-md px-3 py-2.5 md:px-[0.9vw] md:py-[0.7vw] outline-none text-black text-[0.875rem] md:text-[clamp(12px,0.8333vw,15px)] tracking-[-0.02em] leading-[1.6] focus:border-black resize-none placeholder:text-black/35"
            />
          </Field>

          {/* 개인정보 동의 */}
          <div className="pt-5 md:pt-[1.5vw] border-t border-black/10">
            <label className="flex items-start gap-2 md:gap-[0.5vw] text-[0.8125rem] md:text-[clamp(12px,0.8333vw,15px)] text-black/75 cursor-pointer">
              <input
                type="checkbox"
                required
                className="mt-[2px] appearance-none w-4 h-4 md:w-[1vw] md:h-[1vw] border border-black/40 rounded-sm checked:bg-black checked:border-black checked:after:content-['✓'] checked:after:text-white checked:after:text-[0.7rem] checked:after:flex checked:after:items-center checked:after:justify-center cursor-pointer shrink-0"
              />
              <span>
                <span className="text-black/70 mr-1">{t("reg.agree.privacy.required")}</span>
                {t("reg.agree.privacy")}
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitState === "sending"}
            className="mt-2 md:mt-[1vw] w-full min-h-[48px] py-4 md:py-[0.95vw] bg-black text-white tracking-[0.1em] text-[0.875rem] md:text-[clamp(12px,0.8333vw,15px)] font-medium hover:bg-black/85 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitState === "sending" ? "전송 중…" : t("reg.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 md:space-y-[0.5vw]">
      <span className="block text-[0.75rem] md:text-[clamp(11px,0.7292vw,13px)] tracking-[0.1em] text-black/70 font-medium uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

// Custom dropdown that always opens DOWNWARD. The native `<select>` element
// chooses its open direction based on viewport space and inside this drawer
// it would frequently flip upward, which the client requested to fix.
// We render a plain button + an absolutely positioned `<ul>` anchored at
// `top-full` so the menu is always laid out beneath the trigger.
function SelectField({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between border-b border-black/25 py-2 pr-1 bg-transparent text-left outline-none focus:border-black cursor-pointer"
      >
        <span
          className={`text-[0.9375rem] md:text-[clamp(13px,0.9vw,16px)] ${value ? "text-black" : "text-black/35"}`}
        >
          {value || placeholder}
        </span>
        <svg
          className={`text-black/40 transition-transform ${open ? "rotate-180" : ""}`}
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          aria-hidden="true"
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/15 rounded-md shadow-lg z-20 max-h-[240px] overflow-y-auto"
        >
          {options.map((o) => {
            const selected = o === value;
            return (
              <li
                key={o}
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                }}
                className={`px-3 py-2 md:px-[0.9vw] md:py-[0.5vw] text-[0.875rem] md:text-[clamp(12px,0.8333vw,15px)] cursor-pointer ${
                  selected
                    ? "bg-black text-white"
                    : "text-black hover:bg-black/5"
                }`}
              >
                {o}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
