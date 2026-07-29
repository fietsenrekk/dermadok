# Dermadok Huidkliniek — static site

Rebuild of dermadok.be as a static, bilingual (NL-BE / EN) site. No CMS, no backend, no
cookies, no third-party scripts. 48 routes generated from JSON by a zero-dependency Node script.

## Build

```bash
node tools/images.mjs    # grade + grain + responsive ladder (needs ffmpeg on PATH)
node tools/build.mjs     # generate dist/
node tools/audit.mjs     # structural audit — fails on dead links, missing alt, heading jumps
```

`BASE_PATH=/dermadok node tools/build.mjs` for a GitHub Pages project site.

## Local preview

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File ../serve-dermadok.ps1
```

Serves `dist/` on http://localhost:4213.

## Where things live

| Path | What |
|---|---|
| `data/site.json` | Address, hours, transit, **booking availability flags** |
| `data/team.json` | 13 practitioners — facts verbatim from source, booking URLs, restrictions |
| `data/services.json` | 7 service lines |
| `data/prices.json` | 57 prices, plus the documented source conflict |
| `tools/build.mjs` | Generator. Fails the build on missing i18n keys or unresolved bookings |
| `tools/images.mjs` | Colour grade, grain, AVIF/WebP/JPEG ladder |
| `docs/BRAND_EXTRACTION.md` | Every sampled hex, with provenance |
| `CLIENT_ACTIONS.md` | **Read this first** — price conflict, legal, open questions |

## Changing appointment availability

One place. `data/team.json` → the practitioner → `booking.online` (`true` / `false` / `"partial"`)
and `booking.restriction`. Rebuild. Every page that mentions it updates.
