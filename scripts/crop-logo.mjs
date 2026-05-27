// 변환된 PNG에서 흰색 로고 변형만 추출 (하단 1/3)
import sharp from "sharp";
import path from "node:path";

const src = path.resolve("public/images/bebepet-logo.png");

const meta = await sharp(src).metadata();
console.log("Source:", meta.width, "x", meta.height);

// 3등분 — 흰색은 맨 아래
const sectionH = Math.floor(meta.height / 3);
const top = sectionH * 2;

// 흰색 로고 (하단)
await sharp(src)
  .extract({ left: 0, top, width: meta.width, height: sectionH })
  .toFile(path.resolve("public/images/bebepet-logo-white.png"));

// 컬러(중간) — 흰 bg
await sharp(src)
  .extract({ left: 0, top: sectionH, width: meta.width, height: sectionH })
  .toFile(path.resolve("public/images/bebepet-logo-color.png"));

console.log("Wrote bebepet-logo-white.png and bebepet-logo-color.png");
