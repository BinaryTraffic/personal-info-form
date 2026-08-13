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

## 設計ドキュメント

- `docs/personal-data-interface.md`
- `history/` … 作業履歴
