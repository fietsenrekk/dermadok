// Dermadok static site generator. Zero dependencies. Run: node tools/build.mjs
// Emits the NL-BE tree at the root and a full EN mirror under /en/.
//
// The build FAILS (non-zero exit) on: a missing i18n key, a practitioner without a booking
// resolution, a price group with no items, or an <img> referencing a variant that was not
// produced by tools/images.mjs. Those are the four things that must never ship silently.

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, cpSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const OUT = join(ROOT, "dist");
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8").replace(/^﻿/, ""));

const site = read("data/site.json");
const team = read("data/team.json");
const services = read("data/services.json");
const prices = read("data/prices.json");
const assets = existsSync(join(ROOT, "data/assets.manifest.json")) ? read("data/assets.manifest.json") : { images: [] };

// e.g. "/dermadok" for a GitHub Pages project site.
// GUARD: MSYS/Git-Bash rewrites a leading-slash env var into a Windows path, so
// `BASE_PATH=/dermadok` silently becomes "C:/Program Files/Git/dermadok" and every
// link and asset on the deployed site breaks. Caught in production once; never again.
// Use `MSYS_NO_PATHCONV=1 BASE_PATH=/dermadok node tools/build.mjs` on Windows.
const BASE = process.env.BASE_PATH ?? "";
if (BASE && (/^[A-Za-z]:/.test(BASE) || BASE.includes("\\") || !BASE.startsWith("/"))) {
  console.error(`\nBUILD ABORTED — BASE_PATH looks mangled: ${JSON.stringify(BASE)}`);
  console.error(`  Expected a root-relative path like "/dermadok".`);
  console.error(`  On Git Bash / MSYS, prefix the command with MSYS_NO_PATHCONV=1.`);
  process.exit(1);
}
const errors = [];
const YEAR = new Date().getFullYear();
const assetBySlug = Object.fromEntries(assets.images.map((i) => [i.slug, i]));

/* ------------------------------------------------------------------ utils */

const esc = (s) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const L = (loc, o) => {
  if (o == null) return "";
  if (typeof o === "string") return o;
  const v = o[loc] ?? o.nl;
  if (v === undefined) errors.push(`missing locale "${loc}" on ${JSON.stringify(o).slice(0, 60)}`);
  return v ?? "";
};

// URL for a route. NL lives at the root, EN under /en/.
const url = (loc, path = "") => {
  const p = path.replace(/^\/|\/$/g, "");
  const seg = loc === "en" ? (p ? `en/${p}` : "en") : p;
  return `${BASE}/${seg}${seg ? "/" : ""}` || `${BASE}/`;
};
const asset = (p) => `${BASE}/assets/${p}`;

const T = {
  nl: {
    skip: "Naar de inhoud", menu: "Menu", close: "Sluiten",
    nav_derma: "Dermatologie", nav_surg: "Chirurgie", nav_veins: "Spataders",
    nav_aes: "Esthetiek", nav_laser: "Laser", nav_skin: "Huidverbetering",
    nav_team: "Ons team", nav_prices: "Tarieven", nav_practical: "Praktisch",
    nav_faq: "Veelgestelde vragen", nav_contact: "Contact", nav_clinic: "De kliniek",
    book: "Afspraak maken", call: "Bel het secretariaat", callShort: "Bellen",
    online: "Online boeken", onlineFor: "Online boeken kan voor", phoneFor: "Telefonisch",
    bookOnlineTitle: "Online een afspraak boeken", bookPhoneTitle: "Bel het secretariaat",
    newTab: "opent in een nieuw venster",
    treats: "Waarvoor u hier terecht kan",
    consult: "Consultatie", accredited: "Geaccrediteerd", notAccredited: "Niet geaccrediteerd",
    notConventioned: "Niet geconventioneerd",
    education: "Opleiding", training: "Specialisatie", current: "Nu", focus: "Aandachtsgebieden",
    research: "Onderzoek", doctorate: "Doctoraat", teaching: "Onderwijs", confidentiality: "Beroepsgeheim",
    allTeam: "Het volledige team", supportTeam: "Onthaal en administratie",
    hoursTitle: "Telefonische bereikbaarheid",
    hoursWarn: "Dit zijn telefoontijden, geen consultatie-uren.",
    address: "Adres", phone: "Telefoon", email: "E-mail",
    gettingThere: "Bereikbaarheid", byTram: "Met de tram", walk: "wandelen",
    priceIntro: "Richtprijzen", from: "vanaf", perTreatment: "per behandeling",
    langNl: "NL", langEn: "EN",
    footerCare: "Behandelingen", footerTeam: "Team", footerPractical: "Praktisch",
    privacy: "Privacybeleid", rights: "Alle rechten voorbehouden.",
    byAppointment: "Uitsluitend op afspraak.", wheelchair: "Rolstoeltoegankelijke ingang.",
    noMedicalEmail: "Via e-mail beantwoorden we geen medische vragen.",
    relatedDoctors: "Wie behandelt dit", backTeam: "Terug naar het team",
    readMore: "Lees meer", diagnostics: "Onderzoeken", options: "Behandelopties",
    procedures: "Wat we behandelen", signoffPending: "Deze pagina wacht op medische nazicht."
  },
  en: {
    skip: "Skip to content", menu: "Menu", close: "Close",
    nav_derma: "Dermatology", nav_surg: "Surgery", nav_veins: "Varicose veins",
    nav_aes: "Aesthetic medicine", nav_laser: "Laser", nav_skin: "Skin improvement",
    nav_team: "Our team", nav_prices: "Prices", nav_practical: "Getting here",
    nav_faq: "Questions", nav_contact: "Contact", nav_clinic: "The clinic",
    book: "Make an appointment", call: "Call the secretariat", callShort: "Call",
    online: "Book online", onlineFor: "Online booking is available for", phoneFor: "By phone",
    bookOnlineTitle: "Book an appointment online", bookPhoneTitle: "Call the secretariat",
    newTab: "opens in a new window",
    treats: "What you can consult for",
    consult: "Consultation", accredited: "Accredited", notAccredited: "Not accredited",
    notConventioned: "Not conventioned",
    education: "Education", training: "Specialisation", current: "Currently", focus: "Areas of focus",
    research: "Research", doctorate: "Doctorate", teaching: "Teaching", confidentiality: "Confidentiality",
    allTeam: "The full team", supportTeam: "Reception and administration",
    hoursTitle: "Phone availability",
    hoursWarn: "These are phone hours, not consultation hours.",
    address: "Address", phone: "Phone", email: "E-mail",
    gettingThere: "Getting here", byTram: "By tram", walk: "walk",
    priceIntro: "Indicative prices", from: "from", perTreatment: "per treatment",
    langNl: "NL", langEn: "EN",
    footerCare: "Treatments", footerTeam: "Team", footerPractical: "Practical",
    privacy: "Privacy policy", rights: "All rights reserved.",
    byAppointment: "By appointment only.", wheelchair: "Wheelchair-accessible entrance.",
    noMedicalEmail: "We cannot answer medical questions by e-mail.",
    relatedDoctors: "Who treats this", backTeam: "Back to the team",
    readMore: "Read more", diagnostics: "Investigations", options: "Treatment options",
    procedures: "What we treat", signoffPending: "This page is awaiting medical review."
  }
};
const t = (loc, k) => {
  const v = T[loc]?.[k];
  if (v === undefined) { errors.push(`missing i18n key "${k}" for "${loc}"`); return `«${k}»`; }
  return v;
};

