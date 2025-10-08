// Extracted pure time calculation helpers from popup.js for unit testing

/**
 * Compute baseHours when retrieving a running entry.
 * hoursAtFetch includes partial current segment; we subtract the live seconds already elapsed.
 */
export function computeBaseHours(
  hoursAtFetch,
  timerStartedAt,
  now = Date.now()
) {
  const runningSecondsSoFar = Math.max(
    0,
    (now - timerStartedAt.getTime()) / 1000
  );
  return Math.max(0, hoursAtFetch - runningSecondsSoFar / 3600);
}

/**
 * Compute elapsed seconds given baseHours and start timestamp.
 */
export function computeElapsedSeconds(
  baseHours,
  timerStartedAt,
  now = Date.now()
) {
  const runningSecondsLive = Math.max(
    0,
    (now - timerStartedAt.getTime()) / 1000
  );
  return Math.floor(baseHours * 3600 + runningSecondsLive);
}

/**
 * Format seconds to HH:MM:SS
 */
export function formatHMS(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Aggregate today total.
 * @param {Array<{id:number, spent_date:string, hours:number, is_running:boolean}>} entries
 * @param {string} todayStr YYYY-MM-DD
 * @param {object|null} runningEntry currently running entry (full object) or null
 * @param {number} liveElapsedSeconds current live elapsed seconds of running entry (static portion already contained in runningEntry.hours)
 * @returns {{baseSeconds:number,totalSeconds:number}}
 */
export function aggregateToday(
  entries,
  todayStr,
  runningEntry,
  liveElapsedSeconds
) {
  let baseSeconds = 0;
  entries.forEach((e) => {
    if (e.spent_date !== todayStr) return;
    if (runningEntry && e.id === runningEntry.id) return; // exclude running from base
    baseSeconds += Math.round((e.hours || 0) * 3600);
  });
  let totalSeconds = baseSeconds;
  if (runningEntry) {
    totalSeconds += liveElapsedSeconds; // includes static portion implicitly
  }
  return { baseSeconds, totalSeconds };
}
