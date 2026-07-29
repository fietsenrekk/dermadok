# Brand extraction — dermadok.be

Extracted 2026-07-29 from the live site using the in-app browser (not a fetch tool).
Every value below was sampled programmatically; the sampling method is recorded so it is
reproducible. **No value in this document was invented.**

---

## 1. Crawlability — F-002 is WRONG

The prompt asserted the site may be blocking crawlers and calls this "an enormous, silent loss."
It is not blocking anything. `https://www.dermadok.be/robots.txt` returns:

```
User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php

Sitemap: https://www.dermadok.be/sitemap.xml
Sitemap: https://www.dermadok.be/sitemap.html
```

That is the stock WordPress/Yoast default. Nothing of substance is disallowed. The refusal that
generated F-002 was the *fetch tool's own* policy, not the site's. **No action required, and the
claimed SEO loss does not exist.** The rebuild still ships its own permissive `robots.txt` and a
real `sitemap.xml`.

---

## 2. The logo

| File | Intrinsic | Content |
|---|---|---|
| `wp-content/uploads/2019/03/logo-dermadok.png` | 448×142 (also served 1280×405) | `#f8f8f8` 2 480 px + transparent 61 136 px |
| `wp-content/uploads/2019/03/cropped-dermadok-logo.png` | 448×142 | `#202020` 2 320 px + transparent 61 136 px |
| `cropped-dermadok-logo-1-192x192.png` (favicon) | 192×192 | `#202020` 1 304 px + transparent |

Method: drawn to a canvas, every pixel with alpha ≥ 200 bucketed to the nearest 8 levels per
channel, counted, sorted by frequency.

2 480 opaque + 61 136 transparent = 63 616 = exactly 448 × 142. The image is **fully accounted for
by one ink value and transparency.** A minor `#282020` cluster (160 px, 20 % sat) appears only at
glyph edges — antialiasing fringe, not a brand colour.

**Conclusion: the Dermadok mark is monochrome.** Positive `#202020`, knockout `#f8f8f8`.
No vector file is exposed anywhere on the site (checked header, footer, favicon set,
apple-touch-icon, uploads). Per §7.1 step 2 the mark is therefore **re-traced by hand** as layered
inline SVG, not machine-traced from the compressed raster.

---

## 3. The palette — there isn't one

Computed styles were harvested from the first 3 000 elements on the homepage across
`color`, `background-color` and `border-top-color`, then ranked by frequency.

| Sampled | Where | Count |
|---|---|---|
| `#333333` | `body.home` — default body text | 619 |
| `#000000` | `html` | 133 |
| `#ffffff` | `div.logo-text`, page ground | 89 |
| `#212529` | `div.cli-modal-dialog` (cookie plugin) | 28 |
| `#777777` | `div.section-description` | 25 |
| `#222222` | `h3.team-title` | 24 |
| `#666666` | `a.sowb-button`, `a.service-more` | 20 |
| `#f2f2f2` | `div.siteorigin-panels-stretch` | 4 |
| `#1a1a1a` | slider font class | 3 |
| `#bcbaba` | `a` | 3 |

**Every single value is achromatic.** Saturation is zero across the entire theme. There is no
brand hue on dermadok.be — not in the CSS, not in the logo.

This invalidates the literal reading of §2 ("the EXISTING brand palette exactly as extracted"):
there is no palette to preserve beyond ink and paper.

### Palette extension — decision and provenance

§7.3 permits extending a thin palette with neutrals only, and Agent A's completion standard
demands zero invented brand colour. Taken together those would force a fully greyscale site.
Instead — by explicit client decision — **one accent is sampled from the clinic's own
photography**, so it still traces to a real Dermadok source rather than being invented.

Method: each photograph downsampled to 200 px wide; pixels with saturation < 14 %, max channel
< 40 or > 245 discarded (drops neutrals, crushed shadows, blown highlights); remainder bucketed to
16 levels per channel and ranked.

