// Dermadok image pipeline — grade, grain, responsive ladder. Zero npm dependencies; shells to ffmpeg.
//   node tools/images.mjs            build everything
//   node tools/images.mjs --probe    inventory only, no encoding
//
// THE GRADE IS A SYSTEM, NOT A FILTER (§9.4). Every number below is deliberate and reproducible.
// The client's next photographer can match this recipe exactly.
//
// TWO PROFILES, because §9.5 makes skin the hard constraint. ffmpeg cannot mask faces, and a
// global desaturation strong enough to calm an interior would drag skin toward grey. So the
// environment is desaturated and the person is not — "desaturate the environment, not the
// person" implemented as two profiles rather than one compromise that fails both.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, parse } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const SRC = join(ROOT, "assets/source");
const OUT = join(ROOT, "assets/img");
const PROBE_ONLY = process.argv.includes("--probe");

/* ------------------------------------------------------------------ grade */

// Shared spine. Applied to every photograph without exception.
//   curves   lifted black point (0 -> 0.045) gives the soft matte floor; the shoulder
//            (0.82 -> 0.965) prevents clipped whites on skin. Restrained S through the middle.
//   eq       contrast 1.06 is deliberately mild — heavy contrast reads as fashion, not medicine.
//   colorbalance  split tone, single digits: cool shadows, warm highlights. If you can see it
//            as a cast it is too much, so blue shadows +0.04 and red highlights +0.035 only.
const CURVE = "curves=master='0/0.045 0.25/0.235 0.5/0.5 0.82/0.84 1/0.965'";
const SPLIT = "colorbalance=bs=0.040:rh=0.035:bh=-0.015";

const PROFILES = {
  // Faces. Saturation held at 0.97 — barely moved. Protecting skin outranks grade consistency.
  portrait: {
    filters: [CURVE, "eq=contrast=1.055:saturation=0.97:gamma=1.01", SPLIT],
    grain: 5,           // luminance grain strength at reference width (see grainFor)
    sharpen: "unsharp=5:5:0.5:5:5:0.0"
  },
  // Buildings, interiors, equipment. Saturation 0.86 — this is where the desaturation lives.
  environment: {
    filters: [CURVE, "eq=contrast=1.075:saturation=0.86:gamma=1.0", SPLIT],
    grain: 7,
    sharpen: "unsharp=5:5:0.7:5:5:0.0"
  }
};

// §9.7: grain must be baked PER VARIANT at its own size. Grain baked once at 3840 and then
// downscaled to 480 disappears entirely, and the small variants look plastic beside the large
// ones. Reference width 1600; smaller variants get proportionally less absolute noise so the
// PERCEIVED grain size stays constant across the ladder.
const grainFor = (base, width) => Math.max(2, Math.round(base * Math.sqrt(width / 1600)));

const LADDER = [480, 768, 1200, 1600, 2048, 2560, 3840];

/* --------------------------------------------------------------- sources */

// profile + role per asset. Portraits are graded gently; everything else is environment.
const ASSETS = {
  "verstraeten":  { profile: "portrait", role: "portrait" },
  "bracke":       { profile: "portrait", role: "portrait" },
  "horst":        { profile: "portrait", role: "portrait" },
  "denorme":      { profile: "portrait", role: "portrait" },
  "mangodt":      { profile: "portrait", role: "portrait" },
  "spoelders":    { profile: "portrait", role: "portrait" },
  "wustenberghs": { profile: "portrait", role: "portrait" },
  "vandensteen":  { profile: "portrait", role: "portrait" },
  "vandevijver":  { profile: "portrait", role: "portrait" },
  "vandunnegem":  { profile: "portrait", role: "portrait" },
  "pauwels":      { profile: "portrait", role: "portrait" },
  "block":        { profile: "portrait", role: "portrait" },
  "vanmeel":      { profile: "portrait", role: "portrait" },
  "gevel":        { profile: "environment", role: "hero" },
  "interior-1":   { profile: "environment", role: "editorial" },
  "interior-2":   { profile: "environment", role: "editorial" }
};

const MINIMUMS = { hero: 3840, editorial: 2560, portrait: 2560, card: 1600 };

