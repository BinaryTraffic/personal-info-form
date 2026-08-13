# 2026-08-12 銀行・支店の名称検索強化

## 概要

コード検索に加え、銀行名・支店名を漢字 / ひらがな / 全角カナ / 半角カナで部分一致検索できるよう改修。

## 変更

- `scripts/lib/search-normalize.mjs` … 正規化（NFKC・半角カナ・ひらがな・小書きカナ吸収）
- `scripts/sync-zengin.mjs` … 派生フィールド `search_kana` を JSON に出力
- `js/zengin-ref.js` … 優先順位付き検索（コード完全一致→名称…）
- UI 表示: `0005　三菱ＵＦＪ` 形式（コード＋名称）

## 互換性

- 保存キーは引き続き `bank_code` / `branch_code`
- コード検索は維持
- 支店は銀行確定後に `branches/{code}.json` のみ遅延読込
