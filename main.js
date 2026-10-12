/* =========================================================
   Kaiuf M — Portfolio interactions
   ========================================================= */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const range = (p, a, b) => clamp((p - a) / (b - a)); // remap p from [a,b] to [0,1]
  const lerp = (a, b, t) => a + (b - a) * t;

  $("#year").textContent = new Date().getFullYear();

  /* ---------- smooth scroll (Lenis, optional) ---------- */
  let lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = window.lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    lenis.stop();
  }
  const scrollToTarget = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
    else if (typeof target === "number") window.scrollTo({ top: target, behavior: "smooth" });
    else target.scrollIntoView({ behavior: "smooth" });
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    const target = id === "#top" ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    closeMenu();
    scrollToTarget(target);
  });

  /* ---------- preloader ---------- */
  const loader = $("#loader");
  let seen = false;
  try { seen = sessionStorage.getItem("km-loaded") === "1"; } catch (_) {}
  const finishLoader = () => {
    if (loader.classList.contains("is-done")) return;
    loader.classList.add("is-done");
    document.body.classList.remove("is-loading");
    if (lenis) lenis.start();
    try { sessionStorage.setItem("km-loaded", "1"); } catch (_) {}
    setTimeout(() => (loader.style.display = "none"), 1100);
  };
  requestAnimationFrame(() => loader.classList.add("is-ready"));
  $("#skipLoader").addEventListener("click", finishLoader);
  setTimeout(finishLoader, reduceMotion ? 0 : seen ? 900 : 2800);

  /* ---------- cursor ---------- */
  if (finePointer && !reduceMotion) {
    const cursor = $(".cursor");
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; cursor.classList.add("is-on"); });
    document.addEventListener("pointerleave", () => cursor.classList.remove("is-on"));
    document.addEventListener("pointerover", (e) => {
      cursor.classList.toggle("is-hover", !!e.target.closest("a, button, .territory, .index__list li"));
    });
    const loop = () => {
      cx = lerp(cx, x, 0.2); cy = lerp(cy, y, 0.2);
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------- menu ---------- */
  const menu = $("#menu");
  const menuOpenBtn = $("#menuOpen");
  function openMenu() {
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    menuOpenBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
    if (lenis) lenis.stop();
  }
  function closeMenu() {
    if (!menu.classList.contains("is-open")) return;
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    menuOpenBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
    if (lenis) lenis.start();
  }
  menuOpenBtn.addEventListener("click", openMenu);
  $("#menuClose").addEventListener("click", closeMenu);
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  const cols = $$(".menu__col");
  cols.forEach((c) => c.addEventListener("pointerenter", () => cols.forEach((o) => o.classList.toggle("is-active", o === c))));

  /* ---------- intro word cycler ---------- */
  const track = $(".cycler__track");
  if (track) {
    const items = $$("li", track);
    const loopLen = items.length - 3; // the last 3 duplicate the first 3
    const lh = () => items[0].getBoundingClientRect().height;
    let i = 0;
    const paint = () => {
      track.style.transform = `translateY(${-i * lh()}px)`;
      items.forEach((li, k) => li.classList.toggle("is-on", k === i + 1));
    };
    paint();
    if (!reduceMotion) setInterval(() => {
      i++;
      paint();
      if (i === loopLen) setTimeout(() => {
        track.style.transition = "none"; i = 0; paint();
        track.offsetHeight; track.style.transition = "";
      }, 950);
    }, 2000);
  }

  /* ---------- hero rotator ---------- */
  const rot = $$("#rotator em");
  if (rot.length && !reduceMotion) {
    let r = 0;
    setInterval(() => {
      const prev = rot[r];
      r = (r + 1) % rot.length;
      prev.classList.remove("is-on"); prev.classList.add("is-out");
      rot[r].classList.remove("is-out"); rot[r].classList.add("is-on");
      setTimeout(() => prev.classList.remove("is-out"), 750);
    }, 2200);
  }

  /* ---------- reveal on view ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.2 });
  // auto-tag common blocks for a soft fade-up
  $$(".index__title, .index__list li, .method__title, .territory, .names__cta, .entry, .footer__letter, .footer__side")
    .forEach((el) => el.setAttribute("data-reveal", ""));
  $$(".hero, .slide, .moment, .finale, [data-reveal]").forEach((el) => io.observe(el));

  /* ---------- count-up ---------- */
  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = "1";
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || "0", 10);
    const suf = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = target.toFixed(dec) + suf; return; }
    const t0 = performance.now();
    const tick = (t) => {
      const p = clamp((t - t0) / 1300);
      el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(dec) + (p === 1 ? suf : "");
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- definition: split words ---------- */
  const def = $("#defText");
  if (def) {
    const num = def.querySelector(".num");
    const text = def.textContent.replace(num.textContent, "").trim();
    def.innerHTML = "";
    def.appendChild(num);
    text.split(/\s+/).forEach((w) => {
      const s = document.createElement("span");
      s.className = "w"; s.textContent = w + " ";
      def.appendChild(s);
    });
  }
  const defWords = $$("#defText .w");

  /* ---------- scroll-driven scenes ---------- */
  const header = $("#header");
  const weare = $(".weare");
  const manifesto = $(".manifesto");
  const statements = $$(".statement");
  const dots = $$(".manifesto__dots i");
  const defBox = $(".definition__box");
  const masks = $$(".question__mask");
  const workIndex = $("#workIndex");
  const work = $(".work");
  const slides = $$(".slide");
  const indexLinks = $$("#workIndex a");
  const moment = $(".moment");
  const hero = $(".hero");
  const manifestoNum = $("#manifestoNum");
  const qstrip = $(".qstrip");
  const finale = $(".finale");

  // progress through a tall sticky section: 0 when its top hits the viewport top, 1 when its bottom hits the viewport bottom
  const stickyProgress = (el) => {
    const r = el.getBoundingClientRect();
    return clamp(-r.top / (r.height - innerHeight));
  };
  // progress of an element passing through the viewport: 0 entering at the bottom, 1 leaving at the top
  const passProgress = (el) => {
    const r = el.getBoundingClientRect();
    return clamp((innerHeight - r.top) / (innerHeight + r.height));
  };

  let lastManifesto = -1;
  function onScroll() {
    header.classList.toggle("is-compact", scrollY > 80);

    /* header colour: light text over dark sections (or the expanded navy card), navy text over cream */
    const probe = document.elementsFromPoint(Math.min(60, innerWidth / 2), 40)
      .find((el) => !el.closest(".header, .cursor, .side-pill, .hover-preview"));
    const zone = probe && probe.closest(".weare__card, .theme-dark, .theme-light, .slide, [data-theme]");
    const dark = !!zone && (zone.classList.contains("weare__card") || zone.classList.contains("theme-dark") || zone.classList.contains("slide") || zone.dataset.theme === "dark");
    header.classList.toggle("on-dark", dark);

    /* I AM — expanding card */
    if (weare) {
      const p = stickyProgress(weare);
      const e = 1 - Math.pow(1 - range(p, 0.05, 0.55), 3);
      const vw = innerWidth, vh = innerHeight;
      const baseW = Math.min(vw * 0.32, 520), baseH = Math.min(vh * 0.3, 300);
      weare.style.setProperty("--cw", `${lerp(baseW, vw, e)}px`);
      weare.style.setProperty("--ch", `${lerp(baseH, vh, e)}px`);
      weare.style.setProperty("--cr", `${lerp(8, 0, e)}px`);
      weare.style.setProperty("--fw", `${Math.min(vw * 0.5, 820)}px`);
      weare.style.setProperty("--fh", `${baseH}px`);
      weare.style.setProperty("--titles", (1 - range(p, 0.02, 0.25)).toFixed(3));
      weare.style.setProperty("--burst", (1 - range(p, 0.35, 0.58)).toFixed(3));
      weare.style.setProperty("--reel", (1 - range(p, 0.42, 0.6)).toFixed(3));
      weare.style.setProperty("--rot", `${p * 540}deg`);
      const c = range(p, 0.58, 0.78);
      weare.style.setProperty("--content", c.toFixed(3));
      if (c > 0.5) $$(".weare [data-count]").forEach(countUp);
    }

    /* manifesto */
    if (manifesto) {
      const p = stickyProgress(manifesto);
      manifesto.style.setProperty("--mrot", `${p * 160}deg`);
      const idx = Math.min(statements.length - 1, Math.floor(p * statements.length));
      if (idx !== lastManifesto) {
        statements.forEach((s, k) => { s.classList.toggle("is-on", k === idx); s.classList.toggle("is-past", k < idx); });
        dots.forEach((d, k) => d.classList.toggle("is-on", k === idx));
        if (manifestoNum) manifestoNum.textContent = String(idx + 1).padStart(2, "0");
        lastManifesto = idx;
      }
    }

    /* definition: brackets open + word-by-word reveal */
    if (defBox) {
      const p = passProgress(defBox);
      defBox.style.setProperty("--bx", (range(p, 0.1, 0.45) * 30 - 30).toFixed(1));
      const shown = Math.round(range(p, 0.25, 0.55) * defWords.length);
      defWords.forEach((w, k) => w.classList.toggle("is-on", k < shown));
    }

    /* giant masked words drift */
    masks.forEach((m) => {
      const p = passProgress(m.parentElement);
      m.style.setProperty("--qy", `${(p - 0.5) * -120}px`);
    });

    /* hero: photo drifts down/zooms, copy lifts away as you scroll past */
    if (hero) {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty("--hp", clamp(-r.top / r.height).toFixed(3));
    }

    /* project strip slides with scroll */
    if (qstrip) qstrip.style.setProperty("--qs", (passProgress(qstrip.parentElement) * 700).toFixed(1));

    /* SIH 2025 collage: photos drift at different speeds */
    if (finale) finale.style.setProperty("--fp", (passProgress(finale) - 0.5).toFixed(3));

    /* moment photo parallax */
    if (moment) {
      const p = passProgress(moment);
      moment.style.setProperty("--my", `${(p - 0.5) * -80}px`);
    }

    /* work index + media lift */
    if (work) {
      const r = work.getBoundingClientRect();
      workIndex.classList.toggle("is-visible", r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5);
      let active = 0;
      slides.forEach((s, k) => {
        const top = s.getBoundingClientRect().top;
        if (top <= innerHeight * 0.5) active = k;
        const media = s.querySelector(".slide__media");
        if (media) media.style.setProperty("--sy", (clamp(top, 0, innerHeight) * 0.12).toFixed(1));
      });
      indexLinks.forEach((a, k) => a.classList.toggle("is-active", k === active));
    }
  }

  let ticking = false;
  const requestTick = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  };
  addEventListener("scroll", requestTick, { passive: true });
  addEventListener("resize", requestTick);
  onScroll();

  /* ---------- I AM: photo reel inside the card ---------- */
  const reel = $$(".weare__reel figure");
  if (reel.length) {
    let ri = 0;
    const cap = $("#reelCap"), count = $("#reelCount");
    const show = () => {
      reel.forEach((f, k) => f.classList.toggle("is-on", k === ri));
      cap.textContent = reel[ri].dataset.cap;
      count.textContent = `${String(ri + 1).padStart(2, "0")} / ${String(reel.length).padStart(2, "0")}`;
    };
    if (!reduceMotion) setInterval(() => { ri = (ri + 1) % reel.length; show(); }, 2200);
  }

  /* ---------- hero: pointer parallax ---------- */
  if (hero && finePointer && !reduceMotion) {
    let mx = 0, my = 0, tx = 0, ty = 0;
    hero.addEventListener("pointermove", (e) => {
      tx = (e.clientX / innerWidth - 0.5) * 2;
      ty = (e.clientY / innerHeight - 0.5) * 2;
    });
    hero.addEventListener("pointerleave", () => { tx = 0; ty = 0; });
    const drift = () => {
      mx = lerp(mx, tx, 0.06); my = lerp(my, ty, 0.06);
      hero.style.setProperty("--mx", mx.toFixed(3));
      hero.style.setProperty("--my", my.toFixed(3));
      requestAnimationFrame(drift);
    };
    drift();
  }

  /* ---------- record list: photo preview follows the cursor ---------- */
  const preview = $(".hover-preview");
  if (preview && finePointer) {
    const img = $("img", preview);
    let px = 0, py = 0, tx = 0, ty = 0, running = false;
    const follow = () => {
      px = lerp(px, tx, 0.18); py = lerp(py, ty, 0.18);
      preview.style.left = px + "px"; preview.style.top = py + "px";
      if (preview.classList.contains("is-on")) requestAnimationFrame(follow); else running = false;
    };
    $$(".index__list li[data-img]").forEach((li) => {
      li.addEventListener("pointerenter", (e) => {
        img.src = li.dataset.img;
        preview.classList.toggle("is-tall", li.dataset.img.includes("tedx"));
        tx = px = e.clientX + 170; ty = py = e.clientY;
        preview.classList.add("is-on");
        if (!running) { running = true; follow(); }
      });
      li.addEventListener("pointermove", (e) => { tx = e.clientX + 170; ty = e.clientY; });
      li.addEventListener("pointerleave", () => preview.classList.remove("is-on"));
    });
  }

  /* ---------- case-study modal ---------- */
  $$("[data-open]").forEach((btn) => btn.addEventListener("click", () => {
    $("#" + btn.dataset.open).showModal();
    if (lenis) lenis.stop();
  }));
  $$("dialog").forEach((d) => {
    d.querySelector("[data-close]").addEventListener("click", () => d.close());
    d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
    d.addEventListener("close", () => { if (lenis) lenis.start(); });
  });
})();
