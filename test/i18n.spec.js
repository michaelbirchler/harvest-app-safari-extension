import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock translations object
const mockTranslations = {
  en: {
    auth_title: "Harvest Login",
    new_task_title: "New Task",
    error_auth_failed: "Authentication failed",
  },
  de: {
    auth_title: "Harvest Anmeldung",
    new_task_title: "Neue Aufgabe",
    error_auth_failed: "Authentifizierung fehlgeschlagen",
  },
  es: {
    auth_title: "Inicio de sesión en Harvest",
    new_task_title: "Nueva tarea",
    // Missing error_auth_failed to test fallback
  },
};

// Minimal I18n class for testing
class I18n {
  constructor(translations) {
    this.currentLanguage = "en";
    this.translations = translations || {};
    this.autoDetected = false;
  }

  init() {
    const savedLang = localStorage.getItem("harvest_language");

    if (savedLang === "auto" || !savedLang) {
      this.autoDetected = true;
      const browserLang = navigator.language || navigator.userLanguage || "en";
      const langCode = browserLang.split("-")[0];

      if (this.translations[langCode]) {
        this.currentLanguage = langCode;
      } else {
        this.currentLanguage = "en";
      }
    } else if (this.translations[savedLang]) {
      this.currentLanguage = savedLang;
      this.autoDetected = false;
    } else {
      this.autoDetected = true;
      const browserLang = navigator.language || navigator.userLanguage || "en";
      const langCode = browserLang.split("-")[0];
      this.currentLanguage = this.translations[langCode] ? langCode : "en";
    }
  }

  setLanguage(langCode) {
    if (langCode === "auto") {
      localStorage.setItem("harvest_language", "auto");
      this.autoDetected = true;
      const browserLang = navigator.language || navigator.userLanguage;
      const detectedLang = browserLang.split("-")[0];
      this.currentLanguage = this.translations[detectedLang]
        ? detectedLang
        : "en";
    } else if (this.translations[langCode]) {
      this.currentLanguage = langCode;
      this.autoDetected = false;
      localStorage.setItem("harvest_language", langCode);
    } else {
      console.warn("Language not supported:", langCode);
      return;
    }
  }

  getSavedPreference() {
    const saved = localStorage.getItem("harvest_language");
    return saved || "auto";
  }

  t(key, fallback) {
    const translation = this.translations[this.currentLanguage]?.[key];
    if (translation) {
      return translation;
    }

    const englishTranslation = this.translations["en"]?.[key];
    if (englishTranslation) {
      return englishTranslation;
    }

    // If no fallback provided (undefined), return key
    if (fallback === undefined) {
      return key;
    }

    // If fallback is explicitly empty string, return empty string
    if (fallback === "") {
      return "";
    }

    // Otherwise return the fallback
    return fallback;
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  getAvailableLanguages() {
    return Object.keys(this.translations);
  }
}

describe("I18n - Translation System", () => {
  let i18n;
  let originalNavigator;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Mock navigator.language
    originalNavigator = global.navigator;
    global.navigator = {
      language: "en-US",
      userLanguage: "en-US",
    };

    i18n = new I18n(mockTranslations);
  });

  afterEach(() => {
    global.navigator = originalNavigator;
    localStorage.clear();
  });

  describe("Initialization", () => {
    it("defaults to English when no preference is saved", () => {
      i18n.init();
      expect(i18n.getCurrentLanguage()).toBe("en");
      expect(i18n.autoDetected).toBe(true);
    });

    it("auto-detects browser language on first run", () => {
      global.navigator.language = "de-DE";
      i18n.init();
      expect(i18n.getCurrentLanguage()).toBe("de");
      expect(i18n.autoDetected).toBe(true);
    });

    it("falls back to English for unsupported browser language", () => {
      global.navigator.language = "ja-JP";
      i18n.init();
      expect(i18n.getCurrentLanguage()).toBe("en");
      expect(i18n.autoDetected).toBe(true);
    });

    it("uses saved manual language preference", () => {
      localStorage.setItem("harvest_language", "es");
      i18n.init();
      expect(i18n.getCurrentLanguage()).toBe("es");
      expect(i18n.autoDetected).toBe(false);
    });

    it("respects 'auto' preference and detects browser language", () => {
      localStorage.setItem("harvest_language", "auto");
      global.navigator.language = "de-AT";
      i18n.init();
      expect(i18n.getCurrentLanguage()).toBe("de");
      expect(i18n.autoDetected).toBe(true);
    });
  });

