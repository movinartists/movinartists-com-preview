/* Initiation scroll, nav, grid, non-submitting forms. */
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.getElementById("grid");
  if (canvas && window.GridField) {
    const field = new window.GridField(canvas);
    field.start();
    window.__grid = field;
  }

  const wrap = document.getElementById("sigil-wrap");
  const section = document.getElementById("approach");
  const lines = [...document.querySelectorAll("#approach-copy p")];
  const hudStatus = document.querySelector("[data-hud=status]");
  const hudRecv = document.querySelector("[data-hud=recv]");

  if (section) {
    function progress() {
      const r = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const p = total <= 0 ? 1 : Math.min(1, Math.max(0, -r.top / total));
      return p;
    }
    function tick() {
      const p = reduced ? 1 : progress();
      if (window.__grid) window.__grid.setApproach(p);
      if (wrap) {
        const scale = 0.26 + p * 0.9;
        const opacity = 0.65 + p * 0.35;
        wrap.style.setProperty("--sigil-scale", scale.toFixed(3));
        wrap.style.setProperty("--sigil-opacity", opacity.toFixed(3));
      }
      let active = lines[0];
      for (const el of lines) {
        const at = parseFloat(el.dataset.at || "0");
        if (p >= at - 0.02) active = el;
      }
      lines.forEach((el) => el.classList.toggle("is-on", el === active));
      if (hudStatus) hudStatus.textContent = p < 0.25 ? "Approaching" : p < 0.8 ? "Locking" : "Received";
      if (hudRecv) hudRecv.textContent = p < 0.8 ? "Standby" : "Received";
    }
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick);
    tick();
    const skip = document.getElementById("skip-approach");
    if (skip) {
      skip.addEventListener("click", () => {
        const core = document.getElementById("core");
        if (core) core.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      });
    }
  } else if (window.__grid) {
    window.__grid.setApproach(0.35);
  }

  const nav = document.getElementById("nav");
  const toggle = document.querySelector(".nav-toggle");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }));
  }

  const form = document.getElementById("join-form");
  const note = document.getElementById("form-note");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (note) {
        note.textContent = "Signal held locally. This mockup does not send a message or sign anyone up.";
        note.classList.add("is-sent");
      }
    });
  }

  const vid = document.querySelector(".hero-video");
  if (vid && reduced) {
    vid.removeAttribute("autoplay");
    vid.pause();
  }

  /* When this preview is iframe-embedded on movinartists.com:
     live-site functions leave the iframe (full window); socials / Market open a new tab. */
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    const social = /(?:instagram|facebook|tiktok|youtube|twitter|x)\.com/i.test(href);
    const market = /movinartistsmarket\.com/i.test(href);
    const live = /^(https?:)?\/\/(www\.)?movinartists\.com(\/|$)/i.test(href);
    if (social || market) {
      a.setAttribute("target", "_blank");
      if (!a.getAttribute("rel")) a.setAttribute("rel", "noopener noreferrer");
    } else if (live) {
      a.setAttribute("target", "_top");
      if (!a.getAttribute("rel")) a.setAttribute("rel", "noopener noreferrer");
    }
  }, true);
})();
