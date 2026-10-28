/* Umut Sandviç Evi — oyun döngüsü, müşteriler, tezgâh, dükkân, defter, kayıt */
'use strict';
(() => {
const { CATS, ING, H, MOODS, CHARS, RECIPES, WEATHER, EQUIP, DECOR } = window.GameData;
const A = window.Art, Save = window.Save;
const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
function wpick(entries) { // [[val, w], ...]
  const tot = entries.reduce((s, e) => s + e[1], 0); let r = Math.random() * tot;
  for (const [v, w] of entries) { if ((r -= w) <= 0) return v; } return entries[entries.length - 1][0];
}
const short = name => name.split(' ').slice(-2).join(' ');

// ================= SABİTLER =================
const W = 320, H2 = 180, MIN_PER_SEC = 4, OPEN = 480, CLOSE = 1200, LAST_SPAWN = 1160;
const LANE = 142, SLOT_Y = 124, SLOT_X = [146, 170, 194];

// ================= KALICI DURUM (kaydedilen) =================
function newProfile() {
  return { v: 1, day: 1, money: 0, rep: 3,
    unlocked: Object.keys(ING).filter(k => ING[k].cost === 0),
    equip: [], decor: [], book: {}, guide: {}, sigs: [],
    stats: { served: 0, stars3: 0, pets: 0, earned: 0 }, savedAt: 0 };
}
let P = newProfile();
const unl = () => new Set(P.unlocked);

// ================= GÜNLÜK DURUM =================
const S = { running: false, minutes: OPEN, speed: 1, closing: false, weather: 'gunesli',
  customers: [], nextSpawn: OPEN + 6, lastChar: null, criticCame: false, uid: 0, kitchen: false,
  sw: { bread: null, fills: [], toasted: false, toasting: 0 }, particles: [], birds: [{ x: 40, y: 9, v: 9 }, { x: 200, y: 5, v: 6 }, { x: 120, y: 14, v: 7 }],
  tables: [], seats: [], day: { money: 0, served: 0, stars: 0, lost: 0, pets: 0, learned: 0, best: null, creations: [] },
  catTab: 'ekmek', ended: false };
const cat = { x: 110, y: 150, dir: 1, state: 'walk', floor: 'ground', tx: 120, ty: 150, t: 2, frame: 0, ft: 0, jump: null, toBed: false };

const cv = $('scene'), g = cv.getContext('2d'); g.imageSmoothingEnabled = false; A.setCtx(g);

// ================= SES =================
let AC = null;
function beep(f, d = .08, type = 'square', v = .05, f2 = null) { if (!AC) return; try {
  const o = AC.createOscillator(), gn = AC.createGain(); o.type = type; o.frequency.value = f;
  if (f2) o.frequency.linearRampToValueAtTime(f2, AC.currentTime + d);
  gn.gain.value = v; gn.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + d);
  o.connect(gn).connect(AC.destination); o.start(); o.stop(AC.currentTime + d); } catch (e) {} }
const sfx = { click: () => beep(660, .05), coin: () => { beep(988, .08); setTimeout(() => beep(1319, .15), 80); },
  bad: () => beep(220, .25, 'sawtooth', .04, 140), meow: () => beep(820, .3, 'triangle', .07, 480),
  bell: () => { beep(1568, .12, 'sine', .06); setTimeout(() => beep(1175, .2, 'sine', .05), 110); },
  page: () => beep(520, .06, 'triangle', .05, 700), buy: () => { beep(784, .07); setTimeout(() => beep(1046, .07), 70); setTimeout(() => beep(1568, .15), 140); } };
function initAudio() { if (!AC) try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }

let toastT = null;
function toast(msg, ms = 2000) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms); }
function particle(x, y, text, color = '#ffd35c', life = 1.6) { S.particles.push({ x, y, text, color, t: 0, life }); }
const has = (k, set) => P[set].includes(k);

// ================= SANDVİÇ HESAPLARI =================
function sandwichSummary() {
  const sw = S.sw; const s = { bread: sw.bread, fills: sw.fills.slice(), toasted: sw.toasted };
  s.price = (sw.bread ? ING[sw.bread].price : 0) + sw.fills.reduce((t, f) => t + ING[f].price, 0) + (sw.toasted ? 5 : 0) + 15;
  return s;
}
const maxFills = () => has('tezgah', 'equip') ? 9 : 6;
const toastTime = () => has('turbo', 'equip') ? .8 : 1.6;

// ================= MÜŞTERİ SEÇİMİ =================
function availableRecipes() {
  const u = unl();
  const base = Object.entries(RECIPES).filter(([, r]) => (!r.bread || u.has(r.bread)) && r.items.every(i => u.has(i))).map(([id, r]) => ({ id, ...r }));
  return base;
}
function charWeights() {
  const present = new Set(S.customers.map(c => c.cid));
  const wx = WEATHER[S.weather];
  return Object.keys(CHARS).filter(k => !CHARS[k].critic && k !== S.lastChar && !present.has(k)).map(k => {
    let w = 1;
    P.decor.forEach(d => { if (DECOR[d].chars && DECOR[d].chars[k]) w *= DECOR[d].chars[k]; });
    if (wx.charBoost && wx.charBoost[k]) w *= wx.charBoost[k];
    return [k, w];
  });
}
function moodFor(ch) {
  const wx = WEATHER[S.weather];
  const ok = ch.moods.filter(m => { const M = MOODS[m];
    if (M.before && S.minutes > M.before) return false;
    if (M.after && S.minutes < M.after) return false;
    if (M.onlyWeather && !M.onlyWeather.includes(S.weather)) return false;
    if (M.notWeather && M.notWeather.includes(S.weather)) return false;
    if (M.kidOnly && !ch.kid) return false;
    return true; });
  // hava ve dekor gerektirmeyen bazı genel durumlar da gelebilir
  ['yagmur', 'bunalmis'].forEach(m => { const M = MOODS[m]; if (M.onlyWeather.includes(S.weather) && !ok.includes(m) && !ch.kid) ok.push(m); });
  if (!ok.length) return 'ac';
  return wpick(ok.map(m => { let w = 1;
    if (wx.boost && wx.boost[m]) w *= wx.boost[m];
    P.decor.forEach(d => { if (DECOR[d].moods && DECOR[d].moods[m]) w *= DECOR[d].moods[m]; });
    return [m, w]; }));
}
function spawn() {
  let cid;
  if (!S.criticCame && S.minutes > 660 && Math.random() < .12 + P.rep * .03) { cid = 'gizemli'; S.criticCame = true; }
  else { const ws = charWeights(); if (!ws.length) return; cid = wpick(ws); }
  S.lastChar = cid;
  const ch = CHARS[cid];
  const b = P.book[cid] || (P.book[cid] = { visits: 0, likes: [], dislikes: [] });
  b.visits++;
  const order = { kind: 'mood', mood: null, recipe: null };
  const recs = availableRecipes();
  const pMenu = (has('pano', 'equip') ? .38 : .25);
  if (!ch.critic && recs.length && Math.random() < pMenu) {
    order.kind = 'menu';
    if (P.sigs.length && Math.random() < .4) { order.recipe = pick(P.sigs); order.sig = true; }
    else {
      let pool = recs; if (ch.veg) pool = pool.filter(r => !r.items.some(i => ING[i].tags.includes('et') || ING[i].tags.includes('balik')));
      if (ch.kid) pool = pool.filter(r => !r.items.some(i => ch.dislikes.includes(i)));
      if (!pool.length) order.kind = 'mood'; else order.recipe = pick(pool);
    }
  }
  let hint = '';
  const greet = ch.greet && Math.random() < .5 ? pick(ch.greet) + ' ' : '';
  if (order.kind === 'menu') {
    const nm = order.recipe.name;
    hint = greet + (order.sig ? pick([`Herkes sizin “${nm}”i konuşuyor, ondan bir tane!`, `Arkadaşım “${nm}” diye bir şey anlattı, bayılmış. Ondan alayım!`])
      : pick([`Bir “${nm}” lütfen!`, `Menüdeki “${nm}”ten bir tane alabilir miyim?`, `“${nm}” var mı? Ondan alayım.`]));
  } else {
    order.mood = moodFor(ch);
    hint = greet + pick(MOODS[order.mood].lines);
    if (b.visits === 1 && ch.quirk && Math.random() < .35) hint += ' ' + ch.quirk;
    else if (b.visits > 2 && Math.random() < .3) hint += ' ' + pick(['Beni artık tanıyorsun 😉', 'Her zamanki özeni bekliyorum!', 'Geçen sefer güzeldi bu arada.']);
  }
  const moodPat = order.kind === 'mood' ? MOODS[order.mood].pat : 1;
  const pat = ch.base * moodPat * (has('cay', 'equip') ? 1.3 : 1) * (has('pikap', 'decor') ? 1.1 : 1);
  S.customers.push({ id: ++S.uid, cid, ch, order, look: ch.look, x: 332, y: LANE, state: 'queue', arrived: false,
    hint, patience: pat, maxP: pat, frame: 0, wt: 0, moving: false, path: null, bubble: null, eat: 0 });
}

