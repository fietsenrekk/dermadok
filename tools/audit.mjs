// Structural audit over every built route. Run: node tools/audit.mjs
// Catches the things that are cheap to check statically and expensive to miss:
// dead links, missing alt text, heading order, undeclared image dimensions,
// off-domain assets, untranslated strings, and missing meta.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const DIST = join(ROOT, "dist");
const fail = [];
const warn = [];

const walk = (d, acc = []) => {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (e === "index.html") acc.push(p);
  }
  return acc;
};

const pages = walk(DIST);
const routeOf = (p) => "/" + relative(DIST, p).replace(/\\/g, "/").replace(/index\.html$/, "");

// Links carry the deploy prefix (e.g. "/dermadok/…") but dist/ has no such folder.
// Strip it before resolving, or every internal link reads as dead.
const BASE = process.env.BASE_PATH ?? "";
const unbase = (href) => (BASE && href.startsWith(BASE + "/") ? href.slice(BASE.length) : href);

for (const p of pages) {
  const html = readFileSync(p, "utf8");
  const r = routeOf(p);

  // --- meta
  if (!/<title>[^<]{10,}<\/title>/.test(html)) fail.push(`${r} — missing or short <title>`);
  if (!/<meta name="description" content="[^"]{40,}"/.test(html)) fail.push(`${r} — thin meta description`);
  if (!/rel="canonical"/.test(html)) fail.push(`${r} — no canonical`);
  if (!/property="og:image"/.test(html)) warn.push(`${r} — no og:image`);
  if (!/hreflang="nl-BE"/.test(html) || !/hreflang="en"/.test(html)) fail.push(`${r} — incomplete hreflang`);

  // --- headings
  const hs = [...html.matchAll(/<h([1-6])\b/g)].map((m) => +m[1]);
  const h1n = hs.filter((x) => x === 1).length;
  if (h1n !== 1) fail.push(`${r} — ${h1n} <h1> (expected exactly 1)`);
  for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i - 1] > 1) { warn.push(`${r} — heading jump h${hs[i-1]}→h${hs[i]}`); break; }

  // --- images
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    if (!/\balt=/.test(tag)) fail.push(`${r} — <img> without alt`);
    else if (/alt=""/.test(tag) && !/aria-hidden/.test(tag)) warn.push(`${r} — empty alt (decorative?)`);
    if (!/\bwidth=/.test(tag) || !/\bheight=/.test(tag)) fail.push(`${r} — <img> without width/height (CLS risk)`);
  }

  // --- off-domain assets (§15 check 12). The booking host is the only permitted exception.
  for (const m of html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)) {
    const u = m[1];
    if (/onlinebooking\.myorganizer\.online/.test(u)) continue;
    if (/fietsenrekk\.github\.io/.test(u)) continue;         // canonical/hreflang/OG only
    if (/schema\.org/.test(u)) continue;
    fail.push(`${r} — off-domain asset: ${u.slice(0, 70)}`);
  }

  // --- dead internal links
  for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    const href = unbase(m[1]);
    if (/\.(css|js|svg|png|jpg|webp|avif|woff2|xml|txt)$/.test(href)) {
      if (!existsSync(join(DIST, href))) fail.push(`${r} — dead asset ${href}`);
    } else {
      const target = join(DIST, href, "index.html");
      if (!existsSync(target)) fail.push(`${r} — dead link ${href}`);
    }
  }
  if (/href="#"/.test(html)) fail.push(`${r} — href="#" placeholder`);

  // --- untranslated strings on the EN mirror
  if (r.startsWith("/en/")) {
    const body = html.split("<main")[1] ?? "";
    const dutch = /\b(afspraak|enkel op|weekdagen|huidziekten|behandelingen|geneeskunde|dinsdag|woensdag|donderdag|maandag|vrijdag)\b/gi;
    const hits = [...new Set((body.match(dutch) ?? []).map((s) => s.toLowerCase()))];
    // Practitioner facts are deliberately kept verbatim in Dutch (they are credentials,
    // and translating a Belgian qualification would misrepresent it). Only flag pages
    // that are NOT doctor pages.
    if (hits.length && !/\/ons-team\/[a-z-]+\//.test(r)) warn.push(`${r} — Dutch in EN page: ${hits.slice(0,4).join(", ")}`);
  }

  // --- i18n build markers
  if (/«[a-z_]+»/.test(html)) fail.push(`${r} — unresolved i18n key`);
}

console.log(`Audited ${pages.length} routes.\n`);
if (fail.length) { console.log(`FAIL (${fail.length}):`); [...new Set(fail)].forEach((x) => console.log("  " + x)); }
if (warn.length) { console.log(`\nWARN (${warn.length}):`); [...new Set(warn)].slice(0, 25).forEach((x) => console.log("  " + x)); }
if (!fail.length) console.log("No blocking issues.");
process.exit(fail.length ? 1 : 0);
