// ロードマップの描画エンジン。roadmap.html が window.initRoadmap(data) を呼ぶ。
// JSON の書き方: .claude/skills/lesson-and-roadmap.md
(function () {

var CSS = `
.rm-wrap{max-width:820px;margin:0 auto;padding:18px 16px 90px;line-height:1.65}
.rm-wrap *{box-sizing:border-box}
.rm-listlink{font-size:.8rem;margin-bottom:6px}.rm-listlink a{color:var(--muted);text-decoration:underline}
.rm-eyebrow{font-size:.72rem;letter-spacing:.14em;color:var(--teal);font-weight:700}
.rm-wrap h1{margin:6px 0 8px;font-size:1.55rem;line-height:1.3;font-family:"Zen Kaku Gothic New","Noto Sans JP",sans-serif}
.rm-intro{color:var(--muted);font-size:.92rem;margin:0 0 14px}
.rm-intro p{margin:0 0 9px;line-height:1.7}
.rm-intro b{color:var(--teal);font-weight:700}
.rm-total{display:flex;align-items:center;gap:10px;margin-bottom:6px}
.rm-total .n{font-weight:700;color:var(--teal);white-space:nowrap;font-size:.92rem}
.rm-track{flex:1;height:8px;background:var(--card2);border-radius:99px;overflow:hidden;min-width:80px}
.rm-track i{display:block;height:100%;width:0;background:var(--teal);border-radius:99px;transition:width .4s}
.rm-phase{margin:26px 0 8px;font-size:.8rem;font-weight:800;letter-spacing:.06em;color:var(--amber)}
.rm-row{display:flex;gap:12px;align-items:flex-start;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-bottom:8px}
.rm-row.next{border-color:var(--teal);box-shadow:0 0 0 2px var(--accent-ring,rgba(70,214,196,.3))}
.rm-row.done{opacity:.72}
.rm-chk{flex-shrink:0;width:26px;height:26px;margin-top:1px;accent-color:var(--teal);cursor:pointer}
.rm-main{flex:1;min-width:0}
.rm-label{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.rm-label a{color:var(--ink);font-weight:700;text-decoration:none;overflow-wrap:anywhere}
.rm-label a:hover{color:var(--teal);text-decoration:underline}
.rm-row.done .rm-label a{text-decoration:line-through}
.rm-badge{font-size:.7rem;font-weight:800;color:var(--on-accent,#04221e);background:var(--teal);border-radius:999px;padding:2px 9px;white-space:nowrap}
.rm-min{font-size:.78rem;color:var(--dim);white-space:nowrap}
.rm-why{font-size:.85rem;color:var(--muted);margin-top:2px;overflow-wrap:anywhere}
.rm-auto{display:flex;align-items:center;gap:8px;margin-top:7px;font-size:.78rem;color:var(--muted);flex-wrap:wrap}
.rm-auto .track{width:120px;max-width:40%;height:6px;background:var(--card2);border-radius:99px;overflow:hidden}
.rm-auto .track i{display:block;height:100%;background:var(--teal)}
.rm-warn{color:var(--bad);font-weight:700}
.rm-link{font-family:inherit;font-size:.76rem;color:var(--teal);background:none;border:none;padding:0;cursor:pointer;text-decoration:underline}
@media(max-width:480px){.rm-wrap h1{font-size:1.3rem}.rm-row{padding:11px 11px;gap:10px}}
`;

var D, KEY, M = {}; // M = { manual: { id: true|false } }

function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

function readJSON(key) {
  try { var v = JSON.parse(localStorage.getItem(key) || 'null'); return (v && typeof v === 'object') ? v : null; } catch (e) { return null; }
}
function loadM() { M = readJSON(KEY) || {}; M.manual = M.manual || {}; }
function saveM() { try { localStorage.setItem(KEY, JSON.stringify(M)); } catch (e) {} }

// クイズの保存形式(quiz-engine の _state):
//   1問 = キー "<sectionId>_<index>" に 1(正解)/-1(不正解)。末尾が "_数字" のキーだけが1問に対応する。
//   numeric の小問は "<key>_p<n>"、選択は "<key>_pick" などで、末尾が数字だけでないので数えない。
//   total は問題数(単語帳含む)。numeric は小問に1つでも不正解があると -1 になる(あとで直せば 1)。
function quizStat(key, total, sec) {
  var s = readJSON(key) || {};
  var answered = 0, correct = 0;
  Object.keys(s).forEach(function (k) {
    if (!/_\d+$/.test(k)) return;
    if (sec && !([].concat(sec)).some(function (x) { return k.indexOf(x + '_') === 0; })) return;
    if (s[k] === 1) { answered++; correct++; }
    else if (s[k] === -1) answered++;
  });
  if (total && answered > total) answered = total;
  return { answered: answered, correct: correct, total: total || 0 };
}

function autoState(step) {
  var d = step.done || {};
  if (d.lesson) {
    var s = readJSON(d.lesson);
    return { kind: 'lesson', done: !!(s && s.learned) };
  }
  if (d.quiz) {
    var q = quizStat(d.quiz, d.total, d.section);
    return { kind: 'quiz', q: q, done: q.total > 0 && q.answered >= q.total };
  }
  return null;
}

function render() {
  var app = document.getElementById('app');
  app.innerHTML = '';
  var wrap = el('div', 'rm-wrap');
  app.appendChild(wrap);
  var steps = D.steps || [];

  var states = steps.map(function (st) {
    var a = autoState(st);
    var man = M.manual[st.id];
    var checked = (man !== undefined) ? !!man : !!(a && a.done);
    return { a: a, man: man, checked: checked };
  });
  var doneN = states.filter(function (s) { return s.checked; }).length;
  var nextIdx = states.findIndex(function (s) { return !s.checked; });

  wrap.appendChild(el('div', 'rm-eyebrow', 'ROADMAP'));
  if (D.subject) wrap.appendChild(el('div', 'rm-listlink', '<a href="/?list=' + encodeURIComponent(D.subject) + '">テストを1つずつ選ぶ(一覧)</a>　<a href="/">ホームへ</a>'));
  wrap.appendChild(el('h1', '', D.title));
  if (D.intro) {
    var introHtml = String(D.intro).split('\n').filter(Boolean).map(function (ln) {
      var esc = ln.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return '<p>' + esc.replace(/^【([^】]+)】/, '<b>$1</b>　') + '</p>';
    }).join('');
    wrap.appendChild(el('div', 'rm-intro', introHtml));
  }
  wrap.appendChild(el('div', 'rm-total',
    '<span class="n">' + doneN + ' / ' + steps.length + ' 完了</span><div class="rm-track"><i style="width:' + (steps.length ? doneN / steps.length * 100 : 0) + '%"></i></div>'));

  var lastPhase = null;
  steps.forEach(function (st, i) {
    var s = states[i];
    if (st.phase && st.phase !== lastPhase) { wrap.appendChild(el('div', 'rm-phase', st.phase)); lastPhase = st.phase; }
    var row = el('div', 'rm-row' + (s.checked ? ' done' : '') + (i === nextIdx ? ' next' : ''));
    var chk = el('input', 'rm-chk'); chk.type = 'checkbox'; chk.checked = s.checked;
    chk.setAttribute('aria-label', st.label + ' を完了にする');
    chk.addEventListener('change', function () {
      M.manual[st.id] = chk.checked; saveM(); render();
    });
    var main = el('div', 'rm-main');
    var nameHtml = st.href ? '<a href="' + st.href + '">' + st.label + '</a>' : '<span>' + st.label + '</span>';
    main.appendChild(el('div', 'rm-label',
      (i === nextIdx ? '<span class="rm-badge">次はこれ</span>' : '') + nameHtml + (st.minutes ? '<span class="rm-min">約' + st.minutes + '分</span>' : '')));
    if (st.why) main.appendChild(el('div', 'rm-why', st.why));

    if (s.a) {
      var info = '';
      if (s.a.kind === 'quiz') {
        var q = s.a.q;
        var pct = q.total ? Math.min(100, q.answered / q.total * 100) : 0;
        var acc = q.answered ? Math.round(q.correct / q.answered * 100) : null;
        info = '<span>' + q.answered + ' / ' + q.total + ' 問</span><span class="track"><i style="width:' + pct + '%"></i></span>' +
          (acc !== null ? '<span class="' + (acc < 50 && q.answered >= 5 ? 'rm-warn' : '') + '">正答率 ' + acc + '%' + (acc < 50 && q.answered >= 5 ? '(学習ページに戻る)' : '') + '</span>' : '');
      } else {
        info = '<span>' + (s.a.done ? '学習済み(自動)' : '回末チェックで初回8割 → 自動でチェック') + '</span>';
      }
      if (s.man !== undefined) info += '<button class="rm-link" type="button">自動に戻す</button>';
      var auto = el('div', 'rm-auto', info);
      var back = auto.querySelector('.rm-link');
      if (back) back.addEventListener('click', function () { delete M.manual[st.id]; saveM(); render(); });
      main.appendChild(auto);
    }
    row.appendChild(chk); row.appendChild(main);
    wrap.appendChild(row);
  });
}

window.initRoadmap = function (data) {
  D = data; KEY = data.storageKey || ('roadmap_' + (data.title || 'x'));
  document.title = (data.title || 'ロードマップ') + ' ・ 武藤模試';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  loadM();
  var app = document.getElementById('app'); app.style.cssText = '';
  render();
  // 別タブで進めた分を、戻ってきた時に反映する
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { loadM(); render(); } });
  window.addEventListener('focus', function () { loadM(); render(); });
};

})();
