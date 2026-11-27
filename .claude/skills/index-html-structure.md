---
name: index-html-structure
description: index.html（英語模試）のデータ層・レンダリング・採点ロジック・localStorage
metadata:
  type: reference
---

# index.html — 英語模試フロント構造

## データ層（ファイル上部の const 群）

| 変数 | 内容 |
|------|------|
| `VOCAB1` / `VOCAB2` | Unit 1・2 の語彙問題（定義→単語の入力式） |
| `WORDCHOICE` | 日本語ヒント付き Word Choice（選択式） |
| `KEYPHRASE` | Exercises — Key Phrases（選択式） |
| `INDEPTH` | In-Depth Review（選択式） |
| `WRITING` | Writing Strategy 並べ替え（入力式） |
| `TF` | T/F Questions（True/False 選択） |
| `QA` | 本文 Q&A（選択式） |

## 状態管理

- `state` オブジェクトで解答状況を管理
- `localStorage`（キー: `mutou_u12`）に自動保存

## 主要関数

| 関数 | 役割 |
|------|------|
| `norm(s)` | 入力正規化（大小文字・前後空白・句読点吸収） |
| `pickOpt()` | 選択式問題の採点・UI更新 |
| `checkInput()` / `revealInput()` | 入力式採点・答え表示 |
| `render()` | `SECTIONS` 配列を走査してDOM全体を再描画 |
| `updateScore()` | スコアバーとセクション別スコアを更新 |

## 問題追加方法

- **語彙追加**: `VOCAB1` または `VOCAB2` に `["定義", "answer"]` を追加
- **選択式追加**: 対応する配列に `{u, sen/q/s, opts, ans, note}` を追加
- **並べ替え追加**: `WRITING` に `{u, jp, pre, post, bank, ans}` を追加（`ans` は並べ替え部分のみ）

## SECTIONS 配列

`{id, no, title, desc, type, data}` を追加するだけで目次(TOC)と本文に自動追加される。

## 管理者UI（index.html 内）

管理者（kabu6113450@gmail.com）のみ表示されるセクション:
- レース管理（開始・終了・ペア登録）
- バトル管理（作成・追加・終了・決着）
- 全員ポイント配布

## 認証

`localStorage` の `muto_session` に JWT トークンを保存。  
`getToken()` で取得。null の場合はログインなし状態。

**ログイン状態のキャッシュ（2026-11-27）:** `localStorage.muto_login_cache` = `{ user, src: 'custom'|'sb', at }`（有効 7 日・表示用の情報だけ）。
`app-shell.js` の `resolveAuth()` は、キャッシュがあり、同期で読めるトークン（`muto_session`、または期限が 60 秒以上残る Supabase 保存セッション `sb-<ref>-auth-token`）があれば、確認を待たずにログイン済みで描いて `appshell:auth` を出す。そのあと裏で `/api/me` を確かめ、401 ならログアウト表示に戻す。通信エラーのときはキャッシュのままにする。
`appshell:auth` は「ユーザー id＋トークン」が変わったときだけ出し直す（ページの二重読み込みを防ぐ）。
`index.html`（`manageAuth:false`）は `appShell.cachedLogin()` で先に描き、`syncUser`/`syncPasswordUser` が成功したら `rememberLogin(data)`、ログアウト・401 のときは `forgetLogin()` を呼ぶ。
