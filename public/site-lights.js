/* Site driver for the one Lune light renderer (lune-light.js, from the Motion thread, 26 Oct 2026).
   Every <canvas data-light> draws itself: data-light (form), data-size (css px), data-color ("r g b"),
   data-r (radius share), data-sparkle (points of mixed sizes that twinkle).
   Each slot has its own canvas so it scrolls with the page (a fixed layer lagged behind scrolling, Nayara 26 Oct).
   Lights up to 160 px are drawn once and stay still; larger ones move only while on screen, at about 30 fps. */
(function () {
  const LL = window.LuneLight; if (!LL) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hash = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
  const live = new Set(), slots = [];
  document.querySelectorAll('canvas[data-light]').forEach((cv) => {
    const size = +cv.dataset.size || 120;
    if (!cv.style.width && cv.clientWidth === 300) { cv.style.width = size + 'px'; cv.style.height = size + 'px'; } // canvases CSS leaves at the 300 px default
    const R = LL.create(cv); if (!R) return;
    const d = cv.dataset, s = { cv, R, form: d.light, rgb: (d.color || '255 250 240').split(' ').map(Number), r: d.r ? +d.r : undefined, phase: d.phase ? +d.phase : undefined,
      sparkle: 'sparkle' in d, still: size <= 160 || reduce };
    slots.push(s);
  });
  function paint(s, T) {
    const w = s.cv.clientWidth, h = s.cv.clientHeight, size = Math.min(w, h), t = 8 + T * 0.6;
    if (size < 4) return;
    s.R.begin();
    if (s.sparkle) LL.points(s.form, t, size, { rgb: s.rgb, r: s.r, phase: s.phase }).forEach((q, i) => {
      const k = 0.3 + 1.1 * Math.pow(hash(i, 11), 2.6), tw = 0.55 + 0.45 * Math.sin(T * (0.8 + 1.6 * hash(i, 12)) + 6.28 * hash(i, 13));
      s.R.dot(w / 2 + q.x, h / 2 + q.y, q.core * k, q.c, Math.min(1, q.a * (0.2 + 0.6 * tw)));
    });
    else s.R.light(w / 2, h / 2, size, s.form, t, s.rgb, { r: s.r, phase: s.phase });
    s.R.end();
  }
  slots.forEach((s) => paint(s, 10));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      const s = slots.find((x) => x.cv === e.target); if (!s || s.still) return;
      e.isIntersecting ? live.add(s) : live.delete(s);
    }));
    slots.forEach((s) => io.observe(s.cv));
  }
  let last = 0;
  const loop = (ms) => { if (ms - last > 32) { last = ms; live.forEach((s) => paint(s, ms / 1000)); } requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  addEventListener('resize', () => slots.forEach((s) => paint(s, performance.now() / 1000)));
})();
