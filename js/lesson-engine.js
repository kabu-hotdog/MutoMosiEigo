// 学習ページの描画エンジン。lesson.html が window.initLesson(data) を呼ぶ。
// JSON の書き方: .claude/skills/lesson-and-roadmap.md
(function () {

var CSS = `
.ls-wrap{max-width:820px;margin:0 auto;padding:18px 16px 90px;line-height:1.7}
.ls-wrap *{box-sizing:border-box}
.ls-hero{padding:8px 2px 14px}
.ls-eyebrow{font-size:.72rem;letter-spacing:.14em;color:var(--teal);font-weight:700}
.ls-hero h1{margin:6px 0 6px;font-size:1.55rem;line-height:1.3;font-family:"Zen Kaku Gothic New","Noto Sans JP",sans-serif}
.ls-meta{color:var(--muted);font-size:.85rem}
.ls-bar{position:sticky;top:46px;z-index:50;background:var(--bar-bg,var(--bg));backdrop-filter:blur(10px);border-bottom:1px solid var(--line);margin:0 -16px;padding:9px 16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.ls-bar .num{font-size:.9rem;color:var(--teal);font-weight:700;white-space:nowrap}
.ls-bar .track{flex:1;min-width:90px;height:7px;background:var(--card2);border-radius:99px;overflow:hidden}
.ls-bar .track i{display:block;height:100%;width:0;background:var(--teal);border-radius:99px;transition:width .4s}
.ls-btn{font-family:inherit;font-size:.85rem;font-weight:600;color:var(--on-accent,#04221e);background:var(--teal);border:none;border-radius:10px;padding:8px 14px;cursor:pointer}
.ls-btn:hover{filter:brightness(1.08)}
.ls-btn.ghost{background:none;color:var(--muted);border:1px solid var(--line);font-weight:500}
.ls-btn.ghost:hover{color:var(--ink);border-color:var(--teal-d)}
.ls-btn.on{background:var(--accent-soft);color:var(--teal);border:1px solid var(--accent-line)}
.ls-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin-top:14px}
.ls-card h3{margin:0 0 8px;font-size:.95rem}
.ls-card ul{margin:0;padding-left:1.2em}
.ls-card li{margin:3px 0}
details.ls-terms summary{cursor:pointer;font-weight:700;font-size:.95rem}
.ls-term{padding:7px 0;border-top:1px solid var(--line);font-size:.88rem}
.ls-term:first-of-type{margin-top:8px}
.ls-term b{color:var(--teal)}
.ls-term .full{color:var(--dim);font-size:.8rem;display:block}
.ls-tp{position:fixed;left:0;right:0;bottom:0;z-index:70;max-height:55vh;overflow-y:auto;background:var(--card);border-top:2px solid var(--teal);box-shadow:0 -8px 24px rgba(0,0,0,.35);padding:0 16px 14px}
.ls-tp[hidden]{display:none}
.ls-tp .ls-tph{position:sticky;top:0;background:var(--card);display:flex;align-items:center;justify-content:space-between;padding:10px 0 6px;font-weight:700;font-size:.95rem}
.ls-tp .ls-term:first-of-type{margin-top:0}
.ls-block{margin-top:40px;scroll-margin-top:110px}
.ls-bh{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px}
.ls-bn{flex-shrink:0;font-size:.74rem;font-weight:800;color:var(--teal);background:var(--accent-soft);border:1px solid var(--accent-line);border-radius:999px;padding:3px 10px;margin-top:4px;white-space:nowrap}
.ls-bh h2{margin:0;font-size:1.2rem;line-height:1.4;font-family:"Zen Kaku Gothic New","Noto Sans JP",sans-serif;flex:1}
.ls-stamp{display:none;flex-shrink:0;font-size:.78rem;font-weight:800;color:var(--good);border:2px solid var(--good);border-radius:8px;padding:2px 9px;transform:rotate(-5deg);margin-top:3px;white-space:nowrap}
.ls-block.passed .ls-stamp{display:inline-block}
.ls-sub{font-size:.76rem;font-weight:700;color:var(--amber);letter-spacing:.05em;margin:18px 0 6px}
.ls-pre{background:var(--card2);border:1px dashed var(--line-strong,var(--line));border-radius:12px;padding:12px 14px}
.ls-pre .hint{font-size:.8rem;color:var(--muted);margin-bottom:6px}
.ls-body{font-size:1rem;color:var(--ink);overflow-wrap:anywhere}
.ls-body p{margin:.5em 0}
.ls-fig{margin-top:12px;background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:12px 10px;overflow-x:auto}
.ls-fig svg{display:block;max-width:100%;height:auto;margin:0 auto}
.ls-example{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--amber);border-radius:10px;padding:12px 14px}
.ls-example ol{margin:0 0 6px;padding-left:1.4em}
.ls-example li{margin:4px 0}
.ls-q{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:13px 14px;margin-top:10px}
.ls-q.ok{border-color:var(--good-line,var(--good))}
.ls-q.ng{border-color:var(--bad-line,var(--bad))}
.ls-q .qh{font-size:.72rem;font-weight:700;color:var(--teal);margin-bottom:4px}
.ls-q .qh.retry{color:var(--amber)}
.ls-q .prompt{font-size:.98rem;overflow-wrap:anywhere}
.ls-opts{display:flex;flex-direction:column;gap:7px;margin-top:10px}
.ls-opt{font-family:inherit;font-size:.93rem;color:var(--ink);background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:10px 13px;cursor:pointer;text-align:left;overflow-wrap:anywhere}
.ls-opt:hover:not(:disabled){border-color:var(--teal-d)}
.ls-opt:disabled{cursor:default}
.ls-opt .lab{color:var(--teal);margin-right:7px;font-weight:700}
.ls-opt.right{background:var(--good-soft);border-color:var(--good)}
.ls-opt.wrong{background:var(--bad-soft);border-color:var(--bad)}
.ls-fb{margin-top:10px;font-size:.9rem}
.ls-fb .v{font-weight:800}
.ls-fb .v.g{color:var(--good)}
.ls-fb .v.b{color:var(--bad)}
.ls-fb .n{color:var(--muted);margin-top:3px}
.ls-np{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px}
.ls-np input{font-family:inherit;font-size:.95rem;color:var(--ink);background:var(--field-bg,var(--bg2));border:1px solid var(--line);border-radius:10px;padding:8px 11px;width:140px;max-width:100%;outline:none}
.ls-np input:focus{border-color:var(--teal-d)}
.ls-np input.ok{border-color:var(--good)}
.ls-np input.ng{border-color:var(--bad)}
.ls-np .u{font-size:.85rem;color:var(--muted)}
.ls-np .f{font-size:.85rem;font-weight:700}
.ls-np .f.g{color:var(--good)}
.ls-np .f.b{color:var(--bad)}
.ls-acts{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.ls-hintbox{margin-top:8px;padding:8px 12px;border-left:3px solid var(--amber);background:var(--bg2);border-radius:0 8px 8px 0;font-size:.86rem;color:var(--muted);white-space:pre-line}
.ls-res{margin-top:12px;font-size:.92rem}
.ls-res .pass{color:var(--good);font-weight:800}
.ls-res .fail{color:var(--amber);font-weight:700}
.ls-fig img,.ls-fig svg{cursor:zoom-out}
.fig-small img,.fig-small svg{cursor:zoom-in;max-width:220px!important;max-height:170px;width:auto}
.ls-sum{overflow-x:auto}
.ls-sum table{width:100%;border-collapse:collapse;font-size:.9rem}
.ls-sum th,.ls-sum td{border-bottom:1px solid var(--line);padding:7px 8px;text-align:left;vertical-align:top;overflow-wrap:anywhere}
.ls-sum td:first-child{font-weight:700;color:var(--teal);white-space:nowrap}
.ls-write3{margin-top:12px;padding:12px 14px;background:var(--card2);border:1px dashed var(--line-strong,var(--line));border-radius:10px;font-size:.92rem}
.nx-bar{display:flex;flex-direction:column;align-items:stretch;gap:8px;margin:26px 0 8px}
.nx-btn{display:block;text-align:center;padding:14px 16px;border-radius:12px;background:var(--teal,#46d6c4);color:var(--on-accent,#04221e);font-weight:700;text-decoration:none;line-height:1.5}
.nx-btn:hover{filter:brightness(1.07)}
.nx-sub{text-align:center;font-size:.82rem;color:var(--muted);text-decoration:underline}
.nx-bottom{margin-top:40px}
.ls-next{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.ls-next a{display:block;padding:11px 14px;background:var(--card);border:1px solid var(--line);border-radius:10px;color:var(--teal);text-decoration:none;font-weight:700}
.ls-next a:hover{border-color:var(--teal-d)}
.ls-footer{margin-top:40px;padding-top:16px;border-top:1px solid var(--line);color:var(--dim);font-size:.8rem}
.ls-wrap.compact .ls-body,.ls-wrap.compact .ls-fig,.ls-wrap.compact .ls-example,.ls-wrap.compact .ls-pre{display:none}
.ls-wrap .katex-display{overflow-x:auto;overflow-y:hidden;max-width:100%}
.ls-body,.ls-q .prompt,.ls-example,.ls-opt,.ls-hintbox,.ls-fb{max-width:100%;overflow-x:auto}
@media(max-width:480px){.ls-hero h1{font-size:1.3rem}.ls-bh{flex-wrap:wrap}}
@media(min-width:1000px){
.ls-wrap{max-width:1120px}
.ls-block.has-fig{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);column-gap:28px;align-items:start}
.ls-block.has-fig>*{grid-column:1/-1}
.ls-block.has-fig>.ls-body:not(.ls-sub){grid-column:1}
.ls-block.has-fig>.ls-fig{grid-column:2;margin-top:0;position:sticky;top:110px}
.ls-block.multi-fig>.ls-body:not(.ls-sub){grid-column:1/-1}
.ls-block.multi-fig>.ls-fig{grid-column:1/-1;margin-top:12px;position:static;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;align-items:start}
.ls-block.multi-fig>.ls-fig>*{margin:0!important;min-width:0}
}
`;

var D, KEY, S = {};

function $(sel, root) { return (root || document).querySelector(sel); }
function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

function loadState() {
  try { S = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { S = {}; }
  S.q = S.q || {}; S.blocks = S.blocks || {}; S.pre = S.pre || {};
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  if (window.progressSave) window.progressSave(KEY, S); // ログイン中ならサーバーにも控えを残す
}
function mergeInto(dst, src) {
  var chg = false;
  Object.keys(src || {}).forEach(function (k) {
    var v = src[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (!dst[k] || typeof dst[k] !== 'object') { dst[k] = {}; }
      if (mergeInto(dst[k], v)) chg = true;
    } else if (v && !dst[k]) { dst[k] = v; chg = true; }
  });
  return chg;
}

function typeset(root) {
  if (!window.renderMathInElement) return;
  try {
    renderMathInElement(root, {
      delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
      throwOnError: false
    });
  } catch (e) {}
}

// ---- 問題の準備(quiz-engine と同じ規則) ----
var SELF_NUMBERED = /^\s*(?:[①-⑳]|\(?[A-Ea-e]\)[.．]?\s|[A-Ea-e][.．]\s)/;
var CROSS_REF = /すべて|全て|上記|下記|いずれも|どれも|両方|該当なし|正しいものはない|と.{0,4}が正解|および.{0,4}が正解/;

function prep(q0) {
  var q = JSON.parse(JSON.stringify(q0));
  if (Array.isArray(q.opts) && !q.type) q.type = 'single';
  if (q.type === 'single' && Array.isArray(q.opts)) {
    if (typeof q.ans === 'number' && q.opts[q.ans] !== undefined) q.ans = q.opts[q.ans];
  }
  return q;
}
function shuffled(q) {
  var c = JSON.parse(JSON.stringify(q));
  if (c.type !== 'single' || !Array.isArray(c.opts) || c.noShuffle) return c;
  if (c.opts.some(function (o) { return SELF_NUMBERED.test(String(o)) || CROSS_REF.test(String(o)); })) return c;
  for (var i = c.opts.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1)); var t = c.opts[i]; c.opts[i] = c.opts[j]; c.opts[j] = t;
  }
  return c;
}
function labelChar(i) { return String.fromCharCode(65 + i) + '.'; }

function numOk(part, v) {
  if (part.mult) v = v * part.mult;
  var diff = Math.abs(v - part.ans), scale = Math.max(1, Math.abs(part.ans));
  if (typeof part.abs === 'number') return diff <= Math.max(part.abs, 1e-9 * scale);
  if (typeof part.tol === 'number') return diff <= Math.max(part.tol * Math.abs(part.ans), 1e-9 * scale);
  if (part.angle) return diff <= 2;
  return diff <= 0.02 * Math.abs(part.ans);
}

// ---- 問題カード ----
// opt: { label, kind:'pre'|'graded'|'retry', rec, first, onFirst(r), onWrong(card), onOk() }
//   rec  = S.q[qid] の記録 { r: 初回結果(1/-1), ok: 最終的に正解, pick, pf }
//   first = true なら初回結果(rec.r)を記録する。retry は false。
function buildCard(q, opt) {
  var card = el('div', 'ls-q');
  var rec = opt.rec || {};
  var kind = opt.kind;
  if (q.type === 'numeric') buildNumeric(card, q, opt, rec);
  else buildSingle(card, q, opt, rec);
  return card;
}

function head(q, opt) {
  return '<div class="qh' + (opt.kind === 'retry' ? ' retry' : '') + '">' + (opt.label || '') + '</div>' +
    (q.q != null ? '<div class="prompt">' + q.q + '</div>' : '') +
    (q.svg ? '<div class="ls-fig">' + q.svg + '</div>' : '');
}

function buildSingle(card, q, opt, rec) {
  var sq = opt.kind === 'retry' ? shuffled(q) : q;
  var answered = false;
  card.innerHTML = head(sq, opt) + '<div class="ls-opts"></div><div class="ls-fb" hidden></div>';
  var box = $('.ls-opts', card), fb = $('.ls-fb', card);
  var btns = [];
  sq.opts.forEach(function (o, i) {
    var b = el('button', 'ls-opt', '<span class="lab">' + labelChar(i) + '</span>' + o);
    b.type = 'button';
    b.addEventListener('click', function () { choose(o); });
    box.appendChild(b); btns.push(b);
  });
  function show(pick) {
    answered = true;
    var ok = pick === sq.ans;
    btns.forEach(function (b, i) {
      b.disabled = true;
      var o = sq.opts[i];
      if (opt.kind === 'pre') { if (o === sq.ans) b.classList.add('right'); return; }
      if (o === sq.ans) b.classList.add('right');
      if (o === pick && !ok) b.classList.add('wrong');
    });
    fb.hidden = false;
    if (opt.kind === 'pre') {
      fb.innerHTML = '<div class="v">答え: ' + sq.ans + '</div>' + (sq.note ? '<div class="n">' + sq.note + '</div>' : '');
    } else {
      card.classList.add(ok ? 'ok' : 'ng');
      fb.innerHTML = '<div class="v ' + (ok ? 'g' : 'b') + '">' + (ok ? '○ 正解' : '× 不正解') + '</div>' + (sq.note ? '<div class="n">' + sq.note + '</div>' : '');
    }
    typeset(card);
  }
  function choose(pick) {
    if (answered) return;
    var ok = pick === sq.ans;
    if (opt.kind === 'pre') { if (opt.rec) { opt.rec.pick = pick; save(); } show(pick); return; }
    if (opt.first && rec.r === undefined) { rec.r = ok ? 1 : -1; rec.pick = pick; }
    if (ok) rec.ok = 1;
    save();
    show(pick);
    if (opt.first && opt.onFirst && rec.r !== undefined && !opt._reported) { opt._reported = true; opt.onFirst(rec.r); }
    if (ok) { if (opt.onOk) opt.onOk(); } else if (opt.onWrong) opt.onWrong(card);
  }
  // 復元
  if (opt.kind === 'pre' && rec.pick !== undefined) show(rec.pick);
  else if (opt.first && opt.kind === 'graded' && rec.r !== undefined && rec.pick !== undefined) { opt._reported = true; show(rec.pick); }
}

function buildNumeric(card, q, opt, rec) {
  var parts = q.parts || [];
  var st = [];
  card.innerHTML = head(q, opt) + '<div class="np-wrap"></div><div class="ls-acts"></div><div class="np-hint"></div><div class="ls-fb" hidden></div>';
  var wrap = $('.np-wrap', card), acts = $('.ls-acts', card), fb = $('.ls-fb', card);
  var inputs = [], fbs = [], btns = [];
  var restoredOk = !!rec.ok && opt.kind !== 'pre';
  parts.forEach(function (pt, pi) {
    var row = el('div', 'ls-np');
    var inp = el('input'); inp.setAttribute('inputmode', 'decimal'); inp.placeholder = '答え';
    var f = el('span', 'f'); var b = el('button', 'ls-btn', '確認'); b.type = 'button';
    if (pt.label) row.appendChild(el('span', 'u', pt.label));
    row.appendChild(inp);
    if (pt.unit) row.appendChild(el('span', 'u', pt.unit));
    row.appendChild(b); row.appendChild(f);
    wrap.appendChild(row);
    inputs.push(inp); fbs.push(f); btns.push(b);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(pi); });
    b.addEventListener('click', function () { check(pi); });
    if (restoredOk) lockOk(pi, pt.ans / (pt.mult || 1));
  });
  if (restoredOk) { parts.forEach(function (_, i) { st[i] = 1; }); finish(true); }
  if (q.hint) {
    var hb = el('button', 'ls-btn ghost', 'ヒント'); hb.type = 'button';
    var hx = $('.np-hint', card); hx.className = 'ls-hintbox'; hx.hidden = true; hx.innerHTML = q.hint;
    hb.addEventListener('click', function () { hx.hidden = !hx.hidden; typeset(hx); });
    acts.appendChild(hb);
  }
  if (q.reveal) {
    var rb = el('button', 'ls-btn ghost', '解答を見る'); rb.type = 'button';
    var rv = Array.isArray(q.reveal) ? q.reveal : [q.reveal];
    rb.addEventListener('click', function () {
      fb.hidden = false;
      fb.innerHTML = '<div class="n">' + rv.map(function (s) { return '<div>' + s + '</div>'; }).join('') + '</div>';
      typeset(fb);
    });
    acts.appendChild(rb);
  }
  function lockOk(pi, val) {
    inputs[pi].value = String(+val.toFixed(6)); inputs[pi].disabled = true; inputs[pi].className = 'ok';
    btns[pi].hidden = true; fbs[pi].className = 'f g'; fbs[pi].textContent = '✓ 正解';
  }
  function finish(silent) {
    card.classList.add('ok');
    if (q.note) { fb.hidden = false; fb.innerHTML = '<div class="v g">○ 正解</div><div class="n">' + q.note + '</div>'; typeset(fb); }
    if (!silent && opt.onOk) opt.onOk();
  }
  function check(pi) {
    var pt = parts[pi];
    if (st[pi] === 1) return;
    var v = parseFloat(String(inputs[pi].value || '').replace(/[,，\s]/g, ''));
    if (isNaN(v)) { inputs[pi].className = 'ng'; return; }
    var ok = numOk(pt, v);
    st[pi] = ok ? 1 : -1;
    rec.pf = rec.pf || [];
    if (opt.first && rec.pf[pi] === undefined) rec.pf[pi] = ok ? 1 : -1;
    if (ok) lockOk(pi, v);
    else { inputs[pi].className = 'ng'; fbs[pi].className = 'f b'; fbs[pi].textContent = '✗ もう一度'; }
    var allOk = parts.every(function (_, i) { return st[i] === 1; });
    if (opt.first && rec.r === undefined && parts.every(function (_, i) { return rec.pf[i] !== undefined; })) {
      rec.r = rec.pf.every(function (x) { return x === 1; }) ? 1 : -1;
      if (opt.onFirst) opt.onFirst(rec.r);
    }
    if (allOk) rec.ok = 1;
    save();
    if (allOk) finish(false);
  }
}

