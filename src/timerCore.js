// Core timer logic extracted for unit testing without DOM or chrome APIs.
// This mirrors the internal arithmetic used by TimerManager in popup.js

export class TimerCore {
  constructor({ nowFn = () => Date.now() } = {}) {
    this.nowFn = nowFn;
    this.running = false;
    this.baseHours = 0; // hours accumulated before current run
    this.timerStartedAt = null; // epoch ms when current run began
  }

  // Start a new timer run; if already running, noop
  start(startingHours = 0) {
    if (this.running) return;
    this.baseHours = startingHours;
    this.timerStartedAt = this.nowFn();
    this.running = true;
  }

  // Stop the timer and freeze accumulated hours
  stop() {
    if (!this.running) return this.baseHours;
    const elapsed = (this.nowFn() - this.timerStartedAt) / 3600000; // ms to hours
    this.baseHours += elapsed;
    this.running = false;
    this.timerStartedAt = null;
    return this.baseHours;
  }

  // Compute total hours including live run
  currentHours() {
    if (!this.running) return this.baseHours;
    const elapsed = (this.nowFn() - this.timerStartedAt) / 3600000;
    return this.baseHours + elapsed;
  }

  // Format HH:MM:SS from current hours
  formatHMS() {
    const totalSeconds = Math.floor(this.currentHours() * 3600);
    const h = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(totalSeconds % 60)
      .toString()
      .padStart(2, "0");
    return `${h}:${m}:${s}`;
  }
}
