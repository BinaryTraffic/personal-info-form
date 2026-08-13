# Personal Info Form

個人情報に特化した入力フォームコンポーネントです。  
テーマ切替・セクション構成・`getValue` / `setValue` / `validate` API に対応しています。

## サーバーへインストール

```bash
# リポジトリを配置
cd /opt/personal-info-form   # 任意のパス

npm install
npm start
```

ブラウザで `http://サーバーIP:3080/` を開きます。

ポート変更:

```bash
PORT=8080 npm start
```

### systemd 例

```ini
[Unit]
Description=Personal Info Form
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/personal-info-form
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=PORT=3080

[Install]
WantedBy=multi-user.target
```

nginx リバースプロキシ例:

```nginx
location /pinfo/ {
  proxy_pass http://127.0.0.1:3080/;
}
```

※ リバースプロキシ配下では `PersonalInfoForm.mount` の `baseUrl` を合わせること。

## コンポーネントとして埋め込む

```html
<link rel="stylesheet" href="/styles/base.css" />
<link rel="stylesheet" href="/styles/themes/brand.css" />
<div id="mount"></div>
<script src="/src/personal-info-form.js"></script>
<script>
  PersonalInfoForm.mount("#mount", {
    theme: "material", // brand | bootstrap | material
    sections: ["email", "name", "gender", "birth", "phone", "address", "bank"],
    requireEmailVerification: true,
    baseUrl: "",
  }).then((api) => {
    // api.getValue()
    // api.setValue({ ... })
    // api.validate()
    // api.setTheme("bootstrap")
    // api.setSections(["name", "bank"])
  });
</script>
```

カスタム要素:

```html
<script src="/src/personal-info-form.js"></script>
<personal-info-form
  theme="bootstrap"
  sections="name,phone,address,bank"
></personal-info-form>
```

## テーマ

| 値 | 内容 |
|----|------|
| `brand` | 現行ブランド（緑） |
| `bootstrap` | Bootstrap 風 |
| `material` | Material / Google 風 |

## 公開 API

| メソッド | 説明 |
|----------|------|
| `getValue()` | 入力値オブジェクト |
| `setValue(data)` | 値の流し込み |
| `validate()` | 全体バリデーション（boolean） |
| `setTheme(name)` | テーマ切替 |
| `setSections([...])` | 表示セクション切替 |
| `reset()` | クリア |
| `destroy()` | アンマウント |

## 全銀マスタ更新

```bash
npm run sync:zengin
```

`reference/zengin/` に JSON を再生成します（実行時の外部 API 依存なし）。

銀行・支店マスタは [zengin-code](https://github.com/zengin-code/zengin-js)（MIT License, Copyright (c) 2015 Sho Kusano）を同期して生成しています。ライセンス全文は `reference/zengin/LICENSE-zengin-code.txt` を参照してください。生成 JSON を再配布する場合も、同ライセンス表記を同梱してください。

## 郵便番号・住所検索

住所の郵便番号検索は、リポジトリ内に郵便番号簿を同梱せず、実行時に [zipcloud 郵便番号検索 API](https://zipcloud.ibsnet.co.jp/)（株式会社アイビス）を呼び出しています。

- API 利用条件: [郵便番号検索API利用規約](https://zipcloud.ibsnet.co.jp/rule/api)（MIT ではない。規約への同意が前提。ライセンスは提供者側の判断で終了し得る）
- データの出所: 日本郵便が公開する郵便番号データ（zipcloud が再配信）。[日本郵便の説明](https://www.post.japanpost.jp/service/search/zipcode/download/readme.html)では、郵便番号データに限っては著作権を主張せず自由に配布してよいとされています
- 本フォームではマスタ JSON を再配布していないため、全銀のようなライセンスファイル同梱は不要です。利用・商用展開時は zipcloud 規約を確認してください

## 設計ドキュメント

- `docs/personal-data-interface.md`
- `history/` … 作業履歴
