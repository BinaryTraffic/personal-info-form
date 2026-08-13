# 全銀マスタ（zengin-code 連携）

Public Reference。実行時は外部APIに依存せず、生成済み JSON のみを参照する。

## 構成

```text
reference/zengin/
  meta.json
  banks.json
  branches/{bank_code}.json
```

各レコード例:

```json
{
  "name": "三菱ＵＦＪ",
  "kana": "ミツビシユ－エフジエイ",
  "search_kana": "ミツビシユーエフジエイ"
}
```

`search_kana` は検索用の派生フィールド（元データとは分離）。

## 更新

```bash
npm run sync:zengin
```
