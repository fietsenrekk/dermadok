# Image report — Dermadok

Everything here is reproducible: `node tools/images.mjs` regenerates the entire library from
`assets/source/`. The recipe lives in the repo, not in a generation history.

## What was used

**All 16 photographs are the clinic's own, downloaded from dermadok.be.** Nothing was generated.
No faces, no interiors, no clinical imagery, no textures, no "material plates". On a medical site
a generated face is a fabricated identity, and a generated medical-looking image risks being read
as real clinical documentation — a patient-safety problem, not a design one.

Credits spent on image generation: **zero**. The grade and encode run locally through ffmpeg,
which is free and version-controlled.

## The colour grade — exact values

One system, applied to every photograph without exception. Two profiles, because §9.5 makes skin
the hard constraint and ffmpeg cannot mask faces: a global desaturation strong enough to calm a
mixed-lighting interior would drag skin toward grey. So the environment is desaturated and the
person is not.

**Shared spine (both profiles):**

```
curves=master='0/0.045 0.25/0.235 0.5/0.5 0.82/0.84 1/0.965'
colorbalance=bs=0.040:rh=0.035:bh=-0.015
```

- `0/0.045` — the lifted black point. Gives a soft matte floor; crushed blacks read as phone-camera.
- `0.82/0.84 → 1/0.965` — the highlight shoulder. Prevents clipped whites on skin and on white coats.
- `colorbalance` — the split tone. Blue into shadows (+0.040), red into highlights (+0.035), a
  touch of blue out of highlights (−0.015). Single digits. If you can see it as a cast, it is wrong.

**Portrait profile** — faces:
```
eq=contrast=1.055:saturation=0.97:gamma=1.01
unsharp=5:5:0.5:5:5:0.0
noise=c0s=<per-variant>:c0f=u
```
Saturation is held at **0.97** — barely moved. Protecting skin outranks grade consistency.

**Environment profile** — building, interiors:
```
eq=contrast=1.075:saturation=0.86:gamma=1.0
unsharp=5:5:0.7:5:5:0.0
noise=c0s=<per-variant>:c0f=u
```
Saturation **0.86**. This is where the desaturation lives.

**Filter order matters and is deliberate:**
`scale → grade → sharpen → grain → format`. Grain before scaling gets smeared into mush;
sharpening before scaling amplifies resampling artefacts. Output-sharpening only, at final size.

## Grain

`noise=c0s=N:c0f=u` touches the **Y plane only** — monochromatic luminance grain. Chroma grain
reads as a broken JPEG, never as film.

Strength is computed per variant: `round(base × √(width / 1600))`, base 5 (portrait) / 7
(environment), floor 2. Grain baked once at full size and then downscaled disappears entirely,
leaving small variants looking plastic beside large ones — so each responsive variant is grained
at its own size. Actual values run from 2 at 480 px to 7 at 2560 px.

A second grain layer sits over the page in CSS: a 128 px `feTurbulence` tile, `mix-blend-mode:
overlay`, `opacity: 0.025`, fixed size so it never scales with zoom or DPR.

## Encoding

Ladder: 480 / 768 / 1200 / 1600 / 2048 / 2560 / 3840, **clipped to each source's intrinsic width**.
Three formats per variant — AVIF (`libaom-av1`, crf 32), WebP (q 82), JPEG (q:v 4) — served through
`<picture>` with correct `sizes`. 117 files total.

AVIF earns its place: Dr. Denorme at 1600 px is **40 KB AVIF vs 127 KB WebP**, a 68 % saving.

## The resolution problem

15 of 16 sources fall below the minimum this design calls for, and **they were not upscaled**.
Full table and the shoot brief are in `SHOOT_LIST.md`. The short version: most portraits are
500 × 597, reaching 2560 would be a 4–7× upscale, and faces are where upscale artefacts are most
visible and least forgivable. `tools/images.mjs` refuses the upscale by construction — the ladder
is clipped to the source width and the shortfall is printed on every run.

Dr. Denorme (2399 × 2560) is the only source that clears the bar, and it is visibly the best image
on the site.

## Verification performed

- Skin tone checked on the graded output at full size. Natural, neither orange-shifted nor grey.
- Highlight rolloff confirmed on Dr. Denorme's white coat — no clipping.
- All three formats confirmed decoding in-browser (AVIF, WebP, JPEG each return correct intrinsic
  dimensions).
- No image is scaled beyond its intrinsic width in CSS.
- EXIF is stripped by ffmpeg re-encode; no GPS data survives.