/* ------------------------------------------------------------------- logo */

// Re-traced by hand as layered inline SVG (§7.1 step 2 — no vector exists on the live site).
// Each layer is separately addressable so it can be animated, recoloured and taken apart.
// The RULE is its own element: it is the brand device.
const logo = (cls = "", withSub = true) => `
<svg class="mark ${cls}" viewBox="0 0 440 128" role="img" aria-label="Dermadok Huidkliniek" xmlns="http://www.w3.org/2000/svg">
  ${withSub ? `<text class="mark__eyebrow" x="2" y="14" font-family="Inter Tight,sans-serif" font-size="11.5" font-weight="500" letter-spacing="2.55" fill="currentColor" opacity="0.82">DERMATOLOGIE, CHIRURGIE EN ESTHETIEK</text>` : ""}
  <text class="mark__derma" x="0" y="76" font-family="Jost,sans-serif" font-size="58" font-weight="300" letter-spacing="4.2" fill="currentColor">DERMA</text>
  <line class="mark__rule" x1="253" y1="26" x2="253" y2="112" stroke="currentColor" stroke-width="2.1"/>
  <text class="mark__dok" x="268" y="76" font-family="Jost,sans-serif" font-size="58" font-weight="300" letter-spacing="4.2" fill="currentColor">DOK</text>
  ${withSub ? `<text class="mark__sub" x="268" y="104" font-family="Inter Tight,sans-serif" font-size="12.5" font-weight="500" letter-spacing="4.4" fill="currentColor" opacity="0.82">HUIDKLINIEK</text>` : ""}
</svg>`;

const arrow = `<svg class="btn__arrow" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M2 8h12M9.5 3.5 14 8l-4.5 4.5"/></svg>`;

/* -------------------------------------------------------------- <picture> */

function picture(slug, { sizes, alt, cls = "", ratio = "", priority = false, w, h }) {
  const rec = assetBySlug[slug];
  if (!rec) { errors.push(`no image variants for "${slug}" — run tools/images.mjs`); return ""; }
  const vs = rec.variants;
  const top = vs[vs.length - 1];
  const set = (ext) => vs.map((v) => `${asset("img/" + v[ext])} ${v.width}w`).join(", ");
  const iw = w ?? rec.intrinsic.w, ih = h ?? rec.intrinsic.h;
  return `<picture${cls ? ` class="${cls}"` : ""}>
<source type="image/avif" srcset="${set("avif")}" sizes="${sizes}">
<source type="image/webp" srcset="${set("webp")}" sizes="${sizes}">
<img src="${asset("img/" + top.jpg)}" srcset="${set("jpg")}" sizes="${sizes}"
  width="${iw}" height="${ih}" alt="${esc(alt)}"${ratio ? ` style="aspect-ratio:${ratio}"` : ""}
  ${priority ? 'fetchpriority="high" decoding="sync"' : 'loading="lazy" decoding="async"'}></picture>`;
}

/* ------------------------------------------------------------ BookingPath */

// §11.3. One component, driven entirely by data. When an availability flag changes,
// every page that renders this updates. Never presents online booking where it is not offered.
function bookingPath(loc, { practitioner = null, serviceKey = null, heading = null, embed = false }) {
  const p = practitioner;
  const tel = site.phone.tel, disp = site.phone.display;
  const phoneBlock = `
    <a class="btn btn--ghost" href="tel:${tel}">${esc(t(loc, "call"))} <span class="tel">${esc(disp)}</span></a>`;

  // Practitioner-specific path.
  if (p) {
    const online = p.booking.online;
    if (online === false) {
      return `<div class="booking booking--phone">
        <h2>${esc(heading ?? t(loc, "bookPhoneTitle"))}</h2>
        <p class="booking__note">${esc(L(loc, p.booking.restriction))}</p>
        <div class="booking__acts">${phoneBlock}</div></div>`;
    }
    const note = p.booking.restriction
      ? `<p class="booking__note"><strong>${esc(L(loc, p.booking.restriction))}</strong></p>` : "";
    return `<div class="booking">
      <h2>${esc(heading ?? t(loc, "bookOnlineTitle"))}</h2>
      ${note}
      <div class="booking__acts">
        <a class="btn" href="${esc(p.booking.url)}" target="_blank" rel="noopener noreferrer">
          ${esc(t(loc, "online"))} ${arrow}<span class="visually-hidden">(${esc(t(loc, "newTab"))})</span></a>
        ${phoneBlock}
      </div>
      ${embed && site.booking.framingAllowed ? `<iframe class="booking__cal" loading="lazy"
        title="${esc(t(loc, "bookOnlineTitle"))} — ${esc(p.name)}" src="${esc(p.booking.url)}"></iframe>` : ""}
    </div>`;
  }

  // Service-level path: list every practitioner who covers this service.
  const map = {
    dermatologie: (x) => x.discipline === "dermatologie",
    vaat: (x) => x.discipline === "vaatchirurgie" || x.slug === "annick-bracke",
    esthetiek: (x) => x.discipline === "esthetiek",
    laser: (x) => x.discipline === "laser" || x.slug === "valerie-verstraeten",
    huidverbetering: (x) => x.discipline === "huidverbetering"
  };
  const fn = map[serviceKey];
  if (!fn) { errors.push(`unknown booking serviceKey "${serviceKey}"`); return ""; }
  const who = team.practitioners.filter(fn);
  if (!who.length) { errors.push(`no practitioners resolve for serviceKey "${serviceKey}"`); return ""; }

  const anyOnline = who.some((x) => x.booking.online !== false);
  const rows = who.map((x) => {
    const restricted = x.booking.restriction ? `<p class="booking__note">${esc(L(loc, x.booking.restriction))}</p>` : "";
    const act = x.booking.online === false
      ? `<a class="btn btn--ghost" href="tel:${tel}">${esc(t(loc, "callShort"))} ${esc(disp)}</a>`
      : `<a class="btn btn--ghost" href="${esc(x.booking.url)}" target="_blank" rel="noopener noreferrer">${esc(t(loc, "online"))} ${arrow}<span class="visually-hidden">(${esc(t(loc, "newTab"))})</span></a>`;
    return `<div class="prow" style="display:block;padding:0.9em 0;border-top:1px solid var(--line)">
      <div style="display:flex;flex-wrap:wrap;gap:0.8rem;align-items:baseline;justify-content:space-between">
        <span><a class="tlink" href="${url(loc, "ons-team/" + x.slug)}">${esc(x.name)}</a>
          <span class="roster__meta"> · ${esc(L(loc, x.consultation))}</span></span>
        ${act}
      </div>${restricted}</div>`;
  }).join("");

  return `<div class="booking${anyOnline ? "" : " booking--phone"}">
    <h2>${esc(heading ?? t(loc, "book"))}</h2>
    ${rows}
    <div class="booking__acts" style="margin-top:1.3rem">${phoneBlock}</div>
  </div>`;
}