// ================= DEĞERLENDİRME =================
function evaluate(c, s) {
  const ch = c.ch, o = c.order;
  const inS = i => s.fills.includes(i) || s.bread === i;
  if (!s.fills.length) return { stars: 0, line: 'Bu… sadece ekmek mi?', liked: [], disliked: [], pts: 0 };
  const liked = ch.likes.filter(inS), disliked = ch.dislikes.filter(inS);
  if (o.kind === 'menu') {
    const r = o.recipe, req = r.items;
    const missing = req.filter(i => !s.fills.includes(i));
    const extras = s.fills.filter(i => !req.includes(i));
    const toastBad = !!r.toast !== !!s.toasted, breadBad = r.bread && r.bread !== s.bread;
    let stars = 3 - missing.length - (toastBad ? 1 : 0) - (breadBad ? 1 : 0) - (extras.length >= 2 ? 1 : 0) - (disliked.length ? 1 : 0);
    stars = Math.max(0, Math.min(3, stars));
    let line;
    if (stars === 3) line = pick(['Tam menüdeki gibi, harika!', 'İşte bu! Aynen bekledim.', 'Eline sağlık usta!']);
    else if (missing.length) line = `${ING[missing[0]].name} eksik galiba…`;
    else if (breadBad) line = `Bu ${ING[r.bread].name.toLowerCase()} ile yapılmıyor muydu?`;
    else if (toastBad) line = r.toast ? 'Bunun sıcak olması gerekiyordu.' : 'Bunu neden tostladın ki?';
    else if (disliked.length) line = `${ING[disliked[0]].name}?! Ben onu sevmem ki…`;
    else line = 'Biraz fazla şey koymuşsun ama olsun.';
    return { stars, line, liked: [], disliked, pts: stars >= 2 ? 2 : 0, menu: true };
  }
  const m = MOODS[o.mood], pts = m.check(s);
  let stars = pts + (liked.length ? 1 : 0);
  if (disliked.length) stars = Math.max(0, stars - 2);
  stars = Math.min(3, stars);
  let line;
  if (disliked.length) line = `${ING[disliked[0]].name}?! ${pick(['Ben onu sevmem ki…', 'Iyy, hiç sevmem!', 'Keşke sorsaydın…'])}`;
  else { line = m.react[pts]; if (liked.length) line += ` Hele ${ING[liked[0]].name.toLowerCase()}, bayılırım!`; else if (pts === 2) line += ' En sevdiğim bir şey de olsa tam olurdu.'; }
  if (ch.critic && stars === 3) line = 'Aslında ben yemek eleştirmeniyim… Bu dükkân bir yıldızı hak ediyor! ⭐';
  return { stars, line, liked, disliked, pts };
}

function serve() {
  if (!S.running) return;
  const c = queueList()[0];
  if (!c || !c.arrived) { toast(c ? 'Müşteri daha tezgâha gelmedi…' : 'Bekleyen müşteri yok.'); return; }
  if (!S.sw.bread || S.sw.toasting > 0) return;
  const s = sandwichSummary(), r = evaluate(c, s);
  let price = s.price;
  if (r.menu) price = Math.round((c.order.recipe.price || s.price) * (has('pano', 'equip') ? 1.15 : 1));
  const moodTip = c.order.kind === 'mood' ? MOODS[c.order.mood].tip : 1;
  let tip = Math.round((r.stars === 3 ? 12 : r.stars === 2 ? 4 : 0) * moodTip * (has('karagoz', 'decor') ? 1.05 : 1));
  if (c.ch.critic && r.stars === 3) tip += 40;
  const earned = r.stars > 0 ? price + tip : 0;
  P.money += earned; P.stats.earned += earned; S.day.money += earned; S.day.served++; S.day.stars += r.stars; P.stats.served++;
  if (r.stars === 3) P.stats.stars3++;
  P.rep = Math.max(1, Math.min(5, P.rep + (r.stars - 1.5) * .08 + (c.ch.critic && r.stars === 3 ? .5 : 0) - (c.ch.critic && r.stars < 2 ? .3 : 0)));
  if (!S.day.best || r.stars > S.day.best.stars) S.day.best = { stars: r.stars, name: c.ch.name, line: r.line };
  // defter
  const b = P.book[c.cid]; const learned = [];
  r.liked.forEach(i => { if (!b.likes.includes(i)) { b.likes.push(i); learned.push('❤ ' + ING[i].name); } });
  r.disliked.forEach(i => { if (!b.dislikes.includes(i)) { b.dislikes.push(i); learned.push('✖ ' + ING[i].name); } });
  if (learned.length) { S.day.learned += learned.length; setTimeout(() => toast(`📒 Deftere yazıldı: ${short(c.ch.name)} → ${learned.join(', ')}`, 2600), 900); }
  // ruh hâli rehberi
  if (c.order.kind === 'mood' && r.pts === 2 && !P.guide[c.order.mood]) {
    P.guide[c.order.mood] = true; const M = MOODS[c.order.mood];
    setTimeout(() => toast(`📘 Rehbere eklendi: ${M.emo} ${M.label} → ${M.guide}`, 3200), learned.length ? 3400 : 900);
  }
  // imza tarif adayı
  if (c.order.kind === 'mood' && r.stars === 3 && s.fills.length >= 3 && S.day.creations.length < 5)
    S.day.creations.push({ bread: s.bread, items: s.fills.slice(), toast: s.toasted, by: c.ch.name, mood: c.order.mood, price: s.price });
  c.bubble = { text: ['😠', '😐', '🙂', '😋'][r.stars], t: 2.4 };
  if (earned) { particle(c.x, c.y - 26, '+₺' + earned); sfx.coin(); } else sfx.bad();
  if (r.stars === 3) setTimeout(() => particle(c.x + 8, c.y - 22, '❤', '#ff6b81'), 250);
  $('reaction').innerHTML = `<b>${'★'.repeat(r.stars)}${'☆'.repeat(3 - r.stars)}</b> ${short(c.ch.name)}: “${r.line}”<br><span style="color:#3f8f6a">${earned ? `+₺${price}${tip ? ` (+₺${tip} bahşiş)` : ''}` : 'Ödeme yok…'}</span>`;
  const free = S.seats.filter(s2 => !s2.occ);
  if (free.length && r.stars > 0) { const st = pick(free); st.occ = c; c.seat = st; c.state = 'toSeat'; c.path = [{ x: c.x, y: LANE }, { x: st.x, y: LANE }, { x: st.x, y: st.y }];
    if (has('masa', 'equip')) { P.money += 4; S.day.money += 4; } }
  else leave(c, null);
  S.sw = { bread: null, fills: [], toasted: false, toasting: 0 }; refreshBoard();
  closeKitchen();
}

