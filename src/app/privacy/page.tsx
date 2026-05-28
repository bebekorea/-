import Link from "next/link";

export const metadata = {
  title: "개인정보처리방침 | BEBE PET",
  description:
    "베베펫(BEBE PET) 방문 예약 시 수집되는 개인정보의 항목, 이용 목적, 보유 기간 및 이용자의 권리에 관한 안내입니다.",
};

/**
 * Privacy policy — required by Korean PIPA (개인정보 보호법) for any
 * service that collects personal information (the reservation modal
 * collects 이름 / 전화번호 / 지역 / 상담목적). Sections mirror the
 * standard Korean small-business 개인정보처리방침 template; values are
 * tuned to what the reservation form actually collects.
 *
 * Static page — no client interactivity, server-renderable.
 */
export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-black px-5 md:px-[8vw] py-16 md:py-[6vw]">
      <div className="max-w-[840px] mx-auto">
        {/* Breadcrumb / nav back home */}
        <nav className="mb-8 md:mb-[2vw] text-[0.75rem] md:text-[clamp(11px,0.7292vw,13px)] tracking-[0.18em] text-black/60">
          <Link href="/" className="hover:text-black uppercase">
            HOME
          </Link>
          <span className="mx-2">/</span>
          <span className="text-black uppercase">Privacy</span>
        </nav>

        <header className="mb-10 md:mb-[3vw] border-b border-black/10 pb-6 md:pb-[1.5vw]">
          <p className="text-[0.75rem] md:text-[clamp(11px,0.7292vw,13px)] tracking-[0.3em] uppercase font-medium text-black/55 mb-3 md:mb-[0.6vw]">
            BEBE PET
          </p>
          <h1 className="text-[1.75rem] md:text-[clamp(30px,2.5vw,44px)] tracking-[-0.01em] font-light leading-[1.2]">
            개인정보처리방침
          </h1>
        </header>

        <article className="space-y-10 md:space-y-[3vw] text-[0.9375rem] md:text-[clamp(13px,0.9375vw,16px)] leading-[1.9] tracking-[-0.02em] text-black/80">
          <p>
            베베펫코리아(이하 &ldquo;회사&rdquo;라 합니다)는 이용자의 개인정보를
            중요시하며, 「개인정보 보호법」 등 관련 법령을 준수하기 위하여 본
            개인정보처리방침을 수립·공개합니다.
          </p>

          <Section number={1} title="수집하는 개인정보의 항목 및 수집 방법">
            <p className="mb-3">
              회사는 방문 예약 및 상담 신청 처리를 위하여 다음의 개인정보를
              수집합니다.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-black/40">
              <li>필수 항목: 이름, 전화번호, 지역(시/도), 상담목적</li>
              <li>
                자동 수집 항목: 서비스 이용 기록, 접속 로그, IP 주소, 쿠키
              </li>
            </ul>
            <p className="mt-3">
              수집 방법: 홈페이지 내 방문예약 신청 양식, 전화·서면 등을 통한
              상담 접수 시 수집됩니다.
            </p>
          </Section>

          <Section number={2} title="개인정보의 수집 및 이용 목적">
            <ul className="list-disc pl-5 space-y-1.5 marker:text-black/40">
              <li>방문 예약 접수 및 상담 진행 안내</li>
              <li>입양·진료·미용·스파 등 서비스 제공 관련 연락</li>
              <li>고객 문의 및 불만 사항 처리</li>
              <li>서비스 운영을 위한 통계 자료 작성</li>
            </ul>
          </Section>

          <Section number={3} title="개인정보의 보유 및 이용 기간">
            <p>
              수집·이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
              단, 관계 법령의 규정에 의하여 보존할 필요가 있는 경우에는 일정
              기간 동안 보관합니다.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-black/40 mt-3">
              <li>
                계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의 소비자
                보호에 관한 법률)
              </li>
              <li>
                소비자의 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래 등에서의
                소비자 보호에 관한 법률)
              </li>
              <li>웹사이트 방문 기록: 3개월 (통신비밀보호법)</li>
            </ul>
          </Section>

          <Section number={4} title="개인정보의 제3자 제공">
            <p>
              회사는 이용자의 개인정보를 본 방침에서 명시한 범위 내에서만
              처리하며, 이용자의 사전 동의 없이 본래 수집 목적의 범위를 초과하여
              제공하지 않습니다. 다만, 법령의 규정에 의거하거나 수사 목적으로
              법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우는
              예외로 합니다.
            </p>
          </Section>

          <Section number={5} title="개인정보 처리의 위탁">
            <p>
              회사는 원활한 서비스 제공을 위하여 개인정보 처리 업무 일부를 외부
              전문 업체에 위탁할 수 있으며, 위탁 시 「개인정보 보호법」 제26조에
              따라 위탁 계약 체결 시 개인정보가 안전하게 관리될 수 있도록 필요한
              사항을 규정합니다.
            </p>
          </Section>

          <Section number={6} title="이용자의 권리 및 행사 방법">
            <p>
              이용자는 언제든지 본인의 개인정보 열람, 정정, 삭제, 처리정지를
              요청할 수 있으며, 동의를 철회할 수 있습니다. 권리 행사는 아래
              연락처로 서면, 전화 또는 이메일을 통해 요청하실 수 있으며, 회사는
              지체 없이 조치하겠습니다.
            </p>
          </Section>

          <Section number={7} title="개인정보의 안전성 확보 조치">
            <ul className="list-disc pl-5 space-y-1.5 marker:text-black/40">
              <li>개인정보 취급 직원의 최소화 및 정기 교육</li>
              <li>개인정보 처리 시스템에 대한 접근 권한 관리</li>
              <li>개인정보의 암호화 전송 및 저장</li>
              <li>해킹 등에 대비한 보안 프로그램 설치 및 점검</li>
            </ul>
          </Section>

          <Section number={8} title="개인정보 보호책임자">
            <dl className="space-y-1.5">
              <div className="flex gap-3">
                <dt className="w-[80px] md:w-[6vw] shrink-0 text-black/55">
                  이름
                </dt>
                <dd>베베펫코리아 개인정보 보호 담당자</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-[80px] md:w-[6vw] shrink-0 text-black/55">
                  연락처
                </dt>
                <dd>1577-3401</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-[80px] md:w-[6vw] shrink-0 text-black/55">
                  이메일
                </dt>
                <dd>bebepet0409@naver.com</dd>
              </div>
            </dl>
          </Section>

          <Section number={9} title="개인정보처리방침의 변경">
            <p>
              본 방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의
              추가, 삭제 및 정정이 있는 경우에는 변경 사항의 시행 7일 전부터
              공지사항을 통하여 고지하겠습니다.
            </p>
            <p className="mt-3 text-black/55">
              본 개인정보처리방침은 2026년 5월 2일부터 시행됩니다.
            </p>
          </Section>
        </article>

        <footer className="mt-12 md:mt-[4vw] pt-6 md:pt-[1.5vw] border-t border-black/10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[0.875rem] md:text-[clamp(12px,0.8333vw,15px)] tracking-[-0.02em] text-black/70 hover:text-black"
          >
            ← 홈으로 돌아가기
          </Link>
        </footer>
      </div>
    </main>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-[1.0625rem] md:text-[clamp(14px,1.0417vw,18px)] font-semibold tracking-[-0.02em] text-black mb-3 md:mb-[1vw]">
        {number}. {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
