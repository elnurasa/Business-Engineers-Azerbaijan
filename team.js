(function () {
  'use strict';
  /* Team scene: each member's portrait gathers from star dust, settles into the real photo,
     holds, then dissolves back into dust and the next member forms. */
  var TEAM = [
    { name: 'Test üzv 1', role: 'Vəzifə', bio: 'Bura üzv haqqında 1–2 cümləlik qısa məlumat gələcək: ixtisası, təcrübəsi və BEA-dakı rolu.', photo: 'assets/team/profile-1.webp' },
    { name: 'Test üzv 2', role: 'Vəzifə', bio: 'Bura üzv haqqında 1–2 cümləlik qısa məlumat gələcək: ixtisası, təcrübəsi və BEA-dakı rolu.', photo: 'assets/team/profile-2.webp' },
    { name: 'Test üzv 3', role: 'Vəzifə', bio: 'Bura üzv haqqında 1–2 cümləlik qısa məlumat gələcək: ixtisası, təcrübəsi və BEA-dakı rolu.', photo: 'assets/team/profile-3.webp' }
  ];
  var GATHER = 1.9, SHOW = 1.0, HOLD = 6.0, MELT = 0.8, SCATTER = 1.2;
  var T_SHOW = GATHER, T_HOLD = T_SHOW + SHOW, T_MELT = T_HOLD + HOLD, T_SCAT = T_MELT + MELT, T_END = T_SCAT + SCATTER;

  function $(s) { return document.querySelector(s); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(v) { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); }
  function rnd(i) { var s = Math.sin(i * 91.7 + 3.1) * 43758.5453; return s - Math.floor(s); }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var scene = $('#scene-team'), cv = $('#teamCv'), g = cv.getContext('2d'), btn = $('#starBtn');
  var info = $('#tmInfo'), nav = $('#tmNav'), scOrbit = $('#scene-orbit');
  var on = false, cur = 0, next = -1, t = 0, last = 0, W = 0, H = 0, dpr = 1, PS = 300, px = 0, py = 0;
  var sky = [], navBtns = [];

  /* per member: a feathered photo canvas at PS size and the dust sampled from it */
  TEAM.forEach(function (m) { m.img = new Image(); m.img.onload = function () { m.ready = true; m.ps = 0; }; m.img.src = m.photo; });

  function prep(m) {
    if (!m.ready || m.ps === PS) return;
    var c = document.createElement('canvas'); c.width = c.height = PS;
    var o = c.getContext('2d'), iw = m.img.naturalWidth, ih = m.img.naturalHeight, s = Math.max(PS / iw, PS / ih);
    /* tall portraits keep the head in frame: crop mostly from the bottom */
    o.drawImage(m.img, (PS - iw * s) / 2, (PS - ih * s) * (ih > iw * 1.1 ? 0.18 : 0.5), iw * s, ih * s);
    o.globalCompositeOperation = 'destination-in';
    var gr = o.createRadialGradient(PS / 2, PS * 0.46, PS * 0.3, PS / 2, PS * 0.5, PS * 0.52);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    o.fillStyle = gr; o.fillRect(0, 0, PS, PS);
    var d = o.getImageData(0, 0, PS, PS).data, step = Math.max(2, Math.round(PS / 120)), pts = [];
    for (var y = 0; y < PS; y += step) for (var x = 0; x < PS; x += step) {
      var k = (y * PS + x) * 4, a = d[k + 3] / 255, r = d[k], gg = d[k + 1], b = d[k + 2], lum = (r * 0.3 + gg * 0.59 + b * 0.11) / 255;
      if (a * (lum + 0.05) < 0.07) continue;
      /* photo colour pulled toward the site's lavender so the dust belongs to the cosmos */
      pts.push({ x: x - PS / 2, y: y - PS / 2, r: (r * 0.55 + 205 * 0.45) | 0, g: (gg * 0.55 + 165 * 0.45) | 0, b: (b * 0.45 + 255 * 0.55) | 0, a: Math.min(1, a * (0.35 + lum * 1.3)) });
    }
    m.cv = c; m.pts = pts; m.ps = PS;
  }

  function layout() {
    dpr = Math.min(2, window.devicePixelRatio || 1); W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    var wide = W >= 900 && W > H * 1.05, short = H < 500;
    if (wide || short) {
      PS = Math.round(Math.min(H * (short ? 0.7 : 0.62), W * 0.36, 520));
      px = W * (short ? 0.3 : 0.36); py = H * 0.5 + (short ? 10 : 0);
      info.className = 'tm-info side';
      info.style.left = Math.round(px + PS / 2 + Math.min(56, W * 0.04)) + 'px';
      info.style.top = Math.round(py) + 'px'; info.style.width = Math.round(Math.min(440, W - (px + PS / 2) - 80)) + 'px';
    } else {
      PS = Math.round(Math.min(W * 0.8, H * 0.44, 440));
      px = W / 2; py = (W >= 720 ? 120 : 88) + PS / 2;
      info.className = 'tm-info below';
      info.style.left = '50%'; info.style.top = Math.round(py + PS / 2 + 10) + 'px'; info.style.width = Math.round(Math.min(W - 40, 520)) + 'px';
    }
    sky = [];
    var n = Math.round(W * H / 5200);
    for (var i = 0; i < n; i++) sky.push([rnd(i) * W, rnd(i + 0.37) * H, rnd(i + 0.71)]);
    TEAM.forEach(function (m) { m.ps = 0; });
  }

  function fillInfo(i) {
    var m = TEAM[i];
    $('#tmName').textContent = m.name; $('#tmRole').textContent = m.role; $('#tmBio').textContent = m.bio;
    navBtns.forEach(function (b, j) { b.classList.toggle('on', j === i); b.setAttribute('aria-selected', j === i ? 'true' : 'false'); });
  }

  function buildNav() {
    TEAM.forEach(function (m, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'tm-dot'; b.setAttribute('role', 'tab');
      var s = document.createElement('i'); s.setAttribute('aria-hidden', 'true'); b.appendChild(s);
      b.appendChild(document.createTextNode(m.name));
      b.addEventListener('click', function () { go(i); });
      nav.appendChild(b); navBtns.push(b);
    });
    if (TEAM.length < 2) nav.hidden = true;
  }

  /* jump: dissolve the current portrait first, then form the chosen one */
  function go(i) {
    if (i === cur && next < 0) return;
    next = i;
    if (t < T_MELT) t = t < T_SHOW ? T_SCAT + (T_END - T_SCAT) * (1 - t / T_SHOW) : T_MELT;
  }

  function drawSky() {
    g.clearRect(0, 0, W, H);
    for (var i = 0; i < sky.length; i++) {
      var s = sky[i]; g.fillStyle = 'rgba(232,218,255,' + (0.12 + 0.4 * s[2] * (0.6 + 0.4 * Math.sin(t * 1.1 + i))).toFixed(3) + ')';
      g.fillRect(s[0], s[1], s[2] > 0.85 ? 2 : 1.3, s[2] > 0.85 ? 2 : 1.3);
    }
  }

  function drawMember(m) {
    prep(m); if (!m.pts) return;
    var gather = t < T_SCAT ? ease(t / GATHER) : 1 - ease((t - T_SCAT) / SCATTER);
    var photo = t < T_SHOW ? 0 : t < T_HOLD ? ease((t - T_SHOW) / SHOW) : t < T_MELT ? 1 : t < T_SCAT ? 1 - ease((t - T_MELT) / MELT) : 0;
    if (reduce.matches) { gather = 1; photo = 1; }
    /* soft halo behind the portrait */
    var hg = g.createRadialGradient(px, py, PS * 0.1, px, py, PS * 0.75);
    hg.addColorStop(0, 'rgba(150,90,240,' + (0.22 * gather) + ')'); hg.addColorStop(1, 'rgba(90,40,200,0)');
    g.fillStyle = hg; g.fillRect(px - PS, py - PS, PS * 2, PS * 2);
    if (photo < 1) {
      g.globalCompositeOperation = 'lighter';
      var pts = m.pts, sz = Math.max(1.4, PS / 210), fade = 1 - photo * 0.92;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i], q = rnd(i), q2 = rnd(i + 0.5), lag = clamp(gather * 1.35 - q * 0.35, 0, 1), e = lag * lag * (3 - 2 * lag);
        var sx = W * q + Math.sin(t * 0.3 + i) * 14, sy = H * q2 + Math.cos(t * 0.25 + i) * 14;
        var tx = px + p.x + Math.sin(t * 1.7 + i) * 0.9 * (1 - photo), ty = py + p.y + Math.cos(t * 1.5 + i) * 0.9 * (1 - photo);
        g.fillStyle = 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + (p.a * (0.25 + 0.75 * e) * fade).toFixed(3) + ')';
        g.fillRect(sx + (tx - sx) * e, sy + (ty - sy) * e, sz, sz);
      }
      g.globalCompositeOperation = 'source-over';
    }
    /* profiles are transparent cut-outs, so the photo sits straight on the night sky */
    if (photo > 0) { g.globalAlpha = photo; g.drawImage(m.cv, px - PS / 2, py - PS / 2, PS, PS); g.globalAlpha = 1; }
    info.classList.toggle('show', t > T_SHOW - 0.3 && t < T_MELT + 0.2);
  }

  function frame(now) {
    if (!on) return;
    var dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (window.innerWidth !== W || window.innerHeight !== H) layout();
    t += dt;
    var hold = TEAM.length < 2 && next < 0;
    if (hold && t > T_MELT) t = T_MELT - 0.001;
    if (t >= T_END) { t = 0; cur = next >= 0 ? next : (cur + 1) % TEAM.length; next = -1; fillInfo(cur); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawSky(); drawMember(TEAM[cur]);
    requestAnimationFrame(frame);
  }

  function open() {
    if (on) return;
    if (window.BEAApp) { window.BEAApp.closeSvc(); window.BEAApp.closeNav(); }
    on = true; t = 0; next = -1; fillInfo(cur); layout();
    scOrbit.classList.remove('on'); scOrbit.inert = true;
    scene.classList.add('on'); scene.inert = false; scene.setAttribute('aria-hidden', 'false');
    btn.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); btn.setAttribute('aria-label', 'Komandanı bağla');
    last = performance.now(); requestAnimationFrame(frame);
  }
  /* silent: the menu scene is taking over, so the orbit stays hidden */
  function close(silent) {
    if (!on) return;
    on = false; info.classList.remove('show');
    scene.classList.remove('on'); scene.inert = true; scene.setAttribute('aria-hidden', 'true');
    btn.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Komandamız');
    if (!silent) { scOrbit.classList.add('on'); scOrbit.inert = false; btn.focus({ preventScroll: true }); }
  }

  btn.addEventListener('click', function () { on ? close() : open(); });
  document.addEventListener('keydown', function (e) {
    if (!on) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') go((cur + 1) % TEAM.length);
    if (e.key === 'ArrowLeft') go((cur + TEAM.length - 1) % TEAM.length);
  });
  var sx0 = null;
  scene.addEventListener('touchstart', function (e) { sx0 = e.touches[0].clientX; }, { passive: true });
  scene.addEventListener('touchend', function (e) {
    if (sx0 === null) return; var dx = e.changedTouches[0].clientX - sx0; sx0 = null;
    if (Math.abs(dx) > 50) go((cur + (dx < 0 ? 1 : TEAM.length - 1)) % TEAM.length);
  });

  buildNav(); scene.inert = true;
  /* review aid: draw member i at time tt of its cycle, synchronously */
  function peek(i, tt) { cur = i; next = -1; t = tt; fillInfo(i); layout(); g.setTransform(dpr, 0, 0, dpr, 0, 0); drawSky(); drawMember(TEAM[i]); }
  window.BEATeam = { on: function () { return on; }, open: open, close: close, peek: peek, state: function () { var m = TEAM[cur]; return { t: t, cur: cur, ready: !!m.ready, pts: m.pts ? m.pts.length : 0, PS: PS, px: px, py: py }; } };
  if (new URLSearchParams(location.search).get('team') !== null) setTimeout(open, 500);
})();
