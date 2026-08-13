# 2026-08-12 口座情報：Personal Data Interface 要件受領

## 概要

汎用 Personal Data Interface の基本設計を受領。現行フォームの口座欄は本設計に合わせて再構成する前提。

## 文書

- [docs/personal-data-interface.md](../docs/personal-data-interface.md)
- Cursor ルール: `.cursor/rules/bank-account-pdi.mdc`

## 現行UIへの影響（BankAccount）

| 現行フォーム | 設計上の扱い |
|---|---|
| 銀行名（テキスト） | 廃止（表示は全銀JSONから） |
| 銀行コード | **保存対象** `bank_code` |
| 支店名（テキスト） | 廃止（表示は全銀JSONから） |
| 支店コード | **保存対象** `branch_code` |
| 口座種別 | **保存対象** `account_type` |
| 口座番号 | **保存対象** `account_number` |
| 口座名義カナ | **保存対象** `account_holder` |
| ゆうちょ 記号・番号 | 要整理（全銀コード体系への寄せ or 別表現） |

## 次の実装候補

1. `reference/zengin/` のスケルトン（meta / banks / branches サンプル）
2. 口座UIをコード選択＋マスタ名称表示に変更
3. 確認ダイアログ・送信ペイロードを `bank_code` / `branch_code` 中心に変更

## 未決

- ゆうちょ（記号・番号）の正式マッピング
- 本フォームと将来の `person_id` / API の接続タイミング
