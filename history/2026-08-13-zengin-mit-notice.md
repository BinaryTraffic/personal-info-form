# 2026-08-13 全銀マスタの MIT 表記

## 何をしたか

`zengin-code`（MIT）由来であることの帰属・ライセンス表記を README / `reference/zengin/` / 同期スクリプトに追加した。

## なぜか

パブリックリポジトリ公開にあたり、MIT が求める著作権表示・許諾文の同梱が不足していたため。

## 関連ファイル

- `README.md`
- `reference/zengin/README.md`
- `reference/zengin/LICENSE-zengin-code.txt`
- `scripts/sync-zengin.mjs`（sync 時に LICENSE / 表記を再出力）
- `package.json`（`files` に LICENSE を追加）

## 追記（郵便番号）

郵便番号は全銀と異なりローカル同梱ではない。`zipcloud` API 利用である旨と、日本郵便データの著作権方針・zipcloud 規約へのリンクをルート `README.md` に併記した。

## 未決事項

- 本リポジトリ本体のライセンス（現在 `UNLICENSED`）をどうするかは別途
- 本番で外部 API（zipcloud）依存を続けるか、日本郵便公式 API / ローカルマスタに寄せるか
