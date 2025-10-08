// Simplified context provider: always uses document.title and full URL.
(function () {
  "use strict";
  // Previously limited to Safari; now enabled for all browsers so popup always receives context.

  function build() {
    const title = (document.title || "Untitled").trim();
    return {
      title,
      url: location.href,
      composed: `${title}\n${location.href}`,
    };
  }

  function seedPrefill() {
    const data = build();
    chrome.storage.local.set({
      harvestPrefill: {
        project: null,
        task: data.title,
        url: data.url,
        timestamp: Date.now(),
      },
    });
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.action === "harvestRequestPageContext") {
      const data = build();
      chrome.runtime.sendMessage({ action: "harvestPageContext", data });
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", seedPrefill);
  } else {
    seedPrefill();
  }

  // Reseed when tab becomes visible again to keep title/url fresh.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      seedPrefill();
    }
  });

  // Some pages may not trigger visibility change reliably; use focus as backup.
  window.addEventListener("focus", () => {
    seedPrefill();
  });
})();
