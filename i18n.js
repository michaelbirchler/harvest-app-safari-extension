// Minimalistic i18n helper for Harvest Extension
// Simple translation system with automatic language detection

class I18n {
  constructor() {
    this.currentLanguage = "en";
    this.translations = translations || {};
    this.autoDetected = false;
    this.init();
  }

  init() {
    // Check for saved preference
    const savedLang = localStorage.getItem("harvest_language");

    if (savedLang === "auto" || !savedLang) {
      // Use auto-detection
      this.autoDetected = true;
      const browserLang = navigator.language || navigator.userLanguage;
      const langCode = browserLang.split("-")[0]; // 'en-US' -> 'en'

      if (this.translations[langCode]) {
        this.currentLanguage = langCode;
      } else {
        this.currentLanguage = "en"; // fallback
      }
      console.log(
        "🌍 Language auto-detected:",
        this.currentLanguage,
        "from",
        browserLang
      );
    } else if (this.translations[savedLang]) {
      // Use saved manual selection
      this.currentLanguage = savedLang;
      this.autoDetected = false;
      console.log("🌍 Language loaded from preferences:", this.currentLanguage);
    } else {
      // Fallback to auto-detect
      this.autoDetected = true;
      const browserLang = navigator.language || navigator.userLanguage;
      const langCode = browserLang.split("-")[0];
      this.currentLanguage = this.translations[langCode] ? langCode : "en";
      console.log(
        "🌍 Invalid saved language, auto-detected:",
        this.currentLanguage
      );
    }
  }

  setLanguage(langCode) {
    if (langCode === "auto") {
      // Switch to auto-detection
      localStorage.setItem("harvest_language", "auto");
      this.autoDetected = true;
      const browserLang = navigator.language || navigator.userLanguage;
      const detectedLang = browserLang.split("-")[0];
      this.currentLanguage = this.translations[detectedLang]
        ? detectedLang
        : "en";
      console.log("🌍 Switched to auto-detect:", this.currentLanguage);
    } else if (this.translations[langCode]) {
      // Manual language selection
      this.currentLanguage = langCode;
      this.autoDetected = false;
      localStorage.setItem("harvest_language", langCode);
      console.log("🌍 Language manually changed to:", langCode);
    } else {
      console.warn("Language not supported:", langCode);
      return;
    }

    this.translatePage();
  }

  getSavedPreference() {
    const saved = localStorage.getItem("harvest_language");
    return saved || "auto";
  }

  t(key, fallback = "") {
    const translation = this.translations[this.currentLanguage]?.[key];
    if (translation) {
      return translation;
    }

    // Fallback to English if key not found in current language
    const englishTranslation = this.translations["en"]?.[key];
    if (englishTranslation) {
      return englishTranslation;
    }

    // Return the key itself or fallback if provided
    return fallback || key;
  }

  translatePage() {
    // Translate elements with data-i18n attribute
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.getAttribute("data-i18n");
      const translation = this.t(key);

      if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
        // For input fields, translate placeholder
        if (element.hasAttribute("placeholder")) {
          element.placeholder = translation;
        }
      } else {
        // For other elements, translate text content
        element.textContent = translation;
      }
    });

    // Translate elements with data-i18n-placeholder attribute
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const key = element.getAttribute("data-i18n-placeholder");
      element.placeholder = this.t(key);
    });

    // Translate elements with data-i18n-title attribute
    document.querySelectorAll("[data-i18n-title]").forEach((element) => {
      const key = element.getAttribute("data-i18n-title");
      element.title = this.t(key);
    });

    console.log("✅ Page translated to:", this.currentLanguage);
  }

  getAvailableLanguages() {
    return Object.keys(this.translations);
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  getLanguageName(code) {
    const names = {
      en: "English",
      de: "Deutsch",
      fr: "Français",
      es: "Español",
      it: "Italiano",
      pt: "Português",
      nl: "Nederlands",
      ja: "日本語",
      zh: "中文",
    };
    return names[code] || code.toUpperCase();
  }
}

// Create global instance
const i18n = new I18n();

// Helper function for quick access
function t(key, fallback) {
  return i18n.t(key, fallback);
}
