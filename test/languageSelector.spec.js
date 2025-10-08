import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock DOM setup
function setupDOM() {
  document.body.innerHTML = `
    <div id="app">
      <div id="authSection">
        <h2 data-i18n="auth_title">Harvest Login</h2>
        <input id="subdomain" placeholder="Company subdomain" data-i18n-placeholder="auth_subdomain_placeholder">
        <input id="token" placeholder="Personal access token" data-i18n-placeholder="auth_token_placeholder">
        <button id="loginBtn" data-i18n="auth_login_button">Login</button>
      </div>
      
      <div id="timerSection" style="display: none;">
        <h3 data-i18n="new_task_title">New Task</h3>
        <select id="projectSelect" data-i18n-placeholder="new_task_select_project">
          <option value="">Select a project</option>
        </select>
        <button id="startBtn" data-i18n="new_task_start_button">Start Task</button>
      </div>
      
      <div id="footer">
        <select id="languageSelect">
          <option value="auto">🌐 Auto-detect</option>
          <option value="en">🇬🇧 English</option>
          <option value="de">🇩🇪 Deutsch</option>
          <option value="es">🇪🇸 Español</option>
          <option value="fr">🇫🇷 Français</option>
          <option value="it">🇮🇹 Italiano</option>
          <option value="pt">🇵🇹 Português</option>
          <option value="nl">🇳🇱 Nederlands</option>
        </select>
      </div>
    </div>
  `;
}

// Mock translations
const mockTranslations = {
  en: {
    auth_title: "Harvest Login",
    auth_subdomain_placeholder: "Company subdomain",
    auth_token_placeholder: "Personal access token",
    auth_login_button: "Login",
    new_task_title: "New Task",
    new_task_select_project: "Select a project",
    new_task_start_button: "Start Task",
  },
  de: {
    auth_title: "Harvest Anmeldung",
    auth_subdomain_placeholder: "Firmen-Subdomain",
    auth_token_placeholder: "Persönlicher Zugangstoken",
    auth_login_button: "Anmelden",
    new_task_title: "Neue Aufgabe",
    new_task_select_project: "Projekt auswählen",
    new_task_start_button: "Aufgabe starten",
  },
  es: {
    auth_title: "Inicio de sesión en Harvest",
    auth_subdomain_placeholder: "Subdominio de la empresa",
    auth_token_placeholder: "Token de acceso personal",
    auth_login_button: "Iniciar sesión",
    new_task_title: "Nueva tarea",
    new_task_select_project: "Seleccionar un proyecto",
    new_task_start_button: "Iniciar tarea",
  },
};

// Simplified I18n class
class I18n {
  constructor(translations) {
    this.currentLanguage = "en";
    this.translations = translations;
  }

  t(key) {
    return (
      this.translations[this.currentLanguage]?.[key] ||
      this.translations["en"]?.[key] ||
      key
    );
  }

  translatePage() {
    // Translate text content
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.getAttribute("data-i18n");
      element.textContent = this.t(key);
    });

    // Translate placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const key = element.getAttribute("data-i18n-placeholder");
      element.placeholder = this.t(key);
    });

    // Translate titles/tooltips
    document.querySelectorAll("[data-i18n-title]").forEach((element) => {
      const key = element.getAttribute("data-i18n-title");
      element.title = this.t(key);
    });
  }

  setLanguage(langCode) {
    if (langCode === "auto") {
      const browserLang = (navigator.language || "en").split("-")[0];
      this.currentLanguage = this.translations[browserLang]
        ? browserLang
        : "en";
      localStorage.setItem("harvest_language", "auto");
    } else if (this.translations[langCode]) {
      this.currentLanguage = langCode;
      localStorage.setItem("harvest_language", langCode);
    }
    this.translatePage();
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  getSavedPreference() {
    return localStorage.getItem("harvest_language") || "auto";
  }
}

// Language selector manager
class LanguageSelector {
  constructor(i18n) {
    this.i18n = i18n;
    this.selectElement = null;
  }

  init() {
    this.selectElement = document.getElementById("languageSelect");
    if (!this.selectElement) {
      throw new Error("Language select element not found");
    }

    // Load saved preference
    const savedPref = this.i18n.getSavedPreference();
    this.selectElement.value = savedPref;

    // Add change listener
    this.selectElement.addEventListener("change", (e) => {
      this.handleLanguageChange(e.target.value);
    });
  }

