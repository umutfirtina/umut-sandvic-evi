/* Umut Sandviç Evi — pixel çizimler (karakterler, kedi, sahne, dekor, hava, malzeme ikonları, tezgâh katmanları) */
'use strict';
(() => {
const { ING, KEEPER } = window.GameData;
const W = 320, H = 180;

// ---------- renk yardımcıları ----------
function hex2rgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); }
function lerpC(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; }
function darken(h, k) { const A = hex2rgb(h); return 'rgb(' + A.map(v => Math.max(0, Math.min(255, Math.round(v * k)))).join(',') + ')'; }

let g = null;
function P(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); }

// ---------- karakter ----------
function drawPerson(ctx, x, y, L, frame, sitting, extra) {
  x = Math.round(x); y = Math.round(y);
  const kid = !!L.kid, Ht = kid ? 16 : 20, ox = x - 5, oy = y - Ht + (sitting ? 3 : 0);
  const R = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(ox + a, oy + b, w, h); };
  const legTop = kid ? 12 : 15, bodyTop = kid ? 7 : 8;
  if (!sitting) {
    const lh = Ht - legTop; let l1 = 0, l2 = 0; if (frame === 1) l1 = -1; else if (frame === 3) l2 = -1;
    R(2, legTop, 2, lh + l1, L.pants); R(6, legTop, 2, lh + l2, L.pants);
    R(2, legTop + lh + l1 - 1, 2, 1, '#2a1d17'); R(6, legTop + lh + l2 - 1, 2, 1, '#2a1d17');
  } else R(1, legTop, 8, 2, L.pants);
  if (L.backpack) R(8, bodyTop + 1, 3, 5, L.backpack);
  R(1, bodyTop, 8, legTop - bodyTop, L.shirt);
  const sw = (!sitting && (frame === 1 || frame === 3)) ? 1 : 0;
  R(0, bodyTop + 1, 1, 4 - sw, L.shirt); R(9, bodyTop + 1, 1, 4, L.shirt);
  R(0, bodyTop + 5 - sw, 1, 1, L.skin); R(9, bodyTop + 5, 1, 1, L.skin);
  if (L.tie) { R(3, bodyTop, 4, 1, '#fff'); R(4, bodyTop + 1, 2, legTop - bodyTop - 2, L.tie); }
  if (L.apron) { R(2, bodyTop + 2, 6, legTop - bodyTop, '#fbfbf5'); R(2, bodyTop + 2, 6, 1, '#e0e0d8'); }
  if (L.leather) { R(2, bodyTop + 2, 6, legTop - bodyTop, '#6b4226'); R(3, bodyTop + 3, 1, 1, '#c0c0c0'); }
  if (L.scarfC) { R(2, bodyTop, 6, 2, L.scarfC); R(6, bodyTop + 2, 2, 3, L.scarfC); if (L.scarfC === '#f4f4f4') { R(3, bodyTop, 1, 2, '#2f9a4a'); R(6, bodyTop + 3, 2, 1, '#2f9a4a'); } }
  if (L.backpack) R(2, bodyTop, 1, legTop - bodyTop, darken(L.backpack, .7));
  if (extra === 'cay') { R(10, bodyTop + 3, 2, 3, '#c0392b'); R(10, bodyTop + 3, 2, 1, '#f5e6d0'); }
  // kafa
  R(2, 1, 6, bodyTop - 1, L.skin);
  R(3, 4, 1, 1, '#2a1d17'); R(6, 4, 1, 1, '#2a1d17');
  if (kid) { R(2, 5, 1, 1, '#f39aa0'); R(7, 5, 1, 1, '#f39aa0'); }
  const h = L.hair;
  switch (L.style) {
    case 'short': R(2, 0, 6, 2, h); R(2, 2, 1, 1, h); R(7, 2, 1, 1, h); break;
    case 'messy': R(1, 0, 8, 2, h); R(2, -1, 2, 1, h); R(5, -1, 2, 1, h); R(1, 2, 1, 2, h); R(8, 2, 1, 1, h); break;
    case 'long': R(1, 0, 8, 2, h); R(1, 2, 1, 7, h); R(8, 2, 1, 7, h); break;
    case 'pig': R(2, 0, 6, 2, h); R(0, 2, 2, 3, h); R(8, 2, 2, 3, h); R(1, 2, 1, 1, '#ff5a8a'); R(8, 2, 1, 1, '#ff5a8a'); break;
    case 'scarf': R(1, -1, 8, 3, h); R(1, 2, 1, 6, h); R(8, 2, 1, 6, h); R(1, bodyTop, 8, 2, h); R(3, 0, 1, 1, darken(h, .75)); R(6, 1, 1, 1, darken(h, .75)); break;
    case 'beanie': R(1, -1, 8, 3, L.hat); R(1, 1, 8, 1, darken(L.hat, .7)); R(4, -2, 2, 1, '#fff'); R(1, 2, 1, 2, h); R(8, 2, 1, 2, h); break;
    case 'hat': R(2, -2, 6, 3, L.hat); R(0, 1, 10, 1, L.hat); R(2, 0, 6, 1, '#7a2a2a'); R(2, 2, 1, 1, h); R(7, 2, 1, 1, h); break;
    case 'cap': R(2, -1, 6, 2, L.hat); R(7, 0, 3, 1, darken(L.hat, .8)); R(2, 1, 1, 2, h); break;
    case 'chef': R(2, -3, 6, 4, '#fafafa'); R(1, -4, 8, 2, '#fff'); R(2, 0, 6, 1, '#dcdcdc'); R(2, 1, 1, 1, h); R(7, 1, 1, 1, h); break;
    case 'fes': R(3, -2, 4, 3, '#b01e2a'); R(3, -2, 4, 1, '#c8323e'); R(6, -1, 1, 3, '#1a1a1a'); R(2, 1, 1, 2, h); R(7, 1, 1, 2, h); break;
  }
  if (L.capC) { R(3, -1, 4, 2, L.capC); R(4, -1, 2, 1, '#e23b3b'); }
  if (L.band) R(2, 2, 6, 1, L.band);
  if (L.goggles) { R(2, 0, 6, 1, '#ffb43a'); R(3, 0, 1, 1, '#7ad0ff'); R(6, 0, 1, 1, '#7ad0ff'); }
  if (L.glasses) { R(2, 4, 2, 1, '#333'); R(5, 4, 2, 1, '#333'); R(4, 4, 1, 1, '#333'); R(3, 4, 1, 1, '#bfe3ff'); R(6, 4, 1, 1, '#bfe3ff'); }
  if (L.sunglasses) { R(2, 3, 6, 2, '#111'); R(3, 3, 1, 1, '#555'); }
  if (L.mustache) R(3, 6, 4, 1, L.mustache);
  if (L.beard) { R(2, 6, 6, 2, L.beard); R(3, 8, 4, 1, L.beard); }
}

