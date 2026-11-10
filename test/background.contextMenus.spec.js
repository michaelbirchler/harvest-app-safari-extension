import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const source = readFileSync(resolve("background.js"), "utf8");
let chrome;

function loadBackground() {
  runInNewContext(source, {
    chrome,
    navigator: { userAgent: "Version/17.0 Safari/605.1.15" },
    console,
    URL,
  });
}

beforeEach(() => {
  chrome = {
    runtime: {
      onMessage: { addListener: vi.fn() },
      onInstalled: { addListener: vi.fn() },
      sendMessage: vi.fn(),
    },
    storage: {
      local: { get: vi.fn((_keys, cb) => cb({})), set: vi.fn() },
    },
    browserAction: {
      setIcon: vi.fn(),
      setTitle: vi.fn(),
      onClicked: { addListener: vi.fn() },
    },
    windows: { onRemoved: { addListener: vi.fn() } },
    tabs: { sendMessage: vi.fn() },
  };
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

describe("optional background context menus", () => {
  it.each([undefined, {}, { create: vi.fn() }])(
    "loads and handles installation without a complete API (%j)",
    (contextMenus) => {
      chrome.contextMenus = contextMenus;
      expect(loadBackground).not.toThrow();
      const onInstalled = chrome.runtime.onInstalled.addListener.mock.calls[0][0];
      expect(() => onInstalled({ reason: "install" })).not.toThrow();
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining("Context menus are unavailable"),
      );
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(2);
      expect(chrome.browserAction.onClicked.addListener).toHaveBeenCalledOnce();
    },
  );

  function installContextMenus() {
    chrome.contextMenus = {
      create: vi.fn((_options, cb) => cb()),
      onClicked: { addListener: vi.fn() },
    };
    loadBackground();
  }

  it("creates the menu on supported browsers after installation", () => {
    installContextMenus();
    chrome.runtime.onInstalled.addListener.mock.calls[0][0]({ reason: "install" });
    expect(chrome.contextMenus.create).toHaveBeenCalledWith(
      {
        id: "harvest-start-timer",
        title: "Start Harvest Timer",
        contexts: ["page"],
      },
      expect.any(Function),
    );
  });

  it("routes menu clicks to the clicked tab only", () => {
    installContextMenus();
    const onClicked = chrome.contextMenus.onClicked.addListener.mock.calls[0][0];
    const tab = { id: 0, url: "https://example.com", title: "Example" };
    onClicked({ menuItemId: "other-menu" }, tab);
    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
    onClicked({ menuItemId: "harvest-start-timer" }, tab);
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(0, {
      action: "showTimerWidget",
      url: tab.url,
      title: tab.title,
    });
  });

  it("warns rather than throwing for clicks without a tab", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    installContextMenus();
    const onClicked = chrome.contextMenus.onClicked.addListener.mock.calls[0][0];
    expect(() => onClicked({ menuItemId: "harvest-start-timer" })).not.toThrow();
    expect(console.warn).toHaveBeenCalled();
    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
  });

  it("reports menu creation errors", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    installContextMenus();
    chrome.runtime.lastError = { message: "Permission denied" };
    chrome.runtime.onInstalled.addListener.mock.calls[0][0]({ reason: "install" });
    expect(console.error).toHaveBeenCalledWith(
      "Failed to create Harvest context menu:",
      chrome.runtime.lastError,
    );
  });

  it("declares the context-menu permission", () => {
    const manifest = JSON.parse(
      readFileSync(resolve("manifest.json"), "utf8"),
    );
    expect(manifest.permissions).toContain("contextMenus");
  });
});
