# Test Coverage Report

## Overview

Comprehensive unit tests have been created for the Safari Harvest Extension, covering all major functionality including new features like i18n, external timer synchronization, and authentication.

## Test Summary

- **Total Test Files**: 10
- **Total Tests**: 117
- **Status**: ✅ All Passing

## Test Files

### 1. **test/i18n.spec.js** (20 tests) ✅

Tests for the internationalization system with 7 language support.

#### Coverage:

- **Initialization (5 tests)**

  - Default to English when no preference saved
  - Auto-detect browser language on first run
  - Fallback to English for unsupported languages
  - Use saved manual language preference
  - Respect 'auto' preference and detect browser language

- **Manual Language Selection (4 tests)**

  - Switch to specified language
  - Switch to auto-detection mode
  - Ignore unsupported language codes
  - Persist language preference across sessions

- **Translation Retrieval (5 tests)**

  - Return correct translation for current language
  - Fallback to English when key missing in current language
  - Return key when translation missing in all languages
  - Return provided fallback when key missing
  - Return empty string for empty fallback

- **Language Information (2 tests)**

  - Return saved preference including 'auto'
  - Return all available languages

- **Edge Cases (4 tests)**
  - Handle malformed localStorage data
  - Handle missing navigator.language
  - Handle language codes with regions (e.g., en-GB)
  - Handle complex language codes (e.g., de-DE-1996)

### 2. **test/timerSync.spec.js** (18 tests) ✅

Tests for external timer synchronization with 30-second polling.

#### Coverage:

- **syncWithExternalTimer (6 tests)**

  - Detect externally started timer
  - Detect externally stopped timer
  - Detect different timer started externally
  - Update same timer details
  - Return none when no changes detected
  - Handle API errors gracefully

- **Timer Change Callbacks (3 tests)**

  - Trigger callback when timer started externally
  - Trigger callback when timer stopped externally
  - Handle missing callback without crashing

- **Periodic Synchronization (4 tests)**

  - Start periodic sync with default interval (30s)
  - Start periodic sync with custom interval
  - Stop periodic sync
  - Clear previous interval when starting new sync

- **Multiple Running Timers (1 test)**

  - Select first running timer when multiple exist

- **Edge Cases (4 tests)**
  - Handle empty time entries array
  - Handle null/undefined time entries
  - Handle malformed timer entry
  - Preserve local timer on network failure

### 3. **test/auth.spec.js** (39 tests) ✅

Tests for authentication flow with security validation.

#### Coverage:

- **Subdomain Validation (15 tests)**

  - Accept valid alphanumeric subdomain
  - Accept subdomain with hyphens
  - Accept subdomain with numbers
  - Reject empty subdomain
  - Reject subdomain with spaces
  - Reject subdomain with special characters
  - Reject subdomain starting/ending with hyphen
  - Reject too short/long subdomain
  - Reject XSS attempts (script tags, javascript protocol, event handlers)
  - Reject SQL injection attempts (quotes, comments)

- **Token Validation (5 tests)**

  - Accept valid token (64 chars)
  - Reject empty token
  - Reject too short token (<20 chars)
  - Reject too long token (>200 chars)
  - Reject XSS attempts in token

