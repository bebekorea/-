// 원본 PDF → PNG 변환된 bebepet-logo.png (1397x1046, 3가지 컬러 변형 세로 적층)
// 에서 하단 흰색 로고만 중앙 정사각형 영역으로 추출 + 다크블루 → 투명.
import sharp from "sharp";
import path from "node:path";

const src = path.resolve("public/images/bebepet-logo.png");
const dst = path.resolve("public/images/bebepet-logo-hero.png");

const meta = await sharp(src).metadata();
console.log("Source:", meta.width, "x", meta.height);

// 하단 1/3 (흰색 로고 + 다크블루 배경 섹션)
const W = meta.width;
const sectionH = Math.floor(meta.height / 3);
const top = sectionH * 2;

// 좌우 padding 제거 — 로고 콘텐츠는 대략 중앙 33%
const cropX = Math.floor(W * 0.33);
const cropW = Math.floor(W * 0.34);

const cropped = await sharp(src)
  .extract({ left: cropX, top, width: cropW, height: sectionH })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { data, info } = cropped;
const out = Buffer.from(data);

for (let i = 0; i < data.length; i += info.channels) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const isWhite = r > 220 && g > 220 && b > 220;
  if (isWhite) {
    out[i] = 255;
    out[i + 1] = 255;
    out[i + 2] = 255;
    out[i + 3] = 255;
  } else {
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum > 180) {
      out[i] = 255;
      out[i + 1] = 255;
      out[i + 2] = 255;
      out[i + 3] = Math.round((lum - 180) * (255 / 75));
    } else {
      out[i + 3] = 0;
    }
  }
}

await sharp(out, { raw: { width: info.width, height: info.height, channels: info.channels } })
  .png()
  .toFile(dst);

const finalMeta = await sharp(dst).metadata();
console.log("Output:", finalMeta.width, "x", finalMeta.height, "→", dst);
