# Awwwards submission package — Dermadok

**Live:** https://fietsenrekk.github.io/dermadok/
**Repo:** https://github.com/fietsenrekk/dermadok

> ⚠ **Not submitted.** Submitting to Awwwards on a real clinic's behalf is the client's decision,
> not the build team's. This package is prepared and ready; someone with the client relationship
> has to press the button. The thumbnails below still need to be captured — see "Outstanding".

---

## Description (submission field)

> Dermadok is a seven-doctor dermatology, surgery and aesthetic-medicine clinic in Antwerp whose
> real credentials — Harvard research, a cum laude doctorate, a Versailles surgical diploma — were
> invisible behind a stock WordPress theme. The rebuild takes its entire design language from the
> one thing the clinic already owned: the vertical rule that splits DERMA│DOK in its own logo,
> reused as structural spine, section divider and scroll indicator. The single accent colour is
> sampled from a photograph of the clinic's own brick facade. Every practitioner's booking path is
> resolved individually, so a patient always knows whether they can book online or need to call.

Two or three sentences, no agency waffle. Adjust length to the field limit.

## Categories

Pick honestly, do not spray:

- **Health & Wellness** — primary
- **Business & Corporate** — secondary
- **Typography** — defensible: the type system is derived from the logo's own three-tier structure

Do **not** submit under Animation. The motion here is deliberately restrained — two variants, no
pinning, nothing scrubbed on clinical pages — and it would score poorly against sites built to
show off motion. That restraint is correct for the subject matter but it is not an animation entry.

## Technologies

`Zero-dependency Node static generator` · `GSAP` · `ScrollTrigger` · `Lenis` · `ffmpeg (colour
grade + AVIF/WebP ladder)`

No framework. 48 static routes, ~51 KB gzipped JS total, no runtime.

## Elements (3–5 individual submissions)

The most underused route to visibility on the platform. Candidates, strongest first:

1. **The practitioner roster** — not a grid of identical cards. Name, credential, which day they
   consult, and whether they book online, in one scannable row. Answers "who do I see for what"
   without a click. The clay rule wipes in from the bottom on hover and focus.
2. **The booking-path resolver** — one component, driven entirely by data, that renders a
   different truth per practitioner: open online booking, restricted online booking with the
   restriction stated above the button, or phone-only. Never shows online booking where it is not
   offered.
3. **The price sheet** — 57 prices set as a clinical document. Tabular figures, dotted leaders,
   no zebra, no pills, no borders, nothing animated. Includes an honest inline notice where the
   source data contradicts itself.
4. **The brand device** — the vertical rule from the logo, doing structural work throughout:
   label separator, section spine, hover indicator, scroll progress.

Capture each as a clean screen recording or still.

## Outstanding before submission

- [ ] Desktop thumbnail, 1200×900. **Not a raw hero screenshot** — a composed frame showing the
      roster or the price sheet, which are the strongest ideas.
- [ ] Mobile thumbnail, purpose-built. Most entries lose points submitting a squashed desktop crop.
- [ ] Element captures (4 above).
- [ ] Run the full §15 checklist against the **live** URL, not localhost.
- [ ] Confirm zero console errors on three routes on the live URL.
- [ ] **Resolve the price conflict first** (`CLIENT_ACTIONS.md` §2). Submitting a site that
      knowingly displays contested prices is not a good look if a juror reads the notice.

## Honest self-assessment

Against §3.1's real jury numbers (Nominee ≈ 6.5, SOTD ≈ 7.4–8.0):

| Axis | Weight | Estimate | Why |
|---|---|---|---|
| Design | 40 % | 7.5 | Coherent and genuinely derived from the mark. Held back by source photography that is 4–7× below the resolution the layout wants — no grade fixes 500 px. |
| Usability | 30 % | 8.5 | Strongest axis. The booking resolver and the roster answer the two real patient questions immediately. Phone always one tap away. |
| Creativity | 20 % | 6.5 | Deliberately restrained. The device thread is a real idea; the execution is quiet by choice on a page about skin cancer. Jurors reward spectacle, and there is none here. |
| Content | 10 % | 8.5 | Full NL/EN, 13 practitioners, 57 prices, zero invented facts, contradictions surfaced rather than hidden. |

**Realistic outcome: Honorable Mention territory, not Site of the Day.** The photography ceiling is
the binding constraint and it is not solvable in code — it needs the shoot in `SHOOT_LIST.md`.
Re-submitting after that session is the higher-value move.
