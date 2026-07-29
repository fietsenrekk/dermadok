# Findings — dermadok.be

Plain-language report for the client. Everything verified against the live site on
**29 July 2026**. Where the original brief disagreed with the site, the site won.

---

## F-001 · There is no visual system — CONFIRMED, and it is the whole problem

The site runs **Flash by ThemeGrill**, a stock WordPress theme, with default spacing, default type
(Raleway + Playfair Display + Montserrat — three unrelated families) and a plugin cookie banner.
Thirteen credentialed people are presented as one flat scroll.

The substance is genuinely strong: a dermatologist with a Harvard research period and a cum laude
doctorate, a dermatologist who is senior staff at UZA with a Versailles surgical diploma, a former
head of emergency medicine, a vascular surgeon operating across four hospitals. **None of it reads
as credible**, because the presentation flattens all of it to the same weight as everything else.

This is the core problem the rebuild solves. Everything else is downstream.

## F-002 · The crawler-blocking claim is FALSE

The brief stated the site may be blocking search crawlers and called it "an enormous, silent
loss." It is not. `robots.txt` is the stock permissive default: only `/wp-admin/` is disallowed,
and two sitemaps are declared. **There is no hidden SEO loss and no action needed.** The refusal
that produced this finding came from an automated fetching tool's own policy, not from the site.

## F-003 · The booking story — the brief was substantially wrong

The brief described a clinic-wide **patiëntenstop** for new dermatology patients without a
referral. **That appears nowhere on the site.** We searched all 22 pages for
patiëntenstop / verwijsbrief / doorverwijzing / "geen nieuwe" / wachtlijst. Zero matches.

All ten bookable practitioners have working online-booking deep links. What actually exists:

- **Dr. Verstraeten** — no appointments available for general dermatology; laser referrals by phone
- **Dr. Denorme** — online booking only for known patients and general follow-ups
- **Dr. Bracke** — no new haarpathologie or vulvapathologie appointments, "volledig stopgezet"
- **Lisette Van Meel** — no online booking at all, phone only

Real, but per-doctor and per-service — nothing like a clinic-wide freeze. All four are now
data-driven flags rather than prose.

**Also found: the phone number is plain text on every page.** There is not a single `tel:` or
`mailto:` link on the entire site. On a phone you cannot tap to call a dermatology clinic. The
rebuild has three tappable phone links per page plus a persistent mobile call bar. This is the
cheapest significant fix available and it was not in the brief.

## F-004 · Inconsistent service depth — PARTLY CONFIRMED

Spataders and chirurgie have solid copy. But the brief's claim that `/huidverbetering` is "close to
a page title" is **wrong** — it carries a full treatment list and five prices (€35–€95).

Genuinely thin and flagged for sign-off: the laser pages. The brief names a specific device
("Cutera Excel V, 532nm/1064nm") that **could not be confirmed anywhere on the live site**, so no
device specification has been published. Same for the Erbium-YAG indication list
(Hailey-Hailey, Darier, neurofibromas, rhinophyma) — clinically specific claims, unverified,
so the page ships marked as awaiting medical review.

## F-005 · Bios are CVs, not people — CONFIRMED, and worse than described

The brief's own bios were missing major credentials. Recovered from the live pages:

- **Dr. Horst** — spring 2018 at the university hospital in Moshi, Tanzania; postgraduate Tropical
  Medicine at ITG Antwerp; a Diplôme Inter Universitaire in dermatologic surgery from Versailles;
  and currently **senior staff in dermatology at UZA**. The brief had none of this.
- **Dr. Verstraeten** — a **doctorate cum laude** (Maastricht, 4 March 2011) and a medical degree
  with highest distinction. The brief had neither.

## F-006 · Meta and social cards — WORSE than described

The brief said the `og:locale` is wrong. In fact the homepage has **no Open Graph tags at all** —
querying `meta[property^="og"]` returns an empty set. Every page in the rebuild has correct
`og:locale` (`nl_BE` / `en_GB`), title, description, canonical and full hreflang.

## F-007 · Cookie banner — CONFIRMED, removed

A plugin banner appears site-wide. The rebuild ships **no third-party scripts, no analytics and no
cookies**, so it needs no banner at all. Note: adding analytics later reintroduces the obligation.

## F-008 · Dated notices baked into evergreen pages — CONFIRMED, and still happening

Dr. Spoelders' page, edited in May 2026, contains *"Momenteel zijn er afspraken mogelijk van juni
2026 tem augustus 2026"* — hardcoded text that expires within weeks of this report. Deliberately
not carried over. There is now a dated "Actueel" slot on `/praktisch` driven by
`data/site.json → actueel`, currently empty.

Per the brief's own instruction, **no current roadworks text was hardcoded anywhere.**

## F-009 · Operational status as prose, not data — CONFIRMED, fixed

Every availability fact now lives in `data/site.json` and `data/team.json` as a flag. Change the
value, rebuild, every page updates. The build **fails** if a practitioner has no resolvable
booking path, so a half-configured state cannot ship silently.

## F-010 · Belgian advertising rules — NOT DECIDED, escalated

Not resolved in this build and not resolvable by a web team. Copy is factual and non-promotional
throughout: no superlatives, no outcome guarantees, no before/after imagery. `/tarieven` is built
so it can switch to "prijs op consultatie" with one flag and no redesign. Top item in
`CLIENT_ACTIONS.md`.

## F-011 · Open questions — mostly resolved

| Question | Answer |
|---|---|
| `Rijnkaai 22` or `22 bus 301`? | The clinic's own site and footer say **`Rijnkaai 22`**, no unit. Directories showing `22/301` are third-party and unconfirmed. Still worth confirming for post. |
| Is Dr. Wustenberghs still practising? | **Yes.** Full team member, maintained page, live booking link, Tuesday afternoons. |
| Is French served? | Unresolved — not built. |
| Scope of cryolipolyse? | Unresolved — appears once in navigation, nowhere else. |
| Patient reviews? | Unresolved — none published, and consent would be needed. |
| Vector logo? | **No vector exposed anywhere.** Mark re-traced by hand from a 448×142 PNG. |
| Botox/filler prices published? | **Yes, in full** — and inconsistently. See below. |

---

## F-012 · NEW — the site publishes two different prices for the same treatments

Not in the brief. Found during transcription.

| Treatment | `/richtprijzen-…-injectables/` | `/van-den-steen-philippe/` |
|---|---|---|
| HA soft filler 1 ml | €300 | €350 |
| HA soft filler 2 ml | €550 | €600 |
| HA filler 0,55 ml | €250 | €270 |

Both pages were saved on 30 June 2026, 41 seconds apart. A patient is quoted up to **€50 more**
depending on which page they land on. The build uses the dedicated price sheet and says so on the
live page. **This is the single most consequential finding in this report** and needs a decision
before launch.

## F-013 · NEW — the team is thirteen people, not seven

The brief listed seven practitioners. The site's own navigation lists thirteen.
**Dr. Femke Spoelders — dermatologist, UGent 2019, trained in Germany, Ghent and Leuven — was
absent from the brief entirely** despite having a maintained page, a booking link and Friday
consultations. Dr. Karen Wustenberghs was described as an unverified single mention; she is a full
vascular surgeon with a complete practice. Both are in the rebuild in full.

## F-014 · NEW — two product-name typos on the price page

"Prostolane" should be **Prostrolane**. "Dr. CJY Hairfiller" should be **Dr.CYJ Hair Filler**.
Corrected in the rebuild; flagged so the source can be fixed too.
