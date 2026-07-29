# Shoot list — Dermadok

## The headline finding

**Every usable photograph on dermadok.be is below the resolution this site needs. All sixteen.**

That is not a criticism of the photographs — several are perfectly good pictures. It is a
statement about file size. Most portraits are 500 × 597 pixels, which was a normal web size in
2019 and is roughly a quarter of what a modern screen wants.

We deliberately did **not** upscale them. Pushing a 500 px face through a 4× AI upscale produces
the plastic, over-smoothed look that reads instantly as fake — and on a dermatology website, where
skin is the actual subject, that is the worst possible failure. The photographs are used at sizes
their real resolution supports, and graded to one consistent system.

| Asset | Have | Needs | Upscale that was refused |
|---|---|---|---|
| Dr. Femke Spoelders | 352 × 347 | 2560 px | 7.3× |
| Dr. Annick Bracke | 500 × 597 | 2560 px | 4.3× |
| Dr. Niels Horst | 500 × 597 | 2560 px | 4.3× |
| Dr. Valerie Verstraeten | 500 × 597 | 2560 px | 4.3× |
| Dr. Evelyne Mangodt | 500 × 597 | 2560 px | 4.3× |
| Dr. Karen Wustenberghs | 500 × 597 | 2560 px | 4.3× |
| Stéphanie Van Dunnegem | 500 × 597 | 2560 px | 4.3× |
| Caroline Pauwels | 500 × 597 | 2560 px | 4.3× |
| Julie Block | 454 × 640 | 2560 px | 4.0× |
| Stephanie Van de Vijver | 480 × 640 | 2560 px | 4.0× |
| Dr. Philippe Van den Steen | 856 × 918 | 2560 px | 2.8× |
| Lisette Van Meel | 1290 × 1454 | 2560 px | 1.8× |
| Facade (`gevel.jpg`) | 1000 × 960 | 3840 px | 3.8× |
| Interior ×2 | 1000 × 667 | 2560 px | 2.6× |
| **Dr. Pieter Denorme** | **2399 × 2560** | 2560 px | **— meets spec** |

Dr. Denorme's portrait is the only one that clears the bar, and it is visibly the best image on
the current site. That is not a coincidence — it is the whole argument for the shoot below.

---

## Priority 1 — one photographer, one session, all thirteen people

**This is the single highest-leverage thing you can do for the site, and it costs one afternoon.**

Right now the thirteen portraits come from at least six different sessions across seven years,
shot on different cameras, in different light, against different backgrounds, at different
distances. We have graded them to one colour system, which helps a great deal — but grading cannot
fix different focal lengths, different eye-lines and different backgrounds.

Brief for the photographer:

- **One session, one room, one setup.** Everybody, same day.
- **Background:** the clinic's own wall. The `DERMA│DOK` signage wall behind Dr. Denorme is ideal
  and is already part of your identity.
- **Light:** one large soft source, slightly off-axis, plus fill. No hard shadow on the face.
- **Framing:** mid-chest, eye-line at the same height for every person, same lens (85 mm
  equivalent), same distance. Shoot portrait orientation, 5:6.
- **Wardrobe:** whatever each person actually wears at work. No styling.
- **Delivery:** RAW plus 16-bit TIFF, minimum 3000 px on the long edge. Do not accept
  web-sized JPEGs.
- **Expression:** neutral and direct beats a broad smile. This is a medical practice.

Give the photographer `docs/IMAGE_REPORT.md` — it contains the exact colour grade, with numbers,
so new photographs can be matched to the existing system rather than replacing it.

---

## Priority 2 — the building and the rooms

The facade shot is 1000 px and is currently doing hero duty. It needs to be about four times
larger.

- **Facade at Rijnkaai 22** — including the entrance, so patients recognise it on arrival.
  Shoot in overcast light or late afternoon. Minimum 4000 px wide. Landscape and a 21:9 crop.
- **The entrance and approach** — genuinely useful, not decorative. Patients get lost on Het
  Eilandje. One frame showing what the door looks like from the street is worth a paragraph.
- **Waiting area** — as it actually is, empty, daylight.
- **Two treatment rooms** — empty, tidy, daylight. No people, no patients.
- **Reception desk** — for the contact page.

## Priority 3 — equipment, shot as instruments

Photograph the laser equipment the way a precision-instrument catalogue would: dark ground, one
raking light, shallow depth of field, close on the working end. Not a product shot on white —
these should look like serious medical hardware, because they are.

- The vascular/pigment laser (**confirm make and model first** — see CLIENT_ACTIONS §5)
- The Erbium-YAG laser
- The dermatoscope and the digital mole-mapping setup — this is a genuine differentiator and
  currently has no photograph at all
- The duplex ultrasound unit

## What NOT to shoot

- No patients. No treatments in progress. No skin lesions, moles or clinical detail of any kind.
- No before/after. Legally fraught, and grotesque next to skin-cancer content.
- No stock-style "caring hands", folded arms, or stethoscopes.

---

## Nothing on this site is AI-generated

No faces, no interiors, no clinical imagery, no textures. Every photograph is the clinic's own,
graded and re-encoded. On a medical site a generated face is a fabricated identity and a generated
"medical-looking" image risks being read as real clinical documentation. The pipeline
(`tools/images.mjs`) reads only from `assets/source/`, which contains only files downloaded from
dermadok.be.
