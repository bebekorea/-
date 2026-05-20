import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const OUT = "./docs/research/footer-instagram";
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 60000 });
await p.waitForTimeout(1500);
await p.evaluate(() => { const c = document.querySelector(".fp-container"); const el = document.getElementById("footer"); if (c && el) c.scrollTop = el.offsetTop; });
await p.waitForTimeout(1500);
// Position of instagram link
const info = await p.evaluate(() => {
  const ig = document.querySelector('#footer a[aria-label="Instagram"]');
  const phone = document.querySelector('#footer a[href^="tel:"]');
  const divider = document.querySelector('#footer .border-t');
  return {
    ig: ig ? (() => { const r = ig.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.x + r.width }; })() : null,
    phone: phone ? (() => { const r = phone.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.x + r.width }; })() : null,
    dividerTop: divider ? divider.getBoundingClientRect().top : null,
  };
});
console.log("Instagram position:", info.ig);
console.log("Phone position:", info.phone);
console.log("Divider top y:", info.dividerTop);
console.log("Instagram below divider?", info.ig && info.dividerTop && info.ig.y > info.dividerTop ? "✓" : "✗");
console.log("Instagram on right side?", info.ig && info.ig.x > 720 ? "✓" : "✗ (still on left)");
await p.screenshot({ path: resolve(OUT, "footer.png") });
await b.close();
