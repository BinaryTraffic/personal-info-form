/**
 * PersonalInfoForm — 埋め込み可能な個人情報入力コンポーネント
 *
 * Usage:
 *   const api = await PersonalInfoForm.mount('#mount', {
 *     theme: 'brand' | 'bootstrap' | 'material',
 *     sections: ['email','name','gender','birth','phone','address','bank'],
 *     requireEmailVerification: true,
 *   });
 *   api.getValue(); api.setValue(data); api.validate(); api.setTheme('material');
 */
(() => {
  "use strict";

  const ALL_SECTIONS = [
    "email",
    "name",
    "gender",
    "birth",
    "phone",
    "address",
    "bank",
  ];

  const DEFAULTS = {
    theme: "brand",
    sections: [...ALL_SECTIONS],
    requireEmailVerification: true,
    baseUrl: "",
    showDemoChrome: false,
  };

  function resolveUrl(baseUrl, path) {
    if (/^https?:\/\//.test(path)) return path;
    const base = String(baseUrl || "").replace(/\/$/, "");
    const rel = String(path).replace(/^\//, "");
    return base ? `${base}/${rel}` : `/${rel}`;
  }

  function ensureStylesheet(id, href) {
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = href;
    return link;
  }

  function loadScript(src, { force = false } = {}) {
    return new Promise((resolve, reject) => {
      const marker = "data-pinfo-src";
      const bare = src.split("?")[0];
      if (!force) {
        const found = document.querySelector(`script[${marker}="${bare}"]`);
        if (found) {
          resolve();
          return;
        }
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.setAttribute(marker, bare);
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  function waitForApi(timeoutMs = 8000) {
    if (window.PersonalInfoFormAPI) return Promise.resolve(window.PersonalInfoFormAPI);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error("PersonalInfoFormAPI timeout"));
      }, timeoutMs);
      function onReady(ev) {
        cleanup();
        resolve(ev.detail || window.PersonalInfoFormAPI);
      }
      function cleanup() {
        clearTimeout(timer);
        window.removeEventListener("personal-info-form:ready", onReady);
      }
      window.addEventListener("personal-info-form:ready", onReady);
    });
  }

  async function mount(target, userOptions = {}) {
    const options = { ...DEFAULTS, ...userOptions };
    const host =
      typeof target === "string" ? document.querySelector(target) : target;
    if (!host) throw new Error("PersonalInfoForm mount target not found");

    const baseUrl = options.baseUrl || "";

    ensureStylesheet(
      "pinfo-base-css",
      resolveUrl(baseUrl, "styles/base.css")
    );
    ensureStylesheet(
      "pinfo-theme-css",
      resolveUrl(baseUrl, `styles/themes/${options.theme}.css`)
    );
    document.documentElement.setAttribute("data-theme", options.theme);

    const formRes = await fetch(resolveUrl(baseUrl, "src/form.html"), {
      cache: "no-cache",
    });
    if (!formRes.ok) throw new Error("Failed to load form template");
    const formHtml = await formRes.text();

    host.classList.add("p-info-root");
    host.innerHTML = `<div class="page p-info-page">${formHtml}</div>`;

    window.__PInfoFormOptions = {
      requireEmailVerification: options.requireEmailVerification !== false,
      sections: options.sections,
    };

    // Zengin base path relative to site root
    if (!window.ZenginRef) {
      await loadScript(resolveUrl(baseUrl, "js/zengin-ref.js"));
    }
    // Re-init app against injected form
    delete window.PersonalInfoFormAPI;
    await loadScript(`${resolveUrl(baseUrl, "app.js")}?t=${Date.now()}`, {
      force: true,
    });
    const api = await waitForApi();

    api.setTheme = (theme) => {
      const name = theme || "brand";
      document.documentElement.setAttribute("data-theme", name);
      ensureStylesheet(
        "pinfo-theme-css",
        resolveUrl(baseUrl, `styles/themes/${name}.css`)
      );
    };

    api.setSections(options.sections);
    api.getSections = () =>
      ALL_SECTIONS.filter((name) => {
        const el = host.querySelector(`[data-section="${name}"]`);
        return el && !el.hidden;
      });
    api.destroy = () => {
      host.innerHTML = "";
      delete window.PersonalInfoFormAPI;
    };

    return api;
  }

  class PersonalInfoFormElement extends HTMLElement {
    async connectedCallback() {
      if (this._mounted) return;
      this._mounted = true;
      const theme = this.getAttribute("theme") || "brand";
      const sectionsAttr = this.getAttribute("sections");
      const sections = sectionsAttr
        ? sectionsAttr.split(",").map((s) => s.trim()).filter(Boolean)
        : [...ALL_SECTIONS];
      const baseUrl = this.getAttribute("base-url") || "";
      const requireEmailVerification =
        this.getAttribute("require-email-verification") !== "false";

      this._api = await mount(this, {
        theme,
        sections,
        baseUrl,
        requireEmailVerification,
      });
      this.dispatchEvent(
        new CustomEvent("ready", { detail: this._api, bubbles: true })
      );
    }

    get api() {
      return this._api;
    }
  }

  if (!customElements.get("personal-info-form")) {
    customElements.define("personal-info-form", PersonalInfoFormElement);
  }

  window.PersonalInfoForm = {
    mount,
    ALL_SECTIONS,
    themes: ["brand", "bootstrap", "material"],
  };
})();