// ---------- kedi ----------
function drawCat(x, y, dir, state, frame) {
  x = Math.round(x); y = Math.round(y);
  const C = (dx, dy, w, h, c) => { g.fillStyle = c; g.fillRect(dir > 0 ? x + dx : x - dx - w, y + dy, w, h); };
  const o = '#ec9a45', d = '#c46d26', w = '#fff3e0', k = '#2a1d17', pk = '#f08a9a';
  if (state === 'sleep') {
    C(-5, -4, 10, 4, o); C(-3, -4, 1, 2, d); C(0, -4, 1, 2, d); C(-4, -1, 8, 1, '#c98340');
    C(2, -6, 5, 4, o); C(2, -7, 1, 1, o); C(6, -7, 1, 1, o); C(4, -4, 2, 1, k); C(-7, -2, 3, 2, o); C(-7, -2, 1, 1, w);
  } else if (state === 'sit') {
    C(-3, -7, 6, 7, o); C(-1, -5, 3, 4, w); C(-2, -6, 1, 2, d);
    C(-1, -12, 6, 5, o); C(-1, -13, 1, 1, o); C(4, -13, 1, 1, o); C(0, -12, 1, 1, pk); C(3, -12, 1, 1, pk);
    C(1, -10, 1, 1, k); C(3, -10, 1, 1, k); C(2, -9, 1, 1, pk); C(-6, -1, 4, 1, o); C(-6, -2, 1, 1, o); C(0, -1, 1, 1, w); C(2, -1, 1, 1, w);
  } else {
    C(-4, -6, 8, 4, o); C(-2, -6, 1, 2, d); C(0, -6, 1, 2, d); C(-3, -3, 6, 1, w);
    if (frame % 2 === 0) { C(-4, -2, 1, 2, o); C(2, -2, 1, 2, o); C(-2, -2, 1, 2, d); C(3, -2, 1, 2, d); }
    else { C(-3, -2, 1, 2, o); C(3, -2, 1, 2, o); C(-4, -2, 1, 1, d); C(1, -2, 1, 2, d); }
    C(3, -9, 5, 4, o); C(3, -10, 1, 1, o); C(7, -10, 1, 1, o); C(4, -9, 1, 1, pk); C(6, -8, 1, 1, k); C(8, -7, 1, 1, pk);
    const tl = frame % 2; C(-6, -9 + tl, 1, 4 - tl, o); C(-5, -6, 1, 1, o); C(-6, -10 + tl, 1, 1, d);
  }
}

// ---------- sahne ----------
const SKY = [[480, '#a6d6f0'], [720, '#82c4f0'], [960, '#9ccbe8'], [1050, '#f3b56b'], [1140, '#d9776a'], [1200, '#3d3566']];
function skyColor(m, weather) {
  let c = SKY[SKY.length - 1][1];
  for (let i = 0; i < SKY.length - 1; i++) { const [a, ca] = SKY[i], [b, cb] = SKY[i + 1]; if (m <= b) { c = lerpC(ca, cb, Math.max(0, (m - a) / (b - a))); break; } }
  if (['bulutlu', 'yagmurlu', 'karli'].includes(weather)) {
    const A = c.match(/\d+/g).map(Number), gr = weather === 'yagmurlu' ? '#7d8794' : weather === 'karli' ? '#b8c2cc' : '#a3b3c2';
    const B = hex2rgb(gr); c = 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * .65)).join(',') + ')';
  }
  return c;
}
const nightK = m => Math.max(0, Math.min(1, (m - 1040) / 160));
const MTN = [[0, 30], [40, 20], [80, 14], [118, 6], [150, 2], [176, 9], [205, 5], [240, 13], [280, 18], [320, 24]];
function mtnY(x) { for (let i = 0; i < MTN.length - 1; i++) { const [a, ya] = MTN[i], [b, yb] = MTN[i + 1]; if (x <= b) return ya + (yb - ya) * (x - a) / (b - a); } return 24; }

function txt(s, x, y, size, color, font = 'VT323', align = 'center') {
  g.font = `${size}px ${font === 'VT323' ? 'VT323' : '"Pixelify Sans"'}`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y);
}

