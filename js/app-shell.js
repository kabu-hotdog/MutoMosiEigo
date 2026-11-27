// 武藤模試 共通シェル（ヘッダーバー＋ハンバーガードロワー＋認証）
//
// 使い方:
//   appShell.mount(document.getElementById('app-shell-bar'), {
//     nav: window.APP_NAV,          // js/nav.js。省略時は空
//     manageAuth: true,            // 既定 true。false にすると認証はページ側の責務（index.html 用）
//     onGoogleLogin, onIdLogin, onLogout, onNotif, onAvatar  // 省略時は既定動作
//                                          // onAvatar 既定＝内蔵のアバター/フレーム/名前変更モーダル
//                                          //   （PUT /api/avatar → refreshAuth()。id は appshell- プレフィックス）
//   });
//   appShell.user   // null | { id, username, email, avatar, frame, points, lifetimePoints, isAdmin, ... }
//   window.addEventListener('appshell:auth', e => { /* e.detail = appShell.user */ });
//   appShell.refreshAuth()  // /api/me を取り直す（ポイント変動後など）
//   ログイン状態のキャッシュ(localStorage.muto_login_cache・有効 7 日): ページを開いた瞬間はキャッシュでログイン済み表示にし、
//   裏で /api/me を確かめる(401 ならログアウト表示に戻す)。index.html 用に cachedLogin / rememberLogin / forgetLogin も公開。
//   appShell.update({ loggedIn, name, points, avatar, frame, isAdmin })  // 表示だけ手動更新したい場合
//   appShell.setOutline([{ id, html, level }], { title, wideOnly, current })  // ページ内の見出しジャンプ。ドロワーを開くと左に並んで開く
//                                          //   title=パネルの見出し(既定「このページ」)、wideOnly=狭い画面では出さない、
//                                          //   current=開いた時に印を付ける id(省略時はスクロール位置から決める)
//                                          //   id=飛び先の要素 id、html=表示(信頼済み HTML)、level=1|2(2 は字下げ)。null/[] で消す
//
// nav 項目の描画規則:
//   - href があり onClick が無ければ <a href>（通常遷移）
//   - それ以外は <button>（クリックで onClick を呼び、ドロワーを閉じる）
//   - key !== 'home' && key !== 'race' の項目は [data-auth] 付き（未ログイン時に隠す）
//   - adminOnly の項目は [data-admin] 付き（管理者以外は隠す）
(function () {
  try { var _t = localStorage.getItem('mutou_theme'); if (_t && _t !== 'navy') document.documentElement.setAttribute('data-theme', _t); } catch (e) {}
  var SUPABASE_URL      = 'https://gwknnqceiozbmxrqjcae.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_4MgSWSr8bbuUf5Vp_LSD6Q_SI-ciZ2B';
  var ADMIN_EMAIL = 'kabu6113450@gmail.com';

  var opts = null;
  var els = {};
  var drawer = null, backdrop = null, outline = null, outlineOpts = {};
  var _sb = null;
  var user = null, token = null;

  function sbClient() {
    if (_sb) return _sb;
    if (!window.supabase) return null;
    try { _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); } catch (e) { _sb = null; }
    return _sb;
  }

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class')      el.className = attrs[k];
      else if (k === 'text')  el.textContent = attrs[k];
      else if (k === 'html')  el.innerHTML = attrs[k];
      else                    el.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }

  function buildBar(host) {
    host.className = 'appshell-bar';
    host.innerHTML = '';

    var brand  = h('a',   { 'class': 'appshell-brand', href: '/', text: '武藤模試' });
    var spacer = h('span', { 'class': 'appshell-spacer' });

    var idBtn = h('button', { 'class': 'appshell-btn', type: 'button', text: 'IDでログイン' });
    idBtn.addEventListener('click', function () { opts.onIdLogin && opts.onIdLogin(); });

    var googleBtn = h('button', { 'class': 'appshell-btn primary', type: 'button', text: 'Googleでログイン' });
    googleBtn.addEventListener('click', function () { opts.onGoogleLogin && opts.onGoogleLogin(); });

    var notifBtn = h('button', { 'class': 'notif-btn appshell-icon', type: 'button', title: 'お知らせ' });
    notifBtn.innerHTML = '🔔<span class="notif-badge" id="notif-badge">2</span>';
    notifBtn.addEventListener('click', function () { opts.onNotif && opts.onNotif(); });

    var avatar = h('div', { 'class': 'avatar', id: 'auth-avatar', title: 'アイコン変更', text: '🐸' });
    avatar.addEventListener('click', function () { opts.onAvatar && opts.onAvatar(); });
    var nameB   = h('b',    { 'data-role': 'name' });
    var pointsS = h('span', { 'data-role': 'points' });
    var nameWrap = h('span', { 'class': 'appshell-name' }, [avatar, nameB, pointsS]);

    var burger = h('button', {
      'class': 'appshell-hamburger', type: 'button',
      'aria-label': 'メニュー', 'aria-expanded': 'false', text: '☰'
    });
    burger.addEventListener('click', toggleDrawer);

    [brand, spacer, idBtn, googleBtn, notifBtn, nameWrap, burger].forEach(function (n) { host.appendChild(n); });

    els = {
      idBtn: idBtn, googleBtn: googleBtn, notifBtn: notifBtn,
      nameWrap: nameWrap, avatar: avatar, nameB: nameB, pointsS: pointsS, burger: burger
    };
  }

  function buildDrawer() {
    backdrop = h('div', { 'class': 'appshell-backdrop' });
    backdrop.addEventListener('click', closeDrawer);

    drawer = h('nav', { 'class': 'appshell-drawer', 'aria-hidden': 'true' });

    var head = h('div', { 'class': 'appshell-drawer-head', 'data-role': 'drawer-head' });
    drawer.appendChild(head);
    els.drawerHead = head;

    var siblingsHost = h('div', { 'class': 'appshell-drawer-siblings' });
    drawer.appendChild(siblingsHost);
    els.siblingsHost = siblingsHost;
    siblingsHost.addEventListener('click', function (e) { if (e.target.closest('a')) closeDrawer(); });

    (opts.nav || []).forEach(function (item) {
      var inner = [
        h('span', { 'class': 'appshell-drawer-ico', text: item.icon || '' }),
        item.label || ''
      ];
      var node;
      if (item.href && !item.onClick) {
        node = h('a', { href: item.href }, inner);
        node.addEventListener('click', function () { closeDrawer(); });
      } else {
        node = h('button', { type: 'button' }, inner);
        node.addEventListener('click', function () {
          closeDrawer();
          if (item.onClick) item.onClick();
        });
      }
      if (item.id) node.id = item.id;
      if (item.adminOnly) node.setAttribute('data-admin', '1');
      if (item.key !== 'home' && item.key !== 'race') node.setAttribute('data-auth', '1');
      drawer.appendChild(node);
    });

    var logout = h('button', {
      'class': 'appshell-drawer-logout', type: 'button', 'data-role': 'logout', text: 'ログアウト'
    });
    logout.addEventListener('click', function () {
      closeDrawer();
      if (opts.onLogout) opts.onLogout();
    });
    drawer.appendChild(logout);
    els.logout = logout;

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);
  }

  // ── ページ内の見出しジャンプ(ドロワーの左に並ぶ別パネル。スクロールはドロワーと独立) ──
  function setOutline(items, o) {
    outlineOpts = o || {};
    var wasOpen = !!(outline && outline.classList.contains('open'));
    if (outline) { outline.remove(); outline = null; }
    document.body.classList.remove('appshell-has-outline');
    if (!items || !items.length) return;
    outline = h('nav', { 'class': 'appshell-outline', 'aria-label': 'このページの見出し' });
    // スマホでは見出しが先に開く。☰ で今までのメニューへ切り替える(ヘッダーの ☰ は背景の下になり押せないため)
    var menuBtn = h('button', { 'class': 'appshell-outline-menu', type: 'button', 'aria-label': 'メニューを開く', html: '<span>メニュー</span>' });
    menuBtn.addEventListener('click', showMenu);
    outline.appendChild(h('div', { 'class': 'appshell-outline-head' }, [h('span', { text: outlineOpts.title || 'このページ' }), menuBtn]));
    items.forEach(function (it) {
      var a = h('a', { href: '#' + it.id, 'class': 'lv' + (it.level || 1), 'data-target': it.id, html: it.html || '' });
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var t = document.getElementById(it.id);
        closeDrawer();
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      outline.appendChild(a);
    });
    document.body.appendChild(outline);
    document.body.classList.add('appshell-has-outline');
    // 作り直し(合格の ✓ 更新など)で開いていた状態を保つ。スマホでメニュー表示中は見出しを重ねない
    if (wasOpen || (drawer && drawer.classList.contains('open') && !NARROW.matches)) openOutline();
  }
  // 今読んでいる見出しに印を付け、その項目が見える位置までパネルをスクロールする
  function outlineUsable() { return !!outline && !(outlineOpts.wideOnly && NARROW.matches); }
  function openOutline() {
    if (!outlineUsable()) return;
    outline.classList.add('open');
    var links = outline.querySelectorAll('a[data-target]'), cur = null;
    links.forEach(function (a) {
      a.removeAttribute('aria-current');
      var t = document.getElementById(a.getAttribute('data-target'));
      if (t && t.getBoundingClientRect().top < window.innerHeight * 0.35) cur = a;
    });
    if (outlineOpts.current) cur = outline.querySelector('a[data-target="' + outlineOpts.current + '"]') || cur;
    if (!cur && links.length) cur = links[0];
    if (cur) {
      cur.setAttribute('aria-current', 'location');
      outline.scrollTop = Math.max(0, cur.offsetTop - outline.clientHeight / 3);
    }
  }

  // ── 同じ試験（year/grade/exam 一致）への横断ナビ ──────────────────
  // quiz-nav.js（quiz.html 専用）の同等機能を、data.json を持たないページ
  // （まとめ・掲示ページ等。tests/_legacy.json に path 登録されているもの）にも出す。
  // 現在の URL が /api/tests のどれかの path と一致した場合だけ描画するので、
  // テストとして登録されていないページ（scores.html 等）では何も出ない＝ノーコスト。
  function groupHtml(label, itemsHtml) {
    return '<div class="appshell-drawer-group">' + escHtml(label) + '</div>' + itemsHtml;
  }

  function siblingsHtml(tests, self) {
    var same = tests.filter(function (t) {
      return t.year === self.year && t.grade === self.grade && t.exam === self.exam;
    });
    var sameSubject = same.filter(function (t) { return t.subject === self.subject; });
    var otherSubject = same.filter(function (t) { return t.subject !== self.subject; });

    var html = '';
    var g1 = sameSubject.map(function (t) {
      var label = t.title || t.subject || '';
      if (t.path === self.path) {
        return '<span aria-current="page" tabindex="-1">' + escHtml(label) + '（表示中）</span>';
      }
      return '<a href="' + escHtml(t.path) + '">' + escHtml(label) + '</a>';
    }).join('');
    if (g1) html += groupHtml('同じ試験・' + (self.subject || ''), g1);

    if (otherSubject.length) {
      var g2 = otherSubject.map(function (t) {
        var label = (t.subject || '') + ' — ' + (t.title || t.subject || '');
        return '<a href="' + escHtml(t.path) + '">' + escHtml(label) + '</a>';
      }).join('');
      html += groupHtml('同じ試験・他の科目', g2);
    }
    return html;
  }

  function loadTestSiblings() {
    var here = location.pathname + location.search;
    fetch('/api/tests').then(function (r) { return r.ok ? r.json() : null; })
      .then(function (tests) {
        if (!Array.isArray(tests) || !els.siblingsHost) return;
        var self = tests.filter(function (t) { return t.path === here; })[0];
        if (!self) return;
        els.siblingsHost.innerHTML = siblingsHtml(tests, self);
      })
      .catch(function () { /* 登録なし/取得失敗ならメニューのみのまま */ });
  }

  var NARROW = window.matchMedia('(max-width:639px)');
  function showMenu() {
    if (outline) outline.classList.remove('open');
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    var first = drawer.querySelector('a:not([hidden]),button:not([hidden])');
    if (first) first.focus();
  }
  function openDrawer() {
    if (outlineUsable() && NARROW.matches) {
      // スマホ: まず見出しだけ。メニューは見出しパネルの ☰ から
      backdrop.classList.add('open');
      els.burger.setAttribute('aria-expanded', 'true');
      openOutline();
      document.addEventListener('keydown', onKey);
      return;
    }
    drawer.classList.add('open');
    backdrop.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    els.burger.setAttribute('aria-expanded', 'true');
    openOutline();
    document.addEventListener('keydown', onKey);
    var first = drawer.querySelector('a:not([hidden]),button:not([hidden])');
    if (first) first.focus();
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    els.burger.setAttribute('aria-expanded', 'false');
    if (outline) outline.classList.remove('open');
    document.removeEventListener('keydown', onKey);
  }
  function toggleDrawer() {
    if (drawer.classList.contains('open') || (outline && outline.classList.contains('open'))) closeDrawer(); else openDrawer();
  }
  function onKey(e) { if (e.key === 'Escape') closeDrawer(); }

  // ── ログイン状態のキャッシュ ─────────────────────────────
  // 中身はユーザー表示用の情報だけ。認証そのものはトークン(muto_session / Supabase セッション)で、サーバーが毎回確かめる。
  var CACHE_KEY = 'muto_login_cache', CACHE_TTL = 7 * 24 * 3600 * 1000;
  var SB_KEY = 'sb-' + SUPABASE_URL.replace(/^https:\/\//, '').split('.')[0] + '-auth-token';

  function normUser(me) {
    return {
      id: me.id, username: me.username, email: me.email || '',
      avatar: me.avatar || '🐸', frame: me.frame || 'default',
      points: me.points || 0, lifetimePoints: me.lifetime_points != null ? me.lifetime_points : (me.lifetimePoints || 0),
      unlockedAvatars: me.unlockedAvatars || [], title: me.title || '',
      isAdmin: (me.email || '') === ADMIN_EMAIL
    };
  }
  // 今すぐ使えるトークン(同期で読める分だけ)。Supabase は保存済みセッションの期限が 60 秒以上残っていれば使う
  function quickToken(src) {
    try {
      if (src === 'custom') return localStorage.getItem('muto_session') || null;
      var raw = localStorage.getItem(SB_KEY); if (!raw) return null;
      var ss = JSON.parse(raw); ss = ss && (ss.currentSession || ss);
      if (ss && ss.access_token && ss.expires_at && ss.expires_at * 1000 > Date.now() + 60000) return ss.access_token;
    } catch (e) {}
    return null;
  }
  function hasSession(src) {
    try { return src === 'custom' ? !!localStorage.getItem('muto_session') : !!localStorage.getItem(SB_KEY); } catch (e) { return false; }
  }
  function readCache() {
    try {
      var c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (!c || !c.user || !c.user.id || Date.now() - c.at > CACHE_TTL || !hasSession(c.src)) return null;
      return c;
    } catch (e) { return null; }
  }
  function writeCache(u, src) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ user: u, src: src, at: Date.now() })); } catch (e) {}
  }
  function clearCache() { try { localStorage.removeItem(CACHE_KEY); } catch (e) {} }

  // ── 認証 ──────────────────────────────────────────────
  var emittedKey = null; // 最後に appshell:auth を出した時の「誰が・どのトークンで」。同じなら再送しない(ページの二重読み込みを防ぐ)
  function showHeader(u) {
    window.appShell.update({
      loggedIn: !!u, name: u && u.username, points: u && u.points,
      avatar: u && u.avatar, frame: u && u.frame, isAdmin: !!(u && u.isAdmin)
    });
  }
  function applyUser() {
    window.appShell.user = user;
    window.appShell.token = token;
    window.appShell.update({
      loggedIn: !!user,
      name:     user && user.username,
      points:   user && user.points,
      avatar:   user && user.avatar,
      frame:    user && user.frame,
      isAdmin:  !!(user && user.isAdmin)
    });
    var key = user ? user.id + '|' + token : '';
    if (key === emittedKey) return;
    emittedKey = key;
    try { window.dispatchEvent(new CustomEvent('appshell:auth', { detail: user })); } catch (e) {}
  }

  function resolveAuth() {
    var src = localStorage.getItem('muto_session') ? 'custom' : 'sb';
    // 1) キャッシュがあれば、確認を待たずにログイン済みで描く
    var cached = readCache();
    if (cached && cached.src === src) {
      var qt = quickToken(src);
      if (qt) { user = cached.user; token = qt; applyUser(); }
      else showHeader(cached.user); // トークン更新待ち(Supabase の期限切れ直後): 見た目だけ先に出し、ページへの通知は確認後
    }
    // 2) 裏でトークンと /api/me を確かめる
    var p = Promise.resolve(localStorage.getItem('muto_session'));
    if (src === 'sb') {
      var c = sbClient();
      if (c) p = c.auth.getSession().then(function (r) {
        return (r && r.data && r.data.session && r.data.session.access_token) || null;
      }).catch(function () { return null; });
    }
    return p.then(function (t) {
      if (!t || !window.api) { clearCache(); token = null; user = null; applyUser(); return; }
      return window.api.get('/api/me').then(function (me) {
        token = t; user = normUser(me);
        writeCache(user, src);
        applyUser();
      }).catch(function (e) {
        if (e && e.status === 401) {
          if (src === 'custom') localStorage.removeItem('muto_session');
          clearCache(); token = null; user = null; applyUser();
          return;
        }
        // 通信エラー等: キャッシュがあればログイン済みのまま(トークンはサーバー側で毎回確かめられる)
        if (cached && cached.src === src) { token = t; user = cached.user; applyUser(); }
        else { token = null; user = null; applyUser(); }
      });
    });
  }

  function defaultGoogleLogin() {
    var c = sbClient();
    if (!c) { alert('ログイン機能を読み込めませんでした'); return; }
    c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin, skipBrowserRedirect: true } })
      .then(function (r) {
        if (r.error) { alert('Supabaseエラー: ' + r.error.message); return; }
        if (r.data && r.data.url) location.href = r.data.url;
      });
  }
  function defaultIdLogin() { location.href = '/login.html'; }

  // ── アバター／フレーム／名前 変更モーダル（index.html から移設）─────────────
  // id は index.html の #avatar-modal-bg 等と衝突しないよう appshell- プレフィックス。
  var AVATAR_NAMES = { '😼': 'ひろと', '😏': '考え方やな' };
  var AVATARS = [
    '🐸','🐙','🦑','🪲','🦠','🧟','👁️','🫠','🤡','💀',
    '👾','🫀','🧠','🪳','🦷','🐛','🫁','🤢','🕷️','🦂',
    '🐊','🐀','🧌','👽','🫦','🦴','🩸','🧛','🧜','🧝',
    '🎃','🪄','🌑','🌪️','🫧','🕯️','🪦','🩻','🧿','🫐',
    '🔥','💎','👑','⚡','🌙','☠️','🎭','🗿','🌊','🍄'
  ];
  var FRAMES = [
    { id: 'default', name: 'なし' }, { id: 'silver', name: 'シルバー' },
    { id: 'gold', name: 'ゴールド' }, { id: 'teal', name: 'ティール' },
    { id: 'red', name: 'レッド' }, { id: 'purple', name: 'パープル' },
    { id: 'rainbow', name: 'レインボー' },
    { id: 'worst', name: 'ワースト記念', hidden: true },
    { id: 'baka', name: 'バカ記念', hidden: true }
  ];
  var avModal = null, selAvatar = '🐸', selFrame = 'default';

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function applyFrameEl(el, frame) {
    el.className = el.className.replace(/frame-\S+/g, '').trim();
    el.classList.add('avatar', 'frame-' + (frame || 'default'));
  }

  function buildAvatarModal() {
    if (avModal) return;
    avModal = h('div', { 'class': 'modal-bg', id: 'appshell-avatar-modal' });
    avModal.innerHTML =
      '<div class="modal">' +
        '<h2>アイコンを選ぶ</h2>' +
        '<div class="pts-tiles">' +
          '<div class="pts-tile">' +
            '<div class="pts-tile-label">シーズンpt</div>' +
            '<div class="pts-tile-value" id="appshell-season-pts">―</div></div>' +
          '<div class="pts-tile">' +
            '<div class="pts-tile-label">個人pt（累計）</div>' +
            '<div class="pts-tile-value pts-tile-value--amber" id="appshell-lifetime-pts">―</div></div>' +
        '</div>' +
        '<div class="ui-field"><label class="ui-label" for="appshell-username-input">プレイヤーネーム</label>' +
          '<input id="appshell-username-input" class="ui-input" type="text" maxlength="20"></div>' +
        '<div class="avatar avatar-lg" id="appshell-avatar-preview">🐸</div>' +
        '<div class="avatar-grid" id="appshell-avatar-grid"></div>' +
        '<div class="frame-section"><h3>フレームを選ぶ</h3><div class="frame-grid" id="appshell-frame-grid"></div></div>' +
        '<div class="modal-btns" style="margin-top:16px">' +
          '<button type="button" id="appshell-avatar-save" class="ui-btn ui-btn--primary">保存</button>' +
          '<button type="button" id="appshell-avatar-close" class="ui-btn ui-btn--ghost">閉じる</button>' +
        '</div>' +
        '<div class="modal-msg" id="appshell-avatar-msg"></div>' +
      '</div>';
    document.body.appendChild(avModal);

    avModal.addEventListener('click', function (e) { if (e.target === avModal) closeAvatarModal(); });
    avModal.querySelector('#appshell-avatar-save').addEventListener('click', saveAvatarModal);
    avModal.querySelector('#appshell-avatar-close').addEventListener('click', closeAvatarModal);
    avModal.querySelector('#appshell-avatar-grid').addEventListener('click', function (e) {
      var d = e.target.closest('[data-av]'); if (d) selectAvatar(d.getAttribute('data-av'));
    });
    avModal.querySelector('#appshell-frame-grid').addEventListener('click', function (e) {
      var d = e.target.closest('[data-fr]'); if (d) selectFrame(d.getAttribute('data-fr'));
    });
  }

  function renderAvatarGrid() {
    var unlocked = (user && user.unlockedAvatars) || [];
    var special = unlocked.filter(function (e) { return AVATARS.indexOf(e) < 0; });
    var specialHtml = special.length ? (
      '<div style="width:100%;font-size:.72rem;color:var(--teal);letter-spacing:.1em;font-weight:600;margin:8px 0 4px">⭐ アンロック済み</div>' +
      special.map(function (e) {
        var label = AVATAR_NAMES[e] || '';
        return '<div class="avatar-opt avatar-opt-named' + (e === selAvatar ? ' selected' : '') + '" data-av="' + escHtml(e) +
          '" style="border-color:var(--amber)">' + e + (label ? '<div class="avatar-opt-label">' + escHtml(label) + '</div>' : '') + '</div>';
      }).join('') +
      '<div style="width:100%;font-size:.72rem;color:var(--dim);letter-spacing:.1em;font-weight:600;margin:8px 0 4px">通常</div>'
    ) : '';
    avModal.querySelector('#appshell-avatar-grid').innerHTML = specialHtml + AVATARS.map(function (e) {
      return '<div class="avatar-opt' + (e === selAvatar ? ' selected' : '') + '" data-av="' + escHtml(e) + '">' + e + '</div>';
    }).join('');
  }
  function renderFrameGrid() {
    avModal.querySelector('#appshell-frame-grid').innerHTML = FRAMES.filter(function (f) { return !f.hidden; }).map(function (f) {
      return '<div class="frame-opt frame-' + f.id + (f.id === selFrame ? ' selected' : '') + '" data-fr="' + f.id + '" title="' + escHtml(f.name) +
        '"><span style="font-size:1.1rem">😀</span></div>';
    }).join('');
  }
  function selectAvatar(emoji) {
    selAvatar = emoji;
    var prev = avModal.querySelector('#appshell-avatar-preview');
    prev.textContent = emoji;
    renderAvatarGrid();
  }
  function selectFrame(id) {
    selFrame = id;
    applyFrameEl(avModal.querySelector('#appshell-avatar-preview'), id);
    renderFrameGrid();
  }
  function openAvatarModal() {
    if (!avModal) buildAvatarModal();
    selAvatar = (user && user.avatar) || '🐸';
    selFrame  = (user && user.frame) || 'default';
    avModal.querySelector('#appshell-username-input').value = (user && user.username) || '';
    avModal.querySelector('#appshell-season-pts').textContent = ((user && user.points) || 0).toLocaleString() + 'pt';
    avModal.querySelector('#appshell-lifetime-pts').textContent = ((user && user.lifetimePoints) || 0).toLocaleString() + 'pt';
    var prev = avModal.querySelector('#appshell-avatar-preview');
    prev.textContent = selAvatar;
    applyFrameEl(prev, selFrame);
    avModal.querySelector('#appshell-avatar-msg').textContent = '';
    renderAvatarGrid();
    renderFrameGrid();
    avModal.classList.add('open');
  }
  function closeAvatarModal() {
    if (avModal) { avModal.classList.remove('open'); avModal.querySelector('#appshell-avatar-msg').textContent = ''; }
  }
  function saveAvatarModal() {
    var msg = avModal.querySelector('#appshell-avatar-msg');
    var newName = avModal.querySelector('#appshell-username-input').value.trim();
    if (!newName) { msg.textContent = '名前を入力してください'; msg.style.color = 'var(--bad)'; return; }
    if (!window.api) { msg.textContent = '通信できません'; msg.style.color = 'var(--bad)'; return; }
    window.api.put('/api/avatar', { avatar: selAvatar, frame: selFrame, username: newName }).then(function (data) {
      if (data && data.ok) {
        try {
          localStorage.setItem('muto_avatar', selAvatar);
          localStorage.setItem('muto_frame', selFrame);
        } catch (e) {}
        msg.textContent = '保存した！'; msg.style.color = 'var(--teal)';
        setTimeout(closeAvatarModal, 800);
        window.appShell.refreshAuth();
      } else {
        msg.textContent = (data && data.error) || '保存に失敗しました'; msg.style.color = 'var(--bad)';
      }
    }).catch(function () { msg.textContent = '通信エラー'; msg.style.color = 'var(--bad)'; });
  }

  window.appShell = {
    user: null,
    token: null,
    mount: function (host, options) {
      if (!host) { console.warn('[app-shell] mount: host element not found'); return; }
      opts = options || {};
      if (!opts.onGoogleLogin) opts.onGoogleLogin = defaultGoogleLogin;
      if (!opts.onIdLogin)     opts.onIdLogin     = defaultIdLogin;
      if (!opts.onLogout)      opts.onLogout      = function () { window.appShell.logout(); };
      if (!opts.onAvatar)      opts.onAvatar      = openAvatarModal;   // 既定＝内蔵アバターピッカー
      buildBar(host);
      buildDrawer();
      buildAvatarModal();
      this.update({ loggedIn: false });
      if (opts.manageAuth !== false) resolveAuth();
      loadTestSiblings();
    },
    refreshAuth: function () { return resolveAuth(); },
    // index.html(manageAuth:false)用: キャッシュの読み書き。cachedLogin() は今すぐ使えるトークンがある時だけ { user, token } を返す
    cachedLogin: function () {
      var c = readCache(); if (!c) return null;
      var src = localStorage.getItem('muto_session') ? 'custom' : 'sb';
      if (c.src !== src) return null;
      var t = quickToken(src);
      return t ? { user: c.user, token: t } : null;
    },
    rememberLogin: function (me) {
      if (!me || !me.id) return;
      writeCache(normUser(me), localStorage.getItem('muto_session') ? 'custom' : 'sb');
    },
    forgetLogin: clearCache,
    setOutline: setOutline,
    logout: function () {
      var c = sbClient();
      var done = function () {
        localStorage.removeItem('muto_session');
        localStorage.removeItem('muto_user');
        localStorage.removeItem('muto_points');
        clearCache();
        token = null; user = null; applyUser();
      };
      if (c && c.auth && c.auth.signOut) c.auth.signOut().then(done, done);
      else done();
    },
    update: function (state) {
      state = state || {};
      var on = !!state.loggedIn;
      var ptsStr = (state.points != null ? Number(state.points).toLocaleString() : '0') + 'pt';

      els.idBtn.hidden     = on;
      els.googleBtn.hidden = on;
      // お知らせベルは onNotif を渡したページ（index.html）だけに出す。
      // 独立ページはお知らせパネルを持たないので非表示。
      els.notifBtn.hidden  = !on || !opts.onNotif;
      els.nameWrap.hidden  = !on;
      els.logout.hidden    = !on;
      els.drawerHead.hidden = !on;

      els.nameB.textContent   = state.name || '';
      els.pointsS.textContent = ptsStr;
      if (state.avatar) els.avatar.textContent = state.avatar;
      els.avatar.className = 'avatar frame-' + (state.frame || 'default');
      els.drawerHead.textContent =
        (state.avatar || '🐸') + ' ' + (state.name || '') + ' ・ ' + ptsStr;

      drawer.querySelectorAll('[data-auth]').forEach(function (n) { n.hidden = !on; });
      drawer.querySelectorAll('[data-admin]').forEach(function (n) { n.hidden = !(on && state.isAdmin); });
    },
    setBadge: function (n) {
      var b = document.getElementById('notif-badge');
      if (b) b.textContent = n;
    }
  };
})();