// ================= HAREKET =================
function queueList() { return S.customers.filter(c => c.state === 'queue').sort((a, b) => a.id - b.id); }
function moveToward(c, tx, ty, step) {
  const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy);
  if (d <= step || d < .01) { c.x = tx; c.y = ty; c.moving = false; return true; }
  c.x += dx / d * step; c.y += dy / d * step; c.moving = true; c.wt += step; c.frame = Math.floor(c.wt / 2.5) % 4; return false;
}
function leave(c, emoji) { c.state = 'leave'; c.bubble = emoji ? { text: emoji, t: 2 } : null; c.path = [{ x: c.x, y: LANE }, { x: -20, y: LANE }]; }

// ================= KEDİ =================
const BED = { x: 96, y: 126 };
function catThink() {
  const r = Math.random();
  if (cat.floor === 'ground') {
    if (has('kedi', 'decor') && r < .3) { cat.state = 'walk'; cat.tx = BED.x; cat.ty = BED.y; cat.toBed = true; return; }
    if (r < .45) { cat.jump = { fx: cat.x, fy: cat.y, tx: Math.max(84, Math.min(236, cat.x)), ty: 92, t: 0, floor: 'counter' }; return; }
    if (r < .6) { cat.state = Math.random() < .5 ? 'sit' : 'sleep'; cat.t = rnd(3, 8); return; }
    cat.state = 'walk'; cat.tx = rnd(20, 300); cat.ty = rnd(128, 166); cat.toBed = false;
  } else {
    if (r < .3) { cat.jump = { fx: cat.x, fy: cat.y, tx: cat.x, ty: rnd(125, 140), t: 0, floor: 'ground' }; return; }
    if (r < .7) { cat.state = Math.random() < .4 ? 'sleep' : 'sit'; cat.t = rnd(3, 9); return; }
    cat.state = 'walk'; cat.tx = rnd(84, 236); cat.ty = 92;
  }
}
function updateCat(dt) {
  if (cat.jump) { const j = cat.jump; j.t += dt * 2.2; const k = Math.min(1, j.t);
    cat.x = j.fx + (j.tx - j.fx) * k; cat.y = j.fy + (j.ty - j.fy) * k - Math.sin(k * Math.PI) * 14;
    if (k >= 1) { cat.floor = j.floor; cat.jump = null; cat.state = 'sit'; cat.t = rnd(1, 3); } return; }
  if (cat.state === 'walk') { const dx = cat.tx - cat.x, dy = cat.ty - cat.y, d = Math.hypot(dx, dy), st = 14 * dt;
    if (Math.abs(dx) > .2) cat.dir = dx > 0 ? 1 : -1;
    if (d <= st) { cat.x = cat.tx; cat.y = cat.ty; if (cat.toBed) { cat.toBed = false; cat.state = 'sleep'; cat.t = rnd(8, 16); } else catThink(); }
    else { cat.x += dx / d * st; cat.y += dy / d * st; cat.ft += dt; cat.frame = Math.floor(cat.ft * 6) % 2; } }
  else { cat.t -= dt; if (cat.t <= 0) catThink(); }
}

// ================= GÜNCELLEME =================
function update(dt) {
  S.birds.forEach(b => { b.x += b.v * dt; if (b.x > 330) { b.x = -10; b.y = rnd(3, 16); } });
  updateCat(dt);
  S.particles.forEach(p => p.t += dt); S.particles = S.particles.filter(p => p.t < p.life);
  S.customers.forEach(c => { if (c.bubble) c.bubble.t -= dt; });
  if (S.sw.toasting > 0) { S.sw.toasting -= dt; if (S.sw.toasting <= 0) { S.sw.toasting = 0; S.sw.toasted = true; sfx.bell(); refreshBoard(); } }
  if (!S.running) return;
  const sp = S.closing ? Math.max(S.speed, 4) : S.speed, gdt = dt * sp;
  if (!S.closing) {
    S.minutes = Math.min(CLOSE, S.minutes + gdt * MIN_PER_SEC);
    const q = queueList();
    if (S.minutes >= S.nextSpawn && S.minutes < LAST_SPAWN) {
      if (q.length < 3) { spawn(); let gap = rnd(26, 46) * (1.24 - P.rep * .08); if (has('neon', 'decor') && S.minutes > 1020) gap *= .8; S.nextSpawn = S.minutes + gap; }
      else S.nextSpawn = S.minutes + 8;
    }
    if (S.minutes >= CLOSE) { S.closing = true; queueList().forEach(c => leave(c, '👋')); toast('Kapanış saati! 🌙'); closeKitchen(); }
  }
  const step = 26 * gdt, q = queueList();
  S.customers.forEach(c => {
    if (c.state === 'queue') { const i = q.indexOf(c), tx = SLOT_X[Math.min(i, 2)];
      if (c.y > LANE - 1 && Math.abs(c.x - tx) > .5) moveToward(c, tx, LANE, step);
      else c.arrived = moveToward(c, tx, SLOT_Y, step) && i < 3;
      if (c.arrived) { c.patience -= dt * (i === 0 ? 1 : .5);
        if (c.patience <= 0) { leave(c, '😠'); S.day.lost++; P.rep = Math.max(1, P.rep - .12); sfx.bad();
          $('reaction').innerHTML = `<b>☆☆☆</b> ${short(c.ch.name)}: “Çok bekledim, gidiyorum!”`; } }
    } else if (c.state === 'toSeat' || c.state === 'leave') {
      if (c.path && c.path.length) { if (moveToward(c, c.path[0].x, c.path[0].y, step * (c.state === 'leave' ? 1.1 : 1))) c.path.shift(); }
      if (!c.path || !c.path.length) { if (c.state === 'toSeat') { c.state = 'eat'; c.eat = rnd(35, 55); c.moving = false; } else c.dead = true; }
    } else if (c.state === 'eat') { c.eat -= gdt * MIN_PER_SEC;
      if (Math.random() < dt * .15 && !(c.bubble && c.bubble.t > 0)) c.bubble = { text: pick(['😋', '☕', '🥪', '✨']), t: 1.5 };
      if (c.eat <= 0) { c.seat.occ = null; c.state = 'leave'; c.path = [{ x: c.x, y: LANE }, { x: -20, y: LANE }]; } }
  });
  S.customers = S.customers.filter(c => !c.dead);
  if (S.closing && !S.customers.length && !S.ended) endDay();
}

