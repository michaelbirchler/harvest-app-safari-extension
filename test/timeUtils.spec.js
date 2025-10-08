import { describe, it, expect } from "vitest";
import {
  computeBaseHours,
  computeElapsedSeconds,
  formatHMS,
  aggregateToday,
} from "../src/timeUtils.js";

describe("timeUtils", () => {
  it("computeBaseHours subtracts live seconds from fetched hours", () => {
    const start = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const hoursAtFetch = 1.1; // 1h + 6m (approx). 5 mins have elapsed since fetch moment.
    const base = computeBaseHours(hoursAtFetch, start, Date.now());
    // base should be roughly 1.1h - 5m ≈ 1.1 - 0.0833 = 1.0167
    expect(base).toBeGreaterThan(1.0);
    expect(base).toBeLessThan(1.05);
  });

  it("computeElapsedSeconds rebuilds elapsed correctly", () => {
    const start = new Date();
    const baseHours = 0.5; // 30 minutes already logged
    const now = start.getTime() + 10 * 60 * 1000; // 10 minutes later
    const elapsed = computeElapsedSeconds(baseHours, start, now);
    // Expected: 30m + 10m = 40m = 2400s
    expect(elapsed).toBe(2400);
  });

  it("formatHMS formats correctly", () => {
    expect(formatHMS(0)).toBe("00:00:00");
    expect(formatHMS(59)).toBe("00:00:59");
    expect(formatHMS(60)).toBe("00:01:00");
    expect(formatHMS(3661)).toBe("01:01:01");
  });

  it("aggregateToday excludes running entry from base and adds live elapsed", () => {
    const today = "2025-09-18";
    const entries = [
      { id: 1, spent_date: today, hours: 1.0 },
      { id: 2, spent_date: today, hours: 0.5 },
      { id: 3, spent_date: today, hours: 0.25 },
    ];
    const running = entries[2];
    const liveElapsedSeconds = Math.round(running.hours * 3600) + 120; // +2 extra minutes live
    const { baseSeconds, totalSeconds } = aggregateToday(
      entries,
      today,
      running,
      liveElapsedSeconds
    );
    // Base should be entries 1 + 2 only
    expect(baseSeconds).toBe(Math.round((1.0 + 0.5) * 3600));
    expect(totalSeconds).toBe(baseSeconds + liveElapsedSeconds);
  });
});