| Source photo | Dominant chromatic clusters |
|---|---|
| `2019/03/gevel.jpg` (the Rijnkaai facade) | `#a09080` h30° s20 % · `#b0a090` h30° s18 % · `#a08070` h20° s30 % |
| `2019/03/2014-Dermadok-3-8938.jpg` | `#a09080` h30° s20 % · `#f0d0c0` h20° s20 % |
| `2019/03/2014-Dermadok-29-8979.jpg` (interior) | `#807060` h30° s25 % · `#706050` h30° s29 % |

All three converge independently on **hue 20–30°, saturation 18–30 %** — the warm desaturated
clay of Het Eilandje brick and the interior's warm light. One weak cool cluster (`#606070`,
h240°, s14 %, 378 px) is window shadow and is discarded.

**Accent adopted: `--clay: #7D6353`** — the facade cluster taken deeper and slightly further
desaturated. Origin: `gevel.jpg`, mid-tone brick.

> **Slop risk, logged rather than ignored.** §8.1 tell #7 bans "warm cream + high-contrast serif +
> terracotta". A hue-25° accent is adjacent to that default. The mitigations are binding on the
> build: the accent is a *brick shadow*, not a terracotta (s ≈ 25 %, L ≈ 41 %, never a saturated
> orange); the paper is **cool** off-white, never warm cream; the display face is **not** a
> high-contrast serif (Playfair is precisely what is being removed); and the clay is never used as
> a section background field — only as a small-area accent. If any screen starts reading as that
> default, Agent F kills it.

### Final tokens — six values, the §7.3 ceiling

| Token | Value | Provenance |
|---|---|---|
| `--ink` | `#202020` | **sampled** — logo positive |
| `--paper` | `#F4F4F2` | extension — cool off-white, deliberately not cream |
| `--clay` | `#7D6353` | **sampled** — `gevel.jpg` facade brick |
| `--slate` | `#6E7176` | extension — cool mid grey, temperature-matched against clay |
| `--line` | `#D8D8D4` | extension — hairline, derived from paper |
| `--knock` | `#F8F8F8` | **sampled** — logo knockout |

Three of six trace to a sampled hex. The three extensions are neutrals, as §7.3 requires.

---

## 4. Typography found on the live site

`Raleway` · `"Playfair Display", Arial` · `Montserrat` — three Google families, the canonical
default-theme trio. Theme identified from the footer: **Flash by ThemeGrill**. This confirms F-001
directly.

None of these carry forward.

---

## 5. Source imagery inventory

Full list in `data/assets.manifest.json`. The headline problem:

| Portrait | Intrinsic | Meets §9.3 (≥ 2560 px)? |
|---|---|---|
| Dr Pieter Denorme | 2399×2560 | ✅ |
| Lisette Van Meel | 1290×1454 | ❌ |
| Dr Philippe Van den Steen | 856×918 | ❌ |
| Stephanie Van de Vijver | 480×640 | ❌ |
| Julie Block | 454×640 | ❌ |
| Dr Annick Bracke | 500×597 | ❌ |
| Dr Niels Horst | 500×597 | ❌ |
| Dr Valerie Verstraeten | 500×597 | ❌ |
| Dr Evelyne Mangodt | 500×597 | ❌ |
| Dr Karen Wustenberghs | 500×597 | ❌ |
| Stéphanie Van Dunnegem | 500×597 | ❌ |
| Caroline Pauwels | 500×597 | ❌ |
| **Dr Femke Spoelders** | **352×347** | ❌ **worst** |

These filenames carry no WordPress size suffix, so they are the originals — not theme-generated
derivatives. There is no larger version on the server to recover.

**12 of 13 portraits cannot meet the §9.3 minimum, and §9.6 forbids pushing a face through an
aggressive upscale.** Reaching 2560 px from 500 px is a 5× upscale; from Dr Spoelders' 352 px it is
over 7×. That is exactly the operation §9.6 prohibits, and faces are where upscale artefacts are
least forgivable.

**Resolution: portraits are used at restrained display sizes matched to their true resolution, are
never upscaled beyond 2×, and the gap is escalated to `SHOOT_LIST.md` item #1.** The single
photographic session that fixes this costs the client one afternoon and is the highest-leverage
credibility fix available to them.

Also noted: **the homepage carries zero Open Graph tags** — not the wrong `og:locale` that F-006
describes, but none at all. `<meta property="og:*">` returns an empty set.