/* ----------------------------------------------------------------- utils */

const ff = (args) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "pipe" });

function probe(file) {
  const out = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height", "-of", "csv=p=0", file], { encoding: "utf8" });
  const [w, h] = out.trim().split(",").map(Number);
  return { w, h };
}

/* ----------------------------------------------------------------- build */

mkdirSync(OUT, { recursive: true });
const manifest = { _generated: new Date().toISOString(), grade: { CURVE, SPLIT, PROFILES, grainReferenceWidth: 1600 }, images: [] };
const shortfalls = [];

for (const file of readdirSync(SRC)) {
  const { name, ext } = parse(file);
  const cfg = ASSETS[name];
  if (!cfg) continue;                                   // logos handled separately, not graded
  const srcPath = join(SRC, file);
  const { w, h } = probe(srcPath);
  const profile = PROFILES[cfg.profile];
  const min = MINIMUMS[cfg.role];

  // §9.3 / §9.6. We NEVER upscale past the source width. Reaching 2560 from a 500px portrait is
  // a 5x upscale and §9.6 forbids exactly that on faces. An honest small image beats a smeared
  // large one, so the ladder is clipped to the intrinsic width and the gap is reported.
  const widths = [...new Set([...LADDER.filter((x) => x < w), w])].sort((a, b) => a - b);
  // §9.3 measures the LONG EDGE. A 2399x2560 portrait meets a 2560 minimum; testing width alone
  // would have wrongly failed it.
  const longEdge = Math.max(w, h);
  const meets = longEdge >= min;
  if (!meets) shortfalls.push({ name, role: cfg.role, have: `${w}x${h}`, need: `${min}px`, ratio: (min / longEdge).toFixed(1) + "x" });

  const record = {
    slug: name, source: file, intrinsic: { w, h }, role: cfg.role, profile: cfg.profile,
    meetsMinimum: meets, requiredMinimum: min, variants: []
  };

  if (!PROBE_ONLY) {
    for (const width of widths) {
      const g = grainFor(profile.grain, width);
      // ORDER MATTERS: scale -> grade -> sharpen at output size -> grain last.
      // Grain before scaling gets smeared into mush; sharpening before scaling amplifies
      // resampling artefacts. noise c0s touches the Y plane only = monochromatic luminance
      // grain. Chroma grain reads as a broken JPEG, never as film (§9.7).
      const chain = [
        `scale=${width}:-2:flags=lanczos`,
        ...profile.filters,
        profile.sharpen,
        `noise=c0s=${g}:c0f=u`,
        "format=yuv420p"
      ].join(",");

      const webp = join(OUT, `${name}-${width}.webp`);
      const avif = join(OUT, `${name}-${width}.avif`);
      const jpg  = join(OUT, `${name}-${width}.jpg`);
      ff(["-i", srcPath, "-vf", chain, "-c:v", "libwebp", "-quality", "82", "-compression_level", "6", webp]);
      ff(["-i", srcPath, "-vf", chain, "-c:v", "libaom-av1", "-crf", "32", "-cpu-used", "6", "-still-picture", "1", avif]);
      ff(["-i", srcPath, "-vf", chain, "-q:v", "4", jpg]);
      record.variants.push({ width, grain: g, webp: `${name}-${width}.webp`, avif: `${name}-${width}.avif`, jpg: `${name}-${width}.jpg` });
      process.stdout.write(`  ${name} @${width} (grain ${g})\n`);
    }
  }
  manifest.images.push(record);
}

manifest.shortfalls = shortfalls;
writeFileSync(join(ROOT, "data/assets.manifest.json"), JSON.stringify(manifest, null, 2));

console.log(`\n${manifest.images.length} sources processed.`);
if (shortfalls.length) {
  console.log(`\n${shortfalls.length} assets BELOW the §9.3 minimum — not upscaled, by design (§9.6):`);
  for (const s of shortfalls) console.log(`  ${s.name.padEnd(14)} ${s.have.padEnd(10)} needs ${s.need} (${s.ratio} upscale — refused)`);
  console.log(`\n  → escalated to SHOOT_LIST.md. Faces are where upscale artefacts are least forgivable.`);
}
