/* Balkan Consulting — interactions. Désactivé proprement si prefers-reduced-motion. */
(function () {
    "use strict";
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ── Barre de progression de lecture ── */
    var bar = document.createElement("div"); bar.className = "progress"; document.body.appendChild(bar);
    var prog = function () {
        var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
        bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    };
    prog(); window.addEventListener("scroll", prog, { passive: true });

    /* ── Montage vidéo du hero : les clips s'enchaînent en fondu ── */
    var clips = Array.prototype.slice.call(document.querySelectorAll(".hero__clip"));
    if (clips.length) {
        if (reduce) {
            clips[0].classList.add("is-active"); // premier clip figé (poster)
        } else {
            var errored = {};
            var nextIdx = function (i) {
                for (var k = 1; k <= clips.length; k++) { var n = (i + k) % clips.length; if (!errored[n]) return n; }
                return i;
            };
            var playIdx = function (i) {
                clips.forEach(function (c, j) { c.classList.toggle("is-active", j === i); });
                var v = clips[i];
                try { v.currentTime = 0; } catch (e) {}
                var p = v.play();
                if (p && p.catch) { p.catch(function () { errored[i] = true; var n = nextIdx(i); if (n !== i) playIdx(n); }); }
            };
            clips.forEach(function (v, i) {
                v.addEventListener("error", function () { errored[i] = true; });
                v.addEventListener("ended", function () { playIdx(nextIdx(i)); });
            });
            playIdx(0);
        }
    }

    /* ── Nav collée au scroll ── */
    var nav = document.getElementById("nav");
    if (nav) {
        var stick = function () { nav.classList.toggle("is-stuck", window.pageYOffset > 20); };
        stick(); window.addEventListener("scroll", stick, { passive: true });
    }

    /* ── Menu mobile ── */
    var burger = document.querySelector(".burger"), menu = document.getElementById("menu");
    if (burger && menu) {
        var open = function () { menu.hidden = false; requestAnimationFrame(function () { menu.classList.add("is-open"); }); burger.setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; };
        var close = function () { menu.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; setTimeout(function () { menu.hidden = true; }, 350); };
        burger.addEventListener("click", function () { burger.getAttribute("aria-expanded") === "true" ? close() : open(); });
        menu.addEventListener("click", function (e) { if (e.target.closest("a") || e.target.closest(".menu__close")) close(); });
        document.addEventListener("keydown", function (e) { if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") close(); });
    }

    /* ── Onglets (OOD / EOOD) ── */
    document.querySelectorAll("[data-tabs]").forEach(function (tabs) {
        var btns = tabs.querySelectorAll(".tabs__btn");
        var panels = tabs.querySelectorAll(".tabs__panel");
        btns.forEach(function (btn) {
            btn.addEventListener("click", function () {
                var id = btn.getAttribute("data-tab");
                btns.forEach(function (b) { var on = b === btn; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
                panels.forEach(function (p) { p.classList.toggle("is-active", p.getAttribute("data-panel") === id); });
            });
        });
    });

    if (reduce) { return; }

    /* ── Révélations ── */
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    items.forEach(function (el) { el.classList.add("reveal"); });
    if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                var d = parseInt(en.target.getAttribute("data-reveal-delay") || "0", 10);
                if (d) en.target.style.transitionDelay = d + "ms";
                en.target.classList.add("is-in"); io.unobserve(en.target);
            });
        }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
        items.forEach(function (el) { io.observe(el); });
    } else { items.forEach(function (el) { el.classList.add("is-in"); }); }

    /* ── Compteurs ── */
    function countUp(el) {
        var raw = el.getAttribute("data-count"); var suffix = el.getAttribute("data-suffix") || "";
        var target = parseFloat(raw); if (isNaN(target)) return;
        var dur = 1300, start = null;
        function step(ts) { if (!start) start = ts; var p = Math.min((ts - start) / dur, 1); var v = Math.round(target * (1 - Math.pow(1 - p, 3))); el.textContent = v + suffix; if (p < 1) requestAnimationFrame(step); }
        requestAnimationFrame(step);
    }
    if ("IntersectionObserver" in window) {
        var co = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) { if (en.isIntersecting) { countUp(en.target); co.unobserve(en.target); } });
        }, { threshold: 0.6 });
        document.querySelectorAll("[data-count]").forEach(function (el) { co.observe(el); });
    }

    /* ── Tilt 3D léger (hero) ── */
    if (window.matchMedia("(pointer:fine)").matches) {
        document.querySelectorAll("[data-tilt]").forEach(function (el) {
            el.style.transformStyle = "preserve-3d";
            el.style.transition = "transform .2s var(--ease)";
            el.addEventListener("mousemove", function (e) {
                var r = el.getBoundingClientRect();
                var x = (e.clientX - r.left) / r.width - 0.5;
                var y = (e.clientY - r.top) / r.height - 0.5;
                el.style.transform = "perspective(900px) rotateY(" + (x * 6) + "deg) rotateX(" + (-y * 6) + "deg)";
            });
            el.addEventListener("mouseleave", function () { el.style.transform = "perspective(900px) rotateY(0) rotateX(0)"; });
        });

        /* Projecteur au curseur sur les cartes */
        document.querySelectorAll(".card").forEach(function (c) {
            c.addEventListener("mousemove", function (e) {
                var r = c.getBoundingClientRect();
                c.style.setProperty("--mx", (e.clientX - r.left) + "px");
                c.style.setProperty("--my", (e.clientY - r.top) + "px");
            });
        });
    }

    /* ── Frise parcours : remplissage + pop des étapes ── */
    document.querySelectorAll(".timeline").forEach(function (tl) {
        tl.classList.add("anim");
        var o = new IntersectionObserver(function (es) {
            es.forEach(function (en) { if (en.isIntersecting) { tl.classList.add("is-in"); o.disconnect(); } });
        }, { threshold: 0.3 });
        o.observe(tl);
    });

    /* ── Parallaxe (hero : aurora + photo) ── */
    var par = [];
    var a = document.querySelector(".hero .aurora"); if (a) par.push([a, 0.16]);
    document.querySelectorAll(".bento__media img, .whysec__bg img").forEach(function (p) { par.push([p, -0.04]); });
    if (par.length) {
        var tick = false;
        window.addEventListener("scroll", function () {
            if (tick) return; tick = true;
            requestAnimationFrame(function () {
                var y = window.pageYOffset;
                par.forEach(function (pair) { pair[0].style.transform = "translate3d(0," + (y * pair[1]) + "px,0)"; });
                tick = false;
            });
        }, { passive: true });
    }
})();
