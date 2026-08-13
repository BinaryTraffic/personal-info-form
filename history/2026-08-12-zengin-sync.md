# 2026-08-12 zengin-code 連携の実装

## 概要

全銀マスタを `zengin-code` から同期し、Public Reference JSON として配置。口座UIはコード選択＋名称解決に変更。

## 追加・変更

| パス | 内容 |
|------|------|
| `scripts/sync-zengin.mjs` | zengin-code → `reference/zengin/` 生成 |
| `package.json` | `npm run sync:zengin` / postinstall |
| `reference/zengin/` | meta / banks / branches（1146銀行・約2.9万支店） |
| `js/zengin-ref.js` | ローカルJSON読込・検索・名称解決 |
| `index.html` / `app.js` / `styles.css` | 銀行・支店サジェストUI（名称は非保存） |

## 使い方

```bash
npm install
npm run sync:zengin
```

## 設計との対応

- 保存: `bank_code` / `branch_code`（hidden）
- 表示: 全銀JSONから解決
- 実行時の外部API依存なし