  handleLanguageChange(langCode) {
    this.i18n.setLanguage(langCode);

    // Dispatch custom event for other components
    const event = new CustomEvent("languageChanged", {
      detail: { language: this.i18n.getCurrentLanguage() },
    });
    document.dispatchEvent(event);
  }

  updateSelection(langCode) {
    if (this.selectElement) {
      this.selectElement.value = langCode;
    }
  }
}

describe("Language Selector Integration", () => {
  let i18n;
  let languageSelector;

  beforeEach(() => {
    setupDOM();
    localStorage.clear();
    i18n = new I18n(mockTranslations);
    languageSelector = new LanguageSelector(i18n);

    // Mock navigator
    Object.defineProperty(navigator, "language", {
      writable: true,
      value: "en-US",
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
  });

  describe("Initialization", () => {
    it("finds language select element", () => {
      languageSelector.init();
      expect(languageSelector.selectElement).not.toBeNull();
      expect(languageSelector.selectElement.id).toBe("languageSelect");
    });

    it("throws error if select element not found", () => {
      document.getElementById("languageSelect").remove();
      expect(() => languageSelector.init()).toThrow(
        "Language select element not found"
      );
    });

    it("loads saved preference on init", () => {
      localStorage.setItem("harvest_language", "de");
      languageSelector.init();
      expect(languageSelector.selectElement.value).toBe("de");
    });

    it("defaults to auto when no preference saved", () => {
      languageSelector.init();
      expect(languageSelector.selectElement.value).toBe("auto");
    });
  });

  describe("Language Change Handling", () => {
    beforeEach(() => {
      languageSelector.init();
      i18n.translatePage(); // Initial translation
    });

    it("changes language when selection changes", () => {
      const select = document.getElementById("languageSelect");
      select.value = "de";
      select.dispatchEvent(new Event("change"));

      expect(i18n.getCurrentLanguage()).toBe("de");
    });

    it("updates DOM text content", () => {
      const title = document.querySelector('[data-i18n="auth_title"]');
      expect(title.textContent).toBe("Harvest Login"); // English initially

      const select = document.getElementById("languageSelect");
      select.value = "de";
      select.dispatchEvent(new Event("change"));

      expect(title.textContent).toBe("Harvest Anmeldung"); // German
    });

    it("updates input placeholders", () => {
      const subdomain = document.getElementById("subdomain");
      expect(subdomain.placeholder).toBe("Company subdomain");

      const select = document.getElementById("languageSelect");
      select.value = "de";
      select.dispatchEvent(new Event("change"));

      expect(subdomain.placeholder).toBe("Firmen-Subdomain");
    });

    it("updates button labels", () => {
      const loginBtn = document.getElementById("loginBtn");
      expect(loginBtn.textContent).toBe("Login");

      const select = document.getElementById("languageSelect");
      select.value = "es";
      select.dispatchEvent(new Event("change"));

      expect(loginBtn.textContent).toBe("Iniciar sesión");
    });

    it("persists selection to localStorage", () => {
      const select = document.getElementById("languageSelect");
      select.value = "de";
      select.dispatchEvent(new Event("change"));

      expect(localStorage.getItem("harvest_language")).toBe("de");
    });

    it("dispatches custom event on language change", async () => {
      const eventPromise = new Promise((resolve) => {
        document.addEventListener(
          "languageChanged",
          (e) => {
            resolve(e.detail.language);
          },
          { once: true }
        );
      });

      const select = document.getElementById("languageSelect");
      select.value = "es";
      select.dispatchEvent(new Event("change"));

      const language = await eventPromise;
      expect(language).toBe("es");
    });
  });

  describe("Auto-Detection Mode", () => {
    it("detects browser language when auto selected", () => {
      Object.defineProperty(navigator, "language", {
        writable: true,
        value: "de-DE",
      });

      languageSelector.init();
      const select = document.getElementById("languageSelect");
      select.value = "auto";
      select.dispatchEvent(new Event("change"));

      expect(i18n.getCurrentLanguage()).toBe("de");
    });

    it("falls back to English for unsupported language", () => {
      Object.defineProperty(navigator, "language", {
        writable: true,
        value: "ja-JP",
      });

      languageSelector.init();
      const select = document.getElementById("languageSelect");
      select.value = "auto";
      select.dispatchEvent(new Event("change"));

      expect(i18n.getCurrentLanguage()).toBe("en");
    });

    it("saves auto preference to localStorage", () => {
      languageSelector.init();
      const select = document.getElementById("languageSelect");
      select.value = "auto";
      select.dispatchEvent(new Event("change"));

      expect(localStorage.getItem("harvest_language")).toBe("auto");
    });
  });

  describe("Manual Selection Updates", () => {
    it("updates dropdown value programmatically", () => {
      languageSelector.init();
      languageSelector.updateSelection("de");
      expect(languageSelector.selectElement.value).toBe("de");
    });

    it("does nothing if select element not initialized", () => {
      expect(() => languageSelector.updateSelection("de")).not.toThrow();
    });
  });

  describe("Multiple DOM Elements", () => {
    it("translates all elements with same translation key", () => {
      // Add duplicate elements
      document.getElementById("authSection").innerHTML += `
        <button data-i18n="auth_login_button">Login</button>
        <button data-i18n="auth_login_button">Login</button>
      `;

      languageSelector.init();
      const select = document.getElementById("languageSelect");
      select.value = "de";
      select.dispatchEvent(new Event("change"));

      const buttons = document.querySelectorAll(
        '[data-i18n="auth_login_button"]'
      );
      buttons.forEach((button) => {
        expect(button.textContent).toBe("Anmelden");
      });
    });
  });

  describe("Language Persistence Across Sessions", () => {
    it("remembers manual selection", () => {
      languageSelector.init();
      const select = document.getElementById("languageSelect");
      select.value = "es";
      select.dispatchEvent(new Event("change"));

      // Simulate new session
      const newI18n = new I18n(mockTranslations);
      const newSelector = new LanguageSelector(newI18n);
      newSelector.init();

      expect(newSelector.selectElement.value).toBe("es");
    });

    it("remembers auto-detect setting", () => {
      languageSelector.init();
      const select = document.getElementById("languageSelect");
      select.value = "auto";
      select.dispatchEvent(new Event("change"));

      // Simulate new session
      const newI18n = new I18n(mockTranslations);
      const newSelector = new LanguageSelector(newI18n);
      newSelector.init();

      expect(newSelector.selectElement.value).toBe("auto");
    });
  });

  describe("Edge Cases", () => {
    it("handles rapid language switching", () => {
      languageSelector.init();
      const select = document.getElementById("languageSelect");

      select.value = "de";
      select.dispatchEvent(new Event("change"));

      select.value = "es";
      select.dispatchEvent(new Event("change"));

      select.value = "en";
      select.dispatchEvent(new Event("change"));

      const title = document.querySelector('[data-i18n="auth_title"]');
      expect(title.textContent).toBe("Harvest Login");
    });

    it("handles missing translation attributes gracefully", () => {
      document.body.innerHTML +=
        '<div id="noAttr">No translation attribute</div>';

      languageSelector.init();
      const select = document.getElementById("languageSelect");
      select.value = "de";

      expect(() => select.dispatchEvent(new Event("change"))).not.toThrow();
    });

    it("handles corrupted localStorage data", () => {
      localStorage.setItem("harvest_language", '{"invalid": "json"}');

      languageSelector.init();
      // Should treat invalid data as unsupported language, falling back to saved value
      // The select will have the corrupted value but should still be initialized
      expect(languageSelector.selectElement).not.toBeNull();
    });

    it("handles missing data-i18n attributes", () => {
      const element = document.createElement("div");
      element.setAttribute("data-i18n", "missing_key");
      document.body.appendChild(element);

      languageSelector.init();
      const select = document.getElementById("languageSelect");
      select.value = "de";
      select.dispatchEvent(new Event("change"));

      // Should use key as fallback
      expect(element.textContent).toBe("missing_key");
    });
  });

  describe("Event Listeners", () => {
    it("only attaches one change listener", () => {
      const eventSpy = vi.fn();

      languageSelector.init();
      const select = document.getElementById("languageSelect");

      document.addEventListener("languageChanged", eventSpy);

      select.value = "de";
      select.dispatchEvent(new Event("change"));

      expect(eventSpy).toHaveBeenCalledTimes(1);
    });

    it("change listener works after re-initialization", () => {
      languageSelector.init();
      languageSelector.init(); // Re-init

      const select = document.getElementById("languageSelect");
      select.value = "de";
      select.dispatchEvent(new Event("change"));

      expect(i18n.getCurrentLanguage()).toBe("de");
    });
  });
});