// ================= ÇİZİM =================
function sceneState() { return { minutes: S.minutes, weather: S.weather, decor: new Set(P.decor), equip: new Set(P.equip), closing: S.closing, toasting: S.sw.toasting, birds: S.birds }; }
function render() {
  g.setTransform(4, 0, 0, 4, 0, 0);
  const st = sceneState();
  A.drawBackground(st); A.drawShop(st); A.drawCounterFront(st);
  if (cat.floor === 'counter' && !cat.jump) A.drawCat(cat.x, cat.y, cat.dir, cat.state, cat.frame);
  A.drawGround(st); A.drawTablesBack(S.seats);
  S.customers.filter(c => c.state === 'eat').forEach(c => A.drawPerson(g, c.x, c.y, c.look, 0, true));
  A.drawTablesFront(S.tables, S.seats);
  const tea = has('cay', 'equip');
  const list = S.customers.filter(c => c.state !== 'eat').map(c => ({ y: c.y, f: () => A.drawPerson(g, c.x, c.y, c.look, c.moving ? c.frame : 0, false, tea && c.state === 'queue' && c.arrived ? 'cay' : null) }));
  if (cat.floor === 'ground' || cat.jump) list.push({ y: cat.y, f: () => A.drawCat(cat.x, cat.y, cat.dir, cat.jump ? 'walk' : cat.state, cat.frame) });
  list.sort((a, b) => a.y - b.y).forEach(o => o.f());
  A.drawWeather(st);
  const q = queueList();
  S.customers.forEach(c => {
    const top = c.y - (c.look.kid ? 16 : 20) - 2 + (c.state === 'eat' ? 3 : 0);
    if (c.bubble && c.bubble.t > 0) A.bubble(c.x, top, c.bubble.text);
    else if (c.state === 'queue' && c.arrived) { const low = c.patience / c.maxP < .3;
      A.bubble(c.x, top, low ? '😤' : (c.order.kind === 'menu' ? '📋' : MOODS[c.order.mood].emo), low ? '#ffd2c8' : (q[0] === c ? '#fff' : '#eee')); }
  });
  if (q[0] && q[0].arrived && !S.kitchen && S.running) { const b = Math.round(Math.sin(performance.now() / 180) * 1.5);
    A.P(162, 59 + b, 23, 7, '#2a1d17'); A.P(163, 60 + b, 21, 5, '#d8432f');
    A.P(170, 66 + b, 7, 1, '#2a1d17'); A.P(171, 66 + b, 5, 1, '#ffd35c'); A.P(172, 67 + b, 3, 1, '#ffd35c'); A.P(173, 68 + b, 1, 1, '#ffd35c');
    A.txt('dokun', 173.5, 62.7 + b, 5, '#fff', 'px'); }
  if (cat.state === 'sleep' && !cat.jump) { const zz = Math.floor(performance.now() / 600) % 3; A.txt('z'.repeat(zz + 1), cat.x + (cat.dir > 0 ? 6 : -6), cat.y - 10, 6, '#fff'); }
  S.particles.forEach(p => { const a = 1 - p.t / p.life; g.globalAlpha = Math.max(0, a);
    A.txt(p.text, p.x + .4, p.y - p.t * 10 + .4, 7, '#2a1d17', 'px'); A.txt(p.text, p.x, p.y - p.t * 10, 7, p.color, 'px'); g.globalAlpha = 1; });
  if (S.sw.toasting > 0) { const t = performance.now() / 200; for (let i = 0; i < 3; i++) A.P(167 + i * 5 + Math.round(Math.sin(t + i)), 70 - ((t * 3 + i * 4) % 8), 1, 2, 'rgba(255,255,255,.8)'); }
  A.drawNight(st);
}

