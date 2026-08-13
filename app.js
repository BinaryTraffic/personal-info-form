(() => {
  "use strict";

  const ERAS = [
    { id: "reiwa", name: "令和", start: [2019, 5, 1] },
    { id: "heisei", name: "平成", start: [1989, 1, 8] },
    { id: "showa", name: "昭和", start: [1926, 12, 25] },
    { id: "taisho", name: "大正", start: [1912, 7, 30] },
    { id: "meiji", name: "明治", start: [1868, 1, 25] },
  ];

  const MESSAGES = {
    required: "この項目は必須です",
    email: "正しいメールアドレスを入力してください",
    otp: "4桁のワンタイムコードを入力してください",
    otpMismatch: "認証コードが正しくありません",
    emailUnverified: "メールアドレスの本人確認を完了してください",
    japanese: "日本語（漢字・ひらがな・カタカナ）で入力してください",
    hiragana: "ひらがなで入力してください",
    alpha: "半角英字で入力してください",
    mobile: "正しい携帯電話番号（070/080/090など11桁）を入力してください",
    landline: "正しい固定電話番号を入力してください（携帯番号は不可）",
    fax: "正しい電話番号を入力してください",
    zip: "郵便番号は7桁の半角数字で入力してください",
    birth: "有効な生年月日を入力してください",
    gender: "性別を選択してください",
    bankCode: "全銀マスタから銀行を選択してください",
    branchCode: "全銀マスタから支店を選択してください",
    accountNumber: "口座番号は7〜8桁の半角数字で入力してください",
    yuchoKigo: "記号は5桁の半角数字で入力してください",
    yuchoBango: "番号は1〜8桁の半角数字で入力してください",
    katakana: "カタカナで入力してください",
  };

  const RE = {
    email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
    otp: /^\d{4}$/,
    japanese: /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\u3400-\u4DBF々〆ゝゞー・\s]+$/,
    hiragana: /^[\u3041-\u3096\u3099\u309A\u30FC\s]+$/,
    alpha: /^[A-Za-z]+(?:[ '\-][A-Za-z]+)*$/,
    mobile: /^0[6-9]0\d{8}$/,
    landline: /^0(?:[1-9]\d{8}|[1-9]\d{9})$/,
    zip: /^\d{7}$/,
    bankCode: /^\d{4}$/,
    branchCode: /^\d{3}$/,
    accountNumber: /^\d{7,8}$/,
    yuchoKigo: /^\d{5}$/,
    yuchoBango: /^\d{1,8}$/,
    katakana: /^[\u30A1-\u30FA\u30FC\s]+$/,
  };

  const form = document.getElementById("personal-info-form");
  if (!form) return;

  const options = {
    requireEmailVerification: true,
    ...(window.__PInfoFormOptions || {}),
  };

  const birthYear = document.getElementById("birth-year");
  const birthMonth = document.getElementById("birth-month");
  const birthDay = document.getElementById("birth-day");
  const eraSelect = document.getElementById("era");
  const eraYear = document.getElementById("era-year");
  const eraMonth = document.getElementById("era-month");
  const eraDay = document.getElementById("era-day");
  const warekiDisplay = document.getElementById("wareki-display");
  const zipInput = document.getElementById("zip");
  const zipLookupBtn = document.getElementById("zip-lookup");
  const zipStatus = document.getElementById("zip-status");
  const prefecture = document.getElementById("prefecture");
  const city = document.getElementById("city");
  const town = document.getElementById("town");
  const confirmDialog = document.getElementById("confirm-dialog");
  const confirmBody = document.getElementById("confirm-body");
  const middleToggle = document.getElementById("middle-name-toggle");
  const birthBlock = document.querySelector('[data-rule="birth"]');
  const genderSet = document.querySelector('[data-rule="gender"]');
  const emailInput = document.getElementById("email");
  const otpSendBtn = document.getElementById("otp-send");
  const otpResendBtn = document.getElementById("otp-resend");
  const otpVerifyBtn = document.getElementById("otp-verify");
  const otpPanel = document.getElementById("otp-panel");
  const otpStatus = document.getElementById("otp-status");
  const otpInput = document.getElementById("otp-code");
  const emailVerifiedInput = document.getElementById("email-verified");
  const emailVerifiedBadge = document.getElementById("email-verified-badge");

  let syncingDate = false;
  let zipTimer = null;
  let submittedOnce = false;
  let expectedOtp = "";
  let emailVerified = false;
  let otpCooldownTimer = null;
  let otpAbortController = null;

  function toHalfWidthDigits(value) {
    return String(value ?? "")
      .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
      .replace(/[‐－―ー−-]/g, "")
      .replace(/[^\d]/g, "");
  }

  function isMobileNumber(value) {
    return RE.mobile.test(value);
  }

  function isLandlineNumber(value) {
    if (!RE.landline.test(value)) return false;
    if (isMobileNumber(value)) return false;
    if (/^050\d{8}$/.test(value)) return false;
    return true;
  }

  function isValidDate(y, m, d) {
    if (!y || !m || !d) return false;
    const date = new Date(y, m - 1, d);
    return (
      date.getFullYear() === y &&
      date.getMonth() === m - 1 &&
      date.getDate() === d &&
      y >= 1868 &&
      y <= new Date().getFullYear()
    );
  }

  function dateToEra(y, m, d) {
    const target = new Date(y, m - 1, d);
    for (const era of ERAS) {
      const [sy, sm, sd] = era.start;
      const start = new Date(sy, sm - 1, sd);
      if (target >= start) {
        return {
          id: era.id,
          name: era.name,
          year: y - sy + 1,
          month: m,
          day: d,
        };
      }
    }
    return null;
  }

  function eraToWestern(eraId, ey, m, d) {
    const era = ERAS.find((e) => e.id === eraId);
    if (!era || !ey || !m || !d) return null;
    const [sy] = era.start;
    const westernYear = sy + ey - 1;
    if (!isValidDate(westernYear, m, d)) return null;
    const converted = dateToEra(westernYear, m, d);
    if (!converted || converted.id !== eraId || converted.year !== ey) return null;
    return { year: westernYear, month: m, day: d };
  }

  function formatWarekiLabel(y, m, d) {
    const era = dateToEra(y, m, d);
    if (!era) return "";
    const yearLabel = era.year === 1 ? "元" : String(era.year);
    return `${era.name}${yearLabel}年${m}月${d}日（西暦${y}年）`;
  }

  function syncFromWestern() {
    if (syncingDate) return;
    const y = Number(birthYear.value);
    const m = Number(birthMonth.value);
    const d = Number(birthDay.value);
    if (!isValidDate(y, m, d)) {
      warekiDisplay.textContent = "";
      return;
    }
    const era = dateToEra(y, m, d);
    if (!era) {
      warekiDisplay.textContent = "";
      return;
    }
    syncingDate = true;
    eraSelect.value = era.id;
    eraYear.value = String(era.year);
    eraMonth.value = String(m);
    eraDay.value = String(d);
    warekiDisplay.textContent = formatWarekiLabel(y, m, d);
    syncingDate = false;
  }

  function syncFromWareki() {
    if (syncingDate) return;
    const ey = Number(eraYear.value);
    const m = Number(eraMonth.value);
    const d = Number(eraDay.value);
    const western = eraToWestern(eraSelect.value, ey, m, d);
    if (!western) {
      warekiDisplay.textContent = "";
      return;
    }
    syncingDate = true;
    birthYear.value = String(western.year);
    birthMonth.value = String(western.month);
    birthDay.value = String(western.day);
    warekiDisplay.textContent = formatWarekiLabel(
      western.year,
      western.month,
      western.day
    );
    syncingDate = false;
  }

  function setFieldState(field, state, message = "") {
    field.classList.remove("is-valid", "is-invalid");
    if (state === "valid") field.classList.add("is-valid");
    if (state === "invalid") field.classList.add("is-invalid");

    const feedback = field.querySelector(":scope > .invalid-feedback");
    if (feedback && state === "invalid") feedback.textContent = message;
  }

  function clearFieldState(field) {
    field.classList.remove("is-valid", "is-invalid");
  }

  function getInput(field) {
    return field.querySelector("input:not([type='hidden']), select");
  }

  function getFieldValue(field) {
    if (field.classList.contains("zengin-field")) {
      const hidden = field.querySelector("input[type='hidden']");
      if (hidden) return hidden.value;
    }
    const input = getInput(field);
    return input ? input.value : "";
  }

  function validateValue(rule, value, required) {
    const trimmed = String(value ?? "").trim();

    if (!trimmed) {
      if (required) return { ok: false, message: MESSAGES.required };
      return { ok: true, empty: true };
    }

    switch (rule) {
      case "email":
        return RE.email.test(trimmed)
          ? { ok: true }
          : { ok: false, message: MESSAGES.email };
      case "otp":
        return RE.otp.test(trimmed)
          ? { ok: true }
          : { ok: false, message: MESSAGES.otp };
      case "japanese":
        return RE.japanese.test(trimmed)
          ? { ok: true }
          : { ok: false, message: MESSAGES.japanese };
      case "hiragana":
        return RE.hiragana.test(trimmed)
          ? { ok: true }
          : { ok: false, message: MESSAGES.hiragana };
      case "alpha":
        return RE.alpha.test(trimmed)
          ? { ok: true }
          : { ok: false, message: MESSAGES.alpha };
      case "mobile":
        return isMobileNumber(trimmed)
          ? { ok: true }
          : { ok: false, message: MESSAGES.mobile };
      case "landline":
        return isLandlineNumber(trimmed)
          ? { ok: true }
          : { ok: false, message: MESSAGES.landline };
      case "fax":
        return isLandlineNumber(trimmed) || isMobileNumber(trimmed)
          ? { ok: true }
          : { ok: false, message: MESSAGES.fax };
      case "zip":
        return RE.zip.test(trimmed)
          ? { ok: true }
          : { ok: false, message: MESSAGES.zip };
      case "required":
        return { ok: true };
      case "optional":
        return { ok: true, empty: false };
      case "bankCode":
        return RE.bankCode.test(trimmed)
          ? { ok: true }
          : { ok: false, message: MESSAGES.bankCode };
      case "branchCode":
        return RE.branchCode.test(trimmed)
          ? { ok: true }
          : { ok: false, message: MESSAGES.branchCode };
      case "accountNumber":
        return RE.accountNumber.test(trimmed)
          ? { ok: true }
          : { ok: false, message: MESSAGES.accountNumber };
      case "yuchoKigo":
        return RE.yuchoKigo.test(trimmed)
          ? { ok: true }
          : { ok: false, message: MESSAGES.yuchoKigo };
      case "yuchoBango":
        return RE.yuchoBango.test(trimmed)
          ? { ok: true }
          : { ok: false, message: MESSAGES.yuchoBango };
      case "katakana":
        return RE.katakana.test(trimmed)
          ? { ok: true }
          : { ok: false, message: MESSAGES.katakana };
      default:
        return { ok: true };
    }
  }

  function validateField(field, { force = false } = {}) {
    if (field.hidden) {
      clearFieldState(field);
      return true;
    }

    const input = getInput(field);
    if (!input || input.disabled) {
      clearFieldState(field);
      return true;
    }

    const rule = field.dataset.rule || "optional";
    const required =
      field.dataset.required === "true" || input.hasAttribute("required");
    const value = getFieldValue(field);
    const searchTouched =
      field.classList.contains("zengin-field") && input.value.trim() !== "";
    const touched =
      force || submittedOnce || value.trim() !== "" || searchTouched;

    if (!touched && !required) {
      clearFieldState(field);
      return true;
    }

    if (!touched && required && !force && !submittedOnce) {
      clearFieldState(field);
      return false;
    }

    const result = validateValue(rule, value, required);

    if (result.empty) {
      if (searchTouched && !value.trim()) {
        setFieldState(field, "invalid", MESSAGES[rule] || MESSAGES.required);
        return false;
      }
      clearFieldState(field);
      return true;
    }

    if (result.ok) {
      if (rule !== "optional" || value.trim()) {
        setFieldState(field, "valid");
      } else {
        clearFieldState(field);
      }
      return true;
    }

    if (force || submittedOnce || value.trim() !== "" || searchTouched) {
      setFieldState(field, "invalid", result.message || MESSAGES.required);
    }
    return false;
  }

  function validateBirth({ force = false } = {}) {
    const y = Number(birthYear.value);
    const m = Number(birthMonth.value);
    const d = Number(birthDay.value);
    const hasAny = birthYear.value || birthMonth.value || birthDay.value;
    const touched = force || submittedOnce || hasAny;

    if (!touched) {
      birthBlock.classList.remove("is-valid", "is-invalid");
      return false;
    }

    if (!isValidDate(y, m, d)) {
      if (force || submittedOnce || (birthYear.value && birthMonth.value && birthDay.value)) {
        birthBlock.classList.remove("is-valid");
        birthBlock.classList.add("is-invalid");
        const fb = birthBlock.querySelector(".invalid-feedback");
        if (fb) fb.textContent = MESSAGES.birth;
      } else {
        birthBlock.classList.remove("is-valid", "is-invalid");
      }
      return false;
    }

    birthBlock.classList.remove("is-invalid");
    birthBlock.classList.add("is-valid");
    return true;
  }

  function validateGender({ force = false } = {}) {
    const checked = form.querySelector('input[name="gender"]:checked');
    if (checked) {
      genderSet.classList.remove("is-invalid");
      return true;
    }
    if (force || submittedOnce) {
      genderSet.classList.add("is-invalid");
    }
    return false;
  }

  function isSectionEnabled(name) {
    const section = form.querySelector(`[data-section="${name}"]`);
    if (!section) return true;
    return !section.hidden;
  }

  function validateAll({ force = false } = {}) {
    let ok = true;
    form.querySelectorAll(".float-field[data-rule]").forEach((field) => {
      if (field.closest("#otp-panel")?.hidden) return;
      const section = field.closest("[data-section]");
      if (section?.hidden) return;
      if (!validateField(field, { force })) ok = false;
    });
    if (isSectionEnabled("birth") && !validateBirth({ force })) ok = false;
    if (isSectionEnabled("gender") && !validateGender({ force })) ok = false;
    if (
      options.requireEmailVerification &&
      isSectionEnabled("email") &&
      !emailVerified
    ) {
      ok = false;
      const emailField = emailInput.closest(".float-field");
      if (force || submittedOnce) {
        setFieldState(emailField, "invalid", MESSAGES.emailUnverified);
        if (!otpPanel.hidden) {
          const otpField = otpInput.closest(".float-field");
          if (otpField && !otpInput.disabled) {
            setFieldState(otpField, "invalid", MESSAGES.emailUnverified);
          }
        }
      }
    }
    return ok;
  }

  function firstInvalidControl() {
    const invalid =
      form.querySelector(".float-field.is-invalid input, .float-field.is-invalid select") ||
      (birthBlock.classList.contains("is-invalid") ? birthYear : null) ||
      (genderSet.classList.contains("is-invalid")
        ? genderSet.querySelector("input")
        : null);
    return invalid;
  }

  async function lookupZip(code) {
    const zip = toHalfWidthDigits(code).slice(0, 7);
    if (zip.length !== 7) {
      zipStatus.textContent = "郵便番号は7桁で入力してください";
      zipStatus.classList.add("is-error");
      validateField(zipInput.closest(".float-field"), { force: true });
      return;
    }

    zipStatus.classList.remove("is-error");
    zipStatus.textContent = "住所を検索中…";
    zipLookupBtn.disabled = true;

    try {
      const res = await fetch(
        `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${encodeURIComponent(zip)}`
      );
      if (!res.ok) throw new Error("network");
      const data = await res.json();
      if (data.status !== 200 || !data.results?.length) {
        zipStatus.textContent = "該当する住所が見つかりませんでした";
        zipStatus.classList.add("is-error");
        return;
      }
      const r = data.results[0];
      prefecture.value = r.address1 || "";
      city.value = r.address2 || "";
      town.value = r.address3 || "";
      zipInput.value = zip;
      zipStatus.textContent = `${r.address1}${r.address2}${r.address3} を入力しました`;
      [zipInput, prefecture, city, town].forEach((el) => {
        const field = el.closest(".float-field");
        if (field) validateField(field, { force: true });
      });
      document.getElementById("building")?.focus();
    } catch {
      zipStatus.textContent = "住所検索に失敗しました。通信環境をご確認ください";
      zipStatus.classList.add("is-error");
    } finally {
      zipLookupBtn.disabled = false;
    }
  }

  function switchAccountTab(type) {
    document.querySelectorAll(".tab").forEach((tab) => {
      const active = tab.dataset.account === type;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.getElementById("panel-bank").hidden = type !== "bank";
    document.getElementById("panel-yucho").hidden = type !== "yucho";
  }

  function setMiddleNameEnabled(enabled) {
    document.querySelectorAll(".grid-name").forEach((grid) => {
      grid.classList.toggle("has-middle", enabled);
    });

    document.querySelectorAll(".middle-only").forEach((field) => {
      const input = getInput(field);
      field.hidden = !enabled;
      if (!input) return;
      input.disabled = !enabled;
      if (!enabled) {
        input.value = "";
        clearFieldState(field);
      }
    });
  }

  function genderLabel(value) {
    return { male: "男性", female: "女性", other: "その他" }[value] || "";
  }

  function accountTypeLabel(value) {
    return { ordinary: "普通", checking: "当座", savings: "貯蓄" }[value] || "";
  }

  function joinName(a, b, c) {
    return [a, b, c].filter(Boolean).join(" ");
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function collectFormData() {
    const fd = new FormData(form);
    const accountKind =
      document.querySelector(".tab.is-active")?.dataset.account || "bank";
    const useMiddle = middleToggle.checked;
    return {
      email: fd.get("email"),
      emailVerified,
      otpCode: fd.get("one-time-code"),
      nameSei: fd.get("nameSei"),
      nameMiddle: useMiddle ? fd.get("nameMiddle") : "",
      nameMei: fd.get("nameMei"),
      kanaSei: fd.get("kanaSei"),
      kanaMiddle: useMiddle ? fd.get("kanaMiddle") : "",
      kanaMei: fd.get("kanaMei"),
      alphaSei: fd.get("alphaSei"),
      alphaMiddle: useMiddle ? fd.get("alphaMiddle") : "",
      alphaMei: fd.get("alphaMei"),
      useMiddle,
      gender: fd.get("gender"),
      birthYear: fd.get("birthYear"),
      birthMonth: fd.get("birthMonth"),
      birthDay: fd.get("birthDay"),
      telMobile: fd.get("telMobile"),
      telLandline: fd.get("telLandline"),
      telFax: fd.get("telFax"),
      zip: fd.get("zip"),
      prefecture: fd.get("prefecture"),
      city: fd.get("city"),
      town: fd.get("town"),
      building: fd.get("building"),
      accountKind,
      bankCode: fd.get("bankCode"),
      bankDisplay: document.getElementById("bank-resolved")?.textContent || "",
      branchCode: fd.get("branchCode"),
      branchDisplay: document.getElementById("branch-resolved")?.textContent || "",
      accountType: fd.get("accountType"),
      accountNumber: fd.get("accountNumber"),
      accountHolder: fd.get("accountHolder"),
      yuchoKigo: fd.get("yuchoKigo"),
      yuchoBango: fd.get("yuchoBango"),
      yuchoHolder: fd.get("yuchoHolder"),
    };
  }

  function buildConfirmHtml(data) {
    const rows = [
      ["メール", data.email],
      ["メール確認", data.emailVerified ? "確認済み" : "未確認"],
      [
        "氏名",
        joinName(data.nameSei, data.nameMiddle, data.nameMei),
      ],
      [
        "ふりがな",
        joinName(data.kanaSei, data.kanaMiddle, data.kanaMei),
      ],
      [
        "アルファベット",
        joinName(data.alphaSei, data.alphaMiddle, data.alphaMei),
      ],
      ["性別", genderLabel(data.gender)],
      [
        "生年月日",
        formatWarekiLabel(
          Number(data.birthYear),
          Number(data.birthMonth),
          Number(data.birthDay)
        ),
      ],
      ["携帯電話", data.telMobile],
      ["固定電話", data.telLandline || "—"],
      ["ファックス", data.telFax || "—"],
      [
        "住所",
        `〒${data.zip} ${data.prefecture}${data.city}${data.town}${
          data.building ? " " + data.building : ""
        }`,
      ],
    ];

    if (data.accountKind === "bank") {
      rows.push(
        ["銀行コード", data.bankCode || "—"],
        ["銀行（表示）", data.bankDisplay || "—"],
        ["支店コード", data.branchCode || "—"],
        ["支店（表示）", data.branchDisplay || "—"],
        ["口座種別", accountTypeLabel(data.accountType)],
        ["口座番号", data.accountNumber || "—"],
        ["名義", data.accountHolder || "—"]
      );
    } else {
      rows.push(
        ["ゆうちょ記号", data.yuchoKigo || "—"],
        ["ゆうちょ番号", data.yuchoBango || "—"],
        ["名義", data.yuchoHolder || "—"]
      );
    }

    return `<dl>${rows
      .map(([k, v]) => `<dt>${k}</dt><dd>${escapeHtml(v)}</dd>`)
      .join("")}</dl>`;
  }

  function bindNumericSanitize(el, { maxLength } = {}) {
    if (!el) return;
    el.addEventListener("input", () => {
      const cleaned = toHalfWidthDigits(el.value);
      el.value = maxLength ? cleaned.slice(0, maxLength) : cleaned;
    });
  }

  function bindImeSafeSanitize(el, sanitizeFn) {
    if (!el) return;
    let composing = false;

    const apply = () => {
      const before = el.value;
      const after = sanitizeFn(before);
      if (after !== before) el.value = after;
    };

    el.addEventListener("compositionstart", () => {
      composing = true;
    });
    el.addEventListener("compositionend", () => {
      composing = false;
      // IME確定直後の同期書き換えは入力不能の原因になるため遅延する
      requestAnimationFrame(() => {
        apply();
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
    });
    el.addEventListener("input", (event) => {
      if (composing || event.isComposing || el.isComposing) return;
      apply();
    });
    el.addEventListener("blur", apply);
  }

  function bindAlphaUpper(el) {
    bindImeSafeSanitize(el, (value) =>
      value.replace(/[^A-Za-z\s\-']/g, "").toUpperCase()
    );
  }

  function bindHiragana(el) {
    bindImeSafeSanitize(el, (value) =>
      value.replace(/[^\u3041-\u3096\u3099\u309A\u30FC\s]/g, "")
    );
  }

  function bindKatakana(el) {
    bindImeSafeSanitize(el, (value) =>
      value
        .replace(/[ぁ-ゖ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60))
        .replace(/[^\u30A1-\u30FA\u30FC\s]/g, "")
    );
  }

  function resetValidationUI() {
    submittedOnce = false;
    form
      .querySelectorAll(".is-valid, .is-invalid")
      .forEach((el) => el.classList.remove("is-valid", "is-invalid"));
    warekiDisplay.textContent = "";
    zipStatus.textContent = "";
    zipStatus.classList.remove("is-error");
    resetEmailVerification({ keepEmail: false });
    window.resetZenginUi?.();
  }

  function setEmailVerified(state) {
    emailVerified = state;
    emailVerifiedInput.value = state ? "true" : "false";
    emailVerifiedBadge.hidden = !state;
    if (state) {
      otpPanel.hidden = true;
      otpInput.disabled = true;
      otpVerifyBtn.disabled = true;
      stopWebOtpListen();
      const emailField = emailInput.closest(".float-field");
      if (emailField) setFieldState(emailField, "valid");
    }
  }

  function resetEmailVerification({ keepEmail = true } = {}) {
    expectedOtp = "";
    setEmailVerified(false);
    emailVerifiedBadge.hidden = true;
    otpPanel.hidden = true;
    otpStatus.textContent = "";
    otpStatus.classList.remove("is-error");
    otpInput.value = "";
    otpInput.disabled = true;
    otpVerifyBtn.disabled = true;
    otpResendBtn.disabled = true;
    clearTimeout(otpCooldownTimer);
    otpSendBtn.disabled = !(keepEmail && RE.email.test(emailInput.value.trim()));
    otpSendBtn.textContent = "認証コードを送信";
    stopWebOtpListen();
    const otpField = otpInput.closest(".float-field");
    if (otpField) clearFieldState(otpField);
  }

  function generateOtp() {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  function startOtpCooldown(seconds = 60) {
    let remain = seconds;
    otpSendBtn.disabled = true;
    otpResendBtn.disabled = true;
    const tick = () => {
      otpSendBtn.textContent = `再送信（${remain}s）`;
      otpResendBtn.textContent = `再送信（${remain}s）`;
      if (remain <= 0) {
        otpSendBtn.disabled = false;
        otpResendBtn.disabled = false;
        otpSendBtn.textContent = "認証コードを送信";
        otpResendBtn.textContent = "再送信";
        return;
      }
      remain -= 1;
      otpCooldownTimer = setTimeout(tick, 1000);
    };
    tick();
  }

  function stopWebOtpListen() {
    if (otpAbortController) {
      otpAbortController.abort();
      otpAbortController = null;
    }
  }

  function startWebOtpListen() {
    stopWebOtpListen();
    if (!("OTPCredential" in window)) return;
    otpAbortController = new AbortController();
    navigator.credentials
      .get({
        otp: { transport: ["sms"] },
        signal: otpAbortController.signal,
      })
      .then((otp) => {
        if (!otp?.code) return;
        otpInput.value = toHalfWidthDigits(otp.code).slice(0, 4);
        validateField(otpInput.closest(".float-field"), { force: true });
        otpVerifyBtn.disabled = !RE.otp.test(otpInput.value);
        if (RE.otp.test(otpInput.value)) verifyOtp();
      })
      .catch(() => {
        /* user cancelled or unsupported */
      });
  }

  function sendOtp() {
    const emailField = emailInput.closest(".float-field");
    if (!validateField(emailField, { force: true })) {
      emailInput.focus();
      return;
    }

    expectedOtp = generateOtp();
    setEmailVerified(false);
    emailVerifiedBadge.hidden = true;
    otpPanel.hidden = false;
    otpInput.disabled = false;
    otpInput.value = "";
    otpVerifyBtn.disabled = true;
    clearFieldState(otpInput.closest(".float-field"));

    otpStatus.classList.remove("is-error");
    otpStatus.textContent = `${emailInput.value.trim()} 宛に認証コードを送信しました（デモコード: ${expectedOtp}）`;

    startOtpCooldown(60);
    startWebOtpListen();
    otpInput.focus();
  }

  function verifyOtp() {
    const otpField = otpInput.closest(".float-field");
    if (!validateField(otpField, { force: true })) {
      otpInput.focus();
      return;
    }

    if (otpInput.value !== expectedOtp) {
      setFieldState(otpField, "invalid", MESSAGES.otpMismatch);
      otpStatus.classList.add("is-error");
      otpStatus.textContent = MESSAGES.otpMismatch;
      setEmailVerified(false);
      return;
    }

    setFieldState(otpField, "valid");
    otpStatus.classList.remove("is-error");
    otpStatus.textContent = "メールアドレスの確認が完了しました";
    setEmailVerified(true);
  }

  function syncOtpSendEnabled() {
    if (emailVerified) return;
    const valid = RE.email.test(emailInput.value.trim());
    const cooling = otpSendBtn.textContent.includes("再送信（");
    if (!cooling) otpSendBtn.disabled = !valid;
  }

  // Sanitize binders
  [
    [birthYear, 4],
    [birthMonth, 2],
    [birthDay, 2],
    [eraYear, 2],
    [eraMonth, 2],
    [eraDay, 2],
    [zipInput, 7],
    [document.getElementById("tel-mobile"), 11],
    [document.getElementById("tel-landline"), 11],
    [document.getElementById("tel-fax"), 11],
    [document.getElementById("account-number"), 8],
    [document.getElementById("yucho-kigo"), 5],
    [document.getElementById("yucho-bango"), 8],
    [otpInput, 4],
  ].forEach(([el, max]) => bindNumericSanitize(el, { maxLength: max }));

  ["alpha-sei", "alpha-mei", "alpha-middle"].forEach((id) =>
    bindAlphaUpper(document.getElementById(id))
  );
  ["kana-sei", "kana-mei", "kana-middle"].forEach((id) =>
    bindHiragana(document.getElementById(id))
  );
  ["account-holder", "yucho-holder"].forEach((id) =>
    bindKatakana(document.getElementById(id))
  );

  // Live validation
  form.querySelectorAll(".float-field[data-rule]").forEach((field) => {
    const input = getInput(field);
    if (!input) return;
    const run = () => validateField(field, { force: submittedOnce });
    input.addEventListener("input", run);
    input.addEventListener("blur", () => validateField(field, { force: true }));
  });

  [birthYear, birthMonth, birthDay].forEach((el) => {
    el.addEventListener("input", () => {
      syncFromWestern();
      validateBirth({ force: submittedOnce });
    });
    el.addEventListener("blur", () => validateBirth({ force: true }));
  });

  [eraSelect, eraYear, eraMonth, eraDay].forEach((el) => {
    el.addEventListener("input", () => {
      syncFromWareki();
      validateBirth({ force: submittedOnce });
    });
    el.addEventListener("change", () => {
      syncFromWareki();
      validateBirth({ force: submittedOnce });
    });
  });

  form.querySelectorAll('input[name="gender"]').forEach((el) => {
    el.addEventListener("change", () => validateGender({ force: true }));
  });

  middleToggle.addEventListener("change", () => {
    setMiddleNameEnabled(middleToggle.checked);
  });

  emailInput.addEventListener("input", () => {
    if (emailVerified || otpPanel.hidden === false) {
      resetEmailVerification({ keepEmail: true });
      validateField(emailInput.closest(".float-field"), { force: submittedOnce });
    }
    syncOtpSendEnabled();
  });

  emailInput.addEventListener("blur", () => {
    validateField(emailInput.closest(".float-field"), { force: true });
    syncOtpSendEnabled();
  });

  otpSendBtn.addEventListener("click", sendOtp);
  otpResendBtn.addEventListener("click", sendOtp);
  otpVerifyBtn.addEventListener("click", verifyOtp);

  otpInput.addEventListener("input", () => {
    const digits = toHalfWidthDigits(otpInput.value).slice(0, 4);
    otpInput.value = digits;
    validateField(otpInput.closest(".float-field"), {
      force: submittedOnce || digits.length > 0,
    });
    otpVerifyBtn.disabled = !RE.otp.test(digits);
  });

  otpInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!otpVerifyBtn.disabled) verifyOtp();
    }
  });

  zipLookupBtn.addEventListener("click", () => lookupZip(zipInput.value));

  zipInput.addEventListener("input", () => {
    clearTimeout(zipTimer);
    const zip = toHalfWidthDigits(zipInput.value).slice(0, 7);
    zipInput.value = zip;
    validateField(zipInput.closest(".float-field"), { force: submittedOnce });
    if (zip.length === 7) {
      zipTimer = setTimeout(() => lookupZip(zip), 350);
    } else {
      zipStatus.textContent = "";
      zipStatus.classList.remove("is-error");
    }
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchAccountTab(tab.dataset.account));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submittedOnce = true;

    const ok = validateAll({ force: true });
    if (!ok) {
      firstInvalidControl()?.focus();
      return;
    }

    confirmBody.innerHTML = buildConfirmHtml(collectFormData());
    confirmDialog.showModal();
  });

  confirmDialog.addEventListener("close", () => {
    if (confirmDialog.returnValue === "ok") {
      alert("入力内容を受け付けました（デモ）。");
      form.reset();
      setMiddleNameEnabled(false);
      switchAccountTab("bank");
      resetValidationUI();
    }
  });

  form.addEventListener("reset", () => {
    setTimeout(() => {
      setMiddleNameEnabled(false);
      switchAccountTab("bank");
      resetValidationUI();
    }, 0);
  });

  function initZenginUi() {
    const bankSearch = document.getElementById("bank-search");
    const branchSearch = document.getElementById("branch-search");
    const bankCode = document.getElementById("bank-code");
    const branchCode = document.getElementById("branch-code");
    const bankList = document.getElementById("bank-suggestions");
    const branchList = document.getElementById("branch-suggestions");
    const bankResolved = document.getElementById("bank-resolved");
    const branchResolved = document.getElementById("branch-resolved");
    const accountCard = document.getElementById("bank-account-card");
    const cardBank = document.getElementById("card-bank");
    const cardBranch = document.getElementById("card-branch");
    const cardType = document.getElementById("card-type");
    const cardNumber = document.getElementById("card-number");
    const cardHolder = document.getElementById("card-holder");
    const accountNumberInput = document.getElementById("account-number");
    const accountHolderInput = document.getElementById("account-holder");
    if (!window.ZenginRef || !bankSearch || !branchSearch) return;

    let bankTimer = null;
    let branchTimer = null;
    let bankActive = -1;
    let branchActive = -1;

    function updateAccountCard() {
      if (!accountCard) return;
      const bankText = bankResolved.textContent.trim();
      const branchText = branchResolved.textContent.trim();
      const typeInput = form.querySelector('input[name="accountType"]:checked');
      const typeText = accountTypeLabel(typeInput?.value);
      const numberText = accountNumberInput?.value.trim() || "";
      const holderText = accountHolderInput?.value.trim() || "";

      const hasAny =
        bankText || branchText || numberText || holderText || bankCode.value;

      if (!hasAny) {
        accountCard.hidden = true;
        return;
      }

      accountCard.hidden = false;
      cardBank.textContent = bankText || (bankCode.value ? bankCode.value : "—");
      cardBranch.textContent =
        branchText || (branchCode.value ? branchCode.value : "—");
      cardType.textContent = typeText || "—";
      cardNumber.textContent = numberText || "—";
      cardHolder.textContent = holderText || "—";
    }

    function hideList(list, input) {
      list.hidden = true;
      list.innerHTML = "";
      input.setAttribute("aria-expanded", "false");
    }

    function renderList(list, items, onPick) {
      list.innerHTML = "";
      if (!items.length) {
        const empty = document.createElement("li");
        empty.innerHTML =
          '<button type="button" disabled><span class="suggest-name">候補がありません</span></button>';
        list.appendChild(empty);
        list.hidden = false;
        return;
      }
      items.forEach((item) => {
        const li = document.createElement("li");
        li.setAttribute("role", "option");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.innerHTML = `<span class="suggest-main"><span class="suggest-code">${item.code}</span><span class="suggest-sep">　</span><span class="suggest-name">${item.name}</span></span><span class="suggest-kana">${item.kana || ""}</span>`;
        btn.addEventListener("mousedown", (e) => {
          e.preventDefault();
          onPick(item);
        });
        li.appendChild(btn);
        list.appendChild(li);
      });
      list.hidden = false;
    }

    function setActive(list, index) {
      const buttons = [...list.querySelectorAll("button:not([disabled])")];
      buttons.forEach((b, i) => b.classList.toggle("is-active", i === index));
      if (buttons[index]) buttons[index].scrollIntoView({ block: "nearest" });
      return index;
    }

    async function pickBank(item) {
      bankCode.value = item.code;
      bankSearch.value = window.ZenginRef.displayBank(item);
      bankResolved.textContent = window.ZenginRef.displayBank(item);
      hideList(bankList, bankSearch);
      validateField(bankSearch.closest(".float-field"), { force: true });

      branchCode.value = "";
      branchSearch.value = "";
      branchResolved.textContent = "";
      branchSearch.disabled = false;
      clearFieldState(branchSearch.closest(".float-field"));
      hideList(branchList, branchSearch);
      updateAccountCard();
      branchSearch.focus();
    }

    async function pickBranch(item) {
      branchCode.value = item.code;
      branchSearch.value = window.ZenginRef.displayBranch(item);
      branchResolved.textContent = window.ZenginRef.displayBranch(item);
      hideList(branchList, branchSearch);
      validateField(branchSearch.closest(".float-field"), { force: true });
      updateAccountCard();
    }

    async function refreshBanks() {
      try {
        const items = await window.ZenginRef.searchBanks(bankSearch.value, 30);
        bankActive = -1;
        renderList(bankList, items, pickBank);
        bankSearch.setAttribute("aria-expanded", "true");
      } catch (err) {
        bankResolved.textContent = "全銀マスタの読み込みに失敗しました";
        hideList(bankList, bankSearch);
      }
    }

    async function refreshBranches() {
      if (!bankCode.value) return;
      try {
        const items = await window.ZenginRef.searchBranches(
          bankCode.value,
          branchSearch.value,
          40
        );
        branchActive = -1;
        renderList(branchList, items, pickBranch);
        branchSearch.setAttribute("aria-expanded", "true");
      } catch {
        branchResolved.textContent = "支店マスタの読み込みに失敗しました";
        hideList(branchList, branchSearch);
      }
    }

    bankSearch.addEventListener("input", () => {
      bankCode.value = "";
      bankResolved.textContent = "";
      branchCode.value = "";
      branchSearch.value = "";
      branchResolved.textContent = "";
      branchSearch.disabled = true;
      clearTimeout(bankTimer);
      bankTimer = setTimeout(refreshBanks, 180);
      validateField(bankSearch.closest(".float-field"), { force: submittedOnce });
      updateAccountCard();
    });

    branchSearch.addEventListener("input", () => {
      branchCode.value = "";
      branchResolved.textContent = "";
      clearTimeout(branchTimer);
      branchTimer = setTimeout(refreshBranches, 180);
      validateField(branchSearch.closest(".float-field"), {
        force: submittedOnce,
      });
      updateAccountCard();
    });

    accountNumberInput?.addEventListener("input", updateAccountCard);
    accountHolderInput?.addEventListener("input", updateAccountCard);
    form.querySelectorAll('input[name="accountType"]').forEach((el) => {
      el.addEventListener("change", updateAccountCard);
    });

    bankSearch.addEventListener("focus", () => {
      if (bankSearch.value.trim()) refreshBanks();
    });
    branchSearch.addEventListener("focus", () => {
      if (!branchSearch.disabled) refreshBranches();
    });

    bankSearch.addEventListener("blur", () => {
      setTimeout(() => hideList(bankList, bankSearch), 120);
      validateField(bankSearch.closest(".float-field"), { force: true });
    });
    branchSearch.addEventListener("blur", () => {
      setTimeout(() => hideList(branchList, branchSearch), 120);
      validateField(branchSearch.closest(".float-field"), { force: true });
    });

    function bindKeys(input, list, getActive, setIdx, onEnter) {
      input.addEventListener("keydown", (event) => {
        const buttons = [...list.querySelectorAll("button:not([disabled])")];
        if (!buttons.length && event.key !== "Escape") return;
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setIdx(setActive(list, Math.min(getActive() + 1, buttons.length - 1)));
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          setIdx(setActive(list, Math.max(getActive() - 1, 0)));
        } else if (event.key === "Enter") {
          const idx = getActive();
          if (idx >= 0 && buttons[idx]) {
            event.preventDefault();
            buttons[idx].dispatchEvent(new Event("mousedown"));
            onEnter();
          }
        } else if (event.key === "Escape") {
          hideList(list, input);
        }
      });
    }

    bindKeys(
      bankSearch,
      bankList,
      () => bankActive,
      (v) => {
        bankActive = v;
      },
      () => {}
    );
    bindKeys(
      branchSearch,
      branchList,
      () => branchActive,
      (v) => {
        branchActive = v;
      },
      () => {}
    );

    // マスタはバックグラウンドで先読み（表示文言は出さない）
    window.ZenginRef.loadMeta().catch(() => {});
    window.ZenginRef.loadBanks().catch(() => {});

    window.updateBankAccountCard = updateAccountCard;
    window.resetZenginUi = () => {
      bankCode.value = "";
      branchCode.value = "";
      bankSearch.value = "";
      branchSearch.value = "";
      bankResolved.textContent = "";
      branchResolved.textContent = "";
      branchSearch.disabled = true;
      hideList(bankList, bankSearch);
      hideList(branchList, branchSearch);
      updateAccountCard();
    };
  }

  setMiddleNameEnabled(false);
  resetEmailVerification({ keepEmail: false });
  initZenginUi();

  async function setValue(data = {}) {
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el != null && value != null) el.value = String(value);
    };

    set("email", data.email);
    set("name-sei", data.nameSei);
    set("name-mei", data.nameMei);
    set("name-middle", data.nameMiddle);
    set("kana-sei", data.kanaSei);
    set("kana-mei", data.kanaMei);
    set("kana-middle", data.kanaMiddle);
    set("alpha-sei", data.alphaSei);
    set("alpha-mei", data.alphaMei);
    set("alpha-middle", data.alphaMiddle);
    if (data.useMiddle) {
      middleToggle.checked = true;
      setMiddleNameEnabled(true);
    }
    if (data.gender) {
      const radio = form.querySelector(`input[name="gender"][value="${data.gender}"]`);
      if (radio) radio.checked = true;
    }
    set("birth-year", data.birthYear);
    set("birth-month", data.birthMonth);
    set("birth-day", data.birthDay);
    syncFromWestern();
    set("tel-mobile", data.telMobile);
    set("tel-landline", data.telLandline);
    set("tel-fax", data.telFax);
    set("zip", data.zip);
    set("prefecture", data.prefecture);
    set("city", data.city);
    set("town", data.town);
    set("building", data.building);

    if (data.accountKind === "yucho") switchAccountTab("yucho");
    else switchAccountTab("bank");

    set("account-number", data.accountNumber);
    set("account-holder", data.accountHolder);
    if (data.accountType) {
      const t = form.querySelector(`input[name="accountType"][value="${data.accountType}"]`);
      if (t) t.checked = true;
    }
    set("yucho-kigo", data.yuchoKigo);
    set("yucho-bango", data.yuchoBango);
    set("yucho-holder", data.yuchoHolder);

    if (data.bankCode && window.ZenginRef) {
      const bank = await window.ZenginRef.resolveBank(data.bankCode);
      const bankCodeEl = document.getElementById("bank-code");
      const bankSearch = document.getElementById("bank-search");
      const bankResolved = document.getElementById("bank-resolved");
      const branchSearch = document.getElementById("branch-search");
      if (bank && bankCodeEl && bankSearch) {
        bankCodeEl.value = bank.code;
        bankSearch.value = window.ZenginRef.displayBank(bank);
        if (bankResolved) bankResolved.textContent = window.ZenginRef.displayBank(bank);
        if (branchSearch) branchSearch.disabled = false;
      }
      if (data.branchCode) {
        const branch = await window.ZenginRef.resolveBranch(data.bankCode, data.branchCode);
        const branchCodeEl = document.getElementById("branch-code");
        const branchResolved = document.getElementById("branch-resolved");
        if (branch && branchCodeEl && branchSearch) {
          branchCodeEl.value = branch.code;
          branchSearch.value = window.ZenginRef.displayBranch(branch);
          if (branchResolved) {
            branchResolved.textContent = window.ZenginRef.displayBranch(branch);
          }
        }
      }
      window.updateBankAccountCard?.();
    }

    if (data.emailVerified) {
      expectedOtp = "0000";
      setEmailVerified(true);
    }
  }

  function setSections(sections) {
    const all = ["email", "name", "gender", "birth", "phone", "address", "bank"];
    const enabled = new Set(sections?.length ? sections : all);
    all.forEach((name) => {
      const el = form.querySelector(`[data-section="${name}"]`);
      if (el) el.hidden = !enabled.has(name);
    });
  }

  if (Array.isArray(options.sections)) setSections(options.sections);

  window.PersonalInfoFormAPI = {
    getValue: () => collectFormData(),
    setValue,
    validate: () => validateAll({ force: true }),
    reset: () => {
      form.reset();
      setMiddleNameEnabled(false);
      switchAccountTab("bank");
      resetValidationUI();
    },
    setSections,
    isEmailVerified: () => emailVerified,
    getFormElement: () => form,
  };

  window.dispatchEvent(new CustomEvent("personal-info-form:ready", {
    detail: window.PersonalInfoFormAPI,
  }));
})();
