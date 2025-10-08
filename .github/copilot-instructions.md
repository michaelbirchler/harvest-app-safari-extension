# Safari Harvest Time Tracker Extension

This is a Safari web extension that replicates the functionality of the popular Harvest Time Tracker Chrome extension. It provides seamless time tracking capabilities directly from Safari.

## Project Structure

- **Extension Type**: Safari Web Extension (Manifest v2 compatible)
- **Primary Language**: JavaScript (ES6+)
- **UI Framework**: Vanilla HTML/CSS/JS
- **API Integration**: Harvest v2 REST API
- **Target Platform**: Safari 14+ on macOS and iOS

## Key Features Implemented

✅ **Core Time Tracking**

- Harvest API authentication with Personal Access Tokens
- Start/stop timers with project and task selection
- Real-time timer display with badge notifications
- Recent entries view and timer persistence

✅ **Project Management Integration**

- GitHub repository and issue detection
- Trello board and card integration
- Asana task extraction
- Basecamp project support
- Universal website integration with smart project detection

✅ **User Experience**

- Popup interface matching Harvest's design language
- Keyboard shortcuts (Cmd+Shift+H) for quick access
- Context menu integration for right-click timer start
- Automatic project/task suggestion based on current webpage

✅ **Technical Implementation**

- Background script for persistent timer management
- Content scripts for website integration
- Secure storage of API credentials
- Cross-page timer state synchronization

## Development Status: COMPLETE ✅

All project setup steps have been completed:

- [x] Project requirements clarified
- [x] Extension structure scaffolded
- [x] Core functionality implemented
- [x] No additional VS Code extensions needed
- [x] Project validated and packaged
- [x] VS Code tasks created for packaging
- [x] Installation guide provided
- [x] Documentation completed

## Files Structure

````
safari harvest/
├── manifest.json           # Extension configuration
├── popup.html/css/js       # Main extension UI (2188 lines)
├── background.js           # Background timer management
├── content.js/css          # Website integration
├── i18n.js                 # Translation system
├── translations.js         # 7 language translations (en, de, es, fr, it, pt, nl)
├── icons/                  # Extension icons (16-512px)
├── src/                    # Core modules
│   ├── timerCore.js       # Timer state management
│   └── timeUtils.js       # Time formatting utilities
├── test/                   # Vitest test suite (117 tests)
│   ├── i18n.spec.js       # Translation tests (20)
│   ├── timerSync.spec.js  # External sync tests (18)
│   ├── auth.spec.js       # Authentication tests (39)
│   └── languageSelector.spec.js # UI tests (24)
├── README.md              # Project documentation
├── INSTALLATION.md        # Safari setup guide
├── TEST_COVERAGE.md       # Test documentation
└── package.json           # Project metadata

## Recent Features Added

### 🌍 Internationalization (i18n)
- **7 Languages**: English, German, Spanish, French, Italian, Portuguese, Dutch
- **Auto-detection**: Detects browser language on first run
- **Manual selector**: Dropdown in footer for language switching
- **Coverage**: ~90-95% of user base
- **Persistence**: localStorage with 'auto' mode support

### 🔄 External Timer Synchronization
- **30-second polling**: Detects desktop app timer changes
- **Bidirectional sync**: Handles external start/stop/change
- **Conflict resolution**: Updates local state when external timer detected
- **Error handling**: Graceful degradation on network failures

### 👥 Client-Based Project Grouping
- **Optgroups**: Projects grouped by client name
- **Smart sorting**: "No Client" group at top
- **Visual hierarchy**: Improved UX for large project lists

### ✏️ Edit in Harvest Link
- **Direct linking**: Opens current timer in Harvest web app
- **Conditional display**: Only shows when timer running
- **New tab**: Opens in separate tab for convenience

### 🔒 Security Enhancements
- **Input validation**: Subdomain and token format checks
- **XSS prevention**: Script tags, event handlers, javascript protocol blocked
- **SQL injection prevention**: Quotes and SQL comments rejected
- **Sanitization**: All inputs cleaned before API calls

## Code Style & Conventions

### JavaScript
```javascript
// Use ES6+ features
const api = new HarvestAPI();
await api.authenticate();

// Arrow functions for callbacks
element.addEventListener('click', (e) => {
  handleClick(e);
});

// Async/await for API calls
async function fetchData() {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
  }
}

// Console logging with emoji prefixes
console.log('✅ Success:', data);
console.error('❌ Error:', error);
console.log('🔍 Debug:', info);
console.log('🔄 State change:', state);
````

### Naming Conventions

- **Functions**: `camelCase` - `startTimer()`, `loadProjects()`
- **Classes**: `PascalCase` - `HarvestAPI`, `TimerManager`, `I18n`
- **Constants**: `UPPER_SNAKE_CASE` - `API_BASE_URL`, `SYNC_INTERVAL`
- **DOM IDs**: `camelCase` - `projectSelect`, `startNewTaskBtn`
- **CSS Classes**: `kebab-case` - `new-task-form`, `status-toggle-btn`

### Translation Keys

Pattern: `category_descriptor`

```javascript
// Examples:
auth_title, auth_subdomain_placeholder;
new_task_title, new_task_start_button;
current_task_label, current_task_edit;
error_auth_failed, error_network;
```

## Important Implementation Details

### 1. Harvest API Integration

```javascript
// Base URL and authentication
const BASE_URL = 'https://api.harvestapp.com/v2';
headers: {
  'Authorization': `Bearer ${token}`,
  'Harvest-Account-ID': accountId,
  'User-Agent': 'Safari Harvest Extension'
}
```

### 2. Timer State Management

- **Local timer**: Stored in `chrome.storage.local`
- **Current timer**: Synced every 30 seconds with external changes
- **Timer calculations**: Base hours + (current time - start time) / 3600

### 3. External Timer Sync

```javascript
// Runs every 30 seconds in background
async function syncWithExternalTimer() {
  const entries = await getTimeEntries();
  const runningEntry = entries.find((e) => e.is_running);
  // Handle: started, stopped, changed, updated, none
}
```

### 4. Client Grouping in Projects

```javascript
// Group projects by client using <optgroup>
<optgroup label="ClientName">
  <option value="projectId">Project Name</option>
