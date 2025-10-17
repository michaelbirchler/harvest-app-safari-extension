// Background script for Harvest Time Tracker
class BackgroundTimerManager {
  constructor() {
    this.currentTimer = null;
    this.isSafari =
      /Safari\//.test(navigator.userAgent) &&
      !/Chrome\//.test(navigator.userAgent);
    this._popupOpeningSince = 0; // timestamp while attempting to show popup
    this._panelWindowId = null; // track popup emulation window when manually opened (fallback)
  }

  init() {
    // Initialize icon to default state
    this.updateIcon();

    // Listen for timer updates from popup and content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case "popupAck":
          // Popup loaded and acknowledged
          this._popupOpeningSince = 0;
          sendResponse?.({ ok: true });
          break;
        case "startTimer":
          this.startTimer(message.data);
          break;
        case "stopTimer":
          this.stopTimer();
          break;
        case "stopActiveTimer":
          // Direct stop request from content script (floating button running state)
          this.stopTimer();
          chrome.storage.local.remove(["activeTimerMeta"]);
          sendResponse?.({ success: true });
          break;
        case "togglePageTimer":
          // For future expansion; currently popup handles Harvest API.
          break;
        case "getTimerState":
          sendResponse(this.getTimerState());
          break;
        case "startTimerFromPage":
          this.handleStartTimerFromPage(message.data);
          break;
        case "ensurePopupVisible":
          this.ensurePopupVisible();
          break;
        case "openTab":
          this.openTab(message.url);
          sendResponse({ success: true });
          break;
      }
    });

    // Initialize icon
    this.updateIcon();

    // Restore timer state on startup
    this.restoreTimerState();
  }

  startTimer(timerData) {
    this.currentTimer = timerData;
    this.saveTimerState();
    this.updateIcon();
    chrome.runtime.sendMessage({
      action: "activeTimerUpdated",
      data: timerData,
    });
  }

  stopTimer() {
    this.currentTimer = null;
    this.saveTimerState();
    this.updateIcon();
    chrome.runtime.sendMessage({ action: "activeTimerStopped" });
  }

  getTimerState() {
    return {
      isRunning: !!this.currentTimer,
      timer: this.currentTimer,
    };
  }

  updateIcon() {
    if (this.currentTimer) {
      // Timer is running - use dark icon variant
      chrome.browserAction.setIcon({
        path: {
          16: "icons/icon16-dark.png",
          32: "icons/icon32-dark.png",
          48: "icons/icon48-dark.png",
          128: "icons/icon128-dark.png",
          256: "icons/icon256-dark.png",
          512: "icons/icon512-dark.png",
        },
      });
      chrome.browserAction.setTitle({
        title: "Harvest Time Tracker (Timer Running)",
      });
    } else {
      // Timer is stopped - use default light icon
      chrome.browserAction.setIcon({
        path: {
          16: "icons/icon16.png",
          32: "icons/icon32.png",
          48: "icons/icon48.png",
          128: "icons/icon128.png",
          256: "icons/icon256.png",
          512: "icons/icon512.png",
        },
      });
      chrome.browserAction.setTitle({
        title: "Harvest Time Tracker",
      });
    }
  }

  saveTimerState() {
    chrome.storage.local.set({
      currentTimer: this.currentTimer,
    });
  }

  restoreTimerState() {
    chrome.storage.local.get(["currentTimer"], (result) => {
      if (result.currentTimer) {
        this.currentTimer = result.currentTimer;
        this.startTimer(this.currentTimer);
      }
    });
  }

  handleStartTimerFromPage(data) {
    console.log("Background: Received start timer from page:", data);

    // Open the popup to allow user to start the timer
    chrome.browserAction.openPopup?.();

    // Store page data strictly as passive prefill (never auto-start)
    const prefill = {
      project: decodeURIComponent(data.project || ""),
      task: decodeURIComponent(data.task || ""),
      url: data.url,
      timestamp: Date.now(),
    };
    chrome.storage.local.set({
      harvestPrefill: prefill,
      pendingTimerStart: null, // legacy key cleared to disable any auto-start behavior
    });
  }

  ensurePopupVisible() {
    // With default_popup restored, simply ask browser to open it via openPopup if present
    try {
      if (chrome.browserAction.openPopup) {
        chrome.browserAction.openPopup();
        return;
      }
    } catch (e) {
      console.warn("openPopup not available", e);
    }
    // Fallback: create a small popup-style window
    const popupUrl = chrome.runtime.getURL("popup.html");
    if (this._panelWindowId) {
      chrome.windows.get(this._panelWindowId, (win) => {
        if (chrome.runtime.lastError || !win) {
          this._panelWindowId = null;
          this._createPopupWindow(popupUrl);
        } else {
          chrome.windows.update(this._panelWindowId, { focused: true });
        }
      });
    } else {
      this._createPopupWindow(popupUrl);
    }
  }

  _createPopupWindow(popupUrl) {
    chrome.windows.create(
      { url: popupUrl, type: "popup", width: 360, height: 640, focused: true },
      (win) => {
        if (win) this._panelWindowId = win.id;
      }
    );
  }

  // Removed ensurePopupVisibleFallback (merged into single strategy)

  openTab(url) {
    console.log("Background: Opening tab with URL:", url);

    try {
      if (chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create(
          {
            url: url,
            active: true,
          },
          (tab) => {
            if (chrome.runtime.lastError) {
              console.error(
                "Background: Failed to create tab:",
                chrome.runtime.lastError
              );
            } else {
              console.log("Background: Successfully created tab:", tab.id);
            }
          }
        );
      } else {
        console.error("Background: chrome.tabs.create not available");
      }
    } catch (error) {
      console.error("Background: Error creating tab:", error);
    }
  }

  togglePanel() {
    // If using fallback popup window, close it; otherwise open
    if (this._panelWindowId) {
      chrome.windows.get(this._panelWindowId, (win) => {
        if (chrome.runtime.lastError || !win) {
          this._panelWindowId = null;
          this.ensurePopupVisible();
        } else {
          chrome.windows.remove(this._panelWindowId, () => {
            this._panelWindowId = null;
          });
        }
      });
      return;
    }
    // If browser native popup: cannot programmatically detect easily; just open
    this.ensurePopupVisible();
  }
}

