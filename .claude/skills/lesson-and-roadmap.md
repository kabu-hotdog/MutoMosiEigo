---
name: lesson-and-roadmap
description: 学習ページ(lesson.html)とロードマップ(roadmap.html)の JSON の書き方
metadata:
  type: reference
---

# 学習ページとロードマップ

HTML は作らない。JSON だけ書く。エンジンは `js/lesson-engine.js` と `js/roadmap-engine.js`。動くサンプルは `lessons/_sample/data.json`・`lessons/_sample/quiz.json`・`roadmaps/_sample.json`。

| 何を | どこに置く | 開く URL |
|---|---|---|
| 学習ページ | `lessons/{名前}/data.json` | `/lesson.html?d=lessons/{名前}/data.json` |
| ロードマップ | `roadmaps/{名前}.json` | `/roadmap.html?d=roadmaps/{名前}.json` |

注意: `tests/` の下には置かない(`/api/tests` がクイズとして拾ってしまう)。ホームや ☰ メニューに出すには `tests/_legacy.json` に1件足す(`path` に URL、`type:"summary"`、`storageKey:null`、`totalItems:0`)。

## 1. 学習ページ JSON

```jsonc
{
  "year": 2026, "grade": 4, "exam": "後期中間試験", "subject": "情報ネットワーク工学",
  "title": "情報ネットワーク工学 ・ 学習 第1回 通信の歴史と略語",
  "storageKey": "ine_learn_01_v1",   // 回ごとに一意。ロードマップの done.lesson と同じ文字列にする
  "minutes": 40,
  "goals": ["この回が終わると言えること", "…", "…"],
  "katex": true,                      // 数式($...$)を使うなら true
  "terms": [ { "name": "ADSL", "full": "Asymmetric Digital Subscriber Line", "plain": "やさしい説明" } ],
  "blocks": [
    {
      "id": "b1",                     // 回の中で一意。保存キーに使う。後から変えない
      "title": "見出し=一言の結論",
      "pre":   [ /* 事前の問い 1〜2問。single か numeric。採点しない。「外れて当然」と出る */ ],
      "body":  "本文(HTML可。3〜5行、300〜500字)",
      "fig":   "<svg viewBox=\"0 0 320 80\">…</svg>",   // 任意。ラベルは図の中に書く。色は currentColor か CSS 変数
      "example": { "steps": ["手順1", "手順2"], "fill": { /* 最後の一手。single か numeric */ } },  // 任意
      "check": [ /* 確認問題 3問。1問は「なぜ」を問う */ ]
    }
  ],
  "summary": { "rows": [["用語", "一言"]], "write3": "紙に3行、友達に説明するつもりで書く:(お題)" },   // 任意
  "final": [ /* 回末チェック 5〜6問(この回4〜5問+前の回1〜2問) */ ],
  "next":  [ { "label": "演習 ② 第1回へ", "href": "/quiz.html?d=tests/…/data.json#s1" } ],
  "footer": "出典"
}
```

### 問題の書き方(quiz-engine の single / numeric と同じ)

```jsonc
// 単一選択(type は省略可)。ans は選択肢の文字列そのもの(数値インデックスでも可)
{ "type": "single", "q": "問題文", "opts": ["A","B","C"], "ans": "A", "note": "解説" }

// 数値。parts[].ans は数値。許容誤差は abs(絶対) → tol(相対) → 既定 相対2%
{ "type": "numeric", "q": "問題文", "parts": [ { "label": "(1)", "ans": 12.5, "unit": "MB", "abs": 0.05 } ],
  "hint": "…", "reveal": ["解説1行目", "2行目"], "note": "正解後の解説" }
```

- 選択肢は表示のたびにシャッフルされる(「すべて」「①②」を含む選択肢だけは並び替えない。`"noShuffle": true` でも止められる)。
- `multi` / `sort` / `input` / `flashcard` は学習ページでは使えない。
- 数式: `$...$`(行内)、`$$...$$`(別行)。JSON では `\` を `\\` と書く(`\\dfrac`)。`<` は `\lt`。`"katex": true` が必要。
- 本文・選択肢・解説の HTML は信頼する前提でそのまま innerHTML。ユーザー入力は入れない。

### 動き(作る時に知っておくこと)

- 確認問題:正解は ○、不正解は ×+解説。間違えた問題は、次の1問をはさんでから「もう一度」として再出題。
- ブロック合格:確認問題の初回の正答率が 8割以上(3問なら3問とも)で「合格」の印。届かなければ「本文を読み直す」ボタン。
- 回末チェック:初回 8割以上で「学習済み」(`localStorage[storageKey].learned = 1`)。ロードマップがこれを読む。
- 「要点だけ表示」で本文・図・例題・事前の問いを畳む(2周目用)。
- 事前の問い・例題の最後の一手は合格判定に入らない。
- 進み具合は `localStorage[storageKey]` に保存される。問題を増減・並び替えしたら `storageKey` の版(`_v1` → `_v2`)を上げる。

## 2. ロードマップ JSON

```jsonc
{
  "year": 2026, "grade": 4, "exam": "後期中間試験", "subject": "情報ネットワーク工学",
  "title": "情報ネットワーク工学 ・ ロードマップ",
  "intro": "上から順にやる。迷ったら一番上の未完了から。\n正答率が5割を割った回は、学習ページのそのブロックに戻る。",
  "storageKey": "ine_roadmap_v1",     // 手動チェックの保存先
  "steps": [
    { "id": "L1", "phase": "学習", "label": "学習 第1回 通信の歴史と略語",
      "href": "/lesson.html?d=lessons/network-01/data.json", "minutes": 40, "why": "なぜこの順か(一言)",
      "done": { "lesson": "ine_learn_01_v1" } },
    { "id": "P1", "phase": "演習1周目", "label": "② セルフチェック(Moodle そのまま)",
      "href": "/quiz.html?d=tests/2026-4-kouki-chukan-network-selfcheck/data.json", "minutes": 25, "why": "…",
      "done": { "quiz": "ine_chukan_selfcheck_v2", "total": 50 } },
    { "id": "E1", "phase": "前日", "label": "前日: 誤答だけ見直す", "minutes": 15, "why": "…" }   // done なし=手動チェックのみ
  ]
}
```

- `id` は一意。手動チェックの保存キーになるので後から変えない。
- `phase` が変わるところで見出しが入る。日付は出さない。
- `done.lesson` = その学習ページの `storageKey`(回末チェック合格で自動チェック)。
- `done.quiz` = クイズ data.json の `storageKey`、`total` = そのクイズの**問題数**(全セクションの `qs` の合計。numeric は小問ではなく1問と数える。flashcard も1問)。数え間違えると自動チェックが付かない/早く付く。
- クイズの自動チェック:全問に回答(○でも×でも)したら付く。バーは「答えた数 / total」、横に正答率。5問以上答えて正答率が5割未満だと「学習ページに戻る」と赤字で出る。
- 手動チェックは自動より優先。「自動に戻す」で解除できる。
- 一番上の未完了の行に「次はこれ」が付く。
- クイズの回答は `localStorage[storageKey]` の `{ "<セクションid>_<番号>": 1 か -1 }` から読む(`_数字`で終わるキーだけ数える)。
