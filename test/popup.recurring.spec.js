import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const html = readFileSync(resolve("popup.html"), "utf8");

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  document.documentElement.innerHTML = html;
  vi.spyOn(document, "readyState", "get").mockReturnValue("complete");
  chrome.storage.sync.get = (_keys, cb) => cb({
    subdomain: "acme",
    accessToken: "TEST",
    accountId: 1,
    userId: 9,
    lastUserValidation: Date.now(),
  });
  global.fetch = vi.fn(async () => ({
    ok: true,
    json: async () => ({ projects: [], tasks: [], time_entries: [] }),
  }));
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("native recurring-entry workflow", () => {
  it("opens the authenticated account's timesheet without scheduling API writes", async () => {
    await import("../popup.js");
    await vi.advanceTimersByTimeAsync(1);
    const link = document.getElementById("recurringHarvestLink");
    expect(document.getElementById("mainSection").style.display).toBe("block");
    expect(link.href).toBe("https://acme.harvestapp.com/time");
    expect(link.target).toBe("_blank");
    expect(link.rel).toBe("noopener noreferrer");
    expect(document.getElementById("recurringTitle").textContent).toBe(
      "Recurring time entries",
    );
    expect(fetch.mock.calls.every(([, options]) => !options.method || options.method === "GET")).toBe(true);
  });

  it("does not offer an account link before authentication", async () => {
    chrome.storage.sync.get = (_keys, cb) => cb({});
    await import("../popup.js");
    await vi.advanceTimersByTimeAsync(1);
    expect(document.getElementById("mainSection").style.display).toBe("none");
    expect(document.getElementById("recurringHarvestLink").hasAttribute("href")).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("provides all recurring-entry text in all seven languages", () => {
    const source = readFileSync(resolve("translations.js"), "utf8");
    const translations = runInNewContext(`${source}\ntranslations;`);
    const keys = [...document.querySelectorAll("[data-i18n^='recurring_']")]
      .map((element) => element.dataset.i18n);
    expect(Object.keys(translations)).toHaveLength(7);
    expect(keys).toHaveLength(4);
    for (const language of Object.values(translations)) {
      for (const key of keys) {
        expect(language[key]).toEqual(expect.any(String));
        expect(language[key].trim().length).toBeGreaterThan(0);
      }
    }
  });
});
