# Icon Update Implementation - Badge Removal

## Problem

The extension was showing "NaN" on the badge icon due to Safari's limited badge support and issues with time calculation.

## Solution

Completely removed badge functionality and replaced with Safari-native icon switching approach.

## Changes Made

### 1. background.js

**Removed:**

- ❌ `this.intervalId` - No longer needed (no per-second updates)
- ❌ `this.badgeEnabled` - Badge toggle flag removed
- ❌ `updateBadge()` function - Replaced with `updateIcon()`
- ❌ All `setBadgeText()` calls
- ❌ All `setBadgeBackgroundColor()` calls
- ❌ Per-second interval for updating badge
- ❌ Badge preference loading from storage

**Added:**

- ✅ `updateIcon()` function - Switches between light and dark icon variants
- ✅ Icon updates on `startTimer()` and `stopTimer()`
- ✅ Tooltip title changes ("Timer Running" vs default)

### 2. popup.js

**Added:**

- ✅ `chrome.runtime.sendMessage({ action: "startTimer", ... })` in `startTimer()` method
- ✅ `chrome.runtime.sendMessage({ action: "stopTimer" })` in `stopCurrentTimer()` method

## How It Works Now

### Visual States

1. **Timer Stopped (Inactive)**

   - Icon: `icon16.png`, `icon32.png`, etc. (light/default variant)
   - Tooltip: "Harvest Time Tracker"

2. **Timer Running (Active)**
   - Icon: `icon16-dark.png`, `icon32-dark.png`, etc. (dark variant)
   - Tooltip: "Harvest Time Tracker (Timer Running)"

### Communication Flow

```
User clicks Start Timer in popup
    ↓
popup.js startTimer() executes
    ↓
Sends message to background: { action: "startTimer", data: {...} }
    ↓
background.js receives message
    ↓
background.js calls updateIcon()
    ↓
Icon switches to dark variant ✅

User clicks Stop Button in popup
    ↓
popup.js stopCurrentTimer() executes
    ↓
Sends message to background: { action: "stopTimer" }
    ↓
background.js receives message
    ↓
background.js calls updateIcon()
    ↓
Icon switches to light variant ✅
```

## Benefits

- ✅ No more NaN errors
- ✅ Safari-native approach (icon switching vs badges)
- ✅ Better performance (no 1-second intervals)
- ✅ Cleaner, simpler codebase
- ✅ Works reliably across Safari versions
- ✅ Matches behavior of professional Safari extensions (1Password, Bitwarden, etc.)

## Testing Checklist

- [ ] Start a timer → Icon changes to dark variant
- [ ] Stop a timer → Icon changes to light variant
- [ ] Hover over icon when running → Shows "Timer Running" tooltip
- [ ] Hover over icon when stopped → Shows default tooltip
- [ ] Reload extension → Icon state matches timer state
- [ ] Restart browser → Timer state and icon state persist correctly

## Files Modified

1. `/Users/mb14/Work/safari harvest/background.js` - Removed badge system, added icon switching
2. `/Users/mb14/Work/safari harvest/popup.js` - Added background notifications on timer start/stop
