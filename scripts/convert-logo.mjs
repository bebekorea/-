// .ai 파일(실은 PDF) → PNG 변환 임시 스크립트
import { pdf } from "pdf-to-img";
import fs from "node:fs/promises";
import path from "node:path";

const src = "C:\\Users\\rjsdu\\Downloads\\drive-download-20260527T132213Z-3-001\\베베펫 로고\\BEBE PET_logo.ai";
const dst = path.resolve("public/images/bebepet-logo.png");

const document = await pdf(src, { scale: 2 });
const counter = { i: 0 };
for await (const image of document) {
  counter.i++;
  await fs.writeFile(dst, image);
  console.log("Wrote:", dst, "page", counter.i);
  break;
}