/* -------------------------------------------------------------- structure */

const NAV = (loc) => [
  ["dermatologie", t(loc, "nav_derma")], ["chirurgie", t(loc, "nav_surg")],
  ["spataders", t(loc, "nav_veins")], ["esthetiek", t(loc, "nav_aes")],
  ["laser", t(loc, "nav_laser")], ["ons-team", t(loc, "nav_team")],
  ["tarieven", t(loc, "nav_prices")], ["contact", t(loc, "nav_contact")]
];

function head(loc, { title, desc, path, ogImage }) {
  const other = loc === "nl" ? "en" : "nl";
  const canon = `https://fietsenrekk.github.io${url(loc, path)}`;
  return `<!doctype html>
<html lang="${loc === "nl" ? "nl-BE" : "en"}" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canon)}">
<link rel="alternate" hreflang="nl-BE" href="https://fietsenrekk.github.io${url("nl", path)}">
<link rel="alternate" hreflang="en" href="https://fietsenrekk.github.io${url("en", path)}">
<link rel="alternate" hreflang="x-default" href="https://fietsenrekk.github.io${url("nl", path)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="${loc === "nl" ? "nl_BE" : "en_GB"}">
<meta property="og:site_name" content="Dermadok Huidkliniek">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canon)}">
<meta property="og:image" content="https://fietsenrekk.github.io${asset("og/" + (ogImage || "default") + ".png")}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F4F4F2">
<link rel="icon" href="${asset("favicon.svg")}" type="image/svg+xml">
<link rel="preconnect" href="https://onlinebooking.myorganizer.online">
<link rel="preload" as="font" type="font/woff2" href="${asset("fonts/jost-300-latin.woff2")}" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="${asset("fonts/intertight-400-latin.woff2")}" crossorigin>
<link rel="stylesheet" href="${asset("css/base.css")}">
<link rel="stylesheet" href="${asset("css/site.css")}">
<script>document.documentElement.classList.replace('no-js','js');
if(matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('rm');</script>
</head>
<body>
<div class="grain" aria-hidden="true"></div>
<a class="skip" href="#main">${esc(t(loc, "skip"))}</a>`;
}

function header(loc, current) {
  const items = NAV(loc).map(([slug, label]) =>
    `<a href="${url(loc, slug)}"${current === slug ? ' aria-current="page"' : ""}>${esc(label)}</a>`).join("");
  const otherLoc = loc === "nl" ? "en" : "nl";
  return `<header class="hdr">
<div class="wrap hdr__in">
  <a class="hdr__mark" href="${url(loc)}" aria-label="Dermadok Huidkliniek">${logo("", false)}</a>
  <nav class="nav nav--main" aria-label="${esc(t(loc, "menu"))}">${items}</nav>
  <div class="lang">
    <a href="${url("nl", current || "")}"${loc === "nl" ? ' aria-current="true"' : ""}>NL</a>
    <span class="lang__sep" aria-hidden="true"></span>
    <a href="${url("en", current || "")}"${loc === "en" ? ' aria-current="true"' : ""}>EN</a>
  </div>
  <button class="burger" aria-expanded="false" aria-controls="drawer"><span></span><span></span>
    <span class="visually-hidden">${esc(t(loc, "menu"))}</span></button>
</div>
<div class="drawer wrap" id="drawer"><nav class="nav" aria-label="${esc(t(loc, "menu"))}">${items}</nav></div>
</header>`;
}

function footer(loc) {
  const care = services.lines.filter((s) => !s.parent)
    .map((s) => `<li><a href="${url(loc, s.slug)}">${esc(L(loc, s.title))}</a></li>`).join("");
  const docs = team.practitioners
    .map((p) => `<li><a href="${url(loc, "ons-team/" + p.slug)}">${esc(p.name)}</a></li>`).join("");
  const a = site.address;
  return `<footer class="ftr">
<div class="wrap">
  <div class="ftr__grid">
    <div>
      ${logo("ftr__mark")}
      <ul style="margin-top:1.6rem">
        <li class="num">${esc(a.street)}</li>
        <li class="num">B-${esc(a.postal)} ${esc(a.city)} (${esc(a.district)})</li>
        <li><a class="tlink tel" href="tel:${site.phone.tel}">${esc(site.phone.display)}</a></li>
        <li><a class="tlink" href="mailto:${site.email}">${esc(site.email)}</a></li>
      </ul>
    </div>
    <div><h2>${esc(t(loc, "footerCare"))}</h2><ul>${care}
      <li><a href="${url(loc, "huidverbetering")}">${esc(t(loc, "nav_skin"))}</a></li>
      <li><a href="${url(loc, "tarieven")}">${esc(t(loc, "nav_prices"))}</a></li></ul></div>
    <div><h2>${esc(t(loc, "footerTeam"))}</h2><ul>${docs}</ul></div>
    <div><h2>${esc(t(loc, "footerPractical"))}</h2><ul>
      <li><a href="${url(loc, "praktisch")}">${esc(t(loc, "nav_practical"))}</a></li>
      <li><a href="${url(loc, "veelgestelde-vragen")}">${esc(t(loc, "nav_faq"))}</a></li>
      <li><a href="${url(loc, "de-kliniek")}">${esc(t(loc, "nav_clinic"))}</a></li>
      <li><a href="${url(loc, "contact")}">${esc(t(loc, "nav_contact"))}</a></li>
    </ul></div>
  </div>
  <div class="ftr__legal">
    <span>© ${YEAR} Dermadok Huidkliniek. ${esc(t(loc, "rights"))}</span>
    <span>${esc(t(loc, "byAppointment"))}</span>
    <span>${esc(t(loc, "wheelchair"))}</span>
  </div>
</div></footer>`;
}