// ================= TEZGÂH (UI) =================
const iconCache = {};
const ic = id => { const c = A.icon(id); return c; };
function buildCatTabs() {
  const el = $('catTabs'); el.innerHTML = '';
  [...CATS, { id: 'menu', name: 'Menü', emo: '📖' }].forEach(c => {
    const b = document.createElement('button'); b.dataset.cat = c.id;
    b.innerHTML = `${c.emo} ${c.name}`;
    const n = c.id !== 'menu' && c.id !== 'ekmek' ? S.sw.fills.filter(f => ING[f].cat === c.id).length : 0;
    if (n) b.innerHTML += `<span class="dot">${n}</span>`;
    if (c.id === 'ekmek' && S.sw.bread) b.innerHTML += '<span class="dot">✓</span>';
    b.classList.toggle('on', S.catTab === c.id);
    b.onclick = () => { S.catTab = c.id; sfx.click(); refreshBoard(); };
    el.append(b);
  });
}
function buildCatPanel() {
  const el = $('catPanel'); el.innerHTML = '';
  const u = unl(), sw = S.sw, busy = sw.toasting > 0;
  if (S.catTab === 'menu') {
    const box = document.createElement('div'); box.className = 'recipes';
    const fmt = r => `${r.bread ? ING[r.bread].name + ' · ' : ''}${r.items.map(i => ING[i].name).join(', ')}${r.toast ? ' · 🔥 tost' : ''}`;
    P.sigs.forEach(r => { const d = document.createElement('div'); d.className = 'rec';
      d.innerHTML = `<b class="sig">✨ ${r.name}</b> <span style="float:right">₺${r.price}</span><br>${fmt(r)}`; box.append(d); });
    Object.values(RECIPES).forEach(r => { const ok = (!r.bread || u.has(r.bread)) && r.items.every(i => u.has(i));
      const d = document.createElement('div'); d.className = 'rec' + (ok ? '' : ' lock');
      d.innerHTML = `<b>${ok ? '' : '🔒 '}${r.name}</b> <span style="float:right">₺${r.price}</span><br>${fmt(r)}`; box.append(d); });
    el.append(box); return;
  }
  const grid = document.createElement('div'); grid.className = 'grid';
  Object.entries(ING).filter(([, it]) => it.cat === S.catTab).forEach(([id, it]) => {
    const b = document.createElement('button'); b.className = 'ing'; const locked = !u.has(id);
    if (locked) b.classList.add('lock');
    b.append(ic(id));
    const s = document.createElement('span'); s.textContent = it.name; b.append(s);
    const pr = document.createElement('span'); pr.className = 'pr'; pr.textContent = locked ? `🔒 ₺${it.cost}` : `₺${it.price}`; b.append(pr);
    if (S.catTab === 'ekmek') { b.classList.toggle('sel', sw.bread === id); b.disabled = locked || busy || sw.toasted; b.onclick = () => { sw.bread = id; sfx.click(); refreshBoard(); }; }
    else { const n = sw.fills.filter(f => f === id).length; if (n) { const cn = document.createElement('span'); cn.className = 'cnt'; cn.textContent = '×' + n; b.append(cn); }
      b.disabled = locked || busy || !sw.bread || sw.fills.length >= maxFills() || sw.toasted;
      b.onclick = () => { if (!sw.bread) return; sw.fills.push(id); sfx.click(); refreshBoard(); }; }
    if (locked) b.title = 'Gün sonunda dükkândan açabilirsin';
    grid.append(b);
  });
  el.append(grid);
  if (S.catTab !== 'ekmek' && !sw.bread) { const p = document.createElement('div'); p.style.cssText = 'font-size:17px;color:#7a5a40;margin-top:6px'; p.textContent = 'Önce Ekmek sekmesinden bir ekmek seç.'; el.append(p); }
}
function refreshBoard() {
  const sw = S.sw, busy = sw.toasting > 0;
  $('sandLabel').textContent = !sw.bread ? 'Önce bir ekmek seç.' : (sw.toasted ? '🔥 ' : '🥪 ') + ING[sw.bread].name + (sw.fills.length ? ' + ' + sw.fills.map(f => ING[f].name).join(', ') : ' (boş)');
  $('sandPrice').textContent = sw.bread ? `₺${sandwichSummary().price} · ${sw.fills.length}/${maxFills()}` : '';
  $('toastBtn').disabled = busy || !sw.bread || sw.toasted || !S.running;
  $('undoBtn').disabled = busy || !sw.bread; $('clearBtn').disabled = busy || !sw.bread;
  $('serveBtn').disabled = busy || !sw.bread || !S.running;
  if (S.kitchen) { buildCatTabs(); buildCatPanel(); }
}
$('undoBtn').onclick = () => { const sw = S.sw; if (sw.toasted) sw.toasted = false; else if (sw.fills.length) sw.fills.pop(); else sw.bread = null; sfx.click(); refreshBoard(); };
$('clearBtn').onclick = () => { S.sw = { bread: null, fills: [], toasted: false, toasting: 0 }; S.catTab = 'ekmek'; sfx.click(); refreshBoard(); };
$('toastBtn').onclick = () => { if (!S.sw.bread) return; S.sw.toasting = toastTime(); beep(300, .3, 'sawtooth', .03, 260); refreshBoard(); };
$('serveBtn').onclick = serve;

function openKitchen() {
  if (!S.running) return;
  S.kitchen = true; $('kitchen').classList.remove('hidden'); $('backdrop').classList.remove('hidden');
  if (!S.sw.bread) S.catTab = 'ekmek';
  syncKitchenOrder(true); refreshBoard(); sfx.page();
}
function closeKitchen() { S.kitchen = false; $('kitchen').classList.add('hidden'); $('backdrop').classList.add('hidden'); }
$('openK').onclick = openKitchen; $('closeK').onclick = closeKitchen; $('backdrop').onclick = closeKitchen;

function bookLine(c) {
  const b = P.book[c.cid];
  if (c.ch.critic) return '🕶️ Kim olduğu belli değil… Elinden gelenin en iyisini yap.';
  if (!b || (b.visits <= 1 && !b.likes.length && !b.dislikes.length)) return '📒 İlk kez geliyor, dikkatle dinle!';
  const L = b.likes.map(i => ING[i].name), D = b.dislikes.map(i => ING[i].name);
  let s = `📒 ${b.visits}. ziyaret · ❤ ${L.length ? L.join(', ') : '?'} · ✖ ${D.length ? D.join(', ') : '?'}`;
  if (c.order.kind === 'mood' && P.guide[c.order.mood]) s += `\n📘 ${MOODS[c.order.mood].guide}`;
  return s;
}
let kOrderId = null;
function moodTag(c) { return c.order.kind === 'menu' ? (c.order.sig ? '✨ İmza tarif' : '📋 Menüden') : MOODS[c.order.mood].emo + ' ' + MOODS[c.order.mood].label; }
function syncKitchenOrder(force) {
  const c = queueList()[0], id = c && c.arrived ? c.id : null;
  if (!force && id === kOrderId) return; kOrderId = id;
  if (id) { $('kName').textContent = c.ch.name; $('kMood').textContent = moodTag(c); $('kMood').classList.remove('hidden');
    $('kHint').textContent = '“' + c.hint + '”'; $('kBook').innerText = bookLine(c); drawPortrait($('kPortrait'), c.look); }
  else { $('kName').textContent = 'Bekleyen müşteri yok'; $('kMood').classList.add('hidden'); $('kHint').textContent = 'Önceden hazırlık yapabilirsin.'; $('kBook').textContent = ''; drawPortrait($('kPortrait'), null); }
}
function drawPortrait(cnv, look, size = 96) {
  const p = cnv.getContext('2d'); p.imageSmoothingEnabled = false; p.setTransform(1, 0, 0, 1, 0, 0);
  p.fillStyle = '#efd9ad'; p.fillRect(0, 0, cnv.width, cnv.height); const k = cnv.width / 24; p.setTransform(k, 0, 0, k, 0, 0);
  if (look) { A.drawPerson(p, 12, look.kid ? 22 : 23, look, 0, false); return; }
  const R = (a, b, w, h, col) => { p.fillStyle = col; p.fillRect(a, b, w, h); };
  R(7, 13, 10, 8, '#ec9a45'); R(9, 15, 5, 6, '#fff3e0'); R(7, 7, 9, 7, '#ec9a45'); R(7, 6, 2, 1, '#ec9a45'); R(14, 6, 2, 1, '#ec9a45');
  R(9, 10, 1, 1, '#2a1d17'); R(13, 10, 1, 1, '#2a1d17'); R(11, 11, 1, 1, '#f08a9a'); R(17, 18, 3, 2, '#ec9a45'); R(19, 16, 1, 2, '#ec9a45');
}

