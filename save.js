/* Umut Sandviç Evi — kayıt sistemi (çok oyunculu kayıt yuvaları)
 * Her oyuncunun (arkadaşın) kendi kaydı vardır; aynı cihazda birden fazla kişi de oynayabilir.
 * 1) Claude artifact'i olarak açıldığında: Claude hesabına bağlı bulut kaydı (db, kişiye özel alan).
 * 2) Başka yerde (GitHub Pages, yerel dosya): tarayıcının localStorage'ı (+ kalıcı depolama isteği).
 * 3) Yedek kodu: ⚙ menüsünden kopyala, başka cihazda yapıştır. */
'use strict';
(() => {
const PREFIX = 'usev1:p:';            // yerel oyuncu kayıtları
const LEGACY = 'umut-sandvic-evi-save-v1';
const slug = s => (s || 'oyuncu').toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'oyuncu';

const Save = {
  mode: 'local', db: null, uid: null, ready: null, player: null, playerName: null,

  init() {
    this.ready = (async () => {
      try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
      try {
        if (window.claude && typeof window.claude.use === 'function') {
          const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
          if (db && user) { const id = await user.id(); if (id) { this.db = db; this.uid = id; this.mode = 'cloud'; } }
        }
      } catch (e) {}
      // eski tek kayıt → "Oyuncu 1"
      try { const old = localStorage.getItem(LEGACY);
        if (old && !localStorage.getItem(PREFIX + 'oyuncu-1')) { const s = JSON.parse(old); s.playerName = s.playerName || 'Oyuncu 1'; localStorage.setItem(PREFIX + 'oyuncu-1', JSON.stringify(s)); }
        if (old) localStorage.removeItem(LEGACY);
      } catch (e) {}
      return this.mode;
    })();
    return this.ready;
  },

  idFor(name) { return slug(name); },
  setPlayer(name) { this.playerName = name.trim().slice(0, 24) || 'Oyuncu'; this.player = slug(this.playerName); },
  ref(pid) { return this.db.doc('data/users/' + this.uid + '/p-' + (pid || this.player)); },

  async listPlayers() {
    await this.ready;
    const map = {};
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) { const s = JSON.parse(localStorage.getItem(k)); const id = k.slice(PREFIX.length);
        map[id] = { id, name: s.playerName || id, day: s.day, money: s.money, savedAt: s.savedAt || 0, state: s }; } } } catch (e) {}
    if (this.mode === 'cloud') {
      try { const snap = await this.db.collection('data/users/' + this.uid).get();
        snap.docs.forEach(d => { if (!d.id.startsWith('p-') || !d.exists) return; const s = d.data().state; if (!s) return; const id = d.id.slice(2);
          if (!map[id] || (s.savedAt || 0) > map[id].savedAt) map[id] = { id, name: s.playerName || id, day: s.day, money: s.money, savedAt: s.savedAt || 0, state: JSON.parse(JSON.stringify(s)) }; });
      } catch (e) {}
    }
    return Object.values(map).sort((a, b) => b.savedAt - a.savedAt);
  },

  _busy: false, _pending: null,
  async save(state) {
    if (!this.player) return 'none';
    state.savedAt = Date.now(); state.playerName = this.playerName;
    try { localStorage.setItem(PREFIX + this.player, JSON.stringify(state)); } catch (e) {}
    if (this.mode !== 'cloud') return 'local';
    if (this._busy) { this._pending = state; return 'queued'; }
    this._busy = true;
    try { await this.ref().set({ state, v: 2 }); } catch (e) { this._busy = false; return 'local'; }
    this._busy = false;
    if (this._pending) { const p = this._pending; this._pending = null; return this.save(p); }
    return 'cloud';
  },

  async wipe() {
    if (!this.player) return;
    try { localStorage.removeItem(PREFIX + this.player); } catch (e) {}
    if (this.mode === 'cloud') { try { await this.ref().delete(); } catch (e) {} }
  },

  exportCode(state) { return btoa(unescape(encodeURIComponent(JSON.stringify(state)))); },
  importCode(code) { try { const s = JSON.parse(decodeURIComponent(escape(atob(code.trim())))); return s && s.day ? s : null; } catch (e) { return null; } },
};
window.Save = Save;
})();