- **Input Sanitization (3 tests)**

  - Trim whitespace
  - Remove dangerous characters (<, >, ", ')
  - Remove quotes from input

- **Authentication Success (4 tests)**

  - Successfully authenticate with valid credentials
  - Store credentials after successful auth
  - Make API call to correct endpoint
  - Sanitize inputs before making API call

- **Authentication Failures (6 tests)**

  - Throw error for invalid subdomain
  - Throw error for invalid token
  - Handle 401 unauthorized response
  - Handle 403 forbidden response
  - Handle network errors
  - Don't store credentials on failed auth

- **Logout (2 tests)**

  - Clear authentication state
  - Handle logout when not authenticated

- **Edge Cases (4 tests)**
  - Handle null/undefined inputs
  - Handle whitespace-only subdomain
  - Handle API response without JSON body

### 4. **test/languageSelector.spec.js** (24 tests) ✅

Tests for language selector UI integration.

#### Coverage:

- **Initialization (4 tests)**

  - Find language select element
  - Throw error if element not found
  - Load saved preference on init
  - Default to 'auto' when no preference

- **Language Change Handling (6 tests)**

  - Change language when selection changes
  - Update DOM text content
  - Update input placeholders
  - Update button labels
  - Persist selection to localStorage
  - Dispatch custom event on language change

- **Auto-Detection Mode (3 tests)**

  - Detect browser language when auto selected
  - Fallback to English for unsupported language
  - Save auto preference to localStorage

- **Manual Selection Updates (2 tests)**

  - Update dropdown value programmatically
  - Handle missing select element gracefully

- **Multiple DOM Elements (1 test)**

  - Translate all elements with same translation key

- **Language Persistence (2 tests)**

  - Remember manual selection across sessions
  - Remember auto-detect setting across sessions

- **Edge Cases (4 tests)**

  - Handle rapid language switching
  - Handle missing translation attributes
  - Handle corrupted localStorage data
  - Handle missing data-i18n attributes

- **Event Listeners (2 tests)**
  - Attach only one change listener
  - Work after re-initialization

### 5. **test/harvestAPI.spec.js** (2 tests) ✅

Basic API request tests.

### 6. **test/popup.prefill.spec.js** (2 tests) ✅

Tests for automatic project/task prefilling.

### 7. **test/popup.running-title.spec.js** (2 tests) ✅

Tests for running timer title updates.

### 8. **test/popup.snapshot.spec.js** (2 tests) ✅

DOM snapshot tests for UI consistency.

### 9. **test/timeUtils.spec.js** (4 tests) ✅

Tests for time utility functions.

### 10. **test/timerCore.spec.js** (4 tests) ✅

Tests for core timer functionality.

## New Test Files Created

The following test files were created to cover previously untested functionality:

1. **test/i18n.spec.js** - Complete coverage for translation system
2. **test/timerSync.spec.js** - Complete coverage for external timer sync
3. **test/auth.spec.js** - Complete coverage for authentication with security
4. **test/languageSelector.spec.js** - Complete coverage for language selector UI

## Test Coverage by Feature

### ✅ i18n System (Complete)

- Language detection and auto-switching
- Manual language selection
- Translation fallbacks
- localStorage persistence
- 7 languages supported (en, de, es, fr, it, pt, nl)

### ✅ External Timer Synchronization (Complete)

- 30-second polling mechanism
- Detect external start/stop
- Handle timer conflicts
- Error handling and recovery

### ✅ Authentication & Security (Complete)

- Input validation (subdomain, token)
- XSS prevention
- SQL injection prevention
- Secure credential storage
- Error handling

### ✅ Language Selector UI (Complete)

- Dropdown initialization
- Language switching
- DOM updates
- Event handling
- Persistence

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Update snapshots
npm test -- -u
```

## Test Framework

- **Framework**: Vitest v1.6.0
- **Environment**: jsdom (browser simulation)
- **Mocking**: vi.fn() for function mocks
- **Async**: async/await pattern
- **Timers**: Fake timers (vi.useFakeTimers)

## Coverage Goals

Current test coverage focuses on:

- ✅ Core functionality (time tracking, API integration)
- ✅ New features (i18n, external sync)
- ✅ Security (input validation, XSS/SQL prevention)
- ✅ UI interactions (language selector, DOM updates)
- ✅ Error handling (network failures, invalid inputs)
- ✅ Edge cases (null values, malformed data)

## Notes

- All tests use isolated mock data to avoid API dependencies
- Tests include both happy path and error scenarios
- Security tests validate against common attack vectors
- UI tests verify DOM manipulation and event handling
- Snapshot tests ensure UI consistency across changes

## Maintenance

When adding new features:

1. Create corresponding test file in `test/` directory
2. Follow existing patterns (describe/it blocks, mocking)
3. Include both success and failure scenarios
4. Add edge case tests
5. Update this document with new coverage