function drawBackground(st) {
  const m = st.minutes, wx = st.weather;
  g.fillStyle = skyColor(m, wx); g.fillRect(0, 0, W, 112);
  if (!['yagmurlu', 'karli', 'bulutlu'].includes(wx)) {
    const t = (m - 480) / 720, sx = 30 + t * 260, sy = 24 - Math.sin(t * Math.PI) * 20, r = wx === 'sicak' ? 1 : 0;
    g.fillStyle = m > 1050 ? '#ffb36b' : (wx === 'sicak' ? '#fff0a0' : '#fff2b0');
    g.fillRect(sx - 3 - r, sy - 3 - r, 7 + 2 * r, 7 + 2 * r); g.fillRect(sx - 4 - r, sy - 2, 9 + 2 * r, 5); g.fillRect(sx - 2, sy - 4 - r, 5, 9 + 2 * r);
  }
  const mc = m > 1080 ? '#544f78' : '#6e8fb2', snow = m > 1080 ? '#c9c4e0' : '#f4f8fb';
  for (let x = 0; x < W; x++) {
    const y = Math.round(mtnY(x)); P(x, y, 1, 50 - y, mc);
    const sl = Math.round(10 + Math.sin(x * .35) * 1.5 + Math.sin(x * .11) * 1.2 + (wx === 'karli' ? 8 : 0));
    if (y < sl) P(x, y, 1, sl - y, snow);
    if (x % 9 < 2 && y < sl + 5) P(x, Math.max(y, sl), 1, 3, m > 1080 ? '#8f8ab0' : '#a9c0d6');
  }
  // Ulu Cami (çok kubbeli)
  const sil = m > 1080 ? '#4a4566' : '#9cb4c8';
  P(246, 20, 58, 16, sil);
  for (let i = 0; i < 5; i++) { P(248 + i * 11, 17, 9, 3, sil); P(250 + i * 11, 16, 5, 1, sil); P(252 + i * 11, 14, 1, 2, sil); }
  P(243, 4, 3, 32, sil); P(242, 9, 5, 1, sil); P(244, 2, 1, 2, sil); P(305, 6, 3, 30, sil); P(304, 11, 5, 1, sil); P(306, 4, 1, 2, sil);
  // bulutlar
  if (wx !== 'gunesli' && wx !== 'sicak') {
    const cc = wx === 'yagmurlu' ? '#8c96a3' : '#e8eef4', t = performance.now() / 1000;
    for (let i = 0; i < 5; i++) { const cx = ((i * 83 + t * (3 + i)) % 380) - 40, cy = 4 + (i * 7) % 14;
      P(cx, cy + 2, 26, 5, cc); P(cx + 4, cy, 14, 3, cc); P(cx + 14, cy - 1, 8, 2, cc); }
  } else {
    const t = performance.now() / 1000;
    for (let i = 0; i < 2; i++) { const cx = ((i * 160 + t * 2) % 380) - 40; P(cx, 8 + i * 6, 20, 3, '#ffffff'); P(cx + 4, 6 + i * 6, 10, 2, '#ffffff'); }
  }
  // güvercinler
  st.birds.forEach(b => { const f = Math.floor(performance.now() / 250 + b.x) % 2, c = '#6f7686';
    P(b.x, b.y + f, 1, 1, c); P(b.x + 1, b.y + 1 - f, 1, 1, c); P(b.x + 2, b.y + 1, 1, 1, c); P(b.x + 3, b.y + 1 - f, 1, 1, c); P(b.x + 4, b.y + f, 1, 1, c); });
  // komşular
  const lit = m > 1080;
  P(0, 30, 48, 82, '#c98463'); P(0, 30, 48, 3, '#a86a4c');
  P(272, 34, 48, 78, '#8fae9b'); P(272, 34, 48, 3, '#6f8e7b');
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    P(5 + c * 14, 38 + r * 18, 9, 12, (lit && (r + c) % 2 === 0) ? '#ffd77a' : '#5e4a5a'); P(5 + c * 14, 50 + r * 18, 9, 1, '#e8d0b0');
    P(277 + c * 14, 42 + r * 16, 9, 11, (lit && (r + c) % 2 === 1) ? '#ffd77a' : '#4e5e6a'); P(277 + c * 14, 53 + r * 16, 9, 1, '#d8e8d8');
  }
  P(2, 72, 44, 7, '#5a3520'); txt('KESTANE ŞEKERİ', 24, 75.8, 4, '#ffe2a8');
  for (let x = 2; x < 46; x += 4) P(x, 79, 4, 4, ((x - 2) / 4) % 2 ? '#f3efe0' : '#7a3e22');
  P(4, 85, 40, 22, '#d9ecf2'); P(4, 85, 40, 1, '#9cb8c2'); P(4, 95, 40, 1, '#a88a6a'); P(4, 105, 40, 1, '#a88a6a');
  [[7, '#7a3e1a'], [14, '#8a4a22'], [21, '#7a3e1a'], [28, '#f2c14e'], [35, '#8a4a22']].forEach(([x, c], i) => { P(x, 89, 5, 6, '#eef6f8'); P(x + 1, 91, 3, 3, c); P(x, 99, 5, 6, '#eef6f8'); P(x + 1, 101, 3, 3, i % 2 ? '#7a3e1a' : '#c0392b'); });
  P(2, 107, 44, 5, '#6b4a33');
  P(274, 72, 44, 7, '#2f3f6a'); txt('İPEK & HAVLU', 296, 75.8, 4, '#f2e6ff');
  for (let x = 274; x < 318; x += 4) P(x, 79, 4, 4, ((x - 274) / 4) % 2 ? '#f3efe0' : '#7b2d5b');
  P(276, 85, 40, 22, '#e6f0f2');
  [['#e04a3a', 279], ['#f2c14e', 286], ['#3aa88f', 293], ['#7b6bd0', 300], ['#ff8fb1', 307]].forEach(([c, x]) => { P(x, 98, 6, 2, c); P(x, 100, 6, 2, darken(c, .85)); P(x, 102, 6, 2, c); });
  P(282, 86, 1, 10, '#c86bb0'); P(283, 87, 1, 10, '#f2c14e'); P(284, 86, 1, 9, '#c86bb0'); P(298, 86, 10, 1, '#6b4a33'); P(300, 87, 2, 9, '#3aa88f'); P(304, 87, 2, 8, '#e04a3a');
  P(274, 107, 44, 5, '#6b4a33');
}

