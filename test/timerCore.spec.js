import { describe, it, expect, vi } from "vitest";
import { TimerCore } from "../src/timerCore.js";

describe("TimerCore", () => {
  it("starts from zero and accumulates elapsed time", () => {
    let now = 0;
    const core = new TimerCore({ nowFn: () => now });
    core.start(0);
    now += 30 * 1000; // 30s
    expect(core.currentHours()).toBeCloseTo(30 / 3600, 5);
    now += 30 * 1000; // 60s total
    expect(core.formatHMS()).toBe("00:01:00");
  });

  it("stops and freezes accumulated hours", () => {
    let now = 0;
    const core = new TimerCore({ nowFn: () => now });
    core.start(0.5); // already 0.5h
    now += 1800 * 1000; // +0.5h
    const total = core.stop();
    expect(total).toBeCloseTo(1.0, 5);
    // further time should not change frozen total
    now += 3600 * 1000;
    expect(core.currentHours()).toBeCloseTo(1.0, 5);
  });

  it("is idempotent when starting while running", () => {
    let now = 0;
    const core = new TimerCore({ nowFn: () => now });
    core.start(0.25);
    now += 10_000;
    core.start(0.9); // should be ignored
    now += 10_000;
    const hours = core.currentHours();
    // Should reflect 0.25h + 20s
    expect(hours).toBeCloseTo(0.25 + 20 / 3600, 5);
  });

  it("multiple start/stop cycles accumulate correctly", () => {
    let now = 0;
    const core = new TimerCore({ nowFn: () => now });
    core.start(0);
    now += 15 * 60 * 1000; // 15m
    core.stop(); // 0.25h
    core.start(core.currentHours());
    now += 45 * 60 * 1000; // +45m
    const final = core.stop();
    expect(final).toBeCloseTo(1.0, 4); // 60m total
  });
});
