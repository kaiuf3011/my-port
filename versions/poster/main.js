/* =========================================================
   Kaiuf M — Portfolio interactions
   ========================================================= */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  document.getElementById("year").textContent = new Date().getFullYear();
  requestAnimationFrame(() => document.body.classList.add("is-loaded"));

  /* ---------- nav ---------- */
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open);
  });
  document.querySelectorAll("#navLinks a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", false);
    })
  );

  /* ---------- scroll: progress, nav state, timeline fill ---------- */
  const progress = document.querySelector(".scroll-progress");
  const timeline = document.querySelector(".timeline");
  const timelineFill = document.querySelector(".timeline__line span");
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle("is-scrolled", y > 30);

    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
      timelineFill.style.height = `${p * 100}%`;
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- active nav link ---------- */
  const links = [...document.querySelectorAll("#navLinks a[href^='#']")];
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === `#${e.target.id}`));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  document.querySelectorAll("main section[id]").forEach((s) => sectionObserver.observe(s));

  /* ---------- reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        e.target.querySelectorAll("[data-count]").forEach(countUp);
        revealObserver.unobserve(e.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el, i) => {
    // light stagger for siblings revealed together
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 5) * 70}ms`;
    revealObserver.observe(el);
  });

  /* ---------- count-up stats ---------- */
  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = target.toFixed(decimals) + suffix; return; }
    const start = performance.now();
    const dur = 1400;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- typed roles ---------- */
  const typedEl = document.getElementById("typed");
  const roles = ["intelligent systems", "RAG assistants", "AR safety tools", "space-weather AI", "games in Unity", "things that matter"];
  if (!reduceMotion) {
    let ri = 0, ci = roles[0].length, deleting = true;
    const loop = () => {
      const word = roles[ri];
      ci += deleting ? -1 : 1;
      typedEl.textContent = word.slice(0, ci);
      let delay = deleting ? 35 : 70;
      if (!deleting && ci === word.length) { deleting = true; delay = 2200; }
      else if (deleting && ci === 0) { deleting = false; ri = (ri + 1) % roles.length; delay = 300; }
      setTimeout(loop, delay);
    };
    setTimeout(loop, 2600);
  }

  /* ---------- project filters ---------- */
  const filters = document.querySelectorAll(".filter");
  const projects = document.querySelectorAll(".project");
  filters.forEach((btn) =>
    btn.addEventListener("click", () => {
      filters.forEach((b) => b.classList.toggle("is-active", b === btn));
      const f = btn.dataset.filter;
      projects.forEach((p) => {
        const show = f === "all" || p.dataset.cat === f;
        p.classList.toggle("is-hidden", !show);
        if (show) p.classList.add("is-in");
      });
    })
  );

  /* ---------- case-study modal ---------- */
  document.querySelectorAll("[data-open]").forEach((btn) =>
    btn.addEventListener("click", () => document.getElementById(btn.dataset.open).showModal())
  );
  document.querySelectorAll("dialog").forEach((d) => {
    d.querySelector("[data-close]").addEventListener("click", () => d.close());
    d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
  });

  /* ---------- pointer effects (desktop only) ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.25}px)`;
      });
      el.addEventListener("pointerleave", () => (el.style.transform = ""));
    });

    document.querySelectorAll(".tilt").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--mx", `${px * 100}%`);
        el.style.setProperty("--my", `${py * 100}%`);
        el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 8}deg)`;
      });
      el.addEventListener("pointerleave", () => (el.style.transform = ""));
    });
  }

  /* ---------- hero 3D scene ---------- */
  window.addEventListener("load", () => {
    if (typeof THREE === "undefined") return;
    const canvas = document.getElementById("heroCanvas");
    const hero = document.querySelector(".hero");
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1c344d, 0.05);
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 13);

    // core: wireframe icosahedron + inner glow
    const group = new THREE.Group();
    scene.add(group);

    const icoGeo = new THREE.IcosahedronGeometry(3.2, 1);
    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(icoGeo),
      new THREE.LineBasicMaterial({ color: 0xefe6d3, transparent: true, opacity: 0.22 })
    );
    group.add(wire);

    const outer = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(4.6, 0)),
      new THREE.LineBasicMaterial({ color: 0x5c9fae, transparent: true, opacity: 0.3 })
    );
    group.add(outer);

    const nodes = new THREE.Points(
      icoGeo,
      new THREE.PointsMaterial({ color: 0xefe6d3, size: 0.08, transparent: true, opacity: 0.6 })
    );
    group.add(nodes);

    // orbit rings
    const ringMat = new THREE.LineBasicMaterial({ color: 0xb23b5c, transparent: true, opacity: 0.45 });
    const ringPts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      ringPts.push(new THREE.Vector3(Math.cos(a) * 6, Math.sin(a) * 6, 0));
    }
    const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
    const ring1 = new THREE.Line(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 2.4;
    const ring2 = new THREE.Line(ringGeo, ringMat.clone());
    ring2.material.color.set(0xefe6d3);
    ring2.material.opacity = 0.18;
    ring2.rotation.set(Math.PI / 3, Math.PI / 5, 0);
    ring2.scale.setScalar(1.18);
    group.add(ring1, ring2);

    // satellite on ring1
    const sat = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshBasicMaterial({ color: 0xc94a6d }));
    ring1.add(sat);

    // starfield
    const starCount = innerWidth < 760 ? 700 : 1600;
    const pos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 10 + Math.random() * 30;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      pos[i * 3 + 2] = r * Math.cos(ph);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xefe6d3, size: 0.05, transparent: true, opacity: 0.35 })
    );
    scene.add(stars);

    const resize = () => {
      const w = hero.clientWidth, h = hero.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // push the shape right on wide screens so it frames the headline
      // sit the shape behind the build list (lower-right) so it never covers the headline
      const wide = w > 1020, narrow = w < 760;
      group.position.x = wide ? 5.4 : narrow ? 2.4 : 4;
      group.position.y = wide ? -3 : narrow ? -2 : -2.5;
      group.scale.setScalar(wide ? 0.95 : narrow ? 0.5 : 0.7);
    };
    resize();
    window.addEventListener("resize", resize);

    let mx = 0, my = 0;
    window.addEventListener("pointermove", (e) => {
      mx = (e.clientX / innerWidth - 0.5) * 2;
      my = (e.clientY / innerHeight - 0.5) * 2;
    });

    let visible = true;
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(hero);

    const clock = new THREE.Clock();
    const render = () => {
      requestAnimationFrame(render);
      if (!visible) return;
      const t = clock.getElapsedTime();
      const speed = reduceMotion ? 0 : 1;
      group.rotation.y = t * 0.12 * speed + mx * 0.3;
      group.rotation.x = Math.sin(t * 0.2) * 0.15 * speed + my * 0.2;
      outer.rotation.y = -t * 0.08 * speed;
      outer.rotation.z = t * 0.05 * speed;
      ring1.rotation.z = t * 0.25 * speed;
      sat.position.set(6, 0, 0);
      const pulse = 1 + Math.sin(t * 1.4) * 0.03 * speed;
      wire.scale.setScalar(pulse);
      nodes.scale.setScalar(pulse);
      stars.rotation.y = t * 0.01 * speed;
      camera.position.y = -window.scrollY * 0.004;
      renderer.render(scene, camera);
    };
    render();
  });
})();