function drawShop(st) {
  const m = st.minutes, D = st.decor, E = st.equip;
  P(48, 24, 224, 88, '#ecd9b2'); P(48, 24, 224, 2, '#c9ad7f');
  for (let y = 28; y < 110; y += 8) for (let x = 50 + ((y / 8) % 2) * 6; x < 270; x += 12) P(x, y, 1, 1, '#dcc596');
  P(78, 26, 164, 13, '#1f4f7a'); P(78, 26, 164, 1, '#3f7fb0'); P(78, 38, 164, 1, '#123050'); P(80, 28, 160, 9, '#245a8a');
  txt('UMUT SANDVİÇ EVİ', 160, 32.6, 9, '#ffd35c', 'px'); txt('♥', 88, 32.6, 9, '#ff7a6a', 'px'); txt('♥', 232, 32.6, 9, '#ff7a6a', 'px');
  P(52, 30, 22, 6, '#1f4fa0'); P(52, 30, 22, 1, '#fff'); P(52, 35, 22, 1, '#fff'); txt('Ulucami Cd.', 63, 33.1, 3.5, '#fff');
  // iç mekân
  P(76, 48, 168, 48, lerpC('#f4d9a8', '#f7cf8a', nightK(m))); P(76, 80, 168, 16, '#d7e3e0');
  for (let x = 76; x < 244; x += 6) P(x, 80, 1, 16, '#c2d1cd'); for (let y = 86; y < 96; y += 6) P(76, y, 168, 1, '#c2d1cd');
  // Türk bayrağı
  P(84, 51, 1, 20, '#6b4a33'); P(85, 51, 26, 17, '#e30a17');
  g.fillStyle = '#fff'; g.beginPath(); g.arc(94, 59.5, 5, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#e30a17'; g.beginPath(); g.arc(95.4, 59.5, 4, 0, Math.PI * 2); g.fill();
  g.save(); g.translate(101.2, 59.5); g.fillStyle = '#fff'; g.beginPath();
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5, b = a + Math.PI / 5; g.lineTo(Math.cos(a) * 2.6, Math.sin(a) * 2.6); g.lineTo(Math.cos(b) * 1.05, Math.sin(b) * 1.05); }
  g.closePath(); g.fill(); g.restore(); P(85, 67, 26, 1, '#b8000f');
  // Atatürk portresi
  P(207, 51, 20, 24, '#a07818'); P(208, 52, 18, 22, '#d8b23a'); P(210, 54, 14, 18, '#3c4048');
  P(214, 57, 6, 7, '#e6c4a0'); P(214, 56, 6, 2, '#c9c2b6'); P(213, 57, 1, 3, '#c9c2b6'); P(220, 57, 1, 2, '#c9c2b6');
  P(215, 60, 1, 1, '#3a6fb0'); P(218, 60, 1, 1, '#3a6fb0'); P(215, 59, 1, 1, '#7a6a5a'); P(218, 59, 1, 1, '#7a6a5a');
  P(212, 64, 10, 8, '#1e1e22'); P(216, 64, 2, 3, '#f2f2f2'); P(216, 65, 2, 1, '#1e1e22'); P(214, 64, 1, 3, '#2c2c32'); P(219, 64, 1, 3, '#2c2c32');
  // menü panosu
  if (E.has('pano')) { P(128, 49, 66, 30, '#ffd35c'); for (let x = 129; x < 194; x += 4) P(x, 49, 2, 1, (Math.floor(performance.now() / 300) + x) % 8 < 4 ? '#fff6c0' : '#e8a020'); }
  P(130, 51, 62, 26, '#5b3a26'); P(132, 53, 58, 22, '#24392f');
  txt('MENÜ', 161, 57.5, 6, '#f3efe0');
  txt('Tost ........... ₺50', 135, 63, 4.5, '#f3efe0', 'VT323', 'left'); txt('Sandviç ........ ₺70', 135, 67.5, 4.5, '#f3efe0', 'VT323', 'left'); txt('Çay / Ayran .... ₺15', 135, 72, 4.5, '#f3efe0', 'VT323', 'left');
  // kitap rafı
  if (D.has('kitap')) { P(229, 50, 14, 24, '#7a4c2c'); P(230, 51, 12, 22, '#5a3820');
    [[52, ['#c0392b', '#2f6f9e', '#f1c40f', '#27ae60', '#8e44ad', '#e67e22']], [60, ['#2f6f9e', '#e67e22', '#c0392b', '#16a085', '#f1c40f']], [68, ['#8e44ad', '#27ae60', '#c0392b', '#2f6f9e']]].forEach(([y, cs]) => { let x = 231; cs.forEach((c, i) => { const w = i % 3 === 0 ? 2 : 1; if (x + w <= 241) P(x, y + (i % 2), w, 6 - (i % 2), c); x += w + (i % 4 === 3 ? 1 : 0); }); P(230, y + 6, 12, 1, '#7a4c2c'); }); }
  // arka tezgâh
  P(76, 82, 168, 14, '#9b6a43'); P(76, 82, 168, 2, '#b98457');
  P(196, 77, 10, 5, '#e8e8e8'); P(197, 74, 8, 3, '#cfe6f2'); P(199, 73, 4, 1, '#cfe6f2'); P(198, 72, 6, 1, '#c0c0c0');
  [[226, '#c0392b'], [230, '#f1c40f'], [234, '#27ae60'], [238, '#e67e22']].forEach(([x, c]) => { P(x, 76, 3, 6, c); P(x, 75, 3, 1, '#eee'); });
  P(90, 78, 18, 4, '#a8743a'); P(91, 75, 5, 3, '#e0a35a'); P(96, 74, 6, 4, '#d39350'); P(102, 76, 5, 2, '#f0e0c0');
  if (E.has('cay')) { P(186, 72, 7, 10, '#c8a040'); P(187, 70, 5, 2, '#d8b050'); P(188, 69, 3, 1, '#a07818'); P(185, 76, 1, 2, '#6b4a33');
    for (let i = 0; i < 3; i++) { P(207 + i * 4, 78, 2, 4, '#c0392b'); P(207 + i * 4, 78, 2, 1, '#f5e6d0'); } }
  if (D.has('pikap')) { P(139, 78, 16, 4, '#6b3a1e'); P(140, 77, 12, 1, '#222'); P(143, 77, 6, 1, '#d8432f'); P(153, 76, 1, 2, '#c0c0c0');
    if (Math.floor(performance.now() / 500) % 2) txt('♪', 156, 72 - (performance.now() / 300) % 4, 5, '#7a3e22'); }
  // tost makinesi
  const hot = st.toasting > 0, turbo = E.has('turbo');
  P(163, 75, 20, 7, turbo ? '#c0392b' : '#8b8f94'); P(163, 74, 20, 2, turbo ? '#e05a4a' : '#b5b9be'); P(165, 79, 16, 1, '#5e6266');
  P(180, 77, 2, 2, hot ? '#ff4d3d' : '#5a2020'); P(159, 78, 4, 1, '#3a3a3a'); if (turbo) { P(171, 76, 2, 1, '#ffd35c'); P(172, 77, 1, 1, '#ffd35c'); }
  drawPerson(g, 120, 96, KEEPER, hot ? (Math.floor(performance.now() / 200) % 2 ? 1 : 3) : 0, false);
  // ipek perde
  if (D.has('ipek')) { for (let i = 0; i < 6; i++) { P(76 + i, 48, 1, 30 - i * 4, i % 2 ? '#c86bb0' : '#7b2d5b'); P(243 - i, 48, 1, 30 - i * 4, i % 2 ? '#f2c14e' : '#c86bb0'); } P(76, 48, 168, 2, '#7b2d5b'); }
  // tente
  for (let x = 68; x < 252; x += 8) { const w = ((x - 68) / 8) % 2; P(x, 39, 8, 8, w ? '#fff' : '#d8432f'); P(x + 1, 47, 6, 1, w ? '#f0f0f0' : '#c23826'); P(x + 2, 48, 4, 1, w ? '#e6e6e6' : '#b03020'); }
  P(68, 38, 184, 1, '#8a2a1c');
  if (st.weather === 'karli') { P(68, 37, 184, 2, '#ffffff'); P(78, 25, 164, 1, '#ffffff'); }
  // açık/kapalı
  P(55, 52, 1, 6, '#6b4a33'); P(51, 58, 10, 6, st.closing ? '#7a2a2a' : '#3f8f6a'); txt(st.closing ? 'KAPALI' : 'AÇIK', 56, 61.2, 4, '#fff');
  // karagöz perdesi
  if (D.has('karagoz')) { P(49, 68, 24, 20, '#7a4c2c'); P(51, 70, 20, 16, '#fff6dc');
    const b = Math.floor(performance.now() / 400) % 2;
    P(55, 75 - b, 3, 3, '#c0392b'); P(54, 78 - b, 5, 5, '#2f6f9e'); P(55, 74 - b, 3, 1, '#222');
    P(64, 75 + b, 3, 3, '#27ae60'); P(63, 78 + b, 5, 5, '#d8a020'); P(64, 74 + b, 3, 1, '#c0392b'); txt('KARAGÖZ', 61, 89.5, 3.5, '#fff6dc'); }
  // neon
  if (D.has('neon')) { const on = m > 1000 || Math.floor(performance.now() / 700) % 2; const c = on ? '#ff5ab4' : '#a04a7a';
    P(247, 54, 22, 9, '#2a1d2a'); txt('UMUT', 258, 58.8, 6, c, 'px');
    if (on && m > 1000) { g.globalCompositeOperation = 'lighter'; P(246, 53, 24, 11, 'rgba(255,90,180,.18)'); g.globalCompositeOperation = 'source-over'; } }
  // begonvil
  if (D.has('saksi')) { [[50, 74], [246, 272]].forEach(([a, b]) => { for (let x = a; x < b; x += 3) { const y = 40 + ((x * 7) % 9); P(x, y, 2, 2, '#e04a9a'); P(x + 1, y + 3, 1, 3, '#4f9a46'); } }); }
  P(74, 48, 2, 48, '#7a5232'); P(244, 48, 2, 48, '#7a5232');
}