// ================= ÜST BİLGİ =================
let lastKey = null;
function syncUI() {
  $('sDay').textContent = P.day; $('sClock').textContent = fmtTime(S.minutes); $('sMoney').textContent = '₺' + P.money; $('sRep').textContent = P.rep.toFixed(1);
  $('sWeather').textContent = WEATHER[S.weather].emo; $('sWeather').title = WEATHER[S.weather].name;
  const q = queueList(), c = q[0], id = c && c.arrived ? c.id : null, key = id ?? (c ? 'coming' : 'none');
  if (key !== lastKey) { lastKey = key;
    if (id) { $('custName').textContent = c.ch.name; $('custMood').textContent = moodTag(c); $('custMood').classList.remove('hidden');
      $('custHint').textContent = '“' + c.hint + '”'; drawPortrait($('portrait'), c.look); sfx.bell();
      if (S.speed > 1) { setSpeed(1); toast('Müşteri geldi, hız 1x’e döndü'); } }
    else { $('custMood').classList.add('hidden'); $('custName').textContent = c ? 'Biri geliyor…' : 'Henüz müşteri yok';
      $('custHint').textContent = c ? 'Tezgâha yaklaşıyor.' : pick(['Dükkân sakin… Pamuk güneşleniyor.', 'Ulucami’den güvercinler havalandı.', 'Çaylar demlendi, sıradaki müşteriyi bekliyorsun.', 'Uludağ bugün pırıl pırıl görünüyor.', 'Komşu kestane şekercisi selam yolladı.']);
      drawPortrait($('portrait'), null); }
  }
  $('openK').classList.toggle('pulse', !!id && !S.kitchen);
  const setBar = el => { if (id) { const k = Math.max(0, c.patience / c.maxP); el.style.width = (k * 100) + '%'; el.style.background = k > .5 ? '#5bbf4a' : k > .25 ? '#f1c40f' : '#e74c3c'; } else el.style.width = '0%'; };
  setBar($('patFill')); if (S.kitchen) { setBar($('kPat')); syncKitchenOrder(false); A.drawStack($('stack'), S.sw, 3); if (S.sw.toasting > 0) drawToastBar(); }
  $('queueInfo').textContent = q.length > 1 ? `Sırada ${q.length - 1} kişi daha bekliyor` : '';
  $('fastHint').style.display = (S.running && !S.closing && !q.length && S.speed < 4 && S.speed > 0) ? 'block' : 'none';
}
function drawToastBar() { const sg = $('stack').getContext('2d'); sg.setTransform(3, 0, 0, 3, 0, 0);
  sg.fillStyle = '#2a1d17'; sg.fillRect(20, 3, 80, 5); sg.fillStyle = '#ff7a3d'; sg.fillRect(21, 4, 78 * (1 - S.sw.toasting / toastTime()), 3);
  const t = performance.now() / 150; sg.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 5; i++) sg.fillRect(Math.round(40 + i * 10 + Math.sin(t + i) * 2), Math.round(14 - ((t * 2 + i * 3) % 8)), 1, 3); }
function fmtTime(m) { m = Math.floor(m); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
function setSpeed(v) { S.speed = v; document.querySelectorAll('[data-sp]').forEach(b => b.classList.toggle('on', +b.dataset.sp === v)); }
document.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => { setSpeed(+b.dataset.sp); sfx.click(); });

// ================= GÜN AKIŞI =================
function rollWeather() {
  if (P.day === 1) return 'gunesli';
  return wpick([['gunesli', 3], ['bulutlu', 2], ['yagmurlu', 2], ['karli', 1], ['sicak', 1.5]]);
}
function startDay() {
  S.weather = P.nextWeather || rollWeather(); P.nextWeather = null;
  S.minutes = OPEN; S.closing = false; S.ended = false; S.criticCame = false; S.nextSpawn = OPEN + 6; S.customers = []; S.lastChar = null;
  S.day = { money: 0, served: 0, stars: 0, lost: 0, pets: 0, learned: 0, best: null, creations: [] };
  S.tables = has('masa', 'equip') ? [40, 120, 200, 280] : [52, 160, 268];
  S.seats = []; S.tables.forEach(t => S.seats.push({ x: t - 13, y: 163, occ: null, t }, { x: t + 13, y: 163, occ: null, t }));
  S.sw = { bread: null, fills: [], toasted: false, toasting: 0 }; S.catTab = 'ekmek';
  $('reaction').innerHTML = ''; lastKey = -1; S.running = true; refreshBoard(); sfx.bell();
  toast(`${P.day}. gün · ${WEATHER[S.weather].emo} ${WEATHER[S.weather].name}`, 2400);
}
function endDay() {
  S.ended = true; S.running = false; closeKitchen();
  const d = S.day, avg = d.served ? (d.stars / d.served).toFixed(1) : '–';
  if (has('saksi', 'decor')) P.rep = Math.min(5, P.rep + .05);
  const dayNo = P.day; P.day += 1; P.nextWeather = rollWeather();
  doSave();
  $('endTitle').textContent = `${dayNo}. gün bitti 🌙`;
  $('endBody').innerHTML = `<p>💰 Bugünkü kazanç: <b>₺${d.money}</b> · kasa: <b>₺${P.money}</b></p>
    <p>🥪 Servis: <b>${d.served}</b> · ortalama ${avg} ★ · 😠 kızıp giden: ${d.lost}</p>
    <p>📒 Bugün deftere ${d.learned} yeni bilgi yazıldı · 🐈 Pamuk ${d.pets} kez sevildi</p>
    ${d.best ? `<p>🏆 Günün yorumu, ${d.best.name}: “${d.best.line}”</p>` : ''}
    <p style="color:#7a5a40">Yarın: ${WEATHER[P.nextWeather].emo} ${WEATHER[P.nextWeather].name}</p>`;
  const ce = $('endCreations'); ce.innerHTML = '';
  if (d.creations.length && P.sigs.length < 8) {
    ce.innerHTML = '<h4>✨ Bugünün 3 yıldızlı yaratımları: imza tarif yapmak ister misin?</h4>';
    d.creations.slice(0, 3).forEach((cr, i) => {
      const div = document.createElement('div'); div.className = 'creation';
      const def = pick([`${short(cr.by).split(' ')[0]}’in Favorisi`, `${MOODS[cr.mood].label} Usulü`, `Ulucami ${['Klasiği', 'Rüyası', 'Esintisi'][i % 3]}`, `Uludağ ${['Zirvesi', 'Esintisi'][i % 2]}`]);
      div.innerHTML = `<b>${ING[cr.bread].name}</b> · ${cr.items.map(x => ING[x].name).join(', ')}${cr.toast ? ' · 🔥' : ''}<br><small>${cr.by} için (${MOODS[cr.mood].emo} ${MOODS[cr.mood].label})</small><br>`;
      const inp = document.createElement('input'); inp.value = def; inp.maxLength = 28;
      const btn = document.createElement('button'); btn.textContent = '✨ İmza yap'; btn.style.marginLeft = '6px';
      btn.onclick = () => { const name = inp.value.trim() || def; const price = Math.round(cr.price * 1.2 / 5) * 5;
        P.sigs.push({ id: 'sig' + Date.now(), name, bread: cr.bread, items: cr.items, toast: cr.toast, price });
        btn.disabled = true; inp.disabled = true; btn.textContent = '✓ Menüde!'; sfx.buy(); doSave(); };
      div.append(inp, btn); ce.append(div);
    });
  }
  $('endModal').classList.remove('hidden'); refreshBoard();
}
$('toShopBtn').onclick = () => { $('endModal').classList.add('hidden'); openShop(); };
$('nextDayBtn').onclick = () => { $('shopModal').classList.add('hidden'); doSave(); startDay(); };

