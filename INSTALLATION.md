# Safari Extension Installation & Testing Guide

## Loading the Extension in Safari

### Step 1: Enable Developer Mode

1. Open **Safari**
2. Go to **Safari > Preferences** (or press `Cmd + ,`)
3. Click on **Advanced** tab
4. Check "**Show Develop menu in menu bar**"

### Step 2: Allow Unsigned Extensions

1. In Safari, click **Develop** in the menu bar
2. Select "**Allow Unsigned Extensions**"
3. This enables loading of development extensions

### Step 3: Load the Extension

1. Go to **Safari > Preferences**
2. Click on **Extensions** tab
3. Click the **"+"** button in the bottom left
4. Navigate to your project folder: `/Users/mb14/Work/safari harvest`
5. Select the entire folder and click "**Select Folder**"
6. The extension should appear in the list

### Step 4: Enable the Extension

1. Find "**Harvest Time Tracker**" in the extensions list
2. Check the checkbox to **enable** it
3. You should see the extension icon in Safari's toolbar

## Testing the Extension

### Configuration

1. **Get your Harvest credentials**:

   - Go to your Harvest account → Settings → Developers
   - Create a "Personal Access Token"
   - Note your company subdomain (e.g. "yourcompany" from yourcompany.harvestapp.com)

2. **Configure the extension**:

   - Click the Harvest extension icon in Safari's toolbar
   - Enter your company subdomain
   - Enter your Personal Access Token
   - Click "Connect to Harvest"

3. **Start tracking**: You'll see your projects and can start timing immediately!

### Basic Functionality Test

1. **Popup Interface**: Extension icon should open the timer popup
2. **Project Loading**: Projects and tasks should populate from your Harvest account
3. **Timer Start/Stop**: Should be able to start and stop timers
4. **Badge Updates**: Timer duration should appear in the toolbar badge

### Integration Testing

- **GitHub**:
  1. Navigate to any GitHub issue or pull request (URL contains `/issues/` or `/pull/`)
  2. Look for "⏱️ Track Time" button in the header actions area (next to Edit/Code buttons)
  3. If not visible, refresh the page and wait a few seconds for dynamic loading
  4. Check browser console (Developer Tools) for "Harvest:" debug messages
- **Trello**: Open a Trello card and check for integration
- **Keyboard Shortcut**: Press `Cmd+Shift+H` on any webpage to open timer widget

## Debugging

### Console Access

1. **Right-click** the extension icon
2. Select "**Inspect Extension**"
3. Use the **Console** tab to view errors and debug messages

### Background Script Debugging

1. Go to **Develop > Web Extension Background Pages**
2. Select "**Harvest Time Tracker**"
3. This opens the background script console

### Content Script Issues

- Check the **Web Inspector** on pages where integration isn't working
- Look for content script errors in the Console

## Common Issues & Solutions

### "Connection Failed" Error

- Make sure you're logged into Harvest at [id.getharvest.com/sessions/new](https://id.getharvest.com/sessions/new)
- Check that cookies are enabled for Harvest domains
- Try refreshing the Harvest login page and logging in again

### Extension Not Loading

- Make sure "Allow Unsigned Extensions" is enabled
- Try disabling and re-enabling the extension
- Check Safari's Error Console for loading issues
- **✅ Icon errors fixed**: The extension now includes valid PNG icon files

### Timer Buttons Not Appearing

- **GitHub Issues**: Refresh the webpage after enabling the extension
- **Check Safari Console**: Open Developer Tools to see if content script is loading
- **Verify URL**: Make sure you're on an issue/PR page (contains `/issues/` or `/pull/` in URL)
- **Wait for loading**: GitHub loads content dynamically, button may take a few seconds to appear
- **Try keyboard shortcut**: Press `Cmd+Shift+H` to open timer widget manually

### Badge Not Updating

- Check background script permissions
- Verify timer data is being stored correctly
- Look for JavaScript errors in background script console

## Development Workflow

### Making Changes

1. **Edit** files in `/Users/mb14/Work/safari harvest`
2. **Reload** the extension in Safari Preferences > Extensions
3. **Test** functionality in Safari

### Packaging for Distribution

```bash
cd "/Users/mb14/Work/safari harvest"
npm run package
```

This creates `harvest-safari-extension.zip` ready for distribution.

---

**Your Safari Harvest Extension is now ready to use!** 🎉

The extension provides the same core functionality as the Chrome version:

- ⏱️ **One-click time tracking** from Safari's toolbar
- 🔗 **Smart integration** with GitHub, Trello, Asana, and more
- ⌨️ **Keyboard shortcuts** (`Cmd+Shift+H`) for quick access
- 📊 **Real-time timer display** in the browser badge
- 📝 **Project and task management** directly from the popup
