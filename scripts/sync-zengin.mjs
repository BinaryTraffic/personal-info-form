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
    version,
    updated_at: now.toISOString().replace(/\.\d{3}Z$/, "+00:00"),
    bank_count: Object.keys(banks).length,
    branch_file_count: branchFileCount,
    branch_record_count: branchRecordCount,
    search_fields: ["code", "name", "kana", "search_kana"],
  };

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
    path.join(outDir, "README.md"),
    `# 全銀マスタ（zengin-code 連携）

Public Reference。実行時は外部APIに依存せず、生成済み JSON のみを参照する。

## 構成

\`\`\`text
reference/zengin/
  meta.json
  banks.json
  branches/{bank_code}.json
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
