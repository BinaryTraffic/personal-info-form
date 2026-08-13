# 2026-08-13 コンポーネント化（中期）とサーバーインストール対応

## 概要

個人情報フォームを埋め込み可能なコンポーネント化し、テーマ・セクション設定・公開API・Nodeサーバー配布まで対応。

## 追加

- `src/personal-info-form.js` … `PersonalInfoForm.mount` / `<personal-info-form>`
- `src/form.html` … フォームテンプレート（`data-section` 付き）
- `styles/base.css` + `styles/themes/{brand,bootstrap,material}.css`
- `public/index.html` … デモ（テーマ・セクション切替）
- `server.mjs` … 静的配信（`npm start`）
- `README.md` … サーバーインストール手順

## API

`getValue` / `setValue` / `validate` / `setTheme` / `setSections` / `reset` / `destroy`

## 起動

```bash
npm install
npm start
# http://localhost:3080/
```
