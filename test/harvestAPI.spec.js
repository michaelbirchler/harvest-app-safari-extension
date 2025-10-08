import { describe, it, expect, vi, beforeEach } from "vitest";

// Inline minimal copy of HarvestAPI methods under test (or could refactor to separate file)
class HarvestAPI {
  constructor() {
    this.subdomain = null;
    this.accessToken = null;
    this.accountId = null;
  }
  async makeRequest(endpoint, options = {}) {
    const url = `https://api.harvestapp.com/v2${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      "Harvest-Account-Id": this.accountId?.toString(),
      "User-Agent": "Harvest Time Tracker Safari Extension",
      "Content-Type": "application/json",
      ...options.headers,
    };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP ${response.status}: ${response.statusText} - ${errorText}`
      );
    }
    return response.json();
  }
}

describe("HarvestAPI.makeRequest", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("returns parsed JSON on success", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ hello: "world" }),
    });
    const api = new HarvestAPI();
    api.accessToken = "tok";
    api.accountId = 123;
    const data = await api.makeRequest("/ping");
    expect(data.hello).toBe("world");
    expect(fetch).toHaveBeenCalledWith(
      "https://api.harvestapp.com/v2/ping",
      expect.any(Object)
    );
  });

  it("throws with detailed error on failure", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: () => Promise.resolve("Nope"),
    });
    const api = new HarvestAPI();
    api.accessToken = "tok";
    api.accountId = 456;
    await expect(api.makeRequest("/fail")).rejects.toThrow(
      /HTTP 400: Bad Request/
    );
  });
});
