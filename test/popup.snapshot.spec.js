import { describe, it, expect, beforeEach, vi } from "vitest";

// We'll load the popup.html markup into jsdom, then eval popup.js in that context,
// but mock network-dependent pieces (fetch) and dynamic time to stabilize snapshot.

const fs = await import("fs");
const path = await import("path");

function loadHTML() {
  const htmlPath = path.resolve(process.cwd(), "popup.html");
  const html = fs.readFileSync(htmlPath, "utf8");
  document.documentElement.innerHTML = html
    // Remove external stylesheet link to avoid jsdom fetching
    .replace(/<link[^>]+popup.css[^>]+>/, "")
    // Remove script tag that would re-load popup.js automatically
    .replace(/<script[^>]+popup.js[^>]*><\/script>/, "");
}

// Create a deterministic Date.now for timer calculations
let nowBase = 1734567890000; // arbitrary fixed timestamp
const fixedNow = () => nowBase;

// Minimal fake project/task/time entry payloads for deterministic UI state
function mockAuthenticatedStorage() {
  // Simulate stored credentials so HarvestAPI.init resolves true
  global.chrome.storage.sync.get = (_keys, cb) => {
    cb({
      subdomain: "acme",
      accessToken: "TEST",
      accountId: 999,
      accountName: "Acme Inc",
      userId: 42,
      userName: "Jane Doe",
      userEmail: "jane@example.com",
    });
  };
}

function installFetchMocks({ running = false } = {}) {
  global.fetch = vi.fn(async (url) => {
    if (url.includes("/users/me")) {
      return ok({
        id: 42,
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@example.com",
      });
    }
    if (url.includes("/projects?")) {
      return ok({
        projects: [
          {
            id: 1,
            name: "Website Revamp",
            task_assignments: [{ task: { id: 10, name: "Development" } }],
          },
        ],
      });
    }
    if (url.includes("/tasks?")) {
      return ok({ tasks: [{ id: 10, name: "Development" }] });
    }
    if (url.includes("/time_entries?from=")) {
      // Recent entries / today listing
      return ok({
        time_entries: running
          ? [
              {
                id: 777,
                hours: 1.5,
                is_running: true,
                user: { id: 42, name: "Jane Doe" },
                project: { id: 1, name: "Website Revamp" },
                task: { id: 10, name: "Development" },
                notes: "Implement feature",
                spent_date: "2025-09-18",
                updated_at: "2025-09-18T12:00:00Z",
                created_at: "2025-09-18T10:30:00Z",
                timer_started_at: new Date(
                  fixedNow() - 30 * 60 * 1000
                ).toISOString(),
              },
            ]
          : [],
      });
    }
    if (url.endsWith("/time_entries")) {
      // start timer
      return ok({
        id: 888,
        hours: 0,
        is_running: true,
        project: { id: 1, name: "Website Revamp" },
        task: { id: 10, name: "Development" },
        notes: "Implement feature",
        spent_date: "2025-09-18",
        created_at: new Date(fixedNow()).toISOString(),
        timer_started_at: new Date(fixedNow()).toISOString(),
        user: { id: 42, name: "Jane Doe" },
      });
    }
    if (url.includes("/task_assignments")) {
      return ok({
        task_assignments: [{ id: 501, task: { id: 10, name: "Development" } }],
      });
    }
    return ok({});
  });
}

function ok(json) {
  return { ok: true, json: async () => json };
}

// Provide missing chrome APIs for badge updates invoked in popup.js
beforeEach(() => {
  document.body.innerHTML = "";
  loadHTML();
  mockAuthenticatedStorage();
  installFetchMocks({ running: false });

  // Extend chrome mock if not already
  if (!global.chrome) global.chrome = {};
  global.chrome.browserAction = {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  };
  global.chrome.runtime.onMessage.addListener = () => {};
  global.chrome.tabs.query = (_q, cb) => cb([]);

  // Deterministic Date
  vi.spyOn(Date, "now").mockImplementation(fixedNow);
});

describe("popup initial DOM snapshot", () => {
  it("renders authenticated main section and matches snapshot before interaction", async () => {
    // Dynamically import popup.js (it auto-initializes via DOMContentLoaded guard)
    await import("../popup.js");
    // Allow any pending microtasks
    await new Promise((r) => setTimeout(r, 0));
    // Stabilize dynamic timer text by replacing digits beyond first occurrence
    const snapshot = sanitize(document.documentElement.outerHTML);
    expect(snapshot).toMatchSnapshot();
  });

  it("after starting a timer shows running state snapshot", async () => {
    await import("../popup.js");
    await new Promise((r) => setTimeout(r, 0));
    const startBtn = document.getElementById("startNewTaskBtn");
    // Fill description to avoid empty note
    const desc = document.getElementById("description");
    desc.value = "Implement feature";
    startBtn.click();
    // Wait for async start
    await new Promise((r) => setTimeout(r, 0));
    const runningSnap = sanitize(document.documentElement.outerHTML);
    expect(runningSnap).toMatchSnapshot();
  });
});

function sanitize(html) {
  return (
    html
      // Strip any vitest injected attributes (robust generic removal)
      .replace(/ data-vitest="[^"]*"/g, "")
      // Normalize newly added structural utility classes that may change over time
      .replace(/header--tight/g, "header")
      // Collapse multiple spaces at line starts introduced by pretty DOM differences
      .replace(/\n\s{2,}/g, (m) => "\n  ")
      // Normalize Logout button multiline formatting
      .replace(
        /<button([^>]*?)>\s*Logout\s*<\/button>/g,
        "<button$1>Logout</button>"
      )
      // Normalize dynamic timer (MM:SS or H:MM) to token
      .replace(/\b\d{1,2}:[0-5]\d\b/g, "<TIME>")
      // Normalize ISO timestamps
      .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, "<ISO>")
  );
}