// ================= DÜKKÂN =================
let shopTab = 'malzeme';
function openShop() { $('shopModal').classList.remove('hidden'); renderShop(); }
function renderShop() {
  $('shopMoney').textContent = `· 💰 ₺${P.money}`;
  $('tomorrow').textContent = `Yarın: ${WEATHER[P.nextWeather || 'gunesli'].emo} ${WEATHER[P.nextWeather || 'gunesli'].name} · ${P.day}. gün`;
  const tabs = $('shopTabs'); tabs.innerHTML = '';
  [['malzeme', '🥬 Malzemeler'], ['ekipman', '🛠 Ekipman'], ['dekor', '🎨 Dekor']].forEach(([id, nm]) => {
    const b = document.createElement('button'); b.textContent = nm; b.classList.toggle('on', shopTab === id); b.onclick = () => { shopTab = id; renderShop(); }; tabs.append(b); });
  const panel = $('shopPanel'); panel.innerHTML = '';
  const grid = document.createElement('div'); grid.className = 'shopGrid';
  const item = (icoEl, title, desc, cost, owned, onBuy) => {
    const d = document.createElement('div'); d.className = 'shopItem' + (owned ? ' owned' : '');
    const ico = document.createElement('div'); ico.className = 'ico'; if (typeof icoEl === 'string') ico.textContent = icoEl; else ico.append(icoEl);
    const t = document.createElement('div'); t.className = 't'; t.innerHTML = `<b>${title}</b>${desc}`;
    const btn = document.createElement('button');
    if (owned) { btn.textContent = '✓ Var'; btn.disabled = true; } else { btn.textContent = `₺${cost}`; btn.disabled = P.money < cost; btn.className = 'ok';
      btn.onclick = () => { if (P.money < cost) return; P.money -= cost; onBuy(); sfx.buy(); toast(`${title} alındı!`); doSave(); renderShop(); }; }
    d.append(ico, t, btn); grid.append(d);
  };
  if (shopTab === 'malzeme') {
    CATS.forEach(c => { Object.entries(ING).filter(([, it]) => it.cat === c.id && it.cost > 0).forEach(([id, it]) => {
      const used = Object.values(RECIPES).filter(r => r.items.includes(id) || r.bread === id).map(r => r.name);
      item(A.icon(id), `${c.emo} ${it.name}`, used.length ? `Menüde: ${used.slice(0, 2).join(', ')}` : 'Yeni lezzet seçeneği', it.cost, P.unlocked.includes(id), () => P.unlocked.push(id)); }); });
  } else if (shopTab === 'ekipman') {
    Object.entries(EQUIP).forEach(([id, e]) => item(e.emo, e.name, e.desc, e.cost, P.equip.includes(id), () => P.equip.push(id)));
  } else {
    Object.entries(DECOR).forEach(([id, e]) => item(e.emo, e.name, e.desc, e.cost, P.decor.includes(id), () => P.decor.push(id)));
  }
  panel.append(grid);
}

// ================= DEFTER =================
let bookTab = 'musteri';
function openBook() { $('bookModal').classList.remove('hidden'); renderBook(); sfx.page(); }
function renderBook() {
  const tabs = $('bookTabs'); tabs.innerHTML = '';
  [['musteri', '👥 Müşteriler'], ['rehber', '📘 Ruh hâli rehberi'], ['menu', '📖 Menü & imza tarifler']].forEach(([id, nm]) => {
    const b = document.createElement('button'); b.textContent = nm; b.classList.toggle('on', bookTab === id); b.onclick = () => { bookTab = id; renderBook(); }; tabs.append(b); });
  const panel = $('bookPanel'); panel.innerHTML = '';
  if (bookTab === 'musteri') {
    const grid = document.createElement('div'); grid.className = 'people';
    Object.entries(CHARS).filter(([, c]) => !c.critic).forEach(([id, ch]) => {
      const b = P.book[id], d = document.createElement('div'); d.className = 'person' + (b ? '' : ' unknown');
      const cnv = document.createElement('canvas'); cnv.width = 48; cnv.height = 48; drawPortrait(cnv, b ? ch.look : { ...ch.look, skin: '#9a8a7a', hair: '#7a6a5a', shirt: '#8a7a6a', pants: '#6a5a4a' });
      const t = document.createElement('div');
      if (b) t.innerHTML = `<b>${ch.name}</b><br>${b.visits} ziyaret<br>❤ ${b.likes.length ? b.likes.map(i => ING[i].name).join(', ') : '?'}<br>✖ ${b.dislikes.length ? b.dislikes.map(i => ING[i].name).join(', ') : '?'}`;
      else t.innerHTML = '<b>???</b><br>Henüz tanışmadınız.';
      d.append(cnv, t); grid.append(d);
    });
    panel.append(grid);
    const known = Object.keys(P.book).filter(k => !CHARS[k].critic).length;
    const p = document.createElement('p'); p.textContent = `${known} / ${Object.keys(CHARS).length - 1} müşteri tanındı. Sevdikleri ve sevmedikleri, onlara servis ettikçe ortaya çıkar.`; panel.append(p);
  } else if (bookTab === 'rehber') {
    const grid = document.createElement('div'); grid.className = 'people';
    Object.entries(MOODS).filter(([, m]) => !m.special).forEach(([id, m]) => {
      const d = document.createElement('div'); d.className = 'person' + (P.guide[id] ? '' : ' unknown');
      d.innerHTML = `<div style="font-size:26px;width:34px;text-align:center">${m.emo}</div><div><b>${m.label}</b><br>${P.guide[id] ? m.guide : '??? Bu ruh hâlini bir kez tam tuttur, ipucu açılsın.'}</div>`;
      grid.append(d); });
    panel.append(grid);
  } else {
    const box = document.createElement('div'); box.className = 'recipes'; box.style.maxHeight = 'none';
    const u = unl(); const fmt = r => `${r.bread ? ING[r.bread].name + ' · ' : ''}${r.items.map(i => ING[i].name).join(', ')}${r.toast ? ' · 🔥 tost' : ''}`;
    if (!P.sigs.length) { const p = document.createElement('p'); p.textContent = 'Henüz imza tarifin yok. Bir ruh hâlini 3 yıldızla tutturduğun en az 3 malzemeli sandviçleri gün sonunda imza tarife çevirebilirsin.'; panel.append(p); }
    P.sigs.forEach(r => { const d = document.createElement('div'); d.className = 'rec'; d.innerHTML = `<b class="sig">✨ ${r.name}</b> <span style="float:right">₺${r.price}</span><br>${fmt(r)}`; box.append(d); });
    Object.values(RECIPES).forEach(r => { const ok = (!r.bread || u.has(r.bread)) && r.items.every(i => u.has(i));
      const d = document.createElement('div'); d.className = 'rec' + (ok ? '' : ' lock'); d.innerHTML = `<b>${ok ? '' : '🔒 '}${r.name}</b> <span style="float:right">₺${r.price}</span><br>${fmt(r)}`; box.append(d); });
    panel.append(box);
  }
}
$('bookBtn').onclick = openBook; $('bookClose').onclick = () => $('bookModal').classList.add('hidden');

