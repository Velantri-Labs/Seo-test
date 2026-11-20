/* Orbitra — interactions (no dependencies) */
(() => {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  /* ---------- Header state, scroll progress, mobile nav ---------- */
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".scroll-progress");
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 20);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", (e) => {
      if (e.target.closest("a")) { links.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---------- Dropdown menus (click / keyboard / Escape / outside click) ---------- */
  const menus = [...document.querySelectorAll(".has-menu")];
  const closeAll = (except) => menus.forEach((m) => {
    if (m === except) return;
    m.classList.remove("open");
    const b = m.querySelector(".menu-btn"); if (b) b.setAttribute("aria-expanded", "false");
  });
  menus.forEach((m) => {
    const btn = m.querySelector(".menu-btn");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = !m.classList.contains("open");
      closeAll(m);
      m.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
    m.addEventListener("focusout", (e) => { if (!m.contains(e.relatedTarget)) { m.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); } });
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".has-menu")) closeAll(); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = menus.find((m) => m.classList.contains("open"));
    closeAll();
    if (open) open.querySelector(".menu-btn").focus();
  });

  /* ---------- Mission filters ---------- */
  const filterBar = document.querySelector("[data-filters]");
  if (filterBar) {
    const items = [...document.querySelectorAll(".mission")];
    filterBar.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      filterBar.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      const f = b.dataset.filter;
      items.forEach((it) => { it.hidden = f !== "all" && !it.dataset.tags.split(" ").includes(f); });
    });
  }

  /* ---------- Starfield: 3D stars with scroll parallax ---------- */
  const sky = document.getElementById("starfield");
  if (sky) {
    const ctx = sky.getContext("2d");
    let w, h, stars = [];
    const COUNT = window.innerWidth < 700 ? 260 : 520;
    const resize = () => {
      w = sky.width = window.innerWidth * DPR;
      h = sky.height = window.innerHeight * DPR;
    };
    const makeStar = () => ({ x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: Math.random() * 0.9 + 0.1, t: Math.random() * Math.PI * 2 });
    resize();
    for (let i = 0; i < COUNT; i++) stars.push(makeStar());
    window.addEventListener("resize", resize);

    let lastScroll = window.scrollY, velocity = 0, mx = 0, my = 0;
    window.addEventListener("pointermove", (e) => { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; }, { passive: true });

    const draw = () => {
      const sy = window.scrollY;
      velocity += ((sy - lastScroll) * 0.0004 - velocity) * 0.1;
      lastScroll = sy;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, f = Math.max(w, h) * 0.5;
      for (const s of stars) {
        s.z -= 0.0006 + Math.abs(velocity);
        if (s.z <= 0.05) { Object.assign(s, makeStar()); s.z = 1; }
        s.t += 0.02;
        const px = cx + (s.x + mx * 0.08 * (1 - s.z)) * f / s.z;
        let py = cy + (s.y + my * 0.08 * (1 - s.z)) * f / s.z;
        if (px < 0 || px > w || py < 0 || py > h) continue;
        py = (((py - sy * 0.12 * DPR * (1 - s.z)) % h) + h) % h; // depth-based scroll parallax
        const size = (1 - s.z) * 2.2 * DPR + 0.3;
        const alpha = (1 - s.z) * (0.6 + Math.sin(s.t) * 0.4);
        ctx.fillStyle = `rgba(${200 + (s.x > 0 ? 55 : 0)}, ${215}, 255, ${alpha})`;
        ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI * 2); ctx.fill();
      }
      if (!reduceMotion) requestAnimationFrame(draw);
    };
    draw();
  }

  /* ---------- Hero globe: rotating 3D point-sphere with orbit ring ---------- */
  const globe = document.getElementById("globe");
  if (globe) {
    const g = globe.getContext("2d");
    let size;
    const resizeGlobe = () => {
      const r = globe.getBoundingClientRect();
      size = Math.max(r.width, 10) * DPR;
      globe.width = globe.height = size;
    };
    resizeGlobe();
    window.addEventListener("resize", resizeGlobe);

    // Fibonacci sphere
    const N = 1400, pts = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const th = golden * i;
      pts.push([Math.cos(th) * rad, y, Math.sin(th) * rad]);
    }
    const ring = [];
    for (let i = 0; i < 220; i++) { const a = (i / 220) * Math.PI * 2; ring.push([Math.cos(a) * 1.55, 0, Math.sin(a) * 1.55]); }

    let rotY = 0, tiltX = -0.35, targetX = -0.35, targetY = 0, dragY = 0;
    globe.addEventListener("pointermove", (e) => {
      const r = globe.getBoundingClientRect();
      targetX = -0.35 + ((e.clientY - r.top) / r.height - 0.5) * 0.6;
      targetY = ((e.clientX - r.left) / r.width - 0.5) * 0.9;
    });
    globe.addEventListener("pointerleave", () => { targetX = -0.35; targetY = 0; });

    const project = (p, ry, rx, R, c) => {
      let [x, y, z] = p;
      const cosY = Math.cos(ry), sinY = Math.sin(ry);
      [x, z] = [x * cosY - z * sinY, x * sinY + z * cosY];
      const cosX = Math.cos(rx), sinX = Math.sin(rx);
      [y, z] = [y * cosX - z * sinX, y * sinX + z * cosX];
      const persp = 3 / (3 + z);
      return { x: c + x * R * persp, y: c + y * R * persp, z, s: persp };
    };

    const frame = () => {
      rotY += 0.0035;
      tiltX += (targetX - tiltX) * 0.05;
      dragY += (targetY - dragY) * 0.05;
      const c = size / 2, R = size * 0.3;
      g.clearRect(0, 0, size, size);

      // atmosphere glow
      const glow = g.createRadialGradient(c, c, R * 0.6, c, c, R * 1.5);
      glow.addColorStop(0, "rgba(124,92,255,0.35)");
      glow.addColorStop(0.5, "rgba(34,211,238,0.10)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = glow; g.fillRect(0, 0, size, size);

      const ringTilt = tiltX + 0.55;
      const drawRing = (front) => {
        for (const p of ring) {
          const q = project(p, rotY * 0.6 + dragY, ringTilt, R, c);
          if ((q.z < 0) !== front) continue;
          g.fillStyle = `rgba(244,114,182,${front ? 0.85 : 0.25})`;
          g.beginPath(); g.arc(q.x, q.y, 1.4 * DPR * q.s, 0, Math.PI * 2); g.fill();
        }
      };
      drawRing(false);

      for (const p of pts) {
        const q = project(p, rotY + dragY, tiltX, R, c);
        const depth = (1 - q.z) / 2; // 1 = front
        const hue = 190 + p[1] * 70;
        g.fillStyle = `hsla(${hue}, 90%, ${55 + depth * 20}%, ${0.08 + depth * 0.9})`;
        g.beginPath(); g.arc(q.x, q.y, (0.6 + depth * 1.6) * DPR, 0, Math.PI * 2); g.fill();
      }
      drawRing(true);

      // moon
      const ma = rotY * 2.2;
      const m = project([Math.cos(ma) * 1.55, 0, Math.sin(ma) * 1.55], dragY, ringTilt, R, c);
      g.fillStyle = m.z < 0 ? "#f9a8d4" : "rgba(249,168,212,.35)";
      g.shadowColor = "#f472b6"; g.shadowBlur = 20 * DPR;
      g.beginPath(); g.arc(m.x, m.y, 7 * DPR * m.s, 0, Math.PI * 2); g.fill();
      g.shadowBlur = 0;

      if (!reduceMotion) requestAnimationFrame(frame);
    };
    frame();
  }

  /* ---------- Reveal on scroll ---------- */
  document.querySelectorAll(".reveal-stagger").forEach((group) => {
    [...group.children].forEach((el, i) => el.style.setProperty("--i", i));
  });
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach((el) => io.observe(el));
  } else reveals.forEach((el) => el.classList.add("in"));

  /* ---------- 3D tilt cards ---------- */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".tilt").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.transform = `rotateY(${(px - 0.5) * 16}deg) rotateX(${(0.5 - py) * 16}deg) translateZ(10px)`;
        card.style.setProperty("--mx", `${px * 100}%`);
        card.style.setProperty("--my", `${py * 100}%`);
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  /* ---------- Scroll-driven 3D planet journey ---------- */
  const journey = document.querySelector(".journey");
  if (journey) {
    const track = journey.querySelector(".journey-track");
    const cards = [...journey.querySelectorAll(".planet-card")];
    const dots = [...journey.querySelectorAll(".journey-progress span")];
    if (reduceMotion) journey.classList.add("static");
    else {
      const update = () => {
        const r = journey.getBoundingClientRect();
        const total = journey.offsetHeight - window.innerHeight;
        const p = Math.min(Math.max(-r.top / total, 0), 1);
        const first = cards[0], last = cards[cards.length - 1];
        const span = (last.offsetLeft + last.offsetWidth / 2) - (first.offsetLeft + first.offsetWidth / 2);
        const shift = p * span;
        track.style.transform = `translate3d(${-shift}px,0,0)`;
        const center = window.innerWidth / 2;
        let active = 0, best = Infinity;
        cards.forEach((card, i) => {
          const cr = card.getBoundingClientRect();
          const d = (cr.left + cr.width / 2 - center) / window.innerWidth; // -1..1
          const ad = Math.abs(d);
          if (ad < best) { best = ad; active = i; }
          card.style.transform = `rotateY(${d * -55}deg) translateZ(${-ad * 380}px) scale(${1 - Math.min(ad, 1) * 0.12})`;
          card.style.opacity = String(Math.max(1 - ad * 1.1, 0.15));
        });
        dots.forEach((dot, i) => dot.classList.toggle("on", i === active));
      };
      let ticking = false;
      const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { update(); ticking = false; }); } };
      window.addEventListener("scroll", req, { passive: true });
      window.addEventListener("resize", req);
      update();
    }
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll("[data-count]");
  const runCounter = (el) => {
    const end = parseFloat(el.dataset.count);
    const dec = (el.dataset.count.split(".")[1] || "").length;
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = end.toFixed(dec) + suffix; return; }
    const t0 = performance.now(), dur = 1600;
    const step = (t) => {
      const k = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = (end * e).toFixed(dec) + suffix;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { runCounter(en.target); co.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach((c) => co.observe(c));
  } else counters.forEach(runCounter);

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
