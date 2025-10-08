import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock HarvestAPI class
class MockHarvestAPI {
  constructor() {
    this.timeEntries = [];
  }

  async getTimeEntries() {
    return this.timeEntries;
  }

  setTimeEntries(entries) {
    this.timeEntries = entries;
  }
}

// Mock TimerManager class with sync functionality
class TimerManager {
  constructor(harvestAPI) {
    this.harvestAPI = harvestAPI;
    this.currentTimer = null;
    this.syncInterval = null;
    this.onTimerChange = null;
  }

  async syncWithExternalTimer() {
    try {
      const entries = await this.harvestAPI.getTimeEntries();
      const runningEntry = entries.find((entry) => entry.is_running);

      // No timer running externally, but we have one locally
      if (!runningEntry && this.currentTimer) {
        console.log("Timer stopped externally");
        this.currentTimer = null;
        if (this.onTimerChange) {
          this.onTimerChange(null);
        }
        return { action: "stopped", entry: null };
      }

      // Timer running externally
      if (runningEntry) {
        // Different timer than local one
        if (!this.currentTimer || this.currentTimer.id !== runningEntry.id) {
          console.log("Different timer detected externally");
          this.currentTimer = runningEntry;
          if (this.onTimerChange) {
            this.onTimerChange(runningEntry);
          }
          return { action: "changed", entry: runningEntry };
        }

        // Same timer, just update
        this.currentTimer = runningEntry;
        if (this.onTimerChange) {
          this.onTimerChange(runningEntry);
        }
        return { action: "updated", entry: runningEntry };
      }

      // No changes
      return { action: "none", entry: null };
    } catch (error) {
      console.error("Sync error:", error);
      return { action: "error", error };
    }
  }

  startPeriodicSync(intervalMs = 30000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.syncWithExternalTimer();
    }, intervalMs);

    // Initial sync
    this.syncWithExternalTimer();
  }

  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  getCurrentTimer() {
    return this.currentTimer;
  }

  setOnTimerChange(callback) {
    this.onTimerChange = callback;
  }
}