// ================= KAYIT =================
async function doSave() {
  const res = await Save.save(JSON.parse(JSON.stringify(P)));
  $('saveBadge').textContent = res === 'cloud' || res === 'queued' ? '☁ kaydedildi' : '💾 bu cihaza kaydedildi';
}
function openSettings() {
  $('setModal').classList.remove('hidden');
  $('saveMode').textContent = Save.mode === 'cloud' ? `👤 ${Save.playerName} · ☁ Kayıt: Claude hesabın (bulut).` : `👤 ${Save.playerName} · 💾 Kayıt: bu cihazın tarayıcısı. Başka cihaza geçerken yedek kodunu kullan.`;
  $('exportBox').value = Save.exportCode(P); $('resetBtn').dataset.sure = '';
  $('resetBtn').textContent = '🗑 Sıfırdan başla';
}
$('setBtn').onclick = openSettings; $('setClose').onclick = () => $('setModal').classList.add('hidden');
$('copyBtn').onclick = async () => { try { await navigator.clipboard.writeText($('exportBox').value); toast('Yedek kodu kopyalandı 📋'); } catch (e) { $('exportBox').select(); toast('Kod seçildi, kopyalayabilirsin.'); } };
$('importBtn').onclick = () => { const s = Save.importCode($('importBox').value); if (!s) { toast('Kod geçersiz 😕'); return; }
  P = Object.assign(newProfile(), s); doSave(); $('setModal').classList.add('hidden'); toast(`Yedek yüklendi: ${P.day}. gün`); S.running = false; startDay(); };
$('resetBtn').onclick = async () => { const b = $('resetBtn'); if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Emin misin? Tekrar bas'; return; }
  await Save.wipe(); P = newProfile(); $('setModal').classList.add('hidden'); toast('Bu oyuncu sıfırdan başladı'); S.running = false; doSave(); startDay(); };

// ================= GİRİŞ & KONTROLLER =================
window.addEventListener('keydown', e => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (e.key === '0') setSpeed(0); if (e.key === '1') setSpeed(1); if (e.key === '2') setSpeed(2); if (e.key === '3') setSpeed(4);
  if (e.key === 'Enter' && S.kitchen) { e.preventDefault(); serve(); }
  if (e.key === ' ') { e.preventDefault(); S.kitchen ? closeKitchen() : openKitchen(); }
  if (e.key === 'Escape') closeKitchen();
});
cv.addEventListener('click', e => {
  const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H2;
  if (Math.abs(x - cat.x) < 11 && y > cat.y - 15 && y < cat.y + 3) {
    S.day.pets++; P.stats.pets++; particle(cat.x, cat.y - 12, '❤', '#ff6b81', 1.4); sfx.meow();
    if (has('kedi', 'decor') && S.day.pets <= 10 && S.running) { P.money += 1; S.day.money += 1; particle(cat.x + 6, cat.y - 8, '+₺1', '#ffd35c', 1.2); }
    if (cat.state === 'sleep') { cat.state = 'sit'; cat.t = 3; }
    toast(pick(['Miyav! 🐈', 'Pamuk mırlıyor…', 'Prrr ❤', 'Pamuk kafasını sürttü'])); return; }
  const c = queueList()[0];
  if ((x >= 70 && x <= 250 && y >= 48 && y <= 112) || (c && Math.abs(x - c.x) < 8 && y > c.y - 22 && y < c.y + 1)) openKitchen();
});

async function boot() {
  Save.init();
  const players = await Save.listPlayers();
  $('startStatus').textContent = (Save.mode === 'cloud' ? '☁ Kayıtlar Claude hesabına yapılıyor.' : '💾 Kayıtlar bu cihazın tarayıcısında tutuluyor.') + (players.length ? ' Kaydını seç ya da yeni oyuncu ekle.' : ' Adını yaz ve başla!');
  const list = $('playerList'); list.innerHTML = '';
  const begin = (name, state) => { initAudio(); Save.setPlayer(name); P = state ? Object.assign(newProfile(), state) : newProfile();
    $('sPlayer').textContent = Save.playerName; $('startModal').classList.add('hidden'); doSave(); startDay(); };
  players.forEach(pl => { const d = document.createElement('button'); d.className = 'person'; d.style.cssText = 'text-align:left;cursor:pointer';
    d.innerHTML = `<div style="font-size:26px">🧑‍🍳</div><div><b>${pl.name.replace(/[<>&]/g, '')}</b><br>${pl.day}. gün · ₺${pl.money}<br><small>${new Date(pl.savedAt).toLocaleDateString('tr-TR')}</small></div>`;
    d.onclick = () => begin(pl.name, pl.state); list.append(d); });
  const startNew = () => { const nm = $('newName').value.trim(); if (!nm) { toast('Önce adını yaz 🙂'); $('newName').focus(); return; }
    const ex = players.find(p2 => p2.id === Save.idFor(nm)); if (ex) { toast(`“${ex.name}” zaten var, kaldığı yerden devam ediyor`); begin(ex.name, ex.state); return; }
    begin(nm, null); };
  $('newPlayerBtn').onclick = startNew; $('newName').onkeydown = e => { if (e.key === 'Enter') startNew(); };
  $('saveBadge').textContent = Save.mode === 'cloud' ? '☁ bulut kaydı' : '💾 cihaz kaydı';
}
$('switchBtn').onclick = () => { doSave(); location.reload(); };

// ================= DÖNGÜ =================
S.tables = [52, 160, 268]; S.seats = []; S.tables.forEach(t => S.seats.push({ x: t - 13, y: 163, occ: null, t }, { x: t + 13, y: 163, occ: null, t }));
drawPortrait($('portrait'), null);
let last = performance.now();
function loop(t) { const dt = Math.min(.05, (t - last) / 1000); last = t; update(dt); render(); syncUI(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);
boot();
window.__game = { S, get P() { return P; } };
})();
