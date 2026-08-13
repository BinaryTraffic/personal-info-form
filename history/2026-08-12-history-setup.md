# 2026-08-12 履歴フォルダと「久しぶり」ルールの導入

## 実施内容

- `history/` フォルダを作成し、作業履歴を Markdown で記録する運用を開始
- Cursor ルールを追加し、ユーザーが「久しぶり」と言った場合は必ず履歴・Markdown を確認するよう固定

## 関連パス

- `history/README.md` … 履歴の索引
- `.cursor/rules/work-history.mdc` … 履歴の記録ルール
- `.cursor/rules/hisashiburi-resume.mdc` … 「久しぶり」再開時の確認ルール
