// 흰색 로고의 다크블루 배경을 투명으로 변환
import sharp from "sharp";
import path from "node:path";

const src = path.resolve("public/images/bebepet-logo-white.png");
const dst = path.resolve("public/images/bebepet-logo-final.png");

const img = sharp(src).ensureAlpha();
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

const W = info.width;
const H = info.height;
const channels = info.channels; // RGBA
const out = Buffer.from(data);

// 다크블루 배경(파란색 채널이 가장 높고 빨간색이 낮은 픽셀)을 투명으로.
// 흰색 픽셀(R, G, B 모두 230 이상)은 유지.
for (let i = 0; i < data.length; i += channels) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];

  const isWhite = r > 220 && g > 220 && b > 220;
  if (isWhite) {
    // 흰색 그대로
    out[i] = 255;
    out[i + 1] = 255;
    out[i + 2] = 255;
    out[i + 3] = 255;
  } else {
    // 비흰색은 모두 투명 (anti-aliasing 보존을 위해 휘도 기반 알파)
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum > 180) {
      // 밝은 회색 (안티앨리어싱 가장자리) — 부분 투명 흰색
      out[i] = 255;
      out[i + 1] = 255;
      out[i + 2] = 255;
      out[i + 3] = Math.round((lum - 180) * (255 / 75));
    } else {
      // 어두운 픽셀 (배경) — 완전 투명
      out[i + 3] = 0;
    }
  }
}

await sharp(out, { raw: { width: W, height: H, channels } })
  .png()
  .toFile(dst);

console.log("Wrote:", dst);