function drawCounterFront(st) {
  P(70, 92, 180, 4, '#c48a55'); P(70, 92, 180, 1, '#dba06a'); P(72, 96, 176, 16, '#8e5b36');
  for (let x = 72; x < 248; x += 12) P(x, 96, 1, 16, '#7a4c2c'); P(72, 96, 176, 1, '#6a3f22');
  if (st.equip.has('tezgah')) { P(204, 90, 30, 2, '#e0b080'); P(204, 89, 30, 1, '#f0c890'); }
  if (st.decor.has('atki')) { for (let x = 140; x < 196; x += 4) P(x, 98, 4, 5, ((x - 140) / 4) % 2 ? '#ffffff' : '#2f9a4a'); for (let x = 140; x < 196; x += 2) P(x, 103, 1, 2, '#2f9a4a'); txt('BURSA', 168, 100.6, 4, '#123'); }
  P(238, 99, 5, 5, '#1f5fbf'); P(239, 100, 3, 3, '#fff'); P(240, 101, 1, 1, '#1f5fbf'); P(240, 97, 1, 2, '#6b4a33');
}

function drawGround(st) {
  const snow = st.weather === 'karli', wet = st.weather === 'yagmurlu';
  P(0, 112, W, 58, snow ? '#d8dde2' : wet ? '#9c978c' : '#bdb6a6');
  const line = snow ? '#c4cad0' : wet ? '#86817a' : '#a8a090';
  for (let y = 112; y < 170; y += 10) P(0, y, W, 1, line);
  for (let y = 112; y < 170; y += 10) for (let x = ((y / 10) % 2) * 10; x < W; x += 20) P(x, y, 1, 10, line);
  if (wet) [[30, 150], [110, 128], [230, 160], [290, 132]].forEach(([x, y]) => { P(x, y, 14, 2, '#7d93a8'); P(x + 2, y, 6, 1, '#a8bccc'); });
  if (snow) for (let i = 0; i < 40; i++) P((i * 53) % W, 114 + (i * 31) % 54, 3, 1, '#ffffff');
  P(0, 168, W, 3, '#8e8778'); P(0, 171, W, 9, wet ? '#3a3a44' : '#4a4a52'); for (let x = 4; x < W; x += 26) P(x, 175, 12, 1, '#e8e2c8');
  [[60, 118], [258, 118]].forEach(([x, y]) => { P(x - 5, y - 1, 11, 8, '#c46a3a'); P(x - 6, y - 1, 13, 2, '#d98050');
    P(x - 4, y - 7, 9, 6, '#4f9a46'); P(x - 5, y - 5, 2, 3, '#3f8a3a'); P(x + 4, y - 6, 2, 3, '#3f8a3a');
    [[-3, -8], [1, -9], [3, -6], [-1, -5]].forEach(([dx, dy]) => P(x + dx, y + dy, 2, 2, st.decor.has('saksi') ? '#e04a9a' : '#e2324a')); });
  if (st.decor.has('kedi')) { P(88, 122, 16, 5, '#c0392b'); P(89, 121, 14, 1, '#e05a4a'); P(90, 123, 12, 2, '#f5d6c0'); }
}