// Initialize background manager
const backgroundManager = new BackgroundTimerManager();
backgroundManager.init();

// Handle extension icon click
chrome.browserAction.onClicked.addListener((_tab) => {
  // Native behavior: clicking icon shows default popup; we just open explicitly for consistency
  backgroundManager.ensurePopupVisible();
});

// Keyboard command toggle
chrome.commands?.onCommand.addListener((command) => {
  if (command === "toggle-harvest-panel") {
    backgroundManager.togglePanel();
  }
});

// Clean up tracked tab if user closes it manually
chrome.windows.onRemoved?.addListener((winId) => {
  if (winId === backgroundManager._panelWindowId) {
    backgroundManager._panelWindowId = null;
  }
});

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("Harvest Time Tracker installed");

    // Set up context menu items
    chrome.contextMenus.create({
      id: "harvest-start-timer",
      title: "Start Harvest Timer",
      contexts: ["page"],
    });
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "harvest-start-timer") {
    // Open popup or send message to content script
    chrome.tabs.sendMessage(tab.id, {
      action: "showTimerWidget",
      url: tab.url,
      title: tab.title,
    });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, _sendResponse) => {
  switch (message.action) {
    case "pageInfo":
      // Content script is requesting to start a timer with page context
      handlePageTimerRequest(message.data, sender.tab);
      break;
    case "directStopTimer":
      // Placeholder: real Harvest stop still occurs in popup. Could integrate later.
      backgroundManager.stopTimer();
      break;

    case "updateIcon":
      backgroundManager.updateIcon();
      break;
  }
});

function handlePageTimerRequest(pageData, tab) {
  // Extract project information from the current page URL
  const projectInfo = extractProjectInfo(tab.url, tab.title);

  // Send project info back to content script or popup
  chrome.tabs.sendMessage(tab.id, {
    action: "projectSuggestion",
    data: projectInfo,
  });
}

function extractProjectInfo(url, title) {
  // Extract project information from popular project management tools
  const integrations = {
    "github.com": {
      type: "GitHub",
      extractProject: (url) => {
        const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
        return match ? `${match[1]}/${match[2]}` : null;
      },
    },
    "trello.com": {
      type: "Trello",
      extractProject: (url) => {
        const match = url.match(/trello\.com\/b\/[^/]+\/([^/?]+)/);
        return match ? decodeURIComponent(match[1].replace(/-/g, " ")) : null;
      },
    },
    "asana.com": {
      type: "Asana",
      extractProject: (_url) => {
        // Asana project extraction would need more sophisticated parsing
        return title.includes("Asana") ? title.replace(" - Asana", "") : null;
      },
    },
    "basecamp.com": {
      type: "Basecamp",
      extractProject: (url) => {
        const match = url.match(/basecamp\.com\/\d+\/projects\/(\d+)/);
        return match ? `Project ${match[1]}` : null;
      },
    },
  };

  const domain = new URL(url).hostname;
  const integration = Object.keys(integrations).find((key) =>
    domain.includes(key)
  );

  if (integration) {
    const config = integrations[integration];
    const project = config.extractProject(url);

    return {
      type: config.type,
      project,
      task: title,
      url,
    };
  }

  return {
    type: "Web",
    project: domain,
    task: title,
    url,
  };
}
