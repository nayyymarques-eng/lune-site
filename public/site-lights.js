/* Site driver for the one Lune light renderer (lune-light.js, from the Motion thread, 26 Oct 2026).
   Every <canvas data-light> stays in the page as a slot; one fixed WebGL canvas paints all of them,
   clipped to each slot and to the area below the header. Slots: data-light (form), data-size (css px),
   data-color ("r g b"), data-r (radius share), data-arrive (seconds: stars gather into the light),
   data-sparkle (points of mixed sizes that twinkle), data-reveal (stars of the sky gather into the light the
   first time it scrolls into view). */
(function () {
  const LL = window.LuneLight; if (!LL) return;
  const gl = document.createElement('canvas');
  gl.setAttribute('aria-hidden', 'true');
  gl.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:5';
  document.body.appendChild(gl);
  const R = LL.create(gl); if (!R) { gl.remove(); return; }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hash = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
  const cl = (x) => (x < 0 ? 0 : x > 1 ? 1 : x), eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const t0 = performance.now() / 1000;
  let slots = [];
  function scan() {
    slots = [...document.querySelectorAll('canvas[data-light]')].map((cv) => {
      const size = +cv.dataset.size || 120;
      if (!cv.width || cv.width === 300) { cv.width = size; cv.height = size; } // intrinsic size when CSS sets none
      return { cv, form: cv.dataset.light, rgb: (cv.dataset.color || '255 250 240').split(' ').map(Number), r: cv.dataset.r ? +cv.dataset.r : undefined, arrive: +cv.dataset.arrive || 0,
        sparkle: 'sparkle' in cv.dataset, reveal: 'reveal' in cv.dataset ? -1 : 0 };
    });
  }
  function headerBottom() { const h = document.querySelector('header.top'); return h ? h.getBoundingClientRect().bottom : 0; }
  function draw(now) {
    const T = reduce ? 10 : now / 1000, top = headerBottom(), vh = innerHeight;
    R.begin();
    for (const s of slots) {
      const b = s.cv.getBoundingClientRect();
      if (b.width < 4 || b.bottom < top || b.top > vh || !s.cv.isConnected) continue;
      const y0 = Math.max(b.top, top), clip = { x: b.left, y: y0, w: b.width, h: b.bottom - y0 };
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2, size = Math.min(b.width, b.height), t = 8 + T * 0.6;
      const age = T - t0;
      if (s.reveal === -1 && !reduce && b.top < vh * .8 && b.bottom > top + vh * .2) s.reveal = T;
      if (s.reveal && !reduce && (s.reveal === -1 || T - s.reveal < 4.2)) { gather(s, t, size, cx, cy, top, vh, s.reveal === -1 ? 0 : T - s.reveal, 1.2, T); continue; }
      if (s.sparkle) { sparkle(s, t, size, cx, cy, { x: 0, y: top, w: innerWidth, h: vh - top }, T); continue; }
      if (s.arrive && !reduce && age < s.arrive + 1.8) {
        // stars across the screen are drawn in, nearest first, and become the light
        const P = LL.points(s.form, t, size, { rgb: s.rgb, r: s.r }), W = innerWidth;
        P.forEach((q, i) => {
          const fx = hash(i, 5) * W, fy = top + hash(i, 6) * (vh - top);
          const ts = 0.2 + (s.arrive * 0.55) * Math.hypot(fx - cx, fy - cy) / W + 0.3 * hash(i, 7);
          const e = eio(cl((age - ts) / 1.4));
          R.dot(fx + (cx + q.x - fx) * e, fy + (cy + q.y - fy) * e, q.core * 0.75, q.c, q.a * cl((age - 0.5 * hash(i, 8)) / 0.6), { x: 0, y: top, w: W, h: vh - top });
        });
      } else R.light(cx, cy, size, s.form, t, s.rgb, { clip, r: s.r });
    }
    R.end();
  }
  // Mixed sizes and a slow twinkle, so a large light reads like stars rather than even beads.
  const sz = (i) => 0.3 + 1.1 * Math.pow(hash(i, 11), 2.6);
  const tw = (i, T) => 0.55 + 0.45 * Math.sin(T * (0.8 + 1.6 * hash(i, 12)) + 6.28 * hash(i, 13));
  function sparkle(s, t, size, cx, cy, clip, T) {
    LL.points(s.form, t, size, { rgb: s.rgb, r: s.r }).forEach((q, i) => {
      const k = sz(i), w = reduce ? 0.85 : tw(i, T);
      R.dot(cx + q.x, cy + q.y, q.core * k * (0.85 + 0.3 * w), q.c, Math.min(1, q.a * (0.2 + 0.6 * w)), clip);
    });
  }
  // Points start where faint sky stars would be and travel in, nearest first.
  function gather(s, t, size, cx, cy, top, vh, age, span, T) {
    const W = innerWidth, full = { x: 0, y: top, w: W, h: vh - top };
    LL.points(s.form, t, size, { rgb: s.rgb, r: s.r }).forEach((q, i) => {
      const fx = hash(i, 5) * W, fy = top + hash(i, 6) * (vh - top);
      const ts = 0.3 + span * Math.hypot(fx - cx, fy - cy) / W + 0.4 * hash(i, 7);
      const e = eio(cl((age - ts) / 1.6)), k = s.sparkle ? sz(i) : 1, w = s.sparkle ? tw(i, T) : 1;
      R.dot(fx + (cx + q.x - fx) * e, fy + (cy + q.y - fy) * e, q.core * k * (0.45 + 0.4 * e), q.c, q.a * (0.2 + 0.6 * e) * (0.4 + 0.6 * w), full);
    });
  }
  scan();
  if (reduce) {
    const once = () => requestAnimationFrame(draw);
    addEventListener('scroll', once, { passive: true }); addEventListener('resize', once); once();
  } else {
    const loop = (ms) => { draw(ms); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  new MutationObserver(() => scan()).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-light', 'hidden'] });
})();