// ---- 評価 ----
function rate(ids) {
  var n = 0, c = 0;
  for (var i = 0; i < ids.length; i++) {
    var r = (S.q[ids[i]] || {}).r;
    if (r === undefined) return null;
    n++; if (r === 1) c++;
  }
  return { n: n, c: c, p: n ? c / n : 0 };
}

function updateBar() {
  var total = D.blocks.length;
  var passed = D.blocks.filter(function (b) { return (S.blocks[b.id] || {}).passed; }).length;
  $('#lsNum').textContent = '合格 ' + passed + ' / ' + total + (S.learned ? '　学習済み ✓' : '');
  $('#lsTrack').style.width = (total ? passed / total * 100 : 0) + '%';
}

function showBlockResult(b) {
  var r = rate(b.check.map(function (_, i) { return b.id + '_c' + i; }));
  var box = document.getElementById('res_' + b.id);
  var blk = document.getElementById('blk_' + b.id);
  if (!r || !box) return;
  var pass = r.p >= 0.8;
  S.blocks[b.id] = { passed: pass ? 1 : 0, c: r.c, n: r.n };
  save();
  blk.classList.toggle('passed', pass);
  if (pass) box.innerHTML = '<span class="pass">合格 ✓</span>　初回 ' + r.c + ' / ' + r.n + '。次のブロックへ進もう。';
  else {
    box.innerHTML = '<span class="fail">初回 ' + r.c + ' / ' + r.n + '。本文を読み直してから、間違えた問題をもう一度。</span><div class="ls-acts"><button class="ls-btn" type="button">本文を読み直す</button></div>';
    $('button', box).addEventListener('click', function () {
      if (document.querySelector('.ls-wrap').classList.contains('compact')) toggleCompact(false);
      var t = document.getElementById('body_' + b.id) || blk;
      t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  updateBar();
}

function showFinalResult() {
  var r = rate(D.final.map(function (_, i) { return 'f' + i; }));
  var box = document.getElementById('res_final');
  if (!r || !box) return;
  // 他の演習と同じ: 回末の全問に答えたら学習済み(正答率は問わない)。rate() は全問答えるまで null。
  S.learned = 1;
  S.finalRes = { c: r.c, n: r.n };
  save();
  box.innerHTML = '<span class="pass">学習済み ✓</span>　初回 ' + r.c + ' / ' + r.n + '。ロードマップにチェックが付く。';
  updateBar();
}

// ---- 描画 ----
// ids と問題の並びから、カード列を container に作る。初回で間違えた問題には「間はさんで再出題」。
function renderQuestions(container, list, idPrefix, labelPrefix, afterFirst) {
  list.forEach(function (q0, i) {
    var qid = idPrefix + i;
    var q = prep(q0);
    var rec = S.q[qid] = S.q[qid] || {};
    var opt = {
      kind: 'graded', rec: rec, first: true, label: labelPrefix + (i + 1),
      onFirst: function () { afterFirst(); },
      onWrong: function (card) { addRetry(container, card, q, rec, labelPrefix + (i + 1)); },
      onOk: function () {}
    };
    var card = buildCard(q, opt);
    container.appendChild(card);
    // 復元: 初回に間違えたまま直していない問題は、再出題カードも出す
    if (rec.r === -1 && !rec.ok && q.type !== 'numeric') addRetry(container, card, q, rec, labelPrefix + (i + 1));
  });
}

function addRetry(container, afterCard, q, rec, label) {
  var opt = {
    kind: 'retry', rec: rec, first: false, label: 'もう一度 ' + label,
    onWrong: function (card) { addRetry(container, card, q, rec, label); }
  };
  var card = buildCard(q, opt);
  var ref = afterCard.nextElementSibling || afterCard;
  ref.after(card);
  typeset(card);
}

function toggleCompact(v) {
  var w = $('.ls-wrap');
  var on = v === undefined ? !w.classList.contains('compact') : v;
  w.classList.toggle('compact', on);
  S.compact = on ? 1 : 0; save();
  var b = document.getElementById('lsCompact');
  if (b) { b.textContent = on ? '全部表示に戻す' : '要点だけ表示'; b.classList.toggle('on', on); }
}

function render() {
  var app = document.getElementById('app');
  app.style.cssText = ''; app.innerHTML = '';
  var wrap = el('div', 'ls-wrap');
  app.appendChild(wrap);

  var meta = [D.subject, D.exam, D.minutes ? '目安 ' + D.minutes + '分' : ''].filter(Boolean).join(' ・ ');
  wrap.appendChild(el('div', 'ls-hero',
    '<div class="ls-eyebrow">LESSON</div><h1>' + D.title + '</h1><div class="ls-meta">' + meta + '</div>'));

  var bar = el('div', 'ls-bar',
    '<span class="num" id="lsNum"></span><div class="track"><i id="lsTrack"></i></div>' +
    ((D.terms && D.terms.length) ? '<button class="ls-btn ghost" id="lsTerms" type="button">用語</button>' : '') +
    '<button class="ls-btn ghost" id="lsCompact" type="button">要点だけ表示</button>' +
    '<button class="ls-btn ghost" id="lsReset" type="button">やり直し</button>');
  wrap.appendChild(bar);

  if (D.goals && D.goals.length) {
    wrap.appendChild(el('div', 'ls-card', '<h3>この回が終わると言えること</h3><ul>' + D.goals.map(function (g) { return '<li>' + g + '</li>'; }).join('') + '</ul>'));
  }
  if (D.terms && D.terms.length) {
    wrap.appendChild(el('details', 'ls-card ls-terms',
      '<summary>用語集(' + D.terms.length + ')</summary>' + D.terms.map(function (t) {
        return '<div class="ls-term"><b>' + t.name + '</b>' + (t.full ? '<span class="full">' + t.full + '</span>' : '') + (t.plain || '') + '</div>';
      }).join('')));
  }

  // 用語パネル: 本文を読みながら、一番上まで戻らずに用語を確認する(上部の「用語」ボタンで開閉)
  var oldTp = document.getElementById('lsTermPanel'); if (oldTp) oldTp.remove();
  if (D.terms && D.terms.length) {
    var tp = el('div', 'ls-tp',
      '<div class="ls-tph"><span>用語集(' + D.terms.length + ')</span><button class="ls-btn ghost" id="lsTermsClose" type="button">閉じる</button></div>' +
      D.terms.map(function (t) {
        return '<div class="ls-term"><b>' + t.name + '</b>' + (t.full ? '<span class="full">' + t.full + '</span>' : '') + (t.plain || '') + '</div>';
      }).join(''));
    tp.id = 'lsTermPanel'; tp.hidden = true;
    document.body.appendChild(tp);
    var tb = document.getElementById('lsTerms');
    function toggleTerms(on) {
      tp.hidden = on === undefined ? !tp.hidden : !on;
      if (tb) { tb.classList.toggle('on', !tp.hidden); tb.textContent = tp.hidden ? '用語' : '用語を閉じる'; }
    }
    if (tb) tb.onclick = function () { toggleTerms(); };
    document.getElementById('lsTermsClose').onclick = function () { toggleTerms(false); };
  }

  D.blocks.forEach(function (b, bi) {
    var sec = el('section', 'ls-block' + ((S.blocks[b.id] || {}).passed ? ' passed' : ''));
    sec.id = 'blk_' + b.id;
    if (b.fig) sec.classList.add('has-fig');
    if (b.fig && (b.fig.match(/<figure|<svg|<img/g) || []).length > 1 && (b.fig.match(/<figure/g) || []).length !== 1) sec.classList.add('multi-fig');
    sec.innerHTML = '<div class="ls-bh"><span class="ls-bn">BLOCK ' + (bi + 1) + '</span><h2>' + b.title + '</h2><span class="ls-stamp">合格</span></div>';
    if (b.pre && b.pre.length) {
      var pre = el('div', 'ls-pre', '<div class="hint">事前の問い(採点しない。外れて当然。考えてから押す)</div>');
      b.pre.forEach(function (q0, i) {
        var rid = b.id + '_pre' + i;
        S.pre[rid] = S.pre[rid] || {};
        pre.appendChild(buildCard(prep(q0), { kind: 'pre', rec: S.pre[rid], label: '問い ' + (i + 1) }));
      });
      sec.appendChild(pre);
    }
    var body = el('div', 'ls-body', b.body || ''); body.id = 'body_' + b.id;
    sec.appendChild(el('div', 'ls-sub', '本文')); sec.lastChild.classList.add('ls-body');
    sec.appendChild(body);
    if (b.fig) sec.appendChild(el('div', 'ls-fig', b.fig));
    if (b.example) {
      var ex = el('div', 'ls-example', '<b>例題</b>' + (b.example.steps && b.example.steps.length ? '<ol>' + b.example.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' : ''));
      if (b.example.fill) {
        var eid = b.id + '_ex';
        S.q[eid] = S.q[eid] || {};
        var fq = prep(b.example.fill);
        ex.appendChild(buildCard(fq, { kind: 'graded', rec: S.q[eid], first: true, label: '最後の一手', onFirst: function () {}, onWrong: function (c) { addRetry(ex, c, fq, S.q[eid], '最後の一手'); } }));
        if (S.q[eid].r === -1 && !S.q[eid].ok && fq.type !== 'numeric') addRetry(ex, ex.lastChild, fq, S.q[eid], '最後の一手');
      }
      sec.appendChild(ex);
    }
    sec.appendChild(el('div', 'ls-sub', '確認問題')); sec.lastChild.classList.remove('ls-body');
    var checks = el('div', 'ls-checks');
    sec.appendChild(checks);
    renderQuestions(checks, b.check || [], b.id + '_c', '確認 ', function () { showBlockResult(b); });
    sec.appendChild(el('div', 'ls-res')); sec.lastChild.id = 'res_' + b.id;
    wrap.appendChild(sec);
  });

  // まとめ
  if (D.summary) {
    var sm = el('section', 'ls-block ls-sum');
    sm.innerHTML = '<div class="ls-bh"><span class="ls-bn">まとめ</span><h2>この回のまとめ表</h2></div>';
    if (D.summary.rows && D.summary.rows.length) {
      sm.innerHTML += '<div class="ls-card"><table>' + D.summary.rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join('') + '</table></div>';
    }
    if (D.summary.write3) sm.appendChild(el('div', 'ls-write3', '<b>紙に書く</b><br>' + D.summary.write3));
    wrap.appendChild(sm);
  }

  // 回末チェック
  var fin = el('section', 'ls-block');
  fin.id = 'final';
  fin.innerHTML = '<div class="ls-bh"><span class="ls-bn">回末チェック</span><h2>最後に確かめる(初回8割で「学習済み」)</h2></div>';
  var fc = el('div', 'ls-checks'); fin.appendChild(fc);
  renderQuestions(fc, D.final || [], 'f', '回末 ', showFinalResult);
  fin.appendChild(el('div', 'ls-res')); fin.lastChild.id = 'res_final';
  wrap.appendChild(fin);

  if (D.roadmap) {
    // 模試と同じ「次に進む」ボタン。ロードマップの順から次のステップを引く
    var nx = el('div', 'nx-bar nx-bottom'); nx.id = 'lsNext'; wrap.appendChild(nx);
    var rmHref = '/roadmap.html?d=' + D.roadmap;
    var cur = new URLSearchParams(location.search).get('d');
    fetch('/' + D.roadmap).then(function (r) { return r.json(); }).then(function (j) {
      var steps = j.steps || [], at = -1;
      steps.forEach(function (s, i) { var m = String(s.href || '').match(/[?&]d=([^&#]+)/); if (at < 0 && m && decodeURIComponent(m[1]) === cur) at = i; });
      var n = steps[at + 1];
      nx.innerHTML = at >= 0 && n
        ? '<a class="nx-btn" href="' + n.href + '">次に進む: ' + n.label + (n.minutes ? '(約' + n.minutes + '分)' : '') + ' →</a><a class="nx-sub" href="' + rmHref + '">ロードマップへ</a>'
        : '<a class="nx-btn" href="' + rmHref + '">ロードマップへ戻る →</a>';
    }).catch(function () { nx.innerHTML = '<a class="nx-btn" href="' + rmHref + '">ロードマップへ →</a>'; });
  } else if (D.next && D.next.length) {
    wrap.appendChild(el('div', 'ls-next', D.next.map(function (n) { return '<a href="' + n.href + '">' + n.label + ' →</a>'; }).join('')));
  }
  if (D.footer) wrap.appendChild(el('div', 'ls-footer', D.footer));

  $('#lsCompact').addEventListener('click', function () { toggleCompact(); });
  $('#lsReset').addEventListener('click', function () {
    if (!confirm('この回の進み具合を消してやり直しますか?')) return;
    try { localStorage.removeItem(KEY); } catch (e) {}
    if (window.progressSaveNow) window.progressSaveNow(KEY, {});
    S = {}; loadState(); render();
  });

  // 復元した結果を表示に反映
  D.blocks.forEach(function (b) {
    if (rate(b.check.map(function (_, i) { return b.id + '_c' + i; }))) showBlockResult(b);
  });
  if (rate((D.final || []).map(function (_, i) { return 'f' + i; }))) showFinalResult();
  toggleCompact(!!S.compact);
  updateBar();
  typeset(wrap);
}

function addScript(src, onload) {
  var s = document.createElement('script'); s.src = src; s.onload = onload; document.body.appendChild(s);
}

window.initLesson = function (data) {
  D = data; KEY = data.storageKey || ('lesson_' + (data.title || 'x'));
  D.blocks = D.blocks || [];
  document.title = (data.title || '学習ページ') + ' ・ 武藤模試';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  // 図をクリックで小さく/大きく切り替え
  document.addEventListener('click', function (e) {
    var im = e.target.closest && e.target.closest('.ls-fig img,.ls-fig svg');
    if (!im) return;
    (im.closest('figure') || im.closest('.ls-fig')).classList.toggle('fig-small');
  });
  loadState();
  render();
  // 別のブラウザで進めた分を、サーバーの控えから足す(progress.js が読み込み終わったら呼ばれる)
  var _syncLesson = async function () {
    if (!window.progressLoad) return;
    var s = await window.progressLoad(KEY);
    if (!s || typeof s !== 'object' || !Object.keys(s).length) return;
    loadState();
    if (mergeInto(S, s)) { save(); render(); }
  };
  window._quizSync = _syncLesson;
  _syncLesson();
  if (data.katex && !window.renderMathInElement) {
    addScript('https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js', function () {
      addScript('https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js', function () {
        typeset(document.querySelector('.ls-wrap'));
      });
    });
  }
};

})();
