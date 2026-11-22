// 個人の設定・記録をアカウントに紐づける(方針: 個人データは localStorage だけにしない)。
// 使い方:
//   await prefsSync()          … ログイン中なら、サーバーの控えを手元(localStorage)に反映する
//   prefsSet(lsKey, value)     … 手元に保存 + サーバーにも保存(テーマ・自己ベスト・既読など)
// サーバー側は /api/progress の "user_prefs" キーに { lsKey: value } を1つにまとめて持つ。
(function () {
  var SUPABASE_URL = 'https://gwknnqceiozbmxrqjcae.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_4MgSWSr8bbuUf5Vp_LSD6Q_SI-ciZ2B';
  var PREF_KEY = 'user_prefs';
  var _token = null, _prefs = null, _timer = null, _loaded = false;

  async function getToken() {
    if (_token) return _token;
    var custom = localStorage.getItem('muto_session');
    if (custom) { _token = custom; return _token; }
    try {
      if (!window.supabase) return null;
      var c = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      var r = await c.auth.getSession();
      _token = (r.data && r.data.session && r.data.session.access_token) || null;
    } catch (e) {}
    return _token;
  }
  function fill(dst, src) { // 手元に無いものだけ足す(消さない)
    var chg = false;
    Object.keys(src || {}).forEach(function (k) {
      var v = src[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        if (!dst[k] || typeof dst[k] !== 'object') dst[k] = {};
        if (fill(dst[k], v)) chg = true;
      } else if (v && !dst[k]) { dst[k] = v; chg = true; }
    });
    return chg;
  }

  window.prefsSync = async function () {
    var token = await getToken();
    if (!token) return false;
    var changed = false;
    try {
      var res = await fetch('/api/progress', { headers: { 'Authorization': token } });
      if (!res.ok) return false;
      var all = (await res.json()).all || {};
      _prefs = Object.assign({}, all[PREF_KEY] || {}, _prefs || {}); _loaded = true;
      var _srv = all[PREF_KEY] || {};
      // 設定: サーバーの値を手元へ(自己ベストは大きい方、既読は立っている方を残す)
      Object.keys(_prefs).forEach(function (k) {
        var sv = String(_prefs[k]), lv = localStorage.getItem(k);
        if (k === 'clrank_max_score') { if (!(parseInt(lv || '0') >= parseInt(sv))) { localStorage.setItem(k, sv); changed = true; } }
        else if (lv !== sv) { localStorage.setItem(k, sv); changed = true; }
      });
      // 手元にだけある設定はサーバーへ送る
      ['mutou_theme', 'clrank_max_score', 'muto_notif_read_3'].forEach(function (k) {
        var lv = localStorage.getItem(k);
        if (lv && _prefs[k] === undefined) window.prefsSet(k, lv);
      });
      // クイズ・学習・ロードマップの進捗を、手元に足す
      Object.keys(all).forEach(function (k) {
        if (k === PREF_KEY) return;
        if (localStorage.getItem(k + '_reset')) return;
        var cur = {};
        try { cur = JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) {}
        if (fill(cur, all[k])) { localStorage.setItem(k, JSON.stringify(cur)); changed = true; }
      });
    } catch (e) {}
    return changed;
  };

  window.prefsSet = function (key, value) {
    try { localStorage.setItem(key, String(value)); } catch (e) {}
    if (!_prefs) _prefs = {};
    _prefs[key] = String(value);
    clearTimeout(_timer);
    _timer = setTimeout(async function () {
      var token = await getToken();
      if (!token) return;
      try {
        if (!_loaded) { // 同期前に保存する時は、サーバーの控えを上書きしないよう先に合流
          var r0 = await fetch('/api/progress/' + PREF_KEY, { headers: { 'Authorization': token } });
          var s0 = r0.ok ? ((await r0.json()).state || {}) : {};
          _prefs = Object.assign({}, s0, _prefs);
        }
        await fetch('/api/progress/' + PREF_KEY, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': token },
          body: JSON.stringify({ state: _prefs })
        });
      } catch (e) {}
    }, 800);
  };
})();
