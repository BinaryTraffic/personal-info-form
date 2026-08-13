# 汎用個人情報データインターフェース 基本設計

> 出典: ユーザー提示の基本設計（2026-08-12）  
> 本プロジェクトの口座情報UI・全銀参照は本設計に従う。

## 1. 目的

個人情報および銀行口座情報を、各業務システムから独立した共通コンポジットとして管理する。

特定の業務システムに依存しない **Personal Data Interface** を定義し、給与・給与前払い・会員管理・EC・従業員管理・返金・精算など、複数のシステムから共通利用できることを目的とする。

基本原則:

> **業務システムは個人情報そのものを所有せず、個人を識別するIDを所有する。**

---

## 2. 基本思想

```text
業務システム
    │
    │ person_id
    ▼
Personal Data Interface
    │
    ├── Profile
    ├── Contact
    ├── Address
    ├── BankAccount
    ├── Identity
    ├── EmergencyContact
    ├── Consent
    └── Audit
```

業務システム側では氏名・住所・電話・銀行名などを直接管理せず、`person_id` / `bank_account_id` などの共通識別子を保持する。

---

## 3. 設計原則

### 3.1 Person中心モデル

すべての個人情報は `person_id` を中心に関連付ける。`Person` 自体には必要最小限のみ。巨大な単一レコードにしない。

### 3.2 業務IDと Person ID を分離

例: `employee_id` → `person_id`、`customer_id` → `person_id`

---

## 4. コンポーネント構成

Person / Profile / Contact / Address / BankAccount / Identity / EmergencyContact / Consent / Access Policy / Audit  
各コンポーネントは独立して取得・更新可能。

---

## 5. Public Reference と Private Data の分離

- **Public Reference**: 全銀マスタ、郵便番号、都道府県、国コードなど
- **Private Data**: 氏名、住所、電話、Email、生年月日、銀行口座
- 同一ストレージ管理単位に置かない

---

## 6. 全銀マスタ（JSON）

DB管理を必須としない。参照中心のため JSON 管理を基本とする。

```text
/reference/zengin/
  meta.json
  banks.json
  /branches/
    0001.json
    ...
```

- `banks.json`: 銀行コード → name / kana
- `branches/{bank_code}.json`: 支店コード → name / kana
- `meta.json`: source / version / updated_at
- 銀行選択後に対象支店JSONのみ読み込む
- 外部APIリアルタイム依存にしない（週次/月次でJSON更新）

---

## 7. BankAccount（Private Data）

保存フィールド:

| フィールド | 内容 |
|---|---|
| account_id | 口座ID |
| person_id | 人物ID |
| bank_code | 銀行コード（4桁） |
| branch_code | 支店コード（3桁） |
| account_type | ordinary / checking / savings 等 |
| account_number | 口座番号 |
| account_holder | 口座名義（カナ） |
| status | verified 等 |
| created_at / updated_at | 監査用 |

**銀行名・支店名は原則保存しない。** 表示時に全銀JSONから解決する。

---

## 8. API（業務名をパスに含めない）

```text
GET/POST/PATCH /persons/{person_id}/bank-accounts[/{account_id}]
```

公開は最小化（masked view 等）。完全な口座番号は明示権限がある処理のみ。

---

## 9. Access Policy / Audit / Views

- 項目・リソース単位のアクセス制御（管理者＝全閲覧、としない）
- Private Data アクセスは Audit 可能
- 保存モデルは共通、公開モデルは利用目的ごとに限定

---

## 10. Cursor実装時の基本方針（要約）

1. 業務システムと個人情報管理を疎結合にする
2. `person_id` を共通キーとする
3. 業務固有IDと `person_id` を混同しない
4. 個人情報を業務側DBへ複製しない
5. 銀行・支店名称を口座情報へ固定保存しない
6. 全銀マスタはJSON参照データとして扱う
7. 全銀JSONとPrivate Dataを同一ストレージ管理単位にしない
8. 外部APIを本番処理の必須依存先にしない
9. Access Policy で制御する
10. Audit 可能にする
11. APIに特定業務名称を持ち込まない
12. 生データを必要以上にクライアントへ返さない
13. 保存モデルと公開モデルを分離する
14. 将来別システムから再利用できることを前提に実装する
