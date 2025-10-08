import { describe, it, expect, beforeEach, vi } from "vitest";

// Test that while a timer is running we still refresh the title (first line) if user hasn't edited description.

const fs = await import("fs");
const path = await import("path");

function loadHTML() {
  const htmlPath = path.resolve(process.cwd(), "popup.html");
  const html = fs.readFileSync(htmlPath, "utf8");
  document.documentElement.innerHTML = html
    .replace(/<link[^>]+popup.css[^>]+>/, "")
    .replace(/<script[^>]+popup.js[^>]*><\/script>/, "");
}

let nowBase = 1734567890000;
const fixedNow = () => nowBase;

function ok(json) {
  return { ok: true, json: async () => json };
}

function mockStorage() {
  global.chrome.storage.sync.get = (_keys, cb) =>
    cb({
      subdomain: "acme",
      accessToken: "TEST",
      accountId: 1,
      accountName: "Acme Inc",
      userId: 9,
      userName: "Jane Doe",
      userEmail: "jane@example.com",
    });
}

function installFetchMocks() {
  global.fetch = vi.fn(async (url, opts) => {
    if (url.includes("/users/me"))
      return ok({
        id: 9,
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@example.com",
      });
    if (url.includes("/projects?"))
      return ok({
        projects: [
          {
            id: 1,
            name: "Website Revamp",
            task_assignments: [{ task: { id: 10, name: "Development" } }],
          },
        ],
      });
    if (url.includes("/tasks?"))
      return ok({ tasks: [{ id: 10, name: "Development" }] });
    if (url.includes("/time_entries?from=")) {
      return ok({
        time_entries: [
          {
            id: 123,
            hours: 0.25,
            is_running: true,
            user: { id: 9 },
            project: { id: 1, name: "Website Revamp" },
            task: { id: 10, name: "Development" },
            notes: "Initial Title\nhttps://old.example",
            spent_date: "2025-09-18",
            updated_at: new Date(fixedNow()).toISOString(),
            created_at: new Date(fixedNow() - 15 * 60 * 1000).toISOString(),
            timer_started_at: new Date(
              fixedNow() - 15 * 60 * 1000
            ).toISOString(),
          },
        ],
      });
    }
    if (url.endsWith("/time_entries")) {
      // starting new timer (unused here)
      return ok({
        id: 999,
        hours: 0,
        is_running: true,
        project: { id: 1, name: "Website Revamp" },
        task: { id: 10, name: "Development" },
        notes: "Initial Title\nhttps://old.example",
        spent_date: "2025-09-18",
        timer_started_at: new Date(fixedNow()).toISOString(),
        user: { id: 9 },
      });
    }
    return ok({});
  });
}

beforeEach(() => {
  loadHTML();
  if (!global.chrome) global.chrome = {};
  global.chrome.browserAction = {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  };
  global.chrome.runtime = { onMessage: { addListener: () => {} } };
  mockStorage();
  installFetchMocks();
  vi.spyOn(Date, "now").mockImplementation(fixedNow);
});

describe("running timer title refresh", () => {
  it("updates first line with new active tab title when not user edited", async () => {
    // Provide initial tab (old title) and allow popup init to prefill it
    let activeTitle = "Old Page Title";
    let activeUrl = "https://old.example";
    global.chrome.tabs = {
      query: (_q, cb) => cb([{ title: activeTitle, url: activeUrl }]),
    };
    const popupModule = await import("../popup.js");
    await new Promise((r) => setTimeout(r, 0));
    const desc = document.getElementById("description");
    // Sanity: first line should be old title
    expect(desc.value.split("\n")[0]).toBe("Old Page Title");
    // Now change tab context
    activeTitle = "New Page Title";
    activeUrl = "https://new.example";
    global.chrome.tabs.query = (_q, cb) =>
      cb([{ title: activeTitle, url: activeUrl }]);
    (
      global.window.forceActiveTabPrefill || popupModule.forceActiveTabPrefill
    )?.();
    await new Promise((r) => setTimeout(r, 0));
    const lines = desc.value.split("\n");
    expect(lines[0]).toBe("New Page Title");
    expect(lines[1]).toBe("https://new.example");
  });

  it("does not overwrite when user edited", async () => {
    let activeTitle = "Original";
    let activeUrl = "https://one.example";
    global.chrome.tabs = {
      query: (_q, cb) => cb([{ title: activeTitle, url: activeUrl }]),
    };
    const popupModule = await import("../popup.js");
    await new Promise((r) => setTimeout(r, 0));

    const desc = document.getElementById("description");
    desc.value = "User custom line\nhttps://custom.example";
    desc.dataset.userEdited = "true";

    // Change tab
    activeTitle = "Should Not Replace";
    activeUrl = "https://two.example";
    global.chrome.tabs.query = (_q, cb) =>
      cb([{ title: activeTitle, url: activeUrl }]);
    (
      global.window.forceActiveTabPrefill || popupModule.forceActiveTabPrefill
    )?.();
    await new Promise((r) => setTimeout(r, 0));

    expect(desc.value.startsWith("User custom line")).toBe(true);
    expect(desc.value.includes("Should Not Replace")).toBe(false);
  });
});