</optgroup>
```

### 5. Translation System

```javascript
// Initialize with auto-detection
const i18n = new I18n(translations);
i18n.init(); // Auto-detects or uses saved preference

// Translate UI
i18n.translatePage(); // Updates all [data-i18n] elements

// Get translation with fallback
const text = i18n.t("key", "fallback"); // key → en → fallback
```

## Testing Guidelines

### Test Structure (Vitest)

```javascript
describe("Feature Name", () => {
  let instance;

  beforeEach(() => {
    // Setup
    instance = new Class();
  });

  afterEach(() => {
    // Cleanup
    vi.restoreAllMocks();
  });

  it("describes expected behavior", async () => {
    // Arrange
    const mockData = { test: "data" };

    // Act
    const result = await instance.method(mockData);

    // Assert
    expect(result).toBe(expected);
  });
});
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm test -- -u        # Update snapshots
```

### Test Coverage: 117 tests across 10 files

- ✅ i18n.spec.js (20 tests) - Translation system
- ✅ timerSync.spec.js (18 tests) - External timer sync
- ✅ auth.spec.js (39 tests) - Authentication & security
- ✅ languageSelector.spec.js (24 tests) - Language selector UI
- ✅ harvestAPI.spec.js (2 tests) - API integration
- ✅ popup.prefill.spec.js (2 tests) - Auto-prefill
- ✅ popup.running-title.spec.js (2 tests) - Title updates
- ✅ popup.snapshot.spec.js (2 tests) - DOM snapshots
- ✅ timeUtils.spec.js (4 tests) - Time utilities
- ✅ timerCore.spec.js (4 tests) - Timer core

## Common Tasks

### Adding a New Translation

1. Add key to all 7 languages in `translations.js`
2. Add `data-i18n="key"` to HTML element
3. Call `i18n.translatePage()` after DOM changes
4. Write tests in `test/i18n.spec.js`

### Adding API Endpoint

1. Add method to `HarvestAPI` class in `popup.js`
2. Use `makeRequest()` helper with proper error handling
3. Update `test/harvestAPI.spec.js` with new endpoint tests

### Adding New Feature

1. Implement in `popup.js` or appropriate module
2. Add translation keys to `translations.js`
3. Update HTML with `data-i18n` attributes
4. Create test file in `test/` directory
5. Update `TEST_COVERAGE.md`
6. Document in `README.md`

## Security Best Practices

### Input Validation

```javascript
// Always validate user input
if (!/^[a-zA-Z0-9-]+$/.test(subdomain)) {
  throw new Error("invalid_subdomain_format");
}

// Check for XSS patterns
const xssPatterns = [/<script/i, /javascript:/i, /on\w+=/i];
if (xssPatterns.some((p) => p.test(input))) {
  throw new Error("invalid_characters");
}

// Sanitize before use
const clean = input.replace(/[<>'"]/g, "").trim();
```

### API Security

- Never store credentials in plain text
- Use chrome.storage.sync for encrypted storage
- Validate all API responses
- Handle 401/403 errors appropriately

## Performance Considerations

1. **Timer Sync**: 30-second interval to balance responsiveness and API load
2. **DOM Updates**: Batch updates and use DocumentFragment when possible
3. **API Calls**: Cache project/task lists, only refetch when needed
4. **Event Listeners**: Use event delegation where possible
5. **Smooth Scrolling**: CSS `scroll-behavior: smooth` + `-webkit-overflow-scrolling: touch`

## Debugging Tips

### Console Logging Conventions

Use emoji prefixes for easy filtering:

- 🚀 Initialization
- ✅ Success
- ❌ Error
- 🔍 Debug
- 🔄 State change
- 📊 Data
- 📋 List/Array

### Common Issues

1. **Timer not syncing**: Check 30-second interval, verify API credentials
2. **Translations not updating**: Call `i18n.translatePage()` after DOM changes
3. **Projects not loading**: Verify API token, check network tab
4. **Current task not showing**: Ensure timer is running, check `updateStatusBar()`

## Build & Package

```bash
npm run build:icons     # Generate icon sizes from SVG
npm run package         # Create .zip for distribution
npm run validate        # Verify extension structure
npm run lint            # Run oxlint
npm run lint:fix        # Auto-fix lint issues
```

## Browser Compatibility

- **Safari 14+**: Primary target
- **macOS**: Full support
- **iOS**: Limited support (context menu not available)

## Notes for AI Assistants

- **No frameworks**: Use vanilla JavaScript only, no React/Vue/etc.
- **i18n first**: Always add translations for new UI text (all 7 languages)
- **Test coverage**: Write tests for all new features
- **Security focus**: Validate all user inputs, prevent XSS/SQL injection
- **Safari quirks**: Test scrolling, storage, and timers on actual Safari
- **Keep it simple**: Prefer readable code over clever optimizations
- **Document changes**: Update README.md and TEST_COVERAGE.md
- **External sync**: Remember 30-second polling for desktop app integration
- **Client grouping**: Use `<optgroup>` for project organization