function drawTablesBack(seats) { seats.forEach(s => { P(s.x - 3, s.y - 4, 7, 2, '#7a4c2c'); P(s.x - 3, s.y - 2, 1, 4, '#5a3820'); P(s.x + 3, s.y - 2, 1, 4, '#5a3820'); }); }
function drawTablesFront(tables, seats) {
  tables.forEach(t => {
    P(t - 9, 149, 18, 3, '#d9a066'); P(t - 9, 151, 18, 1, '#a87444'); P(t - 1, 152, 2, 12, '#6b4a33'); P(t - 4, 164, 8, 1, '#6b4a33');
    seats.filter(s => s.t === t && s.occ && s.occ.state === 'eat').forEach(s => { const side = s.x < t ? -1 : 1, fx = t + side * 5;
      P(fx - 2, 147, 5, 2, '#e0a35a'); P(fx - 2, 146, 5, 1, '#f7c93b'); P(t - side - 1, 145, 2, 4, '#c0392b'); P(t - side - 1, 145, 2, 1, '#f5f5f5'); });
  });
}

function drawWeather(st) {
  const t = performance.now() / 1000;
  if (st.weather === 'yagmurlu') { g.fillStyle = 'rgba(200,215,235,.7)';
    for (let i = 0; i < 70; i++) { const x = (i * 47 + t * 40) % W, y = (i * 29 + t * 160) % H; g.fillRect(Math.round(x), Math.round(y), 1, 4); } }
  if (st.weather === 'karli') { g.fillStyle = '#ffffff';
    for (let i = 0; i < 60; i++) { const x = (i * 53 + Math.sin(t + i) * 6 + t * 6) % W, y = (i * 37 + t * 14) % H; g.fillRect(Math.round(x), Math.round(y), 1, 1); } }
  if (st.weather === 'sicak') { g.fillStyle = 'rgba(255,200,80,.06)'; g.fillRect(0, 0, W, H); }
}
function drawNight(st) {
  const nk = nightK(st.minutes); if (nk <= 0) return;
  g.fillStyle = `rgba(25,20,60,${nk * .38})`; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'lighter';
  for (let x = 72; x < 250; x += 10) { g.fillStyle = `rgba(255,200,90,${nk * .25})`; g.fillRect(x - 2, 47, 5, 5); }
  g.fillStyle = `rgba(255,190,90,${nk * .12})`; g.fillRect(76, 48, 168, 48);
  if (st.decor.has('neon')) { g.fillStyle = `rgba(255,90,180,${nk * .2})`; g.fillRect(244, 50, 28, 16); }
  g.globalCompositeOperation = 'source-over'; g.fillStyle = '#ffe28a'; for (let x = 72; x < 250; x += 10) g.fillRect(x, 49, 1, 1);
}

function bubble(x, y, text, bg = '#fff') {
  g.font = '7px VT323'; const w = Math.ceil(g.measureText(text).width) + 6, bx = Math.round(x - w / 2), by = Math.round(y - 11);
  P(bx, by, w, 9, '#2a1d17'); P(bx + 1, by + 1, w - 2, 7, bg); P(Math.round(x) - 1, by + 9, 3, 1, '#2a1d17'); P(Math.round(x), by + 10, 1, 1, '#2a1d17');
  g.fillStyle = '#2a1d17'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x, by + 4.8);
}