function mobileBar(loc) {
  return `<div class="mbar">
  <a href="tel:${site.phone.tel}">${esc(t(loc, "callShort"))} <span class="tel">${esc(site.phone.display)}</span></a>
  <a href="${url(loc, "contact")}">${esc(t(loc, "book"))}</a>
</div>`;
}

const tail = (loc, jsonld) => `
${mobileBar(loc)}
${footer(loc)}
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ""}
<script src="${asset("js/motion.js")}" defer></script>
</body></html>`;

/* ---------------------------------------------------------------- JSON-LD */

function clinicLd(loc) {
  const a = site.address;
  return {
    "@context": "https://schema.org", "@type": "MedicalClinic",
    name: "Dermadok Huidkliniek", url: `https://fietsenrekk.github.io${url(loc)}`,
    telephone: site.phone.tel, email: site.email,
    address: { "@type": "PostalAddress", streetAddress: a.street, postalCode: a.postal,
      addressLocality: a.city, addressCountry: a.country },
    geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng },
    isAcceptingNewPatients: !site.booking.clinicWidePatientStop,
    medicalSpecialty: ["Dermatology", "PlasticSurgery"],
    availableService: services.lines.map((s) => ({ "@type": "MedicalProcedure", name: L(loc, s.title) })),
    openingHoursSpecification: site.secretariatHours.days.flatMap((d) =>
      d.slots.map((s) => ({ "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${d.dayEn}`, opens: s.split("-")[0], closes: s.split("-")[1] }))),
    employee: team.practitioners.map((p) => ({ "@type": "Physician", name: p.name,
      jobTitle: L(loc, p.role), url: `https://fietsenrekk.github.io${url(loc, "ons-team/" + p.slug)}` }))
  };
}

function physicianLd(loc, p) {
  return {
    "@context": "https://schema.org", "@type": "Physician",
    name: p.name, jobTitle: L(loc, p.role),
    url: `https://fietsenrekk.github.io${url(loc, "ons-team/" + p.slug)}`,
    telephone: site.phone.tel,
    medicalSpecialty: p.discipline === "dermatologie" ? "Dermatology" : undefined,
    worksFor: { "@type": "MedicalClinic", name: "Dermadok Huidkliniek" },
    address: { "@type": "PostalAddress", streetAddress: site.address.street,
      postalCode: site.address.postal, addressLocality: site.address.city, addressCountry: "BE" },
    availableService: p.treats.map((x) => ({ "@type": "MedicalProcedure", name: x }))
  };
}

/* ------------------------------------------------------------------ write */

function emit(loc, path, html) {
  const dir = join(OUT, loc === "en" ? "en" : "", path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
}

export { }; // module marker

/* ------------------------------------------------------------------ pages */

function pageHome(loc) {
  const pillars = [
    { key: "dermatologie", n: "01" }, { key: "chirurgie", n: "02" }, { key: "esthetiek", n: "03" }
  ].map(({ key, n }) => {
    const s = services.lines.find((x) => x.slug === key);
    const list = (s.procedures ?? []).slice(0, 5).map((x) => `<li>${esc(L(loc, x))}</li>`).join("");
    return `<article class="pillar" data-anim>
      <div class="pillar__n">${n} — ${esc(L(loc, s.title)).toUpperCase()}</div>
      <div><h2>${esc(L(loc, s.lede))}</h2></div>
      <div><ul class="pillar__list">${list}</ul>
        <p style="margin-top:1.2rem"><a class="tlink" href="${url(loc, s.slug)}">${esc(t(loc, "readMore"))} →</a></p></div>
    </article>`;
  }).join("");

  const onlineCount = team.practitioners.filter((p) => p.booking.online !== false).length;
  const title = loc === "nl"
    ? "Dermadok Huidkliniek — dermatologie, chirurgie en esthetiek in Antwerpen"
    : "Dermadok Skin Clinic — dermatology, surgery and aesthetic medicine in Antwerp";
  const desc = loc === "nl"
    ? "Zeven artsen, één kliniek op Het Eilandje. Dermatologie, ambulante chirurgie, vaatheelkunde, laser en esthetische geneeskunde. Rijnkaai 22, Antwerpen."
    : "Seven doctors, one clinic on Het Eilandje. Dermatology, day surgery, vascular care, laser and aesthetic medicine. Rijnkaai 22, Antwerp.";

  const roster = team.practitioners.map((p) => `
    <a class="roster__row" href="${url(loc, "ons-team/" + p.slug)}">
      <span class="roster__name">${esc(p.name)}</span>
      <span class="roster__cred">${esc(L(loc, p.headline))}</span>
      <span class="roster__meta">${esc(L(loc, p.consultation))}</span>
      <span class="roster__go">${p.booking.online === false ? esc(t(loc, "phoneFor")) : esc(t(loc, "online"))}</span>
    </a>`).join("");

  return head(loc, { title, desc, path: "" }) + header(loc, "") + `
<main id="main">
  <section class="hero"><div class="wrap">
    <div class="hero__grid">
      <div>
        <p class="label" data-anim>${esc(L(loc, site.tagline))}</p>
        <h1 data-anim>${loc === "nl"
          ? `Een huidkliniek waar<br>de <em>diagnose</em> voorop staat.`
          : `A skin clinic where the<br><em>diagnosis</em> comes first.`}</h1>
        <p class="hero__lede" data-anim>${loc === "nl"
          ? "Zeven artsen, één kliniek op Het Eilandje. Van de opvolging van een moedervlek tot ambulante chirurgie, vaatheelkunde, lasertherapie en esthetische geneeskunde."
          : "Seven doctors, one clinic on Het Eilandje. From monitoring a mole to day surgery, vascular care, laser therapy and aesthetic medicine."}</p>
        <div class="hero__cta" data-anim>
          <a class="btn" href="${url(loc, "contact")}">${esc(t(loc, "book"))} ${arrow}</a>
          <a class="btn btn--ghost" href="tel:${site.phone.tel}">${esc(t(loc, "call"))}</a>
        </div>
      </div>
      <figure class="hero__fig" data-reveal>
        ${picture("gevel", { sizes: "(min-width:1024px) 40vw, 100vw", alt: loc === "nl"
          ? "De gevel van Dermadok Huidkliniek aan de Rijnkaai in Antwerpen"
          : "The facade of Dermadok Skin Clinic on the Rijnkaai in Antwerp", priority: true })}
      </figure>
    </div>
    <div class="status" data-anim>
      <span class="status__item"><span class="status__dot"></span>${esc(t(loc, "onlineFor"))} ${onlineCount} ${loc === "nl" ? "zorgverleners" : "practitioners"}</span>
      <span class="status__item"><span class="status__dot status__dot--phone"></span>${esc(t(loc, "nav_skin"))}: ${esc(t(loc, "phoneFor"))}</span>
      <span class="status__item"><span class="status__dot status__dot--phone"></span>${site.address.street}, ${site.address.district}</span>
    </div>
  </div></section>

  <section class="pillars"><div class="wrap">
    <p class="label" data-anim>${loc === "nl" ? "Drie zorglijnen" : "Three lines of care"}</p>
    ${pillars}
  </div></section>

  <section class="sect"><div class="wrap">
    <p class="label" data-anim>${esc(t(loc, "allTeam"))}</p>
    <h2 data-anim style="max-width:22ch;margin-bottom:1.4em">${loc === "nl"
      ? "Wie u ziet, en waarvoor."
      : "Who you see, and what for."}</h2>
    <div class="roster">${roster}</div>
  </div></section>
</main>` + tail(loc, clinicLd(loc));
}

function pageService(loc, s) {
  const title = `${L(loc, s.title)} — Dermadok Huidkliniek`;
  const desc = L(loc, s.lede);
  const procs = (s.procedures ?? []).map((x) => `<li>${esc(L(loc, x))}</li>`).join("");
  const diags = (s.diagnostics ?? []).map((d) => `
    <div style="padding:1.6em 0;border-top:1px solid var(--line)">
      <h2>${esc(L(loc, d.title))}</h2>
      <p style="color:var(--ink-46);font-size:var(--t-small);margin:0.5em 0 0.8em">${esc(L(loc, d.when))}</p>
      <p>${esc(L(loc, d.how))}</p></div>`).join("");
  const opts = (s.options ?? []).map((o) => `
    <div style="padding:1.5em 0;border-top:1px solid var(--line)">
      <h2>${esc(L(loc, o.title))}</h2><p style="margin-top:0.6em">${esc(L(loc, o.text))}</p></div>`).join("");

  return head(loc, { title, desc, path: s.slug }) + header(loc, s.slug) + `
<main id="main"><div class="wrap">
  <section class="sect sect--tight">
    <p class="label" data-anim>${esc(L(loc, s.title))}</p>
    <h1 data-anim style="font-size:var(--t-h1);max-width:20ch">${esc(L(loc, s.lede))}</h1>
  </section>
  <div class="grid-2">
    <div>
      <figure data-reveal>${picture("interior-1", { sizes: "(min-width:860px) 42vw, 100vw",
        alt: loc === "nl" ? "Behandelruimte in Dermadok Huidkliniek" : "Treatment room at Dermadok Skin Clinic" })}</figure>
    </div>
    <div class="prose" data-anim>
      ${s.body ? `<p class="lede">${esc(L(loc, s.body))}</p>` : ""}
      ${s.needsSignoff ? `<div class="notice">${esc(t(loc, "signoffPending"))}</div>` : ""}
      ${procs ? `<h2>${esc(t(loc, "procedures"))}</h2><ul>${procs}</ul>` : ""}
      ${s.callout ? `<div class="callout">${esc(L(loc, s.callout))}</div>` : ""}
    </div>
  </div>
  ${diags ? `<section class="sect"><p class="label" data-anim>${esc(t(loc, "diagnostics"))}</p><div class="prose">${diags}</div></section>` : ""}
  ${opts ? `<section class="sect"><p class="label" data-anim>${esc(t(loc, "options"))}</p><div class="prose">${opts}</div></section>` : ""}
  <section class="sect" data-anim>${bookingPath(loc, { serviceKey: s.bookingKey })}</section>
</div></main>` + tail(loc, clinicLd(loc));
}

function pageDoctor(loc, p) {
  const f = p.facts;
  const rows = [
    ["education", f.degree], ["training", f.training], ["research", f.harvard],
    ["doctorate", f.doctorate], ["current", f.current], ["focus", f.focus],
    ["teaching", f.teaching], ["confidentiality", f.confidentiality],
    ["training", f.tanzania], ["training", f.postgrad], ["training", f.diu]
  ].filter(([, v]) => v).map(([k, v]) =>
    `<li><span class="doc__cvk">${esc(t(loc, k))}</span><span>${esc(v)}</span></li>`).join("");
  const treats = p.treats.map((x) => `<li>${esc(x)}</li>`).join("");
  const flags = [
    p.accredited === true ? t(loc, "accredited") : p.accredited === false ? t(loc, "notAccredited") : null,
    p.conventioned === false ? t(loc, "notConventioned") : null
  ].filter(Boolean).join(" · ");

  return head(loc, { title: `${p.name} — ${L(loc, p.role)} — Dermadok`, desc: `${p.name}, ${L(loc, p.role)} — ${L(loc, p.headline)}. ${L(loc, p.consultation)} Dermadok Huidkliniek, Rijnkaai 22, Antwerpen.`, path: `ons-team/${p.slug}` })
    + header(loc, "ons-team") + `
<main id="main"><div class="wrap">
  <div class="doc">
    <figure class="doc__fig" data-reveal>
      ${picture(p.photo, { sizes: "(min-width:960px) 32vw, 80vw", alt: `${p.name}, ${L(loc, p.role)}` })}
      <figcaption>${esc(L(loc, p.role))}</figcaption>
    </figure>
    <div>
      <p class="label" data-anim><a class="tlink" href="${url(loc, "ons-team")}">${esc(t(loc, "backTeam"))}</a></p>
      <h1 data-anim>${esc(p.name)}</h1>
      <p class="doc__role" data-anim>${esc(L(loc, p.headline))}</p>
      ${flags ? `<p class="roster__meta" data-anim style="margin-top:0.5em">${esc(flags)}</p>` : ""}
      <ul class="doc__cv" data-anim>${rows}
        <li><span class="doc__cvk">${esc(t(loc, "consult"))}</span><span>${esc(L(loc, p.consultation))}</span></li>
      </ul>
      <section class="sect sect--tight" data-anim>
        <p class="label">${esc(t(loc, "treats"))}</p>
        <ul class="doc__treats">${treats}</ul>
      </section>
      <div data-anim>${bookingPath(loc, { practitioner: p, embed: false })}</div>
    </div>
  </div>
</div></main>` + tail(loc, physicianLd(loc, p));
}

function pageTeam(loc) {
  const rows = team.practitioners.map((p) => `
    <a class="roster__row" href="${url(loc, "ons-team/" + p.slug)}">
      <span class="roster__name">${esc(p.name)}</span>
      <span class="roster__cred">${esc(L(loc, p.headline))}</span>
      <span class="roster__meta">${esc(L(loc, p.consultation))}</span>
      <span class="roster__go">${p.booking.online === false ? esc(t(loc, "phoneFor")) : esc(t(loc, "online"))}</span>
    </a>`).join("");
  const sup = team.support.map((s) => `
    <div style="padding:1.3em 0;border-top:1px solid var(--line)">
      <div class="roster__name" style="font-size:var(--t-body)">${esc(s.name)}</div>
      <div class="roster__meta">${esc(L(loc, s.role))} — ${esc(L(loc, s.note))}</div>
    </div>`).join("");

  return head(loc, { title: `${t(loc, "nav_team")} — Dermadok Huidkliniek`,
    desc: loc === "nl" ? "De artsen en medewerkers van Dermadok Huidkliniek in Antwerpen." : "The doctors and staff of Dermadok Skin Clinic in Antwerp.",
    path: "ons-team" }) + header(loc, "ons-team") + `
<main id="main"><div class="wrap">
  <section class="sect sect--tight">
    <p class="label" data-anim>${esc(t(loc, "nav_team"))}</p>
    <h1 data-anim style="font-size:var(--t-h1);max-width:18ch">${loc === "nl"
      ? "Wie u ziet, en waarvoor." : "Who you see, and what for."}</h1>
  </section>
  <div class="roster">${rows}</div>
  <section class="sect">
    <p class="label" data-anim>${esc(t(loc, "supportTeam"))}</p>
    <div class="prose" style="max-width:none">${sup}</div>
  </section>
</div></main>` + tail(loc, clinicLd(loc));
}

function pagePrices(loc) {
  const grp = (g) => {
    if (!g.items?.length) { errors.push(`price group "${g.id}" has no items`); return ""; }
    const rows = g.items.map((i) => `
      <div class="prow">
        <span class="prow__label">${esc(i.label)}${i.duration ? `<span class="prow__dur">${esc(i.duration)}</span>` : ""}</span>
        <span class="prow__dots" aria-hidden="true"></span>
        <span class="prow__price">${i.from ? `<span class="prow__from">${esc(t(loc, "from"))} </span>` : ""}€${i.price}</span>
      </div>`).join("");
    return `<section class="pgroup" data-anim>
      <h2>${esc(L(loc, g.title))}</h2>
      ${g.note ? `<p class="pgroup__note">${esc(L(loc, g.note))}</p>` : ""}
      ${rows}
      ${g._conflict ? `<div class="pconflict">${loc === "nl"
        ? "Voor drie fillerbehandelingen publiceert de huidige website twee verschillende prijzen. De hier getoonde bedragen komen van het officiële prijsblad. Bevestig met het secretariaat vóór uw behandeling."
        : "For three filler treatments the current website publishes two different prices. The figures shown here come from the official price sheet. Please confirm with the secretariat before treatment."}</div>` : ""}
    </section>`;
  };
  const aes = prices.aesthetic.groups.map(grp).join("");
  const skin = prices.huidverbetering.groups.map(grp).join("");

  return head(loc, { title: `${t(loc, "nav_prices")} — Dermadok Huidkliniek`,
    desc: loc === "nl" ? "Richtprijzen voor esthetische behandelingen en huidverbetering bij Dermadok Huidkliniek, Antwerpen."
      : "Indicative prices for aesthetic treatments and skin improvement at Dermadok Skin Clinic, Antwerp.",
    path: "tarieven" }) + header(loc, "tarieven") + `
<main id="main"><div class="wrap">
  <section class="sect sect--tight">
    <p class="label" data-anim>${esc(t(loc, "priceIntro"))}</p>
    <h1 data-anim style="font-size:var(--t-h1);max-width:16ch">${loc === "nl" ? "Tarieven" : "Prices"}</h1>
    <p class="lede" data-anim style="margin-top:1.4em">${esc(L(loc, prices.aesthetic._disclaimer))}</p>
  </section>
  <div class="prices">${aes}</div>
  <section class="sect">
    <p class="label" data-anim>${esc(t(loc, "nav_skin"))} — Lisette Van Meel</p>
    <div class="prices">${skin}</div>
  </section>
  <section class="sect" data-anim>${bookingPath(loc, { serviceKey: "esthetiek" })}</section>
</div></main>` + tail(loc, clinicLd(loc));
}

function pageContact(loc) {
  const a = site.address;
  const hours = site.secretariatHours.days.map((d) => `
    <li><span class="hours__d">${esc(loc === "nl" ? d.day : d.dayEn)}</span>
      <span class="hours__t">${d.slots.join("  ·  ").replace(/-/g, "–")}</span></li>
    ${d.note ? `<li style="border:0;padding-top:0"><span class="roster__meta">${esc(L(loc, d.note))}</span></li>` : ""}`).join("");
  const paths = ["dermatologie", "vaat", "esthetiek", "laser", "huidverbetering"]
    .map((k) => `<div style="margin-bottom:1.6rem">${bookingPath(loc, { serviceKey: k,
      heading: L(loc, services.lines.find((s) => s.bookingKey === k)?.title ?? { nl: k, en: k }) })}</div>`).join("");

  return head(loc, { title: `${t(loc, "nav_contact")} — Dermadok Huidkliniek`,
    desc: `${a.street}, B-${a.postal} ${a.city}. ${site.phone.display}.`, path: "contact" })
    + header(loc, "contact") + `
<main id="main"><div class="wrap">
  <section class="sect sect--tight">
    <p class="label" data-anim>${esc(t(loc, "nav_contact"))}</p>
    <h1 data-anim style="font-size:var(--t-h1)">${loc === "nl" ? "Contact en afspraken" : "Contact and appointments"}</h1>
  </section>
  <div class="grid-2">
    <div data-anim>
      <p class="label label--plain">${esc(t(loc, "address"))}</p>
      <p class="num">${esc(a.street)}<br>B-${esc(a.postal)} ${esc(a.city)}<br>${esc(a.district)}</p>
      <p><a class="btn btn--ghost tel" href="tel:${site.phone.tel}">${esc(site.phone.display)}</a></p>
      <p><a class="tlink" href="mailto:${site.email}">${esc(site.email)}</a></p>
      <div class="callout">${esc(L(loc, site._emailPolicy))}</div>
      <p class="label label--plain" style="margin-top:2.4rem">${esc(t(loc, "hoursTitle"))}</p>
      <p class="roster__meta" style="margin-top:-0.8em">${esc(L(loc, site.secretariatHours._warning))}</p>
      <ul class="hours">${hours}</ul>
    </div>
    <div data-anim>
      <p class="label label--plain">${esc(t(loc, "book"))}</p>
      ${paths}
    </div>
  </div>
</div></main>` + tail(loc, clinicLd(loc));
}

function pagePractical(loc) {
  const trams = site.transit.tram.map((x) => `
    <li><span class="hours__d">${esc(t(loc, "byTram"))} ${esc(x.line)} — ${esc(x.stop)}</span>
      <span class="hours__t num">${x.walkMetres} m ${esc(t(loc, "walk"))}</span></li>`).join("");
  const actueel = site.actueel.items.length
    ? site.actueel.items.map((i) => `<div class="notice"><strong>${esc(i.date)}</strong> — ${esc(L(loc, i.text))}</div>`).join("")
    : `<p class="roster__meta">${loc === "nl" ? "Er zijn op dit moment geen bijzondere meldingen." : "There are no current notices."}</p>`;

  return head(loc, { title: `${t(loc, "nav_practical")} — Dermadok Huidkliniek`,
    desc: loc === "nl" ? "Bereikbaarheid, tram en parkeren bij Dermadok Huidkliniek, Rijnkaai 22, Antwerpen."
      : "Getting to Dermadok Skin Clinic, Rijnkaai 22, Antwerp — tram and parking.", path: "praktisch" })
    + header(loc, "praktisch") + `
<main id="main"><div class="wrap">
  <section class="sect sect--tight">
    <p class="label" data-anim>${esc(t(loc, "nav_practical"))}</p>
    <h1 data-anim style="font-size:var(--t-h1);max-width:16ch">${loc === "nl" ? "Zo raakt u er" : "Getting here"}</h1>
  </section>
  <div class="grid-2">
    <figure data-reveal>${picture("gevel", { sizes: "(min-width:860px) 42vw, 100vw",
      alt: loc === "nl" ? "De ingang van Dermadok aan de Rijnkaai" : "The entrance to Dermadok on the Rijnkaai" })}</figure>
    <div class="prose" data-anim>
      <p class="lede">${esc(site.address.street)}, B-${esc(site.address.postal)} ${esc(site.address.city)} — ${esc(site.address.district)}.</p>
      <p class="label label--plain" style="margin-top:2rem">${esc(t(loc, "gettingThere"))}</p>
      <ul class="hours">${trams}</ul>
      <p style="margin-top:1.6rem">${esc(t(loc, "wheelchair"))} ${esc(t(loc, "byAppointment"))}</p>
      <p class="label label--plain" style="margin-top:2.4rem">${loc === "nl" ? "Actueel" : "Current notices"}</p>
      ${actueel}
    </div>
  </div>
</div></main>` + tail(loc, clinicLd(loc));
}

function pageFaq(loc) {
  const qs = loc === "nl" ? [
    ["Wat betekent “niet geconventioneerd”?",
     "Onze artsen zijn niet geconventioneerd. Dat betekent dat zij niet gebonden zijn aan de officiële tarievenafspraak tussen artsen en ziekenfondsen, en dus zelf hun ereloon bepalen. U betaalt het volledige bedrag bij de consultatie en krijgt een getuigschrift waarmee uw ziekenfonds een deel terugbetaalt. Het verschil tussen wat u betaalt en wat u terugkrijgt, draagt u zelf. Vraag het bedrag gerust vooraf aan het secretariaat."],
    ["Wat betekent “geaccrediteerd”?",
     "Accreditering betekent dat de arts zich bijschoolt en deelneemt aan intercollegiale toetsing volgens de normen van het RIZIV. De meeste artsen bij Dermadok zijn geaccrediteerd; op elke artsenpagina staat het vermeld."],
    ["Heb ik een verwijsbrief nodig?",
     "Voor een raadpleging dermatologie is een verwijsbrief van uw huisarts niet verplicht. Wel nuttig: breng een lijst van uw medicatie mee, en foto’s als de klacht wisselt."],
    ["Kan ik online een afspraak boeken?",
     "Voor de meeste zorgverleners wel. Op elke artsenpagina staat of online boeken mogelijk is en waarvoor. Voor huidverbetering bij Lisette Van Meel belt u het secretariaat. Bij Dr. Denorme kan online boeken enkel voor gekende patiënten en algemene opvolgafspraken."],
    ["Kan ik mijn vraag mailen?",
     "Administratieve vragen wel. Medische vragen niet: het medisch geheim en uw privacy zijn via e-mail onvoldoende gegarandeerd. Bel daarvoor het secretariaat."],
    ["Moet ik iemand meebrengen voor een ingreep?",
     "Voor sommige ambulante ingrepen is begeleiding aangewezen. Het secretariaat laat u vooraf weten of dat voor uw ingreep geldt."]
  ] : [
    ["What does “niet geconventioneerd” mean?",
     "Our doctors are not conventioned. This means they are not bound by the official fee agreement between doctors and health insurers, and set their own fees. You pay the full amount at the consultation and receive a certificate with which your health insurer reimburses part of it. The difference is yours to carry. You are welcome to ask the secretariat for the amount in advance."],
    ["What does “geaccrediteerd” mean?",
     "Accreditation means the doctor undertakes continuing education and peer review according to RIZIV standards. Most doctors at Dermadok are accredited; each doctor's page states this."],
    ["Do I need a referral letter?",
     "A referral from your GP is not required for a dermatology consultation. It is helpful to bring a list of your medication, and photographs if the complaint comes and goes."],
    ["Can I book online?",
     "For most practitioners, yes. Each doctor's page states whether online booking is available and for what. For skin-improvement treatments with Lisette Van Meel, please call the secretariat. With Dr. Denorme, online booking is limited to existing patients and general follow-up appointments."],
    ["Can I e-mail my question?",
     "Administrative questions, yes. Medical questions, no: medical confidentiality and your privacy cannot be sufficiently guaranteed by e-mail. Please call the secretariat instead."],
    ["Do I need to bring someone for a procedure?",
     "For some day procedures it is advisable to bring someone with you. The secretariat will tell you in advance whether this applies to yours."]
  ];
  const items = qs.map(([q, a]) => `
    <div style="padding:1.7em 0;border-top:1px solid var(--line)" data-anim>
      <h2>${esc(q)}</h2><p style="margin-top:0.7em">${esc(a)}</p></div>`).join("");
  const ld = { "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: qs.map(([q, a]) => ({ "@type": "Question", name: q,
      acceptedAnswer: { "@type": "Answer", text: a } })) };

  return head(loc, { title: `${t(loc, "nav_faq")} — Dermadok Huidkliniek`,
    desc: loc === "nl" ? "Verwijsbrief, online boeken, niet geconventioneerd — de vragen die het vaakst gesteld worden."
      : "Referrals, online booking and fees — the questions we are asked most.", path: "veelgestelde-vragen" })
    + header(loc, "veelgestelde-vragen") + `
<main id="main"><div class="wrap wrap--tight">
  <section class="sect sect--tight">
    <p class="label" data-anim>${esc(t(loc, "nav_faq"))}</p>
    <h1 data-anim style="font-size:var(--t-h1);max-width:16ch">${loc === "nl" ? "Veelgestelde vragen" : "Common questions"}</h1>
  </section>
  <div class="prose" style="max-width:none">${items}</div>
</div></main>` + tail(loc, ld);
}

function pageClinic(loc) {
  return head(loc, { title: `${t(loc, "nav_clinic")} — Dermadok Huidkliniek`,
    desc: loc === "nl" ? "De praktijk aan de Rijnkaai op Het Eilandje in Antwerpen."
      : "The practice on the Rijnkaai, Het Eilandje, Antwerp.", path: "de-kliniek" })
    + header(loc, "de-kliniek") + `
<main id="main"><div class="wrap">
  <section class="sect sect--tight">
    <p class="label" data-anim>${esc(t(loc, "nav_clinic"))}</p>
    <h1 data-anim style="font-size:var(--t-h1);max-width:18ch">${loc === "nl"
      ? "Rijnkaai 22, Het Eilandje." : "Rijnkaai 22, Het Eilandje."}</h1>
  </section>
  <figure data-reveal style="margin-bottom:var(--stack-m)">
    ${picture("interior-2", { sizes: "100vw", alt: loc === "nl" ? "Het interieur van Dermadok Huidkliniek" : "The interior of Dermadok Skin Clinic" })}
  </figure>
  <div class="grid-2">
    <figure data-reveal>${picture("interior-1", { sizes: "(min-width:860px) 42vw, 100vw",
      alt: loc === "nl" ? "Behandelruimte" : "Treatment room" })}</figure>
    <div class="prose" data-anim>
      <p class="lede">${loc === "nl"
        ? "De praktijk ligt aan de Rijnkaai op Het Eilandje, op wandelafstand van het MAS. De ingang is rolstoeltoegankelijk en consultaties gebeuren uitsluitend op afspraak."
        : "The practice sits on the Rijnkaai in Het Eilandje, within walking distance of the MAS. The entrance is wheelchair accessible and consultations are by appointment only."}</p>
      <p><a class="tlink" href="${url(loc, "praktisch")}">${esc(t(loc, "nav_practical"))} →</a></p>
    </div>
  </div>
</div></main>` + tail(loc, clinicLd(loc));
}

/* -------------------------------------------------------------------- run */

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const routes = [];
for (const loc of ["nl", "en"]) {
  emit(loc, "", pageHome(loc)); routes.push(url(loc));
  for (const s of services.lines) { emit(loc, s.slug, pageService(loc, s)); routes.push(url(loc, s.slug)); }
  emit(loc, "ons-team", pageTeam(loc)); routes.push(url(loc, "ons-team"));
  for (const p of team.practitioners) {
    emit(loc, `ons-team/${p.slug}`, pageDoctor(loc, p)); routes.push(url(loc, `ons-team/${p.slug}`));
  }
  emit(loc, "tarieven", pagePrices(loc)); routes.push(url(loc, "tarieven"));
  emit(loc, "contact", pageContact(loc)); routes.push(url(loc, "contact"));
  emit(loc, "praktisch", pagePractical(loc)); routes.push(url(loc, "praktisch"));
  emit(loc, "veelgestelde-vragen", pageFaq(loc)); routes.push(url(loc, "veelgestelde-vragen"));
  emit(loc, "de-kliniek", pageClinic(loc)); routes.push(url(loc, "de-kliniek"));
}

cpSync(join(ROOT, "assets"), join(OUT, "assets"), { recursive: true,
  filter: (src) => !src.includes(`assets${process.platform === "win32" ? "\\" : "/"}source`) });

// robots + sitemap. Permissive by design (F-002).
writeFileSync(join(OUT, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: https://fietsenrekk.github.io${BASE}/sitemap.xml\n`);
writeFileSync(join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  routes.map((r) => `  <url><loc>https://fietsenrekk.github.io${r}</loc></url>`).join("\n") +
  `\n</urlset>\n`);
writeFileSync(join(OUT, ".nojekyll"), "");

if (errors.length) {
  console.error(`\nBUILD FAILED — ${errors.length} error(s):`);
  for (const e of [...new Set(errors)]) console.error("  " + e);
  process.exit(1);
}
console.log(`Built ${routes.length} routes to dist/`);
