/* Umut Sandviç Evi — kayıt sistemi
 * 1) Claude artifact'i olarak açıldığında: Claude hesabına bağlı bulut kaydı (db capability, kişiye özel alan).
 * 2) Başka yerde (GitHub Pages, yerel dosya): tarayıcının localStorage'ı.
 * Ayrıca kayıt metni kopyalanıp başka cihaza yapıştırılabilir (yedek kodu). */
'use strict';
(() => {
const KEY = 'umut-sandvic-evi-save-v1';
const Save = {
  mode: 'local', db: null, uid: null, ready: null,

  init() {
    this.ready = (async () => {
      try {
        if (window.claude && typeof window.claude.use === 'function') {
          const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
          if (db && user) {
            const id = await user.id();
            if (id) { this.db = db; this.uid = id; this.mode = 'cloud'; }
          }
        }
      } catch (e) { /* bulut yok: yerel kayıt */ }
      return this.mode;
    })();
    return this.ready;
  },

  ref() { return this.db.doc('data/users/' + this.uid + '/save'); },

  async load() {
    await this.ready;
    let cloud = null, local = null;
    if (this.mode === 'cloud') {
      try { const snap = await this.ref().get(); if (snap.exists) cloud = JSON.parse(JSON.stringify(snap.data().state)); } catch (e) {}
    }
    try { const raw = localStorage.getItem(KEY); if (raw) local = JSON.parse(raw); } catch (e) {}
    // Hangisi daha ilerideyse onu kullan
    if (cloud && local) return (local.savedAt || 0) > (cloud.savedAt || 0) ? local : cloud;
    return cloud || local;
  },

  _busy: false, _pending: null,
  async save(state) {
    state.savedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    if (this.mode !== 'cloud') return 'local';
    // aynı dokümana tek seferde bir yazma
    if (this._busy) { this._pending = state; return 'queued'; }
    this._busy = true;
    try { await this.ref().set({ state, v: 1 }); }
    catch (e) { this._busy = false; return 'local'; }
    this._busy = false;
    if (this._pending) { const p = this._pending; this._pending = null; return this.save(p); }
    return 'cloud';
  },

  async wipe() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    if (this.mode === 'cloud') { try { await this.ref().delete(); } catch (e) {} }
  },

  exportCode(state) { return btoa(unescape(encodeURIComponent(JSON.stringify(state)))); },
  importCode(code) { try { const s = JSON.parse(decodeURIComponent(escape(atob(code.trim())))); return s && s.day ? s : null; } catch (e) { return null; } },
};
window.Save = Save;
})();