// ---------- malzeme ikonları ----------
function icon(id) {
  const c = document.createElement('canvas'); c.width = 32; c.height = 32; const x = c.getContext('2d'); x.scale(2, 2);
  const R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  const it = ING[id];
  if (it.bread) {
    const b = it.bread;
    switch (b.style) {
      case 'slice': R(2, 2, 12, 12, b.crust); R(3, 4, 10, 9, b.inner); break;
      case 'baget': R(0, 7, 16, 4, b.crust); R(1, 6, 14, 1, b.crust); [3, 7, 11].forEach(a => R(a, 7, 2, 1, b.inner)); break;
      case 'seed': R(3, 3, 10, 10, b.crust); x.clearRect(6, 6, 4, 4); [[4, 4], [8, 3], [11, 5], [12, 9], [9, 12], [4, 11], [3, 8]].forEach(([a, bb]) => R(a, bb, 1, 1, '#fbefd0')); break;
      case 'flour': R(1, 6, 14, 6, b.crust); R(2, 5, 12, 1, b.crust); [[3, 7], [7, 6], [11, 7], [5, 9], [10, 10]].forEach(([a, bb]) => R(a, bb, 2, 1, '#fbf6ea')); break;
      case 'grain': R(2, 4, 12, 9, b.crust); R(3, 3, 10, 1, b.crust); [[4, 6], [8, 5], [11, 8], [6, 10], [10, 11]].forEach(([a, bb]) => R(a, bb, 1, 1, '#e8d0a0')); break;
      case 'herb': R(1, 5, 14, 7, b.crust); R(2, 4, 12, 1, b.crust); [[3, 6], [7, 7], [11, 6]].forEach(([a, bb]) => R(a, bb, 1, 1, '#4f9a46')); [[5, 9], [10, 9]].forEach(([a, bb]) => R(a, bb, 2, 1, '#f7c93b')); break;
      case 'wrap': R(1, 4, 14, 9, b.crust); R(2, 5, 12, 7, b.inner); [[4, 6], [9, 9], [11, 6]].forEach(([a, bb]) => R(a, bb, 1, 1, '#c8a060')); break;
      default: R(2, 4, 12, 9, b.crust); R(3, 3, 10, 1, b.crust); R(4, 6, 8, 6, b.inner);
    }
    return c;
  }
  const c1 = it.c1, c2 = it.c2;
  switch (it.shape) {
    case 'rounds': R(3, 3, 10, 10, c1); R(2, 5, 12, 6, c1); R(5, 6, 2, 1, c2); R(9, 9, 2, 1, c2); R(7, 4, 1, 1, c2); break;
    case 'fold': R(2, 4, 12, 4, c1); R(3, 8, 11, 4, darken(c1, .92)); R(2, 4, 12, 1, c2); R(3, 8, 11, 1, c2); break;
    case 'strips': for (let i = 0; i < 3; i++) { R(2, 3 + i * 4, 12, 3, c1); R(4 + i * 2, 3 + i * 4, 1, 3, c2); R(9, 3 + i * 4, 1, 3, c2); } break;
    case 'egg': R(3, 3, 10, 10, c1); R(4, 2, 8, 1, c1); R(6, 6, 4, 4, c2); break;
    case 'sheet': R(2, 4, 12, 9, c1); R(2, 4, 12, 2, c2); R(5, 8, 2, 2, darken(c1, .9)); break;
    case 'chunks': [[2, 5, 5, 4], [8, 4, 6, 5], [4, 10, 7, 4]].forEach(([a, b, w, h]) => { R(a, b, w, h, c1); R(a, b, w, 1, c2); }); break;
    case 'balls': [[2, 7], [8, 7], [5, 3]].forEach(([a, b]) => { R(a, b, 6, 5, c1); R(a + 1, b - 1, 4, 1, c1); R(a + 1, b, 2, 1, c2); }); break;
    case 'dots': for (let i = 0; i < 14; i++) R(3 + (i * 5) % 10, 5 + (i * 3) % 8, 2, 2, i % 3 ? c1 : c2); break;
    case 'leaf': R(2, 6, 12, 6, c1); R(4, 4, 8, 2, c2); R(3, 8, 10, 1, darken(c1, .8)); R(7, 5, 1, 7, '#c8f0a8'); break;
    case 'rings': [[2, 4], [7, 8]].forEach(([a, b]) => { R(a, b, 7, 5, c1); R(a + 2, b + 1, 3, 3, c2); }); break;
    case 'drizzle': R(5, 4, 6, 10, c1); R(6, 2, 4, 2, '#f5f5f5'); R(7, 1, 2, 1, '#f5f5f5'); R(6, 7, 4, 3, '#ffffff'); R(7, 8, 2, 1, c2); break;
    case 'spread': R(4, 5, 8, 9, c1); R(3, 3, 10, 2, '#c48a55'); R(5, 6, 2, 6, c2); break;
  }
  return c;
}