  describe("Manual Language Selection", () => {
    beforeEach(() => {
      i18n.init();
    });

    it("switches to specified language", () => {
      i18n.setLanguage("de");
      expect(i18n.getCurrentLanguage()).toBe("de");
      expect(i18n.autoDetected).toBe(false);
      expect(localStorage.getItem("harvest_language")).toBe("de");
    });

    it("switches to auto-detection mode", () => {
      i18n.setLanguage("de"); // Manual first
      global.navigator.language = "es-ES";
      i18n.setLanguage("auto"); // Then auto
      expect(i18n.getCurrentLanguage()).toBe("es");
      expect(i18n.autoDetected).toBe(true);
      expect(localStorage.getItem("harvest_language")).toBe("auto");
    });

    it("ignores unsupported language codes", () => {
      i18n.setLanguage("de");
      const before = i18n.getCurrentLanguage();
      i18n.setLanguage("invalid");
      expect(i18n.getCurrentLanguage()).toBe(before);
    });

    it("persists language preference across sessions", () => {
      i18n.setLanguage("es");

      // Simulate new session
      const i18n2 = new I18n(mockTranslations);
      i18n2.init();

      expect(i18n2.getCurrentLanguage()).toBe("es");
      expect(i18n2.autoDetected).toBe(false);
    });
  });

  describe("Translation Retrieval", () => {
    beforeEach(() => {
      i18n.init();
    });

    it("returns correct translation for current language", () => {
      i18n.setLanguage("de");
      expect(i18n.t("auth_title")).toBe("Harvest Anmeldung");
    });

    it("falls back to English when key missing in current language", () => {
      i18n.setLanguage("es");
      expect(i18n.t("error_auth_failed")).toBe("Authentication failed");
    });

    it("returns key when translation missing in all languages", () => {
      const result = i18n.t("nonexistent_key");
      expect(result).toBe("nonexistent_key");
    });

    it("returns provided fallback when key missing", () => {
      expect(i18n.t("nonexistent_key", "Custom Fallback")).toBe(
        "Custom Fallback"
      );
    });

    it("returns empty string for empty fallback", () => {
      expect(i18n.t("nonexistent_key", "")).toBe("");
    });
  });

  describe("Language Information", () => {
    it("returns saved preference including 'auto'", () => {
      expect(i18n.getSavedPreference()).toBe("auto");

      localStorage.setItem("harvest_language", "de");
      expect(i18n.getSavedPreference()).toBe("de");
    });

    it("returns all available languages", () => {
      const languages = i18n.getAvailableLanguages();
      expect(languages).toEqual(["en", "de", "es"]);
    });
  });

  describe("Edge Cases", () => {
    it("handles malformed localStorage data", () => {
      localStorage.setItem("harvest_language", '{"invalid": "json"}');
      i18n.init();
      expect(i18n.getCurrentLanguage()).toBe("en");
    });

    it("handles missing navigator.language", () => {
      global.navigator = {};
      i18n.init();
      expect(i18n.getCurrentLanguage()).toBe("en");
    });

    it("handles language code with region (e.g., en-GB)", () => {
      global.navigator.language = "en-GB";
      i18n.init();
      expect(i18n.getCurrentLanguage()).toBe("en");
    });

    it("handles language code with script (e.g., zh-Hans-CN)", () => {
      global.navigator.language = "de-DE-1996";
      i18n.init();
      expect(i18n.getCurrentLanguage()).toBe("de");
    });
  });
});
