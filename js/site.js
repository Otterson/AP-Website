(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sticky nav border ---------- */
  var nav = document.querySelector(".nav");
  if (nav) {
    var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Node network background ---------- */
  function network(canvas) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, pts = [], running = false, visible = true, raf = 0;
    var mouse = { x: -9999, y: -9999 };
    var LINK = 130;

    function size() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var target = Math.round(Math.min(90, Math.max(28, (W * H) / 15000)));
      while (pts.length < target) pts.push(make());
      pts.length = target;
      pts.forEach(function (p) { p.x = Math.min(p.x, W); p.y = Math.min(p.y, H); });
    }
    function make() {
      return { x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .32, vy: (Math.random() - .5) * .32, hub: Math.random() < .14 };
    }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        if (!reduce) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > W) p.vx *= -1;
          if (p.y < 0 || p.y > H) p.vy *= -1;
        }
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            ctx.strokeStyle = "rgba(76,194,255," + (0.2 * (1 - d / LINK)).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        var md = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (md < 170) {
          ctx.strokeStyle = "rgba(138,125,255," + (0.35 * (1 - md / 170)).toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        ctx.fillStyle = p.hub ? "rgba(138,125,255,.9)" : "rgba(76,194,255,.7)";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.hub ? 2.3 : 1.5, 0, Math.PI * 2); ctx.fill();
      }
      if (running) raf = requestAnimationFrame(frame);
    }
    function start() { if (running || reduce || !visible || document.hidden) return; running = true; raf = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    size(); frame();
    window.addEventListener("resize", function () { size(); if (!running) frame(); });
    var host = canvas.parentElement;
    host.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    host.addEventListener("pointerleave", function () { mouse.x = mouse.y = -9999; });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible ? start() : stop(); }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
    start();
  }
  document.querySelectorAll("canvas[data-network]").forEach(network);

  /* ---------- Terminal typing ---------- */
  var term = document.querySelector("[data-term]");
  if (term) {
    var lines = JSON.parse(term.getAttribute("data-term"));
    var out = term.querySelector(".out");
    if (reduce) { out.textContent = lines[0]; }
    else {
      var li = 0, ci = 0;
      (function type() {
        var s = lines[li];
        out.textContent = s.slice(0, ++ci);
        if (ci < s.length) setTimeout(type, 34 + Math.random() * 30);
        else setTimeout(function erase() {
          if (ci > 0) { out.textContent = s.slice(0, --ci); setTimeout(erase, 14); }
          else { li = (li + 1) % lines.length; setTimeout(type, 260); }
        }, 2100);
      })();
    }
  }

  /* ---------- Count-up stats (final values are in the HTML) ---------- */
  if (!reduce && "IntersectionObserver" in window) {
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        countObs.unobserve(en.target);
        var el = en.target, to = parseFloat(el.dataset.count), pre = el.dataset.pre || "", suf = el.dataset.suf || "", t0 = null;
        function step(ts) {
          if (!t0) t0 = ts;
          var k = Math.min(1, (ts - t0) / 1400), e = 1 - Math.pow(1 - k, 3);
          el.textContent = pre + Math.round(to * e) + suf;
          if (k < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: .6 });
    document.querySelectorAll("[data-count]").forEach(function (el) { countObs.observe(el); });
  }

  /* ---------- Card glow follows pointer ---------- */
  document.querySelectorAll(".glow").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--gx", (e.clientX - r.left) + "px");
      el.style.setProperty("--gy", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); revObs.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { revObs.observe(el); });
    // Safety net: never leave content hidden.
    setTimeout(function () { reveals.forEach(function (el) { el.classList.add("in"); }); }, 2500);
  }

  /* ---------- Toast ---------- */
  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy") ? resolve() : reject(); } catch (err) { reject(err); }
      document.body.removeChild(ta);
    });
  }

  /* ---------- Copy buttons ---------- */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var label = btn.textContent;
      copyText(btn.getAttribute("data-copy")).then(function () {
        btn.textContent = "copied"; btn.classList.add("done");
        setTimeout(function () { btn.textContent = label; btn.classList.remove("done"); }, 1600);
      }, function () { toast("Couldn't copy. Select the text instead."); });
    });
  });

  /* ---------- Copy page link / native share ---------- */
  var linkUrl = function (btn) { return new URL(btn.getAttribute("data-url") || location.pathname, location.href).href; };
  document.querySelectorAll("[data-copy-link]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      copyText(linkUrl(btn)).then(function () { toast("Link copied"); }, function () { toast("Couldn't copy the link"); });
    });
  });
  document.querySelectorAll("[data-share]").forEach(function (btn) {
    if (!navigator.share) { btn.hidden = true; return; }
    btn.addEventListener("click", function () {
      navigator.share({ title: "Austin Peterson · Resume", text: "Austin Peterson, Senior Consultant at Deloitte (AI & Data)", url: linkUrl(btn) }).catch(function () {});
    });
  });

  /* ---------- Experience: expand / collapse all ---------- */
  document.querySelectorAll("[data-expand]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("data-expand") === "open";
      document.querySelectorAll(".timeline details").forEach(function (d) { d.open = open; });
    });
  });

  /* ---------- Experience: section TOC highlight ---------- */
  var tocLinks = document.querySelectorAll(".toc a");
  if (tocLinks.length && "IntersectionObserver" in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var tocObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          tocLinks.forEach(function (a) { a.classList.remove("active"); });
          var a = map[en.target.id]; if (a) a.classList.add("active");
        }
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) tocObs.observe(s); });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
