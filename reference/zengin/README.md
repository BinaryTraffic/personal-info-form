# 全銀マスタ（zengin-code 連携）

Public Reference。実行時は外部APIに依存せず、生成済み JSON のみを参照する。

## ライセンス（必須表記）

生成 JSON の元データは [zengin-code](https://github.com/zengin-code/zengin-js) です。

- License: **MIT**
- Copyright (c) 2015 Sho Kusano
- 全文: [`LICENSE-zengin-code.txt`](./LICENSE-zengin-code.txt)

本ディレクトリの内容（またはそこから再配布するマスタ）を公開・同梱する場合は、上記著作権表示と許諾文を含めてください。

## 構成

```text
reference/zengin/
  meta.json
  banks.json
  branches/{bank_code}.json
  LICENSE-zengin-code.txt
  README.md
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
