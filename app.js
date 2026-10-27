(function () {
  'use strict';
  var D = window.BEA, NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function $(s) { return document.querySelector(s); }
  function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function h(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }

  var svcBySlug = {};
  D.services.forEach(function (s) { svcBySlug[s.slug] = s; });

  /* Three concentric rings, two services each, always opposite each other:
     the picture is point-symmetric around the centre at every moment. [slug, label, short label] */
  var RINGS = [
    [['hr-strategy-design', 'HR strategiya', 'HR strategiya'], ['executive-leadership-coaching', 'İcraçı koçinq', 'Koçinq']],
    [['people-analytics', 'İnsan analitikası', 'Analitika'], ['total-rewards', 'Kompensasiya', 'Mükafatlar']],
    [['leadership-academies', 'Liderlik akademiyası', 'Liderlik'], ['performance-management', 'Performans idarəetməsi', 'Performans']]
  ];

  var cv = $('#orbitCv'), g2 = cv.getContext('2d'), labelsEl = $('#labels'), coreEl = $('#core');
  var W = 0, H = 0, cx = 0, cy = 0, narrow = false, dpr = 1, TAU = Math.PI * 2;
  var items = [], rings = [], dust = [], sparks = [], stars = [], ringDust = [], beaPts = [], beaP = [], coreHover = false, shocks = [], hotIdx = -1, bgGrad = null, vigGrad = null;
  var selSlug = null, lastPill = null, navOn = false, introStart = performance.now(), cs = 160, topLimit = 90;
  var mouse = { tx: 0, ty: 0, x: 0, y: 0 };
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); }
  var ctx = document.createElement('canvas').getContext('2d');

  /* order: people -> organization -> process -> data -> technology.
     Inner ring carries two directions (opposite), outer ring carries three (120 degrees apart). */
  var SV = [
    { slug: 'hr', r: 0, k: 0, t: 'HR transformasiyası', s: 'HR transformasiyası', en: 'People & HR Transformation', h: 'Strategiya, əməliyyat modeli və HR sistemləri',
      d: 'HR funksiyasını biznes strategiyasına uyğun qurur, insan kapitalını idarə olunan dəyərə çeviririk.',
      subs: ['HR strategiyası və əməliyyat modeli', 'Siyasət və proseslərin dizaynı', 'İstedad, performans və mükafat sistemləri', 'HR funksiyasının transformasiyası'],
      out: 'Biznes strategiyası ilə uyğunlaşmış, effektiv işləyən HR funksiyası.',
      ic: 'M9 7m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M3 20v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1M16 4a3 3 0 0 1 0 6M21 20v-1a4 4 0 0 0-3-3.9' },
    { slug: 'od', r: 1, k: 0, t: 'Təşkilati dizayn və inkişaf', s: 'Təşkilati inkişaf', en: 'Organization Design & Development', h: 'Struktur, rollar, mədəniyyət və dəyişiklik',
      d: 'Təşkilatın strukturunu, rollarını və mədəniyyətini strategiyanı icra edəcək şəkildə qururuq.',
      subs: ['Təşkilati struktur və rolların dizaynı', 'Səlahiyyət matrisi və idarəetmə modeli', 'Mədəniyyət və dəyişikliyin idarə edilməsi', 'Liderlik inkişafı'],
      out: 'Aydın struktur, sürətli qərar qəbulu və dəyişikliyə hazır təşkilat.',
      ic: 'M9 3h6v4H9zM12 7v4M5 15v-2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2M3 15h4v4H3zM17 15h4v4h-4zM10 15h4v4h-4zM12 11v4' },
    { slug: 'bpm', r: 1, k: 1, t: 'Biznes proses idarəetməsi (BPM)', o: 'Biznes proses idarəetməsi (BPM)', tag: 'BPM', s: 'BPM', en: 'Business Process Management', h: 'Proseslərin xəritələnməsi və optimallaşdırılması',
      d: 'Biznes proseslərini görünən, ölçülə bilən və idarə olunan edirik.',
      subs: ['Proseslərin xəritələnməsi (AS-IS / TO-BE)', 'Proses təhlili və optimallaşdırma', 'Proses idarəetmə sisteminin qurulması', 'Proses KPI-ları və nəzarət'],
      out: 'Şəffaf, ölçülə bilən və daha az xərcli proseslər.',
      ic: 'M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4' },
    { slug: 'data', r: 0, k: 1, t: 'Data və analitika', s: 'Data analitika', en: 'Data & Analytics', h: 'Analitika sistemləri və KPI panelləri',
      d: 'Datanı qərar qəbulunun əsas alətinə çevirən analitika sistemləri qururuq.',
      subs: ['Data strategiyası və arxitekturası', 'Analitika sistemlərinin qurulması', 'KPI və idarəetmə panelləri (dashboard)', 'People analytics'],
      out: 'Qərarların fərziyyəyə yox, dataya əsaslanması.',
      ic: 'M4 20V10h4v10zM10 20V4h4v16zM16 20v-7h4v7z' },
    { slug: 'digital', r: 1, k: 2, t: 'Rəqəmsal transformasiya', s: 'Rəqəmsal transformasiya', en: 'Digital Transformation & Technology', h: 'Rəqəmsal strategiya, IT və rəqəmsal həllər',
      d: 'Biznesinizə uyğun rəqəmsal yol xəritəsi hazırlayır, IT və rəqəmsal həlləri seçib tətbiq edirik.',
      subs: ['Rəqəmsal transformasiya strategiyası', 'Proseslərin rəqəmsallaşdırılması və avtomatlaşdırma', 'IT və rəqəmsal həllərin seçimi (HRIS, ERP və s.)', 'Tətbiq və dəyişikliyin idarə edilməsi'],
      out: 'Müasir texnologiya ilə daha sürətli və effektiv biznes.',
      ic: 'M7 7h10v10H7zM10 10h4v4h-4zM9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4' }
  ];
  /* two concentric rings with the same tilt (they never cross) + one faint guide ring */
  var CFG = [{ sc: 0.42, n: 2, hue: '#FFFFFF', w: 1.2 }, { sc: 1.0, n: 3, hue: '#FFFFFF', w: 1.9 }];
  var TILT = 0.36;

  function iconEl(d, sz) {
    var s = el('svg', { viewBox: '0 0 24 24', width: sz, height: sz, 'aria-hidden': 'true' }); el('path', { d: d, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s); return s;
  }
  SV.forEach(function (s, i) {
    var b = h('button', 'svcbox'); b.type = 'button'; b.setAttribute('aria-label', s.t + '. ' + s.h);
    var ic = h('span', 'ic'); ic.appendChild(iconEl(s.ic, 20));
    var tx = h('span', 'tx'); tx.appendChild(h('span', 'no', '0' + (i + 1) + (s.tag ? '  ·  ' + s.tag : ''))); var tt = h('span', 'tt', s.t); tx.appendChild(tt);
    var go = h('span', 'go', '→'); go.setAttribute('aria-hidden', 'true');
    var hint = h('span', 'hint', s.h); hint.setAttribute('aria-hidden', 'true');
    b.appendChild(ic); b.appendChild(tx); b.appendChild(go); b.appendChild(hint);
    labelsEl.appendChild(b);
    var p = { g: b, tt: tt, sv: s, idx: i, ring: s.r, k: s.k, slug: s.slug, x: 0, y: 0, s: 1, dt: 1, w: 220, hh: 64, off: 0 };
    items.push(p);
    b.addEventListener('click', function () { openSvc(p); });
    b.addEventListener('mouseenter', function () { hotIdx = i; });
    b.addEventListener('mouseleave', function () { hotIdx = -1; });
    b.addEventListener('focus', function () { hotIdx = i; });
    b.addEventListener('blur', function () { hotIdx = -1; });
  });

  var cry = 1, sry = 0, crx = 1, srx = 0, F = 1700;
  function proj(th, rg) {
    var x = rg.a * Math.cos(th), y0 = rg.b * Math.sin(th);
    var y = y0 * Math.cos(TILT), z = y0 * Math.sin(TILT);
    var x1 = x * cry + z * sry, z1 = -x * sry + z * cry;
    var y1 = y * crx - z1 * srx, z2 = y * srx + z1 * crx;
    var s = F / (F - z2);
    return { x: cx + x1 * s, y: cy + y1 * s, s: s };
  }
  function dep(s) { return clamp((s - 0.93) / 0.14, 0, 1); }
  function hexA(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }

  function layout() {
    W = window.innerWidth; H = window.innerHeight; narrow = W < 720;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    g2.setTransform(dpr, 0, 0, dpr, 0, 0);
    topLimit = narrow ? 80 : 96;
    cx = W / 2; cy = narrow ? (topLimit + H) / 2 : H / 2 + 28;
    bgGrad = g2.createRadialGradient(cx, cy * 0.95, 0, cx, cy, Math.hypot(W, H) * 0.62);
    bgGrad.addColorStop(0, '#2B1668'); bgGrad.addColorStop(0.45, '#1A0D47'); bgGrad.addColorStop(1, '#0B0626');
    vigGrad = g2.createRadialGradient(cx, cy, Math.min(W, H) * 0.35, cx, cy, Math.hypot(W, H) * 0.62);
    vigGrad.addColorStop(0, 'rgba(150,90,235,0.16)'); vigGrad.addColorStop(1, 'rgba(150,90,235,0)');
    /* phones: all five share the outer ring (72 degrees apart); wider screens: 2 inner + 3 outer */
    items.forEach(function (p, i) { p.tt.textContent = W < 980 ? SV[i].s : (SV[i].o || SV[i].t); var single = true; p.ring = single ? 1 : SV[i].r; p.k = single ? i : SV[i].k; });
    items.forEach(function (p) { p.w = p.g.offsetWidth || 220; p.hh = p.g.offsetHeight || 64; });
    var bw = Math.max.apply(null, items.map(function (p) { return p.w; })), bh = Math.max.apply(null, items.map(function (p) { return p.hh; }));
    cs = clamp(Math.min(W, H) * (narrow ? 0.26 : 0.21), narrow ? 92 : 124, 190);
    coreEl.style.left = cx + 'px'; coreEl.style.top = cy + 'px'; coreEl.style.width = cs + 'px'; coreEl.style.height = cs + 'px';
    buildBea();

    var A = narrow ? W / 2 - 34 : Math.min(W * 0.45, W / 2 - bw / 2 - 16);
    var B = Math.max(60, Math.min(cy - topLimit - bh / 2 - 6, H - cy - bh / 2 - 14) / Math.cos(TILT));
    var a0 = Math.max(A * CFG[0].sc, cs / 2 + bw / 2 + 22), b0 = Math.max(B * CFG[0].sc, (cs / 2 + bh / 2 + 16) / Math.cos(TILT));
    a0 = Math.min(a0, A - (narrow ? 6 : 50)); b0 = Math.min(b0, B - bh * 1.1);
    var single = true;
    if (single) { a0 = A * 0.62; b0 = B * 0.42; }
    rings = [{ a: a0, b: b0, n: 2, hue: CFG[0].hue, w: CFG[0].w }, { a: A, b: B, n: single ? 5 : 3, hue: CFG[1].hue, w: CFG[1].w }];
    var ph = searchPhase();
    items.forEach(function (p) { p.off = (p.ring === 1 ? ph : 0) + p.k * TAU / rings[p.ring].n; });
    var rst = rng(77); stars = [];
    for (var sti = 0; sti < (narrow ? 90 : 170); sti++) stars.push({ x: rst() * W, y: rst() * H, r: 0.3 + rst() * 1.1, a: 0.2 + rst() * 0.6, sp: 0.5 + rst() * 1.5, ph: rst() * 6 });
    var rs = rng(31); sparks = [];
    for (var si = 0; si < (narrow ? 7 : 12); si++) sparks.push({ x: rs() * W, y: rs() * H, z: 1.0 + rs() * 2.0, sp: 0.4 + rs() * 0.8, ph: rs() * 6 });
    var rr = rng(9); dust = [];
    /* star-dust rings: each ring is made of many small glowing particles drifting along it */
    var rd = rng(53); ringDust = [];
    rings.forEach(function (rg, ri) {
      if (ri !== 1) return; var n = narrow ? 340 : 700;
      for (var k = 0; k < n; k++) { var big = rd() > 0.93; ringDust.push({ ring: ri, th: rd() * TAU, j: (rd() - 0.5) * (ri ? 16 : 12), z: big ? 1.5 + rd() * 1.1 : 0.4 + rd() * 0.9, big: big, ph: rd() * 6, tw: 1 + rd() * 2.5, sp: (ri ? 0.022 : -0.03) * (0.6 + rd() * 0.8) }); }
    });
    dust = [];
    rings.forEach(function (rg, ri) { for (var k = 0; k < 0; k++) dust.push({ ring: ri, th: rr() * TAU, sp: 0.03 + rr() * 0.05, z: 0.7 + rr() * 1.0, ph: rr() * 6 }); });
  }

  /* inner and outer items share one angular speed; find the outer phase that keeps every pair apart */
  function searchPhase() {
    var sv = [cry, sry, crx, srx]; cry = 1; sry = 0; crx = 1; srx = 0;
    var S = 90, T = 120, best = 0, bs = -1e9;
    for (var a = 0; a < S; a++) {
      var ph = a * (TAU / 3) / S, m = 1e9;
      for (var t = 0; t < T && m > bs; t++) {
        var base = TAU * t / T, P = items.map(function (it) { var q = proj((it.ring === 1 ? ph : 0) + base + it.k * TAU / rings[it.ring].n, rings[it.ring]); return [q.x, q.y, it.w, it.hh]; });
        for (var i = 0; i < P.length; i++) for (var j = i + 1; j < P.length; j++) {
          var c = Math.max(Math.abs(P[i][0] - P[j][0]) - (P[i][2] + P[j][2]) / 2 - 16, Math.abs(P[i][1] - P[j][1]) - (P[i][3] + P[j][3]) / 2 - 10);
          if (c < m) m = c;
        }
      }
      if (m > bs) { bs = m; best = ph; }
    }
    var worst = null, wm = 1e9;
    for (var t2 = 0; t2 < T; t2++) {
      var b2 = TAU * t2 / T, P2 = items.map(function (it) { var q = proj((it.ring === 1 ? best : 0) + b2 + it.k * TAU / rings[it.ring].n, rings[it.ring]); return [q.x, q.y, it.w, it.hh]; });
      for (var i2 = 0; i2 < P2.length; i2++) for (var j2 = i2 + 1; j2 < P2.length; j2++) {
        var xg = Math.abs(P2[i2][0] - P2[j2][0]) - (P2[i2][2] + P2[j2][2]) / 2, yg = Math.abs(P2[i2][1] - P2[j2][1]) - (P2[i2][3] + P2[j2][3]) / 2, c2 = Math.max(xg - 16, yg - 10);
        if (c2 < wm) { wm = c2; worst = { a: SV[i2].slug, b: SV[j2].slug, xgap: Math.round(xg), ygap: Math.round(yg) }; }
      }
    }
    window.__orbitWorst = worst;
    cry = sv[0]; sry = sv[1]; crx = sv[2]; srx = sv[3];
    window.__orbitClearance = Math.round(bs);
    return best;
  }

  function mix(c1, c2, f) { return [Math.round(c1[0] + (c2[0] - c1[0]) * f), Math.round(c1[1] + (c2[1] - c1[1]) * f), Math.round(c1[2] + (c2[2] - c1[2]) * f)]; }
  var DEEP = [106, 58, 192], LIGHT = [242, 228, 255];
  function drawBg(t) {
    g2.globalCompositeOperation = 'source-over';
    g2.fillStyle = bgGrad; g2.fillRect(0, 0, W, H);
    g2.globalCompositeOperation = 'lighter';
    /* nebula clouds in the logo's colours */
    [['#7040C0', -0.6, 0.17, 0.5], ['#C43FBE', 2.2, 0.08, 0.42], ['#4A3AD0', 4.1, 0.12, 0.46]].forEach(function (b) {
      var x = cx + Math.cos(t * 0.03 + b[1]) * W * 0.3, y = cy + Math.sin(t * 0.025 + b[1]) * H * 0.22, r = Math.max(W, H) * b[3];
      var gr = g2.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, hexA(b[0], b[2])); gr.addColorStop(1, hexA(b[0], 0));
      g2.fillStyle = gr; g2.fillRect(0, 0, W, H);
    });
    stars.forEach(function (st) {
      var a = st.a * (0.55 + 0.45 * Math.sin(t * st.sp + st.ph));
      g2.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
      g2.fillRect(st.x - mouse.x * 5 * st.r, st.y - mouse.y * 4 * st.r, st.r * 1.6, st.r * 1.6);
    });
    sparks.forEach(function (k) {
      var a = Math.max(0, Math.sin(t * k.sp + k.ph)); if (a < 0.02) return;
      var r = k.z * (0.6 + 0.4 * a);
      g2.fillStyle = 'rgba(255,245,255,' + (0.8 * a).toFixed(3) + ')';
      g2.beginPath(); g2.moveTo(k.x, k.y - r * 2.4); g2.lineTo(k.x + r * 0.42, k.y - r * 0.42); g2.lineTo(k.x + r * 2.4, k.y); g2.lineTo(k.x + r * 0.42, k.y + r * 0.42);
      g2.lineTo(k.x, k.y + r * 2.4); g2.lineTo(k.x - r * 0.42, k.y + r * 0.42); g2.lineTo(k.x - r * 2.4, k.y); g2.lineTo(k.x - r * 0.42, k.y - r * 0.42); g2.closePath(); g2.fill();
      g2.fillStyle = 'rgba(200,150,255,' + (0.22 * a).toFixed(3) + ')'; g2.beginPath(); g2.arc(k.x, k.y, r * 3.4, 0, TAU); g2.fill();
    });
    g2.fillStyle = vigGrad; g2.fillRect(0, 0, W, H);
    g2.globalCompositeOperation = 'source-over';
  }
  /* rings are star-dust: many glowing particles, brighter and larger in front; a very faint line keeps the shape readable */
  function drawRings(t, ik) {
    var hr = hotIdx >= 0 ? items[hotIdx].ring : -1, SEG = narrow ? 90 : 150, vis = ease(ik);
    var guide = { a: rings[1].a * 1.12, b: rings[1].b * 1.12 };
    g2.lineCap = 'round';
    [rings[1]].forEach(function (rg) { var gi = 2;
      var hot = hr === gi - 1 ? 1 : 0, prev = proj(-Math.PI / 2, rg), upto = Math.round(SEG * vis);
      for (var j = 1; j <= upto; j++) {
        var p = proj(-Math.PI / 2 + j * TAU / SEG, rg), d = dep((p.s + prev.s) / 2);
        g2.strokeStyle = 'rgba(200,165,255,' + ((gi === 0 ? 0.05 : 0.07 + 0.08 * d) * (1 + hot * 1.2)).toFixed(3) + ')'; g2.lineWidth = gi === 0 ? 1 : 1 + 0.6 * d;
        g2.beginPath(); g2.moveTo(prev.x, prev.y); g2.lineTo(p.x, p.y); g2.stroke(); prev = p;
      }
    });
    var tmp = { a: 0, b: 0 };
    ringDust.forEach(function (q) {
      var rg = rings[q.ring]; tmp.a = rg.a + q.j; tmp.b = rg.b + q.j * 0.5;
      var p = proj(q.th + t * q.sp, tmp), d = dep(p.s), tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * q.tw + q.ph));
      var a = (0.28 + 0.66 * d) * tw * vis * (hr === q.ring ? 1.5 : 1), r = q.z * (0.65 + 0.55 * d) * p.s;
      g2.fillStyle = 'rgba(238,218,255,' + Math.min(1, a).toFixed(3) + ')';
      g2.beginPath(); g2.arc(p.x, p.y, r, 0, TAU); g2.fill();
      if (q.big) { g2.fillStyle = 'rgba(190,130,250,' + (a * 0.22).toFixed(3) + ')'; g2.beginPath(); g2.arc(p.x, p.y, r * 3.2, 0, TAU); g2.fill(); }
    });
    if (hotIdx >= 0) {
      var it = items[hotIdx], lg = g2.createLinearGradient(cx, cy, it.x, it.y);
      lg.addColorStop(0, 'rgba(210,170,255,0)'); lg.addColorStop(0.35, 'rgba(210,170,255,0.3)'); lg.addColorStop(1, 'rgba(240,220,255,0.8)');
      g2.strokeStyle = lg; g2.lineWidth = 1.3; g2.setLineDash([3, 6]); g2.beginPath(); g2.moveTo(cx, cy); g2.lineTo(it.x, it.y); g2.stroke(); g2.setLineDash([]);
    }
  }

  /* centre: star-dust particles flow in from the rings, form "BEA", glow, then return to the rings */
  function buildBea() {
    var fsB = Math.round(cs * 0.46), o = document.createElement('canvas');
    o.width = Math.ceil(fsB * 2.8); o.height = Math.ceil(fsB * 1.4);
    var c = o.getContext('2d'); c.fillStyle = '#fff';
    c.font = "800 " + fsB + "px 'Plus Jakarta Sans', 'Arial Black', Arial, sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('BEA', o.width / 2, o.height / 2 + fsB * 0.04);
    var d = c.getImageData(0, 0, o.width, o.height).data, st = Math.max(2, Math.round(fsB / 26));
    beaPts = [];
    for (var y = 0; y < o.height; y += st) for (var x = 0; x < o.width; x += st) if (d[(y * o.width + x) * 4 + 3] > 128) beaPts.push([x - o.width / 2, y - o.height / 2]);
    if (!beaPts.length) beaPts = [[0, 0]];
    var n = narrow ? 360 : 600; beaP = [];
    for (var i = 0; i < n; i++) beaP.push({ ring: 1, o: Math.random() * TAU, ph: Math.random() * 6, r: 0.7 + Math.random() * 0.7, x: cx, y: cy });
  }
  function drawBea(t) {
    if (!beaPts.length || !beaP.length || rings.length < 2) return;
    var tt = Math.max(0, t), cyc = (tt % 10) / 10;
    var gather = cyc < 0.18 ? ease(cyc / 0.18) : cyc < 0.82 ? 1 : 1 - ease((cyc - 0.82) / 0.18);
    var N = beaP.length, bw = cs, hov = coreHover ? 1.35 : 1;
    var hg = g2.createRadialGradient(cx, cy, 0, cx, cy, cs * 0.85);
    hg.addColorStop(0, 'rgba(176,96,224,' + ((0.08 + 0.2 * gather) * hov).toFixed(3) + ')'); hg.addColorStop(1, 'rgba(176,96,224,0)');
    g2.fillStyle = hg; g2.fillRect(cx - cs, cy - cs, cs * 2, cs * 2);
    for (var i = 0; i < N; i++) {
      var p = beaP[i], a = beaPts[Math.floor(i * beaPts.length / N)], q = proj(p.o + tt * (p.ring ? 0.05 : -0.07), rings[p.ring]);
      var lag = clamp(gather * 1.25 - (i / N) * 0.25, 0, 1);
      var tx = q.x + (cx + a[0] - q.x) * lag, ty = q.y + (cy + a[1] - q.y) * lag;
      p.x += (tx - p.x) * 0.2; p.y += (ty - p.y) * 0.2;
      var f = clamp(a[0] / bw + 0.5, 0, 1);
      var al = (0.45 + 0.45 * Math.sin(tt * 3 + p.ph)) * (0.55 + 0.45 * lag) * hov;
      g2.fillStyle = 'rgba(' + Math.round(235 - 3 * f) + ',' + Math.round(218 - 110 * f) + ',' + Math.round(255 - 20 * f) + ',' + Math.min(1, al).toFixed(3) + ')';
      g2.beginPath(); g2.arc(p.x, p.y, p.r * (0.8 + 0.35 * lag), 0, TAU); g2.fill();
    }
  }
  /* three bright comets with long light trails travel along the single ring */
  function drawComets(t, ik) {
    if (ik < 1 || rings.length < 2) return;
    var rg = rings[1];
    for (var c = 0; c < 3; c++) {
      var head = t * 0.42 + c * TAU / 3;
      for (var st = 0; st < 44; st++) {
        var th = head - st * 0.016, p = proj(th, rg), d = dep(p.s), f = 1 - st / 44;
        g2.fillStyle = 'rgba(250,240,255,' + (0.9 * f * f * (0.55 + 0.45 * d)).toFixed(3) + ')';
        g2.beginPath(); g2.arc(p.x, p.y, (0.6 + 2.8 * f) * p.s, 0, TAU); g2.fill();
      }
      var hp = proj(head, rg), hg = g2.createRadialGradient(hp.x, hp.y, 0, hp.x, hp.y, 18);
      hg.addColorStop(0, 'rgba(230,200,255,0.75)'); hg.addColorStop(1, 'rgba(230,200,255,0)');
      g2.fillStyle = hg; g2.fillRect(hp.x - 18, hp.y - 18, 36, 36);
    }
  }
  function drawDust(t, ik) {
    dust.forEach(function (d) {
      var p = proj(d.th + t * d.sp, rings[d.ring]), dd = dep(p.s), a = (0.08 + 0.24 * (0.5 + 0.5 * Math.sin(t * 1.1 + d.ph))) * (0.5 + 0.5 * dd) * ik;
      g2.fillStyle = 'rgba(235,215,255,' + Math.min(1, a * 1.1).toFixed(3) + ')'; g2.beginPath(); g2.arc(p.x, p.y, d.z * p.s, 0, TAU); g2.fill();
    });
  }
  function drawShocks(dt) {
    shocks = shocks.filter(function (s) {
      s.l += dt; var u = s.l / 1.0; if (u >= 1) return false;
      g2.strokeStyle = 'rgba(220,200,250,' + (0.45 * (1 - u)).toFixed(3) + ')'; g2.lineWidth = 1.6 * (1 - u) + 0.5;
      g2.beginPath(); g2.arc(s.x, s.y, 14 + 80 * u, 0, TAU); g2.stroke(); return true;
    });
  }
  function placeItems(t, ik) {
    items.forEach(function (p, i) {
      var rg = rings[p.ring], th = p.off + t * 0.055, q = proj(th, rg), d = dep(q.s), e = ease(ik * 1.7 - 0.55 - i * 0.09);
      p.x = q.x; p.y = q.y; p.s = q.s; p.dt = d;
      var k = (0.94 + 0.1 * d) * (0.7 + 0.3 * e), hw = p.w * k / 2;
      var x = cx + (q.x - cx) * e, y = cy + (q.y - cy) * e;
      x = clamp(x, hw + 8, W - hw - 8); y = clamp(y, topLimit + p.hh / 2, H - p.hh / 2 - 10);
      p.g.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + k.toFixed(3) + ')';
      p.g.style.opacity = ((0.86 + 0.14 * d) * e).toFixed(2);
      p.g.style.zIndex = Math.round(q.s * 100);
      p.g.classList.toggle('below', y > cy + 40);
    });
  }

  var last = performance.now(), tAcc = 0;
  function frame(now) {
    var dt = Math.min(0.1, (now - last) / 1000); last = now;
    tAcc += dt * (reduce.matches ? 0.25 : 1);
    var t = tAcc, ik = reduce.matches ? 1 : clamp((now - introStart) / 1500, 0, 1);
    if (window.innerWidth !== W || window.innerHeight !== H) { layout(); if (navOn) { layoutNav(); showSection(navCur, false); } }
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
    var ry = mouse.x * 0.08 + Math.sin(t * 0.1) * 0.05, rx = mouse.y * 0.06 + Math.sin(t * 0.08 + 1) * 0.03;
    cry = Math.cos(ry); sry = Math.sin(ry); crx = Math.cos(rx); srx = Math.sin(rx);
    if (!navOn) {
      drawBg(t);
      g2.globalCompositeOperation = 'lighter';
      drawRings(t, ik); drawComets(t, ik); drawBea(t); drawDust(t, ik); drawShocks(dt);
      g2.globalCompositeOperation = 'source-over';
      placeItems(t, ik);
    }
    requestAnimationFrame(frame);
  }
  window.addEventListener('pointermove', function (e) { mouse.tx = (e.clientX / W - 0.5) * 2; mouse.ty = (e.clientY / H - 0.5) * 2; });
  coreEl.addEventListener('click', function () { openNav('about'); });
  coreEl.addEventListener('mouseenter', function () { coreHover = true; });
  coreEl.addEventListener('mouseleave', function () { coreHover = false; });
  coreEl.addEventListener('focus', function () { coreHover = true; });
  coreEl.addEventListener('blur', function () { coreHover = false; });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

  /* ---------- SERVICE PANEL ---------- */
  var panel = $('#svcPanel');
  function openSvc(p) {
    var s = p.sv;
    selSlug = p.slug; lastPill = p; shocks.push({ x: p.x, y: p.y, l: 0 });
    items.forEach(function (q) { q.g.classList.toggle('sel', q.slug === selSlug); });
    $('#svcCat').textContent = 'Xidmət istiqaməti · 0' + (p.idx + 1);
    $('#svcTitle').textContent = s.t;
    $('#svcDesc').textContent = s.d;
    $('#svcMeta').textContent = s.en;
    var ul = $('#svcSubs'); clear(ul); s.subs.forEach(function (x) { ul.appendChild(h('li', '', x)); });
    var oc = $('#svcOut'); clear(oc); oc.appendChild(h('b', '', 'Nə qazanırsınız')); oc.appendChild(document.createTextNode(s.out));
    panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false');
    $('#svcClose').focus({ preventScroll: true });
  }
  function closeSvc(refocus) {
    panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true');
    selSlug = null; items.forEach(function (q) { q.g.classList.remove('sel'); });
    if (refocus && lastPill) lastPill.g.focus({ preventScroll: true });
  }
  $('#svcClose').addEventListener('click', function () { closeSvc(true); });
  $('#svcCta').addEventListener('click', function () { closeSvc(false); openNav('contact'); });

  /* ---------- NAV SCENE ---------- */
  var NAV = [{ id: 'about', t: 'Haqqımızda' }, { id: 'approach', t: 'Yanaşmamız' }, { id: 'faq', t: 'FAQ' }, { id: 'contact', t: 'Əlaqə' }];
  var navCur = 'about', chips = {}, arcLines = {};
  var navSvg = $('#navSvg'), navArcs = $('#navArcs'), navChips = $('#navChips'), navPanel = $('#navPanel');
  var scOrbit = $('#scene-orbit'), scNav = $('#scene-nav'), burger = $('#menu');

  function layoutNav() {
    var w = window.innerWidth, hh = window.innerHeight, nr = w < 720;
    navSvg.setAttribute('viewBox', '0 0 ' + w + ' ' + hh);
    clear(navArcs); clear(navChips); chips = {}; arcLines = {};
    var cyN = nr ? hh * 0.2 : hh / 2;
    var dy = nr ? hh * 0.068 : Math.min(hh * 0.16, 170);
    var R0 = 1.5 * dy * 1.22, g = nr ? dy * 0.52 : dy * 0.56;
    var cf = nr ? 15 : Math.max(16, Math.min(20, w / 100)), chH = Math.round(cf * 2.7);
    ctx.font = '500 ' + cf + 'px Fraunces, Georgia, serif';
    var maxRight = 0;

    if (!nr) [0.34, 0.5, 0.66].forEach(function (m) {
      el('circle', { cx: w * 0.98, cy: hh * 0.9, r: Math.min(w, hh) * m, fill: 'none', stroke: '#2F2160', 'stroke-width': 1.2 }, navArcs);
    });
    [-0.9, 4, 5.2].forEach(function (m) {
      var R = R0 + m * g; if (R < 40) return;
      el('path', { d: 'M0 ' + (cyN - R) + ' A ' + R + ' ' + R + ' 0 0 1 0 ' + (cyN + R), class: 'arc line', opacity: 0.5 }, navArcs);
    });

    NAV.forEach(function (n, i) {
      var R = R0 + i * g, yy = cyN + (i - 1.5) * dy, xx = Math.sqrt(Math.max(R * R - (yy - cyN) * (yy - cyN), 0));
      var len = Math.PI * R, d = 'M0 ' + (cyN - R) + ' A ' + R + ' ' + R + ' 0 0 1 0 ' + (cyN + R);
      el('path', { d: d, class: 'arc band draw', 'stroke-width': chH * 1.5, style: '--len:' + len + ';--d:' + (0.1 + i * 0.12) + 's' }, navArcs);
      var line = el('path', { d: d, class: 'arc line draw' + (n.id === navCur ? ' on' : ''), style: '--len:' + len + ';--d:' + (0.1 + i * 0.12) + 's' }, navArcs);
      arcLines[n.id] = line;
      var cw = Math.ceil(ctx.measureText(n.t).width + chH + 24);
      xx = Math.max(xx, cw / 2 + 16);
      var gg = el('g', { class: 'chip' + (n.id === navCur ? ' on' : ''), transform: 'translate(' + xx.toFixed(1) + ',' + yy.toFixed(1) + ')', tabindex: 0, role: 'tab', 'aria-selected': n.id === navCur ? 'true' : 'false', 'aria-label': n.t, style: '--d:' + (0.45 + i * 0.12) + 's' }, navChips);
      el('rect', { class: 'bd', x: -cw / 2, y: -chH / 2, width: cw, height: chH, rx: chH / 2 }, gg);
      el('circle', { cx: -cw / 2 + chH / 2, cy: 0, r: 3.8 }, gg);
      var tx = el('text', { x: -cw / 2 + chH / 2 + 12, y: 0.5, 'dominant-baseline': 'central', 'font-size': cf }, gg); tx.textContent = n.t;
      gg.addEventListener('click', function () { showSection(n.id, true); });
      gg.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showSection(n.id, true); }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); var j = (i + (e.key === 'ArrowDown' ? 1 : NAV.length - 1)) % NAV.length; chips[NAV[j].id].focus(); }
      });
      chips[n.id] = gg;
      maxRight = Math.max(maxRight, xx + cw / 2);
    });

    if (!nr) {
      var pl = Math.round(maxRight + 64), pw = Math.round(Math.min(700, w - pl - 56));
      navPanel.style.setProperty('--pl', pl + 'px'); navPanel.style.setProperty('--pw', pw + 'px');
    }
  }

  function showSection(id, animate) {
    navCur = id;
    NAV.forEach(function (n) {
      var on = n.id === id;
      if (chips[n.id]) { chips[n.id].classList.toggle('on', on); chips[n.id].setAttribute('aria-selected', on ? 'true' : 'false'); }
      if (arcLines[n.id]) arcLines[n.id].classList.toggle('on', on);
    });
    clear(navPanel);
    ({ about: renderAbout, approach: renderApproach, faq: renderFaq, contact: renderContact })[id]();
    if (animate) { navPanel.classList.remove('swap'); void navPanel.offsetWidth; navPanel.classList.add('swap'); }
  }

  function renderAbout() {
    navPanel.appendChild(h('p', 'eyebrow', 'Business Engineers Azerbaijan'));
    navPanel.appendChild(h('h2', '', 'Haqqımızda'));
    navPanel.appendChild(h('p', 'lead', 'İnsan, təşkilat, proses, data və texnologiya istiqamətlərində konsaltinq xidmətləri göstəririk. Məqsədimiz şirkətlərin strategiyasını işləyən sistemlərə çevirməkdir.'));
    navPanel.appendChild(h('p', '', D.about));
    var st = h('div', 'stats');
    [['10+', 'il təcrübə'], ['5', 'xidmət istiqaməti'], ['12', 'sektor']].forEach(function (x) { var d = h('div'); d.appendChild(h('b', '', x[0])); d.appendChild(h('span', '', x[1])); st.appendChild(d); });
    navPanel.appendChild(st);
    navPanel.appendChild(h('h3', '', 'Xidmət istiqamətlərimiz'));
    var dl = h('div', 'dirs');
    items.forEach(function (it) { var b = h('button', '', '0' + (it.idx + 1) + '  ' + it.sv.t); b.type = 'button'; b.addEventListener('click', function () { closeNav(); setTimeout(function () { openSvc(it); }, 450); }); dl.appendChild(b); });
    navPanel.appendChild(dl);
    var vm = h('div', 'vm');
    [['Vizyonumuz', D.vision], ['Missiyamız', D.mission]].forEach(function (x) { var c = h('div'); c.appendChild(h('h3', '', x[0])); c.appendChild(h('p', '', x[1])); vm.appendChild(c); });
    navPanel.appendChild(vm);
    navPanel.appendChild(h('h3', '', 'Sektorlar'));
    var t = h('div', 'tags');
    ['Bank', 'FMCG', 'Tikinti', 'Pərakəndə', 'Telekommunikasiya', 'Texnologiya', 'Distribusiya', 'İstehsalat', 'Logistika', 'Tibb', 'Təhsil', 'Xidmət'].forEach(function (x) { t.appendChild(h('span', '', x)); });
    navPanel.appendChild(t);
  }
  function renderApproach() {
    navPanel.appendChild(h('p', 'eyebrow', 'Prinsiplərimiz'));
    navPanel.appendChild(h('h2', '', 'Yanaşmamız'));
    navPanel.appendChild(h('p', '', 'Hər layihəni dörd prinsip istiqamətləndirir: dəyər, fərqlilik, məsuliyyət və insan.'));
    var v = h('div', 'vals');
    D.values.forEach(function (x, i) { var d = h('div'); var b = h('b'); b.appendChild(h('i', '', String(i + 1))); b.appendChild(document.createTextNode(x.t)); d.appendChild(b); d.appendChild(h('p', '', x.d)); v.appendChild(d); });
    navPanel.appendChild(v);
  }
  function renderFaq() {
    navPanel.appendChild(h('p', 'eyebrow', 'Suallar və cavablar'));
    navPanel.appendChild(h('h2', '', 'Tez-tez verilən suallar'));
    D.faq.forEach(function (f, i) {
      var b = h('button', 'fq', f.q); b.type = 'button'; b.setAttribute('aria-expanded', 'false'); b.id = 'fq' + i;
      var a = h('div', 'fa'); a.setAttribute('role', 'region'); a.setAttribute('aria-labelledby', b.id); var inner = h('div'); inner.appendChild(h('p', '', f.a)); a.appendChild(inner);
      b.addEventListener('click', function () { var o = b.getAttribute('aria-expanded') === 'true'; b.setAttribute('aria-expanded', o ? 'false' : 'true'); a.classList.toggle('open', !o); });
      navPanel.appendChild(b); navPanel.appendChild(a);
    });
  }
  function renderContact() {
    navPanel.appendChild(h('p', 'eyebrow', 'Bizimlə əlaqə'));
    navPanel.appendChild(h('h2', '', 'Əlaqə'));
    var ul = h('ul', 'info');
    [['Telefon', '+994 50 444 10 50', 'tel:+994504441050'], ['E-poçt', 'info@bea.az', 'mailto:info@bea.az'], ['Vebsayt', 'www.bea.az', 'https://www.bea.az'], ['Ünvan', 'Bakı, Azərbaycan'], ['İş saatları', 'B.e. – Cümə: 09:00 – 18:00']].forEach(function (x) {
      var li = h('li'); li.appendChild(h('small', '', x[0]));
      if (x[2]) { var a = h('a', '', x[1]); a.href = x[2]; li.appendChild(a); } else li.appendChild(document.createTextNode(x[1]));
      ul.appendChild(li);
    });
    navPanel.appendChild(ul);
    var f = h('form', 'ct'); f.noValidate = true;
    function field(id, label, tag, full) {
      var w = h('div', full ? 'full' : ''); var l = h('label', '', label); l.htmlFor = id; var i = h(tag); i.id = id; i.name = id; if (tag === 'input') i.type = id === 'email' ? 'email' : 'text';
      var er = h('div', 'err'); er.id = id + 'Err'; i.setAttribute('aria-describedby', er.id); w.appendChild(l); w.appendChild(i); w.appendChild(er); f.appendChild(w); return i;
    }
    var fn = field('name', 'Adınız', 'input'), fe = field('email', 'E-poçt', 'input'), fs2 = field('subject', 'Mövzu', 'input', true), fm = field('message', 'Mesajınız', 'textarea', true);
    var row = h('div', 'full'); var btn = h('button', 'cta', 'Göndər'); btn.type = 'submit'; row.appendChild(btn); var ok = h('div', 'ok'); ok.setAttribute('role', 'status'); row.appendChild(ok); f.appendChild(row);
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var bad = false;
      [[fn, 'Adınızı yazın'], [fe, 'Düzgün e-poçt yazın'], [fm, 'Mesajınızı yazın']].forEach(function (x) {
        var v = x[0].value.trim(), er = $('#' + x[0].id + 'Err'), invalid = !v || (x[0] === fe && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v));
        er.textContent = invalid ? x[1] : ''; if (invalid) bad = true;
      });
      if (bad) return;
      var body = fm.value.trim() + '\n\n— ' + fn.value.trim() + ' (' + fe.value.trim() + ')';
      window.location.href = 'mailto:info@bea.az?subject=' + encodeURIComponent(fs2.value.trim() || 'Konsultasiya sorğusu') + '&body=' + encodeURIComponent(body);
      ok.textContent = 'E-poçt proqramınız açılır. Göndərməni orada təsdiqləyin.';
    });
    navPanel.appendChild(f);
  }

  function openNav(id) {
    navOn = true; closeSvc(false);
    layoutNav(); showSection(id || navCur, false);
    scOrbit.classList.remove('on'); scNav.classList.add('on');
    scOrbit.inert = true; scNav.inert = false; scNav.setAttribute('aria-hidden', 'false');
    burger.classList.add('is-open'); burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Menyunu bağla');
    setTimeout(function () { var c = chips[navCur]; if (c) c.focus({ preventScroll: true }); }, 600);
  }
  function closeNav() {
    navOn = false;
    scNav.classList.remove('on'); scOrbit.classList.add('on');
    scNav.inert = true; scOrbit.inert = false; scNav.setAttribute('aria-hidden', 'true');
    burger.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Menyunu aç');
    burger.focus({ preventScroll: true });
  }
  burger.addEventListener('click', function () { navOn ? closeNav() : openNav(); });
  $('#back').addEventListener('click', closeNav);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (panel.classList.contains('open')) closeSvc(true); else if (navOn) closeNav();
  });

  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { layout(); if (navOn) { layoutNav(); showSection(navCur, false); } }, 120); });

  scNav.inert = true;
  layout();
  requestAnimationFrame(frame);
})();
