/**
 * 全銀検索用の文字列正規化（派生ロジック）
 * - NFKC（全角英数など）
 * - 半角カナ → 全角カナ
 * - ひらがな → カタカナ
 * - 長音・ハイフン・空白除去
 */

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

export function hankakuKatakanaToZenkaku(input) {
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

export function hiraganaToKatakana(input) {
  return String(input ?? "").replace(/[\u3041-\u3096]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
  );
}

/** 検索比較用に正規化した文字列を返す */
export function normalizeForSearch(input) {
  let s = String(input ?? "").normalize("NFKC");
  s = hankakuKatakanaToZenkaku(s);
  s = hiraganaToKatakana(s);
  // 小書きカナ → 大書き（全銀カナ表記ゆれ吸収）
  s = s.replace(/[\u30A1\u30A3\u30A5\u30A7\u30A9\u30C3\u30E3\u30E5\u30E7\u30EE\u30F5\u30F6]/g, (ch) => {
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
  });
  s = s.replace(/[\u309B\u309C]/g, "");
  // 長音・各種ハイフン・空白・中黒
  s = s.replace(/[\u30FC\uFF0D\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFF70\u002D\s\u3000\u30FB]/g, "");
  s = s.toUpperCase();
  return s;
}

/** マスタ派生フィールド search_kana 用 */
export function buildSearchKana(kana) {
  return normalizeForSearch(kana);
}