describe("TimerManager - External Timer Synchronization", () => {
  let timerManager;
  let mockAPI;

  beforeEach(() => {
    mockAPI = new MockHarvestAPI();
    timerManager = new TimerManager(mockAPI);
    vi.useFakeTimers();
  });

  afterEach(() => {
    timerManager.stopPeriodicSync();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("syncWithExternalTimer", () => {
    it("detects externally started timer", async () => {
      const externalTimer = {
        id: 123,
        is_running: true,
        project: { name: "Test Project" },
        task: { name: "Test Task" },
        hours: 0.5,
      };

      mockAPI.setTimeEntries([externalTimer]);

      const result = await timerManager.syncWithExternalTimer();

      expect(result.action).toBe("changed");
      expect(result.entry).toEqual(externalTimer);
      expect(timerManager.getCurrentTimer()).toEqual(externalTimer);
    });

    it("detects externally stopped timer", async () => {
      // Start with a local timer
      timerManager.currentTimer = {
        id: 123,
        is_running: true,
        project: { name: "Test Project" },
      };

      // No running timers from API
      mockAPI.setTimeEntries([]);

      const result = await timerManager.syncWithExternalTimer();

      expect(result.action).toBe("stopped");
      expect(result.entry).toBeNull();
      expect(timerManager.getCurrentTimer()).toBeNull();
    });

    it("detects different timer started externally", async () => {
      // Start with local timer
      timerManager.currentTimer = {
        id: 123,
        is_running: true,
        project: { name: "Old Project" },
      };

      // Different timer from API
      const differentTimer = {
        id: 456,
        is_running: true,
        project: { name: "New Project" },
        task: { name: "New Task" },
      };

      mockAPI.setTimeEntries([differentTimer]);

      const result = await timerManager.syncWithExternalTimer();

      expect(result.action).toBe("changed");
      expect(result.entry).toEqual(differentTimer);
      expect(timerManager.getCurrentTimer().id).toBe(456);
    });

    it("updates same timer details", async () => {
      // Start with local timer
      timerManager.currentTimer = {
        id: 123,
        is_running: true,
        hours: 0.5,
      };

      // Same timer but with updated hours
      const updatedTimer = {
        id: 123,
        is_running: true,
        hours: 1.25,
      };

      mockAPI.setTimeEntries([updatedTimer]);

      const result = await timerManager.syncWithExternalTimer();

      expect(result.action).toBe("updated");
      expect(result.entry.hours).toBe(1.25);
      expect(timerManager.getCurrentTimer().hours).toBe(1.25);
    });

    it("returns none when no changes detected", async () => {
      mockAPI.setTimeEntries([]);

      const result = await timerManager.syncWithExternalTimer();

      expect(result.action).toBe("none");
      expect(result.entry).toBeNull();
    });

    it("handles API errors gracefully", async () => {
      mockAPI.getTimeEntries = vi
        .fn()
        .mockRejectedValue(new Error("Network error"));

      const result = await timerManager.syncWithExternalTimer();

      expect(result.action).toBe("error");
      expect(result.error).toBeDefined();
    });
  });

  describe("Timer Change Callbacks", () => {
    it("triggers callback when timer started externally", async () => {
      const callback = vi.fn();
      timerManager.setOnTimerChange(callback);

      const externalTimer = {
        id: 789,
        is_running: true,
        project: { name: "Callback Test" },
      };

      mockAPI.setTimeEntries([externalTimer]);
      await timerManager.syncWithExternalTimer();

      expect(callback).toHaveBeenCalledWith(externalTimer);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("triggers callback when timer stopped externally", async () => {
      const callback = vi.fn();
      timerManager.setOnTimerChange(callback);

      timerManager.currentTimer = { id: 123, is_running: true };
      mockAPI.setTimeEntries([]);

      await timerManager.syncWithExternalTimer();

      expect(callback).toHaveBeenCalledWith(null);
    });

    it("does not crash when callback not set", async () => {
      const externalTimer = {
        id: 999,
        is_running: true,
      };

      mockAPI.setTimeEntries([externalTimer]);

      await expect(timerManager.syncWithExternalTimer()).resolves.toBeDefined();
    });
  });

  describe("Periodic Synchronization", () => {
    it("starts periodic sync with default interval", async () => {
      const syncSpy = vi.spyOn(timerManager, "syncWithExternalTimer");
      mockAPI.setTimeEntries([]);

      timerManager.startPeriodicSync();

      // Initial sync
      await vi.advanceTimersByTimeAsync(0);
      expect(syncSpy).toHaveBeenCalledTimes(1);

      // After 30 seconds
      await vi.advanceTimersByTimeAsync(30000);
      expect(syncSpy).toHaveBeenCalledTimes(2);

      // After 60 seconds
      await vi.advanceTimersByTimeAsync(30000);
      expect(syncSpy).toHaveBeenCalledTimes(3);
    });

    it("starts periodic sync with custom interval", async () => {
      const syncSpy = vi.spyOn(timerManager, "syncWithExternalTimer");
      mockAPI.setTimeEntries([]);

      timerManager.startPeriodicSync(10000); // 10 seconds

      // Initial sync
      await vi.advanceTimersByTimeAsync(0);
      expect(syncSpy).toHaveBeenCalledTimes(1);

      // After 10 seconds
      await vi.advanceTimersByTimeAsync(10000);
      expect(syncSpy).toHaveBeenCalledTimes(2);
    });

    it("stops periodic sync", async () => {
      const syncSpy = vi.spyOn(timerManager, "syncWithExternalTimer");
      mockAPI.setTimeEntries([]);

      timerManager.startPeriodicSync(10000);
      await vi.advanceTimersByTimeAsync(0);

      timerManager.stopPeriodicSync();

      const callCountBefore = syncSpy.mock.calls.length;
      await vi.advanceTimersByTimeAsync(20000);

      expect(syncSpy).toHaveBeenCalledTimes(callCountBefore);
    });

    it("clears previous interval when starting new sync", async () => {
      const syncSpy = vi.spyOn(timerManager, "syncWithExternalTimer");
      mockAPI.setTimeEntries([]);

      timerManager.startPeriodicSync(30000);
      await vi.advanceTimersByTimeAsync(0);

      timerManager.startPeriodicSync(10000); // Start again with different interval
      await vi.advanceTimersByTimeAsync(0);

      // Should only have 2 calls (one from each start)
      expect(syncSpy).toHaveBeenCalledTimes(2);

      // New interval should be active
      await vi.advanceTimersByTimeAsync(10000);
      expect(syncSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe("Multiple Running Timers", () => {
    it("selects first running timer when multiple exist", async () => {
      const timer1 = {
        id: 111,
        is_running: true,
        project: { name: "Project 1" },
      };
      const timer2 = {
        id: 222,
        is_running: true,
        project: { name: "Project 2" },
      };

      mockAPI.setTimeEntries([timer1, timer2]);

      const result = await timerManager.syncWithExternalTimer();

      expect(result.entry.id).toBe(111);
      expect(timerManager.getCurrentTimer().id).toBe(111);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty time entries array", async () => {
      mockAPI.setTimeEntries([]);

      const result = await timerManager.syncWithExternalTimer();

      expect(result.action).toBe("none");
    });

    it("handles null/undefined time entries", async () => {
      mockAPI.setTimeEntries(null);
      mockAPI.getTimeEntries = vi.fn().mockResolvedValue(null);

      const result = await timerManager.syncWithExternalTimer();

      expect(result.action).toBe("error");
      expect(result.error).toBeDefined();
    });

    it("handles malformed timer entry", async () => {
      const malformedTimer = {
        // Missing id
        is_running: true,
        project: { name: "Malformed" },
      };

      mockAPI.setTimeEntries([malformedTimer]);

      const result = await timerManager.syncWithExternalTimer();

      // Should still detect the timer
      expect(result.action).toBe("changed");
    });

    it("preserves local timer on network failure", async () => {
      timerManager.currentTimer = {
        id: 999,
        is_running: true,
      };

      mockAPI.getTimeEntries = vi
        .fn()
        .mockRejectedValue(new Error("Network down"));

      await timerManager.syncWithExternalTimer();

      // Local timer should remain
      expect(timerManager.getCurrentTimer()).not.toBeNull();
      expect(timerManager.getCurrentTimer().id).toBe(999);
    });
  });
});
