# Translation System

This extension uses a minimalistic custom translation system with automatic browser language detection and manual override.

## Features

✅ **Auto-detection**: Automatically detects browser language on first run
✅ **Manual override**: Language selector in extension footer
✅ **7 languages supported**: English, German, Spanish, French, Italian, Portuguese, Dutch
✅ **Persistent preference**: Saves user's language choice
✅ **Live switching**: Change language without reloading

## How It Works

1. **translations.js**: Contains all translation strings organized by language code (en, de, fr, etc.)
2. **i18n.js**: Lightweight translation helper that automatically detects browser language
3. **HTML attributes**: Elements use `data-i18n`, `data-i18n-placeholder`, and `data-i18n-title` attributes
4. **JavaScript API**: Use `t('key', 'fallback')` function to get translated strings

## Supported Languages

- **en** - English (default)
- **de** - Deutsch (German)
- **fr** - Français (French)
- **it** - Italiano (Italian)
- **es** - Español (Spanish)
- **pt** - Português (Portuguese/Brazilian)
- **nl** - Nederlands (Dutch)

## Adding a New Language

1. Open `translations.js`
2. Add a new language object following the existing pattern:

```javascript
es: {
  auth_title: "Inicio de sesión en Harvest",
  auth_login_button: "Iniciar sesión",
  // ... add all keys
}
```

3. The extension will automatically detect and use the browser's language

## Using Translations in HTML

### Text Content

```html
<h3 data-i18n="new_task_title">New Task</h3>
```

### Placeholder Text

```html
<input
  data-i18n-placeholder="auth_subdomain_placeholder"
  placeholder="yourcompany"
/>
```

### Title/Tooltip

```html
<button data-i18n-title="timer_start" title="Start timer">▶</button>
```

## Using Translations in JavaScript

```javascript
// Simple translation
const message = t("error_auth_failed");

// Translation with fallback
const message = t("error_auth_failed", "Authentication failed");

// Dynamic translations
showError(t("error_start_task", "Failed to start task") + ": " + error.message);
```

## Translation Keys

All translation keys follow a naming pattern:

- `auth_*` - Authentication/login screen
- `current_task_*` - Current running task section
- `new_task_*` - New task form
- `recent_entries_*` - Recent entries section
- `error_*` - Error messages
- `status_*` - Status messages
- `timer_*` - Timer actions
- `user_*` - User info and actions

## Manual Language Selection

Users can manually select their preferred language from the dropdown in the extension footer:

1. Open the Harvest extension
2. Look for the language selector (🌍) in the bottom-left corner
3. Choose from:
   - **🌍 Auto** - Automatic detection based on browser language (default)
   - **🇬🇧 English**
   - **🇩🇪 Deutsch**
   - **🇪🇸 Español**
   - **🇫🇷 Français**
   - **🇮🇹 Italiano**
   - **�� Português**
   - **🇳🇱 Nederlands**

The selection is saved and will persist across sessions.

## Browser Language Detection

The system automatically detects the browser language using:

```javascript
navigator.language || navigator.userLanguage;
```

For example:

- `en-US` → Uses `en` translations
- `de-DE` → Uses `de` translations
- `fr-CA` → Uses `fr` translations

## Language Persistence

The selected language (or "auto" mode) is saved in localStorage:

```javascript
localStorage.getItem("harvest_language");
```

### Auto Mode (Default)

- Setting: `'auto'` or not set
- Behavior: Detects browser language each time the extension opens
- Use case: Users who switch between devices or browsers with different language settings

### Manual Selection

- Setting: Specific language code (e.g., `'de'`, `'es'`)
- Behavior: Always uses the selected language regardless of browser settings
- Use case: Users who want to override their browser language for this extension

## Testing Translations

### Test Auto-Detection:

1. Select "🌍 Auto" in the language selector
2. Change your browser's language settings
3. Reload the extension
4. The UI should automatically display in the detected language
5. If the language is not supported, English will be used as fallback

### Test Manual Selection:

1. Select a specific language from the dropdown
2. The UI immediately switches to that language
3. Close and reopen the extension
4. The language remains the same (persisted)

## Programmatic API

For developers or advanced users:

```javascript
// Change language programmatically
i18n.setLanguage("de"); // Switch to German
i18n.setLanguage("auto"); // Switch back to auto-detection

// Get current language
const currentLang = i18n.getCurrentLanguage(); // e.g., 'en'

// Get saved preference (includes 'auto')
const pref = i18n.getSavedPreference(); // e.g., 'auto' or 'de'

// Check if auto-detected
const isAuto = i18n.autoDetected; // true/false
```
