import sharp from "sharp";
import path from "node:path";

const src = path.resolve("public/images/bebepet-logo-final.png");
const dst = path.resolve("public/images/bebepet-logo-hero.png");

// 알파 = 0인 픽셀만 background로 인식하도록 threshold를 0으로.
await sharp(src)
  .trim({ background: { r: 255, g: 255, b: 255, alpha: 0 }, threshold: 0 })
  .toFile(dst);

const meta = await sharp(dst).metadata();
console.log("Trimmed:", meta.width, "x", meta.height, "→", dst);
