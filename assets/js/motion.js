/* ==========================================================================
   DERMADOK — motion. §10 implemented as specified.

   TWO variants only. "Settle" for content, "Reveal" for photography. Anything
   else must be written down and justified; there are currently ZERO exceptions.
   Consistency reads as intent, variety reads as accident.

   This file is entirely optional to the page. Remove it and nothing breaks:
   every element renders in its final state, because the hiding rules in
   base.css are scoped to html.js:not(.rm).
   ========================================================================== */

(() => {
  "use strict";

  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  // Captured synchronously — document.currentScript is null once we are inside a
  // promise callback, which would silently break the vendor paths.
  const BASE = (document.currentScript?.src ?? "").replace(/motion\.js.*$/, "") || "./";

  /* ---------------------------------------------------------- always-on UI */
  // The drawer works with or without GSAP. Navigation is not a flourish.
  const burger = document.querySelector(".burger");
  const drawer = document.getElementById("drawer");
  if (burger && drawer) {
    burger.addEventListener("click", () => {
      const open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      if (open) drawer.removeAttribute("data-open"); else drawer.setAttribute("data-open", "");
    });
    // Escape closes it, and focus returns to the control that opened it.
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
        burger.setAttribute("aria-expanded", "false");
        drawer.removeAttribute("data-open");
        burger.focus();
      }
    });
  }

  /* -------------------------------------------------------- reduced motion */
  // §10.1: the reduced-motion branch registers NOTHING. Not a shorter animation —
  // nothing at all. Elements are already in their final state via CSS.
  if (reduced.matches) { root.classList.add("rm"); return; }

  /* --------------------------------------------------------- the failsafe */
  // Content hidden by CSS and revealed only by JS is fragile: if the RAF loop
  // never runs, the page stays blank. That is not hypothetical — requestAnimationFrame
  // is throttled to zero in a background or non-compositing tab, so a page opened in
  // a background tab would render with no text at all.
  //
  // So: if the ticker has not advanced shortly after boot, drop the whole motion
  // layer and let CSS show everything. A missing animation is a non-event; invisible
  // body copy on a page about skin cancer is not.
  const failsafe = () => {
    if (!root.classList.contains("rm")) root.classList.add("rm");
    document.querySelectorAll("[data-anim],[data-reveal]").forEach((el) => {
      el.style.opacity = ""; el.style.transform = ""; el.style.clipPath = "";
    });
  };
  let armed = setTimeout(() => {
    if (!window.gsap || window.gsap.ticker.frame === 0) failsafe();
  }, 1500);
  // A tab that starts hidden gets its animations when it becomes visible; until
  // then the failsafe has already shown the content, which is the right trade.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && window.ScrollTrigger) window.ScrollTrigger.refresh();
  });

  /* ------------------------------------------------------------ GSAP setup */
  const boot = () => {
    if (!window.gsap || !window.ScrollTrigger) {
      // Vendor scripts unreachable. Show everything rather than leave a blank page.
      clearTimeout(armed); failsafe();
      return;
    }
    // Once the ticker is confirmed running, the failsafe is no longer needed.
    window.gsap.ticker.add(function armCheck() {
      clearTimeout(armed);
      window.gsap.ticker.remove(armCheck);
    });
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Lenis, driven by GSAP's ticker. NEVER two RAF loops.
    if (window.Lenis) {
      const lenis = new window.Lenis({ duration: 1.05, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      window.__lenis = lenis;
    }

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      /* ---- PRIMARY: "Settle" -------------------------------------------- */
      // y +24 -> 0, opacity 0 -> 1, 0.9s, power2.out. Stagger 0.06 WITHIN a
      // section only, never across sections. Batched rather than one trigger
      // per element.
      //
      // Hero elements are deliberately EXCLUDED: §10.4 gives the hero one
      // orchestrated entrance on load and says nothing there animates on
      // scroll. Without this exclusion the hero is claimed by both the batch
      // and the load timeline, and `overwrite` leaves some elements stranded
      // at opacity 0 depending on which fires last.
      const scrollAnim = gsap.utils.toArray("[data-anim]").filter((el) => !el.closest(".hero"));
      gsap.set(scrollAnim, { y: 24 });
      ScrollTrigger.batch(scrollAnim, {
        start: "top 82%",
        once: true,
        onEnter: (batch) => gsap.to(batch, {
          y: 0, opacity: 1, duration: 0.9, ease: "power2.out", stagger: 0.06,
          overwrite: "auto",
          onStart() { batch.forEach((el) => (el.style.willChange = "transform,opacity")); },
          onComplete() { batch.forEach((el) => (el.style.willChange = "")); }
        })
      });

      /* ---- SECONDARY: "Reveal" ------------------------------------------ */
      // clip-path inset(0 0 100% 0) -> 0, paired with an internal scale 1.06 -> 1
      // on the <img>, so the frame uncovers a photograph that is already settling.
      // Photography ONLY. Never text, never UI.
      document.querySelectorAll("[data-reveal]").forEach((frame) => {
        const img = frame.querySelector("img");
        const tl = gsap.timeline({
          scrollTrigger: { trigger: frame, start: "top 85%", once: true },
          onStart() { frame.style.willChange = "clip-path"; },
          onComplete() { frame.style.willChange = ""; if (img) img.style.willChange = ""; }
        });
        tl.to(frame, { clipPath: "inset(0 0 0% 0)", duration: 1.2, ease: "expo.out" });
        if (img) tl.to(img, { scale: 1, duration: 1.4, ease: "expo.out" }, 0);
      });

      /* ---- The brand-device thread -------------------------------------- */
      // The vertical rule from the logo, drawn by scroll. One element, two jobs:
      // section divider and scroll-progress indicator. scrub:1 — a one-second
      // catch-up. Never scrub:true (twitchy), never above 1.5 (feels laggy).
      document.querySelectorAll(".spine").forEach((el) => {
        gsap.fromTo(el, { "--spine-scale": 0 }, {
          "--spine-scale": 1, ease: "none",
          scrollTrigger: { trigger: el, start: "top 70%", end: "bottom 60%", scrub: 1 }
        });
      });

      /* ---- Hero: one orchestrated entrance, on LOAD not scroll ---------- */
      // 1.4s total, then it is done. Nothing in the hero animates on scroll.
      // Split by LINE, never by character — character stagger on a medical
      // headline is exactly the tell in §8.1.
      const hero = document.querySelector(".hero");
      if (hero) {
        const bits = hero.querySelectorAll("[data-anim]");
        gsap.set(bits, { y: 20, opacity: 0 });
        gsap.timeline({ defaults: { ease: "power2.out" } })
          .to(bits, { y: 0, opacity: 1, duration: 0.85, stagger: 0.08 }, 0.05)
          .fromTo(".hdr__mark .mark__rule",
            { scaleY: 0, transformOrigin: "50% 50%" },
            { scaleY: 1, duration: 0.7, ease: "expo.out" }, 0);
      }

      return () => gsap.killTweensOf("[data-anim],[data-reveal]");
    });

    // Trigger positions are wrong on first paint until fonts and the LCP image
    // have landed. Refresh after both.
    if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
  };

  // Load GSAP only when motion is actually wanted — reduced-motion users pay nothing.
  const add = (src) => new Promise((res) => {
    const s = document.createElement("script");
    s.src = src; s.async = false; s.onload = res; s.onerror = res;
    document.head.appendChild(s);
  });
  // Self-hosted, not CDN: §15 check 12 requires zero off-domain assets apart from
  // the booking link, and skipping a third-party DNS + TLS handshake helps LCP.
  (async () => {
    await add(BASE + "gsap.min.js");
    await add(BASE + "ScrollTrigger.min.js");   // must land after gsap
    await add(BASE + "lenis.min.js");
    boot();
  })();
})();
