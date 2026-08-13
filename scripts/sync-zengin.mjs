#!/usr/bin/env node
/**
 * zengin-code から Public Reference JSON を生成する。
 * 実行時は外部APIに依存せず、生成済み JSON のみを参照する。
 *
 * Usage:
 *   npm run sync:zengin
 */
import { createRequire } from "node:module";
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSearchKana } from "./lib/search-normalize.mjs";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "reference", "zengin");
const branchesDir = path.join(outDir, "branches");

function pickBank(entry) {
  const name = entry.name ?? "";
  const kana = entry.kana ?? "";
  return {
    name,
    kana,
    search_kana: buildSearchKana(kana),
  };
}

function pickBranch(entry) {
  const name = entry.name ?? "";
  const kana = entry.kana ?? "";
  return {
    name,
    kana,
    search_kana: buildSearchKana(kana),
  };
}

async function main() {
  let zenginCode;
  try {
    zenginCode = require("zengin-code");
  } catch {
    console.error(
      "zengin-code が見つかりません。先に `npm install` を実行してください。"
    );
    process.exit(1);
  }

  await rm(outDir, { recursive: true, force: true });
  await mkdir(branchesDir, { recursive: true });

  const banks = {};
  let branchFileCount = 0;
  let branchRecordCount = 0;

  for (const [bankCode, bank] of Object.entries(zenginCode)) {
    banks[bankCode] = pickBank(bank);

    const branches = {};
    const sourceBranches = bank.branches || {};
    for (const [branchCode, branch] of Object.entries(sourceBranches)) {
      branches[branchCode] = pickBranch(branch);
      branchRecordCount += 1;
    }

    await writeFile(
      path.join(branchesDir, `${bankCode}.json`),
      `${JSON.stringify(branches)}\n`,
      "utf8"
    );
    branchFileCount += 1;
  }

  const now = new Date();
  const version = now.toISOString().slice(0, 10).replaceAll("-", "");
  const meta = {
    source: "zengin-code",
    package: "zengin-code",
    source_repository: "https://github.com/zengin-code/zengin-js",
    license: "MIT",
    license_file: "LICENSE-zengin-code.txt",
    copyright: "Copyright (c) 2015 Sho Kusano",
    version,
    updated_at: now.toISOString().replace(/\.\d{3}Z$/, "+00:00"),
    bank_count: Object.keys(banks).length,
    branch_file_count: branchFileCount,
    branch_record_count: branchRecordCount,
    search_fields: ["code", "name", "kana", "search_kana"],
  };

  const zenginLicense = `The MIT License (MIT)

Copyright (c) 2015 Sho Kusano

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Source package: zengin-code (https://github.com/zengin-code/zengin-js)
`;

  await writeFile(
    path.join(outDir, "banks.json"),
    `${JSON.stringify(banks)}\n`,
    "utf8"
  );
  await writeFile(
    path.join(outDir, "meta.json"),
    `${JSON.stringify(meta, null, 2)}\n`,
    "utf8"
  );
  await writeFile(
    path.join(outDir, "LICENSE-zengin-code.txt"),
    zenginLicense,
    "utf8"
  );

  await writeFile(
    path.join(outDir, "README.md"),
    `# 全銀マスタ（zengin-code 連携）

Public Reference。実行時は外部APIに依存せず、生成済み JSON のみを参照する。

## ライセンス（必須表記）

生成 JSON の元データは [zengin-code](https://github.com/zengin-code/zengin-js) です。

- License: **MIT**
- Copyright (c) 2015 Sho Kusano
- 全文: [\`LICENSE-zengin-code.txt\`](./LICENSE-zengin-code.txt)

本ディレクトリの内容（またはそこから再配布するマスタ）を公開・同梱する場合は、上記著作権表示と許諾文を含めてください。

## 構成

\`\`\`text
reference/zengin/
  meta.json
  banks.json
  branches/{bank_code}.json
  LICENSE-zengin-code.txt
  README.md
\`\`\`

各レコード例:

\`\`\`json
{
  "name": "三菱ＵＦＪ",
  "kana": "ミツビシユ－エフジエイ",
  "search_kana": "ミツビシユーエフジエイ"
}
\`\`\`

\`search_kana\` は検索用の派生フィールド（元データとは分離）。

## 更新

\`\`\`bash
npm run sync:zengin
\`\`\`
`,
    "utf8"
  );

  console.log(
    `synced: banks=${meta.bank_count}, branch_files=${branchFileCount}, branches=${branchRecordCount}`
  );
  console.log(`output: ${path.relative(root, outDir)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
