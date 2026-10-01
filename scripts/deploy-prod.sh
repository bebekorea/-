#!/bin/zsh
# 라이브(www.bebepetkorea.co.kr) 배포
#
# git push 는 배포가 아니다. Vercel 개인 계정(rjsduq0123-9970)의 bebepet 프로젝트에 CLI로 올린다.
# repo 폴더에서 바로 vercel deploy 하면 커밋 작성자(wholebigkr)가 Vercel 계정에 연결돼 있지 않아
# BLOCKED(TEAM_ACCESS_REQUIRED) 되므로, .git 을 뺀 임시 복사본에서 올린다.
#
# 사용법 (bebepet 폴더에서):
#   zsh scripts/deploy-prod.sh           복사본 만들고 바로 배포
#   zsh scripts/deploy-prod.sh --check   복사본만 만들어 내용 확인 (배포 안 함)
# 처음 한 번은 vercel login 이 필요하다.

set -euo pipefail

ROOT="${0:A:h:h}"
STAGE="$(mktemp -d -t bebepet-deploy)"
trap 'rm -rf "$STAGE"' EXIT

# 제외: git 메타데이터, 의존성, 빌드 산출물, 루트의 작업용 스크린샷 png
# .vercel/project.json 은 포함돼야 프로젝트 연결이 유지된다. .env.local 은 .vercelignore 가 걸러낸다.
rsync -a \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.playwright-mcp' \
  --exclude '.DS_Store' \
  --exclude '/*.png' \
  "$ROOT/" "$STAGE/"

[[ -f "$STAGE/.vercel/project.json" ]] || { echo "오류: .vercel/project.json 이 없다" >&2; exit 1; }

echo "복사본: $(find "$STAGE" -type f | wc -l | tr -d ' ')개 파일, $(du -sh "$STAGE" | cut -f1)"

if [[ "${1:-}" == "--check" ]]; then
  echo "--check: 배포하지 않고 종료"
  exit 0
fi

cd "$STAGE"
vercel deploy --prod --yes --archive=tgz
