import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const publicPages = [
  "index.html",
  "software.html",
  "nexus.html",
  "workforce.html",
  "work.html",
  "agency.html",
  "emergency.html",
  "bim.html",
  "worksuite.html",
  "doorsuite.html",
  "fire-door-register.html",
  "electrical-commissioning.html",
  "construction-hardware.html",
  "greenloop.html",
  "innovation-lab.html",
  "team.html",
];
const privatePages = [
  "skanska.html",
  "nexus/spark/index.html",
  "skanska-property.html",
  "nexus/skanska-property/index.html",
];
const requiredNav = ["Home", "Software", "Hardware", "GreenLoop", "R&amp;D", "Team"];
const failures = [];

function fail(file, message) {
  failures.push(`${file}: ${message}`);
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function localTarget(value) {
  if (!value || /^(?:https?:|mailto:|tel:|data:|javascript:|#)/i.test(value)) return null;
  const clean = value.split(/[?#]/, 1)[0];
  if (!clean) return null;
  const relative = clean.startsWith("/") ? clean.slice(1) : clean;
  return relative.endsWith("/") ? `${relative}index.html` : relative;
}

for (const file of publicPages) {
  const html = await readFile(path.join(root, file), "utf8");
  const expectedCanonical = file === "index.html"
    ? "https://nosmotechnology.co.uk/"
    : `https://nosmotechnology.co.uk/${file}`;

  if (!/<title>[^<]+<\/title>/.test(html)) fail(file, "missing title");
  if (!/<meta name="description" content="[^"]+">/.test(html)) fail(file, "missing description");
  if (!html.includes(`<link rel="canonical" href="${expectedCanonical}">`)) fail(file, "wrong canonical");
  for (const property of ["og:type", "og:title", "og:description", "og:url", "og:image"]) {
    if (!html.includes(`property="${property}"`)) fail(file, `missing ${property}`);
  }
  if (!html.includes('<link rel="icon" href="/assets/nosmo-logo.png">')) fail(file, "missing favicon");
  if (!html.includes('<link rel="stylesheet" href="/assets/site-v2.css">')) fail(file, "missing shared stylesheet");
  if (/noindex/i.test(html)) fail(file, "public page is noindex");
  if (/DoorFlow/.test(html)) fail(file, "legacy DoorFlow name is public");

  const header = html.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0] ?? "";
  const logoCount = (header.match(/<img class="brand-logo" src="\/assets\/NOSMO_LOGO_LONG\.jpeg"/g) ?? []).length;
  if (logoCount !== 1) fail(file, `expected one official header logo, found ${logoCount}`);
  let navCursor = -1;
  for (const label of requiredNav) {
    const next = header.indexOf(`>${label}</a>`, navCursor + 1);
    if (next < 0) fail(file, `missing or misordered navigation item ${label}`);
    navCursor = next;
  }

  for (const match of html.matchAll(/<(?:a|img|link|script)\b[^>]*?\b(?:href|src)="([^"]+)"/g)) {
    const target = localTarget(match[1]);
    if (target && !(await exists(path.join(root, target)))) fail(file, `missing local target ${match[1]}`);
  }
  for (const match of html.matchAll(/<img\b([^>]*)>/g)) {
    if (!/\balt="[^"]*"/.test(match[1])) fail(file, "image missing alt text");
  }
}

for (const file of privatePages) {
  const html = await readFile(path.join(root, file), "utf8");
  if (!/<meta name="robots" content="noindex,nofollow,noarchive">/.test(html)) {
    fail(file, "private route must be noindex,nofollow,noarchive");
  }
}

const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
for (const file of publicPages) {
  const url = file === "index.html"
    ? "https://nosmotechnology.co.uk/"
    : `https://nosmotechnology.co.uk/${file}`;
  if (!sitemap.includes(`<loc>${url}</loc>`)) fail("sitemap.xml", `missing ${url}`);
}
if (/skanska/i.test(sitemap)) fail("sitemap.xml", "private SKANSKA route is listed");

const css = await readFile(path.join(root, "assets/site-v2.css"), "utf8");
const openBraces = (css.match(/{/g) ?? []).length;
const closeBraces = (css.match(/}/g) ?? []).length;
if (openBraces !== closeBraces) fail("assets/site-v2.css", `unbalanced braces ${openBraces}/${closeBraces}`);

if (failures.length) {
  console.error(`Site validation failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Site validation passed: ${publicPages.length} public pages, ${privatePages.length} private routes, local links and metadata checked.`);
