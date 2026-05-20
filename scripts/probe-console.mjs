import { chromium } from "playwright";

const URL = "http://localhost:3001/";
const TIMEOUT_MS = 12000;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const events = [];
page.on("console", (msg) => {
  events.push({ kind: "console", type: msg.type(), text: msg.text() });
});
page.on("pageerror", (err) => {
  events.push({ kind: "pageerror", text: err.message, stack: err.stack });
});
page.on("requestfailed", (req) => {
  events.push({ kind: "requestfailed", url: req.url(), failure: req.failure()?.errorText });
});

try {
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
  await page.waitForTimeout(2500);
} catch (e) {
  events.push({ kind: "navigation_error", text: String(e) });
}

// hover service trigger
try {
  const svc = await page.locator('[aria-haspopup="true"]').first();
  await svc.hover({ timeout: 2000 });
  await page.waitForTimeout(500);
} catch (e) {
  events.push({ kind: "interaction_error", step: "hover service", text: String(e) });
}

// click 글로벌 (non-existent #global anchor)
try {
  await page.getByText("글로벌", { exact: true }).first().click({ timeout: 2000 });
  await page.waitForTimeout(400);
} catch (e) {
  events.push({ kind: "interaction_error", step: "click 글로벌", text: String(e) });
}

// click a dropdown item
try {
  await page.locator('[aria-haspopup="true"]').first().hover({ timeout: 2000 });
  await page.waitForTimeout(300);
  await page.getByText("입양", { exact: true }).first().click({ timeout: 2000 });
  await page.waitForTimeout(400);
} catch (e) {
  events.push({ kind: "interaction_error", step: "click 입양", text: String(e) });
}

// toggle language to EN and back to KO
try {
  await page.getByText("ENG", { exact: true }).first().click({ timeout: 2000 });
  await page.waitForTimeout(400);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
} catch (e) {
  events.push({ kind: "interaction_error", step: "lang toggle", text: String(e) });
}

await page.waitForTimeout(800);

await browser.close();

console.log(JSON.stringify(events, null, 2));
