# Client actions — Dermadok

Ordered by consequence. The first three cost patients money, send them to the wrong place, or
carry legal exposure. Everything verified against the live dermadok.be on **29 July 2026**.

---

## 1. ⚠ Confirm Belgian advertising and price-publication rules — BEFORE launch

Dermadok is a dermatology practice **and** an aesthetic-medicine provider. Both sets of rules
apply and they are not the same. They govern what may be claimed, shown and priced publicly.

**This has not been decided in this build and must not be decided by your web team.** Confirm with
your professional body or legal advisor:

- May indicative prices for aesthetic treatments be published on a public website?
- Do the rules differ for general dermatology versus aesthetic medicine?
- Are the current price pages compliant as they stand today on dermadok.be?

The site is built so `/tarieven` can switch to "prijs op consultatie" **without a redesign** — one
flag, no layout change. All copy is factual and non-promotional: no superlatives, no outcome
guarantees, no before/after imagery anywhere.

---

## 2. ⚠ You publish two different prices for the same treatments

Your website currently contradicts itself. These pages were saved 41 seconds apart on
30 June 2026 and disagree:

| Treatment | `/richtprijzen-…-injectables/` | `/van-den-steen-philippe/` |
|---|---|---|
| Hyaluronzuur soft filler 1 ml | **€300** | **€350** |
| Hyaluronzuur soft filler 2 ml | **€550** | **€600** |
| Hyaluronzuur filler 0,55 ml | **€250** | **€270** |

A patient is quoted **up to €50 more** depending on which page they happen to land on.

This build uses the dedicated `/richtprijzen/` sheet, because it is purpose-built for pricing.
That gap of 41 seconds is far too small to prove which is newer, so **this is a guess and is
flagged as one on the live page**. Tell us which figures are correct and we will remove the notice.

Fix the old site too — the wrong number is probably in printed material and e-mail templates as well.

---

## 3. ⚠ Confirm current appointment availability

The brief we were given described a clinic-wide **patiëntenstop** for new dermatology patients
without a referral, and a **existing-patients-only** policy for spataders.

**Neither appears anywhere on your live website.** We searched all 22 pages. What we did find:

| Practitioner | Actual restriction, verbatim from your site |
|---|---|
| Dr. Verstraeten | "Er zijn momenteel geen afspraken meer beschikbaar voor algemene dermatologie." Laser referrals by phone. |
| Dr. Denorme | Online booking only for known patients and general follow-up. Procedures via the secretariat. |
| Dr. Bracke | No new appointments for haarpathologie or vulvapathologie — "volledig stopgezet". |
| Lisette Van Meel | No online booking at all — phone only. |
| Everyone else | Online booking open, no restriction stated. |

All of this lives in **one file** (`data/site.json` and `data/team.json`). When something changes,
change the value there and every page that mentions it updates. Please confirm all five rows are
still accurate before launch.

---

## 4. The brief we were given was out of date in several places

Worth knowing, because the same errors may be circulating internally:

- **The brief listed 7 practitioners. You have 13.** Dr. Femke Spoelders was missing entirely, and
  Dr. Karen Wustenberghs was described as an unverified mention. Both have maintained pages and
  live booking links. Both are in this build in full.
- **The brief said your site blocks search crawlers.** It does not — `robots.txt` is the standard
  permissive WordPress default. There is no hidden SEO loss.
- **The brief said botox and filler prices were unpublished.** They are published in full.
- **The brief said `/huidverbetering` was nearly empty.** It has a complete treatment and price list.

---

## 5. Open questions we could not answer from your website

- **Address:** your site says `Rijnkaai 22`. Two external directories say `Rijnkaai 22/301`.
  Which is correct for post and for Google? We used your own form everywhere.
- **Laser device:** the brief names a "Cutera Excel V (532nm/1064nm)". We could not confirm this
  on your site and have **not published any device specification**. Confirm make and model.
- **Erbium-YAG indications:** the brief lists Hailey-Hailey disease, Darier's disease,
  neurofibromas and rhinophyma. These are specific clinical claims we could not verify verbatim.
  The page is live but marked as awaiting medical review.
- **Cryolipolyse** appears once in your navigation and nowhere else. Is it still offered?
- **French:** is French served, and at what level? Not built — say the word and it is added.
- **Patient reviews:** do you want them, and do you have written consent to publish them?
- **Logo:** do you have the original vector file? We rebuilt the mark by hand from a 448×142 PNG
  because no vector is exposed on your site. The original would be better.

---

## 6. Two spelling corrections we made

Your price page has two product-name typos. We used the correct names and are telling you so you
can fix the source:

- "Prostolane" → **Prostrolane**
- "Dr. CJY Hairfiller" → **Dr.CYJ Hair Filler**

---

## 7. Medical sign-off required

Every service description needs a doctor to read and approve it. Two pages are explicitly marked
in-build as awaiting review and display a notice until you clear them:

- `/laser` — device and protocol detail
- `/laser/erbium-yag` — the indication list

---

## 8. Production to-do (deliberately out of scope for this build)

- Analytics, and the consent obligation that comes with it. This build ships **no third-party
  scripts and no cookies**, so it currently needs no cookie banner at all. Adding analytics changes
  that. Your current site runs a cookie banner it may not need.
- The booking embed. `onlinebooking.myorganizer.online` sends **no** `X-Frame-Options` and **no**
  `frame-ancestors`, so embedding is technically permitted and the component supports it. We ship
  labelled new-tab links by default because they are more reliable on mobile. Worth confirming with
  the vendor that framing is intentionally allowed.
- A contact form, if you want one — needs a backend, which this build does not have.
- A CMS, if you want to edit copy yourselves.
- Custom domain.
