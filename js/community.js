/* Community lineup — Filatov-style select, field-log card, Esc / outside close. */
(function () {
  const EMPTY_BIO = "";
  const EMPTY_HANDLE = "";
  const MARKET = "https://www.movinartistsmarket.com";

  const stage = document.getElementById("stage") || document.getElementById("current");
  const lineup = document.getElementById("lineup");
  const wrap = document.getElementById("lineup-wrap");
  const card = document.getElementById("field-log");
  const giant = document.getElementById("giant-num");
  const hint = document.getElementById("hint");
  const backdrop = document.getElementById("carrier-backdrop");
  const exitBar = document.getElementById("carrier-exit");
  const backBtn = document.getElementById("carrier-back");
  const prevBtn = document.getElementById("carrier-prev");
  const nextBtn = document.getElementById("carrier-next");

  if (!lineup || !wrap) return;

  let selected = null;
  let trackRaf = 0;

  function el(tag, cls, attrs) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  }

  function render() {
    lineup.innerHTML = "";
    for (const c of window.CARRIERS) {
      const btn = el("button", "carrier" + (c.wide ? " is-wide" : ""), {
        type: "button",
        "data-id": c.id,
        "aria-label": c.additional ? c.name : `Carrier ${c.id} ${c.name}`
      });
      const fig = el("span", "fig");
      const img = el("img", "", {
        src: c.src,
        alt: `${c.name}, Code Carrier ${c.id}`,
        draggable: "false"
      });
      fig.appendChild(img);
      const meta = el("span", "meta");
      const num = el("span", "num");
      num.textContent = c.additional ? "" : c.id;
      const name = el("span", "name");
      name.textContent = c.name;
      meta.append(num, name);
      btn.append(fig, meta);
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (selected === c.id) close();
        else open(c.id);
      });
      lineup.appendChild(btn);
    }
  }

  function fillCard(c) {
    card.querySelector("[data-field=number]").textContent = c.additional ? "" : `CARRIER ${c.id}`;
    card.querySelector("[data-field=name]").textContent = c.name;
    const bio = card.querySelector("[data-field=bio]");
    if (bio) {
      bio.textContent = c.bio || EMPTY_BIO;
      bio.classList.toggle("is-empty", !c.bio);
      if (bio.closest(".field")) bio.closest(".field").hidden = !c.bio;
    }
        const handleVal = c.liveHandle || c.handle;
    const handle = card.querySelector("[data-field=handle]");
    handle.textContent = handleVal || EMPTY_HANDLE;
    handle.classList.toggle("is-empty", !handleVal);
    if (handle.closest(".field")) handle.closest(".field").hidden = !handleVal;
    if (handleVal) {
      handle.href = "https://instagram.com/" + handleVal.replace(/^@/, "");
      handle.removeAttribute("aria-disabled");
    } else {
      handle.removeAttribute("href");
      handle.setAttribute("aria-disabled", "true");
    }
    const logoWrap = card.querySelector(".kit-logo-wrap");
    const logoImg = logoWrap.querySelector("img");
    if (c.logo) {
      logoImg.src = c.logo;
      logoImg.alt = `${c.name} logo`;
      logoWrap.hidden = false;
    } else {
      logoImg.removeAttribute("src");
      logoWrap.hidden = true;
    }
  }

  function scrollToCarrier(id) {
    const btn = lineup.querySelector(`.carrier[data-id="${id}"]`);
    if (!btn) return;
    const wr = wrap.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    const mobile = window.innerWidth < 721;
    // Leave room on the right for the field-log on desktop; center on mobile.
    const target = mobile ? wr.left + wr.width * 0.50 : wr.left + wr.width * 0.32;
    const mid = br.left + br.width / 2;
    wrap.scrollTo({
      left: wrap.scrollLeft + (mid - target),
      behavior: "smooth"
    });
  }

  function positionGiant() {
    if (!selected) return;
    const btn = lineup.querySelector(`.carrier[data-id="${selected}"]`);
    if (!btn) return;
    const img = btn.querySelector("img");
    const r = (img || btn).getBoundingClientRect();
    giant.style.left = `${r.left + r.width * 0.45}px`;
    giant.style.top = `${r.top + r.height * 0.38}px`;
  }

  function trackWhileAnimating() {
    cancelAnimationFrame(trackRaf);
    const end = performance.now() + 850;
    const step = (now) => {
      positionGiant();
      if (now < end && selected) {
        trackRaf = requestAnimationFrame(step);
      }
    };
    trackRaf = requestAnimationFrame(step);
  }


  function setExitChrome(on) {
    if (backdrop) {
      backdrop.hidden = !on;
      backdrop.setAttribute("aria-hidden", on ? "false" : "true");
    }
    if (exitBar) {
      exitBar.hidden = !on;
      exitBar.setAttribute("aria-hidden", on ? "false" : "true");
    }
    document.body.classList.toggle("is-open", on);
    document.documentElement.classList.toggle("is-open", on);
    if (!on) {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
  }

  function step(dir) {
    if (!selected) return;
    const ids = window.CARRIERS.map((c) => c.id);
    const i = ids.indexOf(selected);
    const n = (i + dir + ids.length) % ids.length;
    open(ids[n]);
  }
  function open(id) {
    const c = window.CARRIERS.find((x) => x.id === id);
    if (!c) return;
    selected = id;
    stage.classList.add("is-open");
    setExitChrome(true);
    if (hint) hint.hidden = true;
    for (const btn of lineup.querySelectorAll(".carrier")) {
      btn.classList.toggle("is-on", btn.dataset.id === id);
      btn.setAttribute("aria-pressed", btn.dataset.id === id ? "true" : "false");
    }
    if (c.additional) {
      giant.textContent = "";
      giant.classList.remove("is-on");
      giant.setAttribute("aria-hidden", "true");
    } else {
      giant.textContent = c.id;
      giant.classList.add("is-on");
      giant.setAttribute("aria-hidden", "false");
    }
    fillCard(c);
    card.classList.add("is-on");
    card.setAttribute("aria-hidden", "false");
    scrollToCarrier(id);
    // after scroll starts, keep the number behind the figure
    trackWhileAnimating();
    setTimeout(positionGiant, 400);
    setTimeout(positionGiant, 800);
  }

  function close() {
    if (!selected) return;
    selected = null;
    stage.classList.remove("is-open");
    setExitChrome(false);
    if (hint) hint.hidden = false;
    for (const btn of lineup.querySelectorAll(".carrier")) {
      btn.classList.remove("is-on");
      btn.setAttribute("aria-pressed", "false");
    }
    giant.classList.remove("is-on");
    giant.setAttribute("aria-hidden", "true");
    card.classList.remove("is-on");
    card.setAttribute("aria-hidden", "true");
    cancelAnimationFrame(trackRaf);
  }

  function onKey(e) {
    if (e.key === "Escape") {
      close();
      return;
    }
    if (!selected) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const ids = window.CARRIERS.map((c) => c.id);
      const i = ids.indexOf(selected);
      const n = e.key === "ArrowRight" ? (i + 1) % ids.length : (i - 1 + ids.length) % ids.length;
      open(ids[n]);
    }
  }

  function onOutsideClick(e) {
    if (!selected) return;
    if (e.target.closest(".carrier")) return;
    if (e.target.closest("#field-log")) return;
    if (e.target.closest("#carrier-exit")) return;
    if (e.target.closest(".site-header")) return;
    if (e.target.closest("header")) return;
    close();
  }

  // Init
  render();
  const cardClose = document.getElementById("card-close");
  if (cardClose) {
    cardClose.addEventListener("click", (e) => {
      e.stopPropagation();
      close();
    });
  }
  if (backdrop) {
    backdrop.addEventListener("click", (e) => {
      e.stopPropagation();
      close();
    });
  }
  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      close();
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      step(-1);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      step(1);
    });
  }
  document.addEventListener("click", onOutsideClick);
  document.addEventListener("keydown", onKey);
  window.addEventListener("resize", () => {
    if (selected) {
      scrollToCarrier(selected);
      positionGiant();
    }
  });
  wrap.addEventListener("scroll", () => {
    if (selected) positionGiant();
  }, { passive: true });

  // Grid canvas is started in main.js. Expose for Playwright / local QA.
  window.__current = { open, close, get selected() { return selected; } };
})();
