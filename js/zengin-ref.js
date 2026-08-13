/**
 * Public Reference: 全銀マスタ（ローカル JSON）
 * コード検索 + 名称検索（漢字/ひらがな/全角カナ/半角カナ）
 * 実行時は zengin-code / 外部API に依存しない。
 */
(() => {
  "use strict";

  const BASE = "/reference/zengin";

  const state = {
    meta: null,
    banks: null,
    branchesCache: new Map(),
    loadingBanks: null,
  };

  const HANKAKU_SINGLES = {
    "\uFF61": "\u3002",
    "\uFF62": "\u300C",
    "\uFF63": "\u300D",
    "\uFF64": "\u3001",
    "\uFF65": "\u30FB",
    "\uFF66": "\u30F2",
    "\uFF67": "\u30A1",
    "\uFF68": "\u30A3",
    "\uFF69": "\u30A5",
    "\uFF6A": "\u30A7",
    "\uFF6B": "\u30A9",
    "\uFF6C": "\u30E3",
    "\uFF6D": "\u30E5",
    "\uFF6E": "\u30E7",
    "\uFF6F": "\u30C3",
    "\uFF70": "\u30FC",
    "\uFF71": "\u30A2",
    "\uFF72": "\u30A4",
    "\uFF73": "\u30A6",
    "\uFF74": "\u30A8",
    "\uFF75": "\u30AA",
    "\uFF76": "\u30AB",
    "\uFF77": "\u30AD",
    "\uFF78": "\u30AF",
    "\uFF79": "\u30B1",
    "\uFF7A": "\u30B3",
    "\uFF7B": "\u30B5",
    "\uFF7C": "\u30B7",
    "\uFF7D": "\u30B9",
    "\uFF7E": "\u30BB",
    "\uFF7F": "\u30BD",
    "\uFF80": "\u30BF",
    "\uFF81": "\u30C1",
    "\uFF82": "\u30C4",
    "\uFF83": "\u30C6",
    "\uFF84": "\u30C8",
    "\uFF85": "\u30CA",
    "\uFF86": "\u30CB",
    "\uFF87": "\u30CC",
    "\uFF88": "\u30CD",
    "\uFF89": "\u30CE",
    "\uFF8A": "\u30CF",
    "\uFF8B": "\u30D2",
    "\uFF8C": "\u30D5",
    "\uFF8D": "\u30D8",
    "\uFF8E": "\u30DB",
    "\uFF8F": "\u30DE",
    "\uFF90": "\u30DF",
    "\uFF91": "\u30E0",
    "\uFF92": "\u30E1",
    "\uFF93": "\u30E2",
    "\uFF94": "\u30E4",
    "\uFF95": "\u30E6",
    "\uFF96": "\u30E8",
    "\uFF97": "\u30E9",
    "\uFF98": "\u30EA",
    "\uFF99": "\u30EB",
    "\uFF9A": "\u30EC",
    "\uFF9B": "\u30ED",
    "\uFF9C": "\u30EF",
    "\uFF9D": "\u30F3",
  };
  const VOICED = {
    "\u30AB": "\u30AC",
    "\u30AD": "\u30AE",
    "\u30AF": "\u30B0",
    "\u30B1": "\u30B2",
    "\u30B3": "\u30B4",
    "\u30B5": "\u30B6",
    "\u30B7": "\u30B8",
    "\u30B9": "\u30BA",
    "\u30BB": "\u30BC",
    "\u30BD": "\u30BE",
    "\u30BF": "\u30C0",
    "\u30C1": "\u30C2",
    "\u30C4": "\u30C5",
    "\u30C6": "\u30C7",
    "\u30C8": "\u30C9",
    "\u30CF": "\u30D0",
    "\u30D2": "\u30D3",
    "\u30D5": "\u30D6",
    "\u30D8": "\u30D9",
    "\u30DB": "\u30DC",
    "\u30A6": "\u30F4",
  };
  const SEMI_VOICED = {
    "\u30CF": "\u30D1",
    "\u30D2": "\u30D4",
    "\u30D5": "\u30D7",
    "\u30D8": "\u30DA",
    "\u30DB": "\u30DD",
  };

  function hankakuKatakanaToZenkaku(input) {
    let out = "";
    const s = String(input ?? "");
    for (let i = 0; i < s.length; i += 1) {
      const ch = s[i];
      const base = HANKAKU_SINGLES[ch] ?? ch;
      const mark = s[i + 1];
      if (mark === "\uFF9E" && VOICED[base]) {
        out += VOICED[base];
        i += 1;
        continue;
      }
      if (mark === "\uFF9F" && SEMI_VOICED[base]) {
        out += SEMI_VOICED[base];
        i += 1;
        continue;
      }
      out += base;
    }
    return out;
  }

  function hiraganaToKatakana(input) {
    return String(input ?? "").replace(/[\u3041-\u3096]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) + 0x60)
    );
  }

  function normalizeForSearch(input) {
    let s = String(input ?? "").normalize("NFKC");
    s = hankakuKatakanaToZenkaku(s);
    s = hiraganaToKatakana(s);
    s = s.replace(
      /[\u30A1\u30A3\u30A5\u30A7\u30A9\u30C3\u30E3\u30E5\u30E7\u30EE\u30F5\u30F6]/g,
      (ch) => {
        const map = {
          "\u30A1": "\u30A2",
          "\u30A3": "\u30A4",
          "\u30A5": "\u30A6",
          "\u30A7": "\u30A8",
          "\u30A9": "\u30AA",
          "\u30C3": "\u30C4",
          "\u30E3": "\u30E4",
          "\u30E5": "\u30E6",
          "\u30E7": "\u30E8",
          "\u30EE": "\u30EF",
          "\u30F5": "\u30AB",
          "\u30F6": "\u30B1",
        };
        return map[ch] || ch;
      }
    );
    s = s.replace(/[\u309B\u309C]/g, "");
    s = s.replace(
      /[\u30FC\uFF0D\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFF70\u002D\s\u3000\u30FB]/g,
      ""
    );
    s = s.toUpperCase();
    return s;
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    return res.json();
  }

  async function loadMeta() {
    if (state.meta) return state.meta;
    state.meta = await fetchJson(`${BASE}/meta.json`);
    return state.meta;
  }

  async function loadBanks() {
    if (state.banks) return state.banks;
    if (state.loadingBanks) return state.loadingBanks;
    state.loadingBanks = fetchJson(`${BASE}/banks.json`)
      .then((data) => {
        state.banks = data;
        state.loadingBanks = null;
        return data;
      })
      .catch((err) => {
        state.loadingBanks = null;
        throw err;
      });
    return state.loadingBanks;
  }

  async function loadBranches(bankCode) {
    const code = String(bankCode || "").padStart(4, "0");
    if (!/^\d{4}$/.test(code)) return {};
    if (state.branchesCache.has(code)) return state.branchesCache.get(code);

    const data = await fetchJson(`${BASE}/branches/${code}.json`);
    state.branchesCache.set(code, data);
    return data;
  }

  function sortedEntries(mapObj) {
    return Object.entries(mapObj).sort(([a], [b]) => a.localeCompare(b, "en"));
  }

  function searchKanaOf(item) {
    if (item.search_kana) return item.search_kana;
    return normalizeForSearch(item.kana || "");
  }

  function nameNormOf(item) {
    return normalizeForSearch(item.name || "");
  }

  /**
   * 優先度（小さいほど上位）
   * 1 コード完全一致
   * 2 名称完全一致（name / search_kana）
   * 3 コード前方一致
   * 4 名称前方一致
   * 5 名称部分一致
   * 0 空クエリ（コード順）
   * null 非該当
   */
  function rankMatch(code, item, rawQuery) {
    const qRaw = String(rawQuery ?? "").trim();
    if (!qRaw) return { rank: 50, item: { code, ...item } };

    const qNorm = normalizeForSearch(qRaw);
    const qDigits = qRaw.replace(/[^\d]/g, "");
    const nameNorm = nameNormOf(item);
    const kanaNorm = searchKanaOf(item);

    if (qDigits && code === qDigits.padStart(code.length, "0")) {
      return { rank: 1, item: { code, ...item } };
    }
    if (qNorm && (nameNorm === qNorm || kanaNorm === qNorm)) {
      return { rank: 2, item: { code, ...item } };
    }
    if (qDigits && code.startsWith(qDigits)) {
      return { rank: 3, item: { code, ...item } };
    }
    if (
      qNorm &&
      (nameNorm.startsWith(qNorm) || kanaNorm.startsWith(qNorm))
    ) {
      return { rank: 4, item: { code, ...item } };
    }
    if (
      (qDigits && code.includes(qDigits)) ||
      (qNorm && (nameNorm.includes(qNorm) || kanaNorm.includes(qNorm)))
    ) {
      return { rank: 5, item: { code, ...item } };
    }
    return null;
  }

  function searchEntries(entries, rawQuery, limit) {
    const scored = [];
    for (const [code, item] of entries) {
      const hit = rankMatch(code, item, rawQuery);
      if (!hit) continue;
      scored.push(hit);
    }
    scored.sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.item.code.localeCompare(b.item.code, "en");
    });
    return scored.slice(0, limit).map((s) => s.item);
  }

  async function searchBanks(query, limit = 30) {
    const banks = await loadBanks();
    return searchEntries(sortedEntries(banks), query, limit);
  }

  async function searchBranches(bankCode, query, limit = 40) {
    const branches = await loadBranches(bankCode);
    return searchEntries(sortedEntries(branches), query, limit);
  }

  async function resolveBank(bankCode) {
    const banks = await loadBanks();
    const code = String(bankCode || "").padStart(4, "0");
    const bank = banks[code];
    return bank ? { code, ...bank } : null;
  }

  async function resolveBranch(bankCode, branchCode) {
    const branches = await loadBranches(bankCode);
    const code = String(branchCode || "").padStart(3, "0");
    const branch = branches[code];
    return branch ? { code, ...branch } : null;
  }

  function displayBank(bank) {
    if (!bank) return "";
    return `${bank.code}　${bank.name}`;
  }

  function displayBranch(branch) {
    if (!branch) return "";
    return `${branch.code}　${branch.name}`;
  }

  window.ZenginRef = {
    loadMeta,
    loadBanks,
    loadBranches,
    searchBanks,
    searchBranches,
    resolveBank,
    resolveBranch,
    displayBank,
    displayBranch,
    normalizeForSearch,
  };
})();