// ---------- tezgâh: sandviç yığını ----------
function drawStack(cv, sw, scale) {
  const sg = cv.getContext('2d'); sg.imageSmoothingEnabled = false; sg.setTransform(scale, 0, 0, scale, 0, 0);
  const SP = (x, y, w, h, c) => { sg.fillStyle = c; sg.fillRect(Math.round(x), Math.round(y), w, h); };
  SP(0, 0, 120, 74, '#e8cf9c'); for (let y = 6; y < 58; y += 10) SP(0, y, 120, 1, '#dcc08a');
  SP(0, 62, 120, 12, '#c48a55'); SP(0, 62, 120, 1, '#dba06a'); for (let x = 0; x < 120; x += 20) SP(x, 63, 1, 11, '#a87444');
  SP(10, 60, 100, 3, '#fff'); SP(14, 63, 92, 2, '#e2dccd'); SP(10, 59, 100, 1, '#f0ece2');
  if (!sw.bread) { sg.fillStyle = '#8a6a4a'; sg.font = '8px VT323'; sg.textAlign = 'center'; sg.textBaseline = 'middle'; sg.fillText('önce ekmek seç…', 60, 38); return; }
  const b = ING[sw.bread].bread, tk = sw.toasted ? .78 : 1, crust = darken(b.crust, tk), inner = darken(b.inner, sw.toasted ? .88 : 1), cx = 60, w = b.w;
  let y = 59;
  const bh = Math.max(2, Math.round(6 * b.hk));
  if (b.style === 'slice') { SP(cx - w / 2, y - bh, w, bh, inner); SP(cx - w / 2, y - bh, 1, bh, crust); SP(cx + w / 2 - 1, y - bh, 1, bh, crust); SP(cx - w / 2, y - 1, w, 1, crust); }
  else { SP(cx - w / 2 + 1, y - bh, w - 2, bh, crust); SP(cx - w / 2, y - bh + 1, w, Math.max(1, bh - 2), crust); SP(cx - w / 2 + 2, y - bh, w - 4, Math.min(2, bh), inner); }
  y -= bh;
  // katmanların sıkışması: çok malzemede inceltilir
  const squash = sw.fills.length > 6 ? .75 : 1;
  sw.fills.forEach((f, idx) => { y -= layer(SP, f, cx, y, w - 4, sw.toasted, idx) * squash; });
  const th = Math.max(3, Math.round(8 * b.hk));
  if (b.style === 'slice') { SP(cx - w / 2, y - th, w, th, inner); SP(cx - w / 2, y - th, w, 1, crust); SP(cx - w / 2, y - th, 1, th, crust); SP(cx + w / 2 - 1, y - th, 1, th, crust); SP(cx - w / 2 + 1, y - th - 1, w - 2, 1, crust); }
  else if (b.style === 'wrap') { SP(cx - w / 2, y - th, w, th, crust); SP(cx - w / 2 + 2, y - th + 1, w - 4, 1, inner); SP(cx - w / 2 - 2, y - th + 1, 3, th + 2, crust); SP(cx + w / 2 - 1, y - th + 1, 3, th + 2, crust); }
  else { SP(cx - w / 2 + 1, y - 3, w - 2, 3, inner); SP(cx - w / 2, y - th, w, th - 3, crust); SP(cx - w / 2 + 3, y - th - 2, w - 6, 2, crust); SP(cx - w / 2 + 3, y - th - 2, w - 6, 1, darken(b.crust, Math.min(1.12, tk * 1.1))); }
  const top = y - th;
  const dots = (pts, col, ww = 2) => pts.forEach(([dx, dy]) => SP(cx + dx, top + dy, ww, 1, col));
  if (b.style === 'seed') dots([[-18, 1], [-9, 2], [0, 1], [8, 2], [16, 1], [-14, 3], [4, 3], [13, 1]], '#fbefd0');
  if (b.style === 'flour') dots([[-24, 2], [-12, 1], [2, 2], [14, 1], [24, 2], [-4, 0]], '#fbf6ea', 3);
  if (b.style === 'grain') dots([[-20, 2], [-10, 1], [-2, 3], [6, 1], [15, 2], [22, 3]], '#d8b98e', 1);
  if (b.style === 'herb') { dots([[-20, 2], [-6, 1], [8, 2], [20, 1]], '#4f9a46', 1); dots([[-14, 1], [2, 2], [14, 2]], '#f7c93b'); }
  if (b.style === 'baget') for (let x = cx - w / 2 + 8; x < cx + w / 2 - 8; x += 12) { SP(x, top + 1, 5, 1, darken(b.crust, .7)); SP(x + 4, top, 3, 1, b.inner); }
  if (sw.toasted) for (let x = cx - w / 2 + 6; x < cx + w / 2 - 4; x += 8) SP(x, top + 1, 2, Math.max(1, th - 2), 'rgba(70,30,10,.5)');
  return top;
}
function layer(SP, f, cx, y, w, toasted, idx) {
  const it = ING[f], c1 = it.c1, c2 = it.c2, L = cx - w / 2, Rr = cx + w / 2, off = (idx * 3) % 5;
  switch (it.shape) {
    case 'rounds': for (let x = L + off - 2; x < Rr - 7; x += 9) { SP(x, y - 3, 9, 3, c1); SP(x + 1, y - 3, 7, 1, darken(c1, 1.1)); SP(x + 2, y - 2, 1, 1, c2); SP(x + 5, y - 2, 1, 1, c2); } return 3;
    case 'fold': for (let x = L - 1 + off; x < Rr - 6; x += 7) { SP(x, y - 3, 8, 3, c1); SP(x, y - 3, 8, 1, c2); SP(x + 7, y - 2, 1, 2, darken(c1, .85)); } return 3;
    case 'strips': for (let x = L + 1 + off; x < Rr - 8; x += 10) { SP(x, y - 4, 9, 4, c1); SP(x + 2, y - 4, 1, 4, c2); SP(x + 6, y - 4, 1, 4, c2); } return 4;
    case 'egg': for (let x = L + 2 + off; x < Rr - 8; x += 11) { SP(x, y - 4, 9, 4, c1); SP(x + 3, y - 3, 3, 2, c2); } return 4;
    case 'sheet': SP(L - 1, y - 2, w + 2, 2, c1); SP(L - 1, y - 2, w + 2, 1, c2);
      if (toasted && it.tags.includes('eriyen')) [L + 3, cx - 4, Rr - 6].forEach(x => SP(x, y, 2, 2, c1)); return 2;
    case 'chunks': for (let x = L + 1 + off; x < Rr - 4; x += 6) { const hh = 2 + ((x | 0) % 2); SP(x, y - hh, 5, hh, c1); SP(x, y - hh, 5, 1, c2); } return 3;
    case 'balls': for (let x = L + 2 + off; x < Rr - 5; x += 7) { SP(x, y - 4, 6, 4, c1); SP(x + 1, y - 5, 4, 1, c1); SP(x + 1, y - 4, 2, 1, c2); } return 5;
    case 'dots': for (let i = 0; i < w / 2; i++) SP(L + (i * 7) % w, y - 1 - (i % 2), 2, 1, i % 3 ? c1 : c2); return 2;
    case 'leaf': SP(L - 3, y - 2, w + 6, 2, c1); for (let x = L - 3; x < Rr + 3; x += 4) SP(x, y - 3, 2, 1, c2); SP(L - 3, y, 2, 1, c1); SP(Rr + 1, y, 2, 1, c1); return 3;
    case 'rings': for (let x = L + off; x < Rr - 6; x += 8) { SP(x, y - 3, 7, 3, c1); SP(x + 2, y - 2, 3, 1, c2); } return 3;
    case 'drizzle': for (let x = L; x < Rr; x += 2) SP(x, y - 1 - ((x - L) % 6 < 3 ? 1 : 0), 2, 1, c1); return 1.5;
    case 'spread': SP(L, y - 2, w, 2, c1); SP(L, y - 2, w, 1, c2); SP(L, y, 1, 3, c1); SP(Rr - 1, y, 1, 2, c1); return 2;
  }
  return 2;
}

window.Art = {
  setCtx: ctx => { g = ctx; }, P, txt, W, H, darken, lerpC, nightK,
  drawPerson, drawCat, drawBackground, drawShop, drawCounterFront, drawGround, drawTablesBack, drawTablesFront,
  drawWeather, drawNight, bubble, icon, drawStack,
};
})();
