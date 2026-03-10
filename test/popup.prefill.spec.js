import { describe, it, expect, beforeEach, vi } from "vitest";

// Test that forceActiveTabPrefill always populates description on popup open.

const fs = await import("fs");
const path = await import("path");

function loadHTML() {
  const htmlPath = path.resolve(process.cwd(), "popup.html");
  const html = fs.readFileSync(htmlPath, "utf8");
  document.documentElement.innerHTML = html
    .replace(/<link[^>]+popup.css[^>]+>/, "")
    .replace(/<script[^>]+popup.js[^>]*><\/script>/, "");
}

beforeEach(() => {
  vi.resetModules();
  loadHTML();
  // chrome mocks
  global.chrome = {
    storage: {
      sync: {
        get: (_k, cb) =>
          cb({
            subdomain: "acme",
            accessToken: "T",
            accountId: 1,
            userId: 9,
            accountName: "Acme",
            userName: "User",
          }),
        set: (_d, cb) => cb && cb(),
        clear: (cb) => cb && cb(),
      },
      local: {
        get: (_k, cb) => cb({}),
        set: (_d, cb) => cb && cb(),
        remove: (_k, cb) => cb && cb(),
      },
    },
    runtime: { sendMessage: () => {}, onMessage: { addListener: () => {} } },
    browserAction: {
      setBadgeText: () => {},
      setBadgeBackgroundColor: () => {},
    },
    tabs: {
      query: (q, cb) =>
        cb([
          {
            title: "Dashboard – Harvest",
            url: "https://app.example.com/dashboard",
          },
        ]),
    },
  };
  global.fetch = vi.fn((url) => {
    if (url.includes("/users/me"))
      return ok({
        id: 9,
        first_name: "User",
        last_name: "Name",
        email: "u@example.com",
      });
    if (url.includes("/projects?")) return ok({ projects: [] });
    if (url.includes("/tasks?")) return ok({ tasks: [] });
    if (url.includes("/time_entries?from=")) return ok({ time_entries: [] });
    if (url.includes("/time_entries?from=")) return ok({ time_entries: [] });
    return ok({});
  });
});

function ok(json) {
  return { ok: true, json: async () => json };
}

describe("forceActiveTabPrefill", () => {
  it("sets description to active tab title + URL on load", async () => {
    await import("../popup.js");
    await new Promise((r) => setTimeout(r, 50));
    const desc = document.getElementById("description");
    expect(desc.value).toContain("Dashboard – Harvest");
    expect(desc.value).toContain("https://app.example.com/dashboard");
  });

  it("does not overwrite userEdited description", async () => {
    // Pre-set a manual value & mark userEdited before import
    const textarea = document.getElementById("description");
    textarea.value = "Manual note";
    textarea.dataset.userEdited = "true";
    await import("../popup.js");
    await new Promise((r) => setTimeout(r, 50));
    expect(textarea.value).toBe("Manual note");
  });

  it("prefills new task fields from the running timer", async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes("/users/me")) {
        return ok({
          id: 9,
          first_name: "User",
          last_name: "Name",
          email: "u@example.com",
        });
      }
      if (url.includes("/projects?")) {
        return ok({
          projects: [
            {
              id: 7,
              name: "Sirius 2026",
              task_assignments: [{ task: { id: 11, name: "02_Entwicklung" } }],
            },
          ],
        });
      }
      if (url.includes("/tasks?")) {
        return ok({ tasks: [{ id: 11, name: "02_Entwicklung" }] });
      }
      if (url.includes("/time_entries?from=")) {
        return ok({
          time_entries: [
            {
              id: 55,
              hours: 0.5,
              is_running: true,
              user: { id: 9, name: "User Name" },
              project: { id: 7, name: "Sirius 2026" },
              task: { id: 11, name: "02_Entwicklung" },
              notes:
                "Daily Scrum\nhttps://github.com/swissredcross/example/issues/162",
              updated_at: "2026-03-10T08:00:00.000Z",
              created_at: "2026-03-10T07:30:00.000Z",
              timer_started_at: "2026-03-10T07:30:00.000Z",
            },
          ],
        });
      }
      return ok({});
    });

    await import("../popup.js");
    await new Promise((r) => setTimeout(r, 50));

    const project = document.getElementById("projectSelect");
    const task = document.getElementById("taskSelect");
    const desc = document.getElementById("description");

    expect(project.value).toBe("7");
    expect(task.value).toBe("11");
    expect(desc.value).toBe(
      "Daily Scrum\nhttps://github.com/swissredcross/example/issues/162",
    );
  });
});
