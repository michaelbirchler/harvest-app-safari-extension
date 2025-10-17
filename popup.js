class HarvestAPI {
  constructor() {
    // Basic credential / identity fields
    this.subdomain = null; // e.g. yourcompany (NOT a full URL)
    this.accessToken = null; // Personal access token
    this.accountId = null; // Numeric account id returned by accounts endpoint
    this.accountName = null;
    this.userId = null;
    this.userName = null;
    this.userEmail = null;
  }

  // Helper: Get local date in YYYY-MM-DD format (not UTC)
  // IMPORTANT: This uses the browser's local timezone, not UTC.
  // Using toISOString() would cause timezone bugs where timers are logged
  // on the wrong date (e.g., starting a timer at 11 PM PST would be logged
  // as the next day in UTC, or at 1 AM PST would be logged as yesterday).
  getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Load previously stored credentials and verify they still work.
  async init() {
    try {
      const data = await this.getStoredData();
      if (!data || !data.subdomain || !data.accessToken || !data.accountId) {
        return false; // not authenticated yet
      }
      this.subdomain = data.subdomain;
      this.accessToken = data.accessToken;
      this.accountId = data.accountId;
      this.accountName = data.accountName || null;
      this.userId = data.userId || null;
      this.userName = data.userName || null;
      this.userEmail = data.userEmail || null;
      this.lastUserValidation = data.lastUserValidation || 0;

      const now = Date.now();
      const TWENTY_FOUR_HOURS = 24 * 3600 * 1000;
      // Only revalidate with network call if last success older than 24h (reduces needless failures when offline)
      if (now - this.lastUserValidation < TWENTY_FOUR_HOURS && this.userId) {
        return true;
      }

      let attempt = 0;
      const maxAttempts = 2; // soft retry once before giving up
      while (attempt < maxAttempts) {
        try {
          const me = await this.makeRequest("/users/me");
          if (me && me.id) {
            this.userId = me.id;
            this.userName = `${me.first_name || ""} ${
              me.last_name || ""
            }`.trim();
            this.userEmail = me.email || this.userEmail;
            this.lastUserValidation = now;
            await this.storeData({
              subdomain: this.subdomain,
              accessToken: this.accessToken,
              accountId: this.accountId,
              accountName: this.accountName,
              userId: this.userId,
              userName: this.userName,
              userEmail: this.userEmail,
              lastUserValidation: this.lastUserValidation,
            });
            return true;
          }
          break; // unexpected shape – don't loop
        } catch (e) {
          attempt++;
          console.warn(
            `User validation attempt ${attempt} failed`,
            e?.message || e
          );
          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, 400));
          }
        }
      }
      // Do NOT clear credentials immediately; just mark as not currently validated
      console.warn(
        "Proceeding without fresh validation (offline or transient error). Credentials retained."
      );
      return true; // allow UI to proceed; API calls may still surface errors which user can act on
    } catch (e) {
      console.warn("HarvestAPI.init failed", e);
      return false;
    }
  }

  // Full authentication flow: discover account id from subdomain, then fetch /users/me
  async authenticate(subdomain, accessToken) {
    try {
      // Normalize subdomain (strip protocol / domain if user pasted URL)
      subdomain = (subdomain || "")
        .trim()
        .replace(/^https?:\/\//, "")
        .replace(/\.harvestapp\.com.*$/, "")
        .replace(/\/$/, "");
      if (!subdomain) throw new Error("Invalid subdomain");
      if (!accessToken) throw new Error("Missing access token");

      this.subdomain = subdomain;
      this.accessToken = accessToken;

      // 1) Get accessible accounts for this token
      const accountsResp = await fetch(
        "https://id.getharvest.com/api/v2/accounts",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "User-Agent": "Harvest Time Tracker Safari Extension",
          },
        }
      );
      if (!accountsResp.ok) {
        const txt = await accountsResp.text();
        throw new Error(
          `Accounts lookup failed (${accountsResp.status}): ${txt}`
        );
      }
      const accountsJson = await accountsResp.json();
      const accounts = accountsJson.accounts || [];
      if (!accounts.length)
        throw new Error("No accounts associated with token");

      // Find account by matching base_uri containing subdomain OR (fallback) first account
      let harvestAccount =
        accounts.find((a) =>
          (a.base_uri || "").includes(`${subdomain}.harvestapp.com`)
        ) || accounts[0];

      this.accountId = harvestAccount.id;
      this.accountName = harvestAccount.name;

      // 2) Fetch user details
      const verifyResponse = await fetch(
        "https://api.harvestapp.com/v2/users/me",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Harvest-Account-Id": this.accountId.toString(),
            "User-Agent": "Harvest Time Tracker Safari Extension",
            "Content-Type": "application/json",
          },
        }
      );
      if (!verifyResponse.ok) {
        const errorText = await verifyResponse.text();
        throw new Error(
          `User verification failed (${verifyResponse.status}): ${errorText}`
        );
      }
      const userData = await verifyResponse.json();
      this.userId = userData.id;
      this.userName = `${userData.first_name || ""} ${
        userData.last_name || ""
      }`.trim();
      this.userEmail = userData.email || null;

      await this.storeData({
        subdomain: this.subdomain,
        accessToken: this.accessToken,
        accountId: this.accountId,
        accountName: this.accountName,
        userId: this.userId,
        userName: this.userName,
        userEmail: this.userEmail,
      });

      return { success: true, userData, accountName: this.accountName };
    } catch (error) {
      console.error("Authentication failed:", error);
      return false;
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = `https://api.harvestapp.com/v2${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      "Harvest-Account-Id": this.accountId.toString(),
      "User-Agent": "Harvest Time Tracker Safari Extension",
      "Content-Type": "application/json",
      ...options.headers,
    };

    console.log(`Making request to: ${url} with account ID: ${this.accountId}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Request failed: ${response.status} ${response.statusText}`,
        errorText
      );
      throw new Error(
        `HTTP ${response.status}: ${response.statusText} - ${errorText}`
      );
    }

    return response.json();
  }

  async getProjects() {
    return this.makeRequest("/projects?is_active=true");
  }
  async getTasks() {
    return this.makeRequest("/tasks?is_active=true");
  }

  async getTimeEntries(date = null) {
    const dateStr = date || this.getLocalDateString();
    const userFilter = this.userId ? `&user_id=${this.userId}` : "";
    const url = `/time_entries?from=${dateStr}&to=${dateStr}${userFilter}`;
    console.log("Requesting time entries with URL:", url);
    return this.makeRequest(url);
  }

  async getTimeEntriesRange(fromDate, toDate) {
    const userFilter = this.userId ? `&user_id=${this.userId}` : "";
    const url = `/time_entries?from=${fromDate}&to=${toDate}${userFilter}`;
    console.log("Requesting time entries RANGE with URL:", url);
    return this.makeRequest(url);
  }
  async updateTimer(entryId, notes) {
    return this.makeRequest(`/time_entries/${entryId}`, {
      method: "PATCH",
      body: JSON.stringify({ notes }),
    });
  }

  async getProjectTaskAssignments(projectId) {
    // Harvest API: /projects/{PROJECT_ID}/task_assignments
    try {
      const data = await this.makeRequest(
        `/projects/${projectId}/task_assignments?is_active=true`
      );
      return data.task_assignments || [];
    } catch (e) {
      console.error(
        "Failed to fetch task assignments for project",
        projectId,
        e
      );
      return [];
    }
  }

  // Start a timer (create a new running time entry)
  async startTimer(projectId, taskId, notes = "") {
    try {
      const body = {
        project_id: projectId,
        task_id: taskId,
        spent_date: this.getLocalDateString(),
        notes: notes || "",
        // Setting is_running true is implicit when using POST /time_entries per Harvest docs
      };
      const entry = await this.makeRequest(`/time_entries`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      return entry;
    } catch (e) {
      console.error("HarvestAPI.startTimer failed", e);
      throw e;
    }
  }

  // Stop a running timer
  async stopTimer(entryId) {
    try {
      const stopped = await this.makeRequest(`/time_entries/${entryId}/stop`, {
        method: "PATCH",
      });
      return stopped;
    } catch (e) {
      console.error("HarvestAPI.stopTimer failed", e);
      throw e;
    }
  }

  // Restart a stopped timer (Harvest supports restarting last duration entry)
  async restartTimer(entryId) {
    try {
      const restarted = await this.makeRequest(
        `/time_entries/${entryId}/restart`,
        {
          method: "PATCH",
        }
      );
      return restarted;
    } catch (e) {
      console.error("HarvestAPI.restartTimer failed", e);
      throw e;
    }
  }

  async getStoredData() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        [
          "subdomain",
          "accessToken",
          "accountId",
          "userName",
          "userEmail",
          "accountName",
          "userId",
        ],
        resolve
      );
    });
  }

  async storeData(data) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(data, resolve);
    });
  }

  async clearData() {
    return new Promise((resolve) => {
      chrome.storage.sync.clear(resolve);
    });
  }
}

class TimerManager {
  constructor() {
    this.api = new HarvestAPI();
    this.currentTimer = null;
    this.intervalId = null;
    this.syncIntervalId = null; // For periodic external timer sync
    this.timerStartedAt = null; // Date when current running segment began
    this.baseHours = 0; // Hours BEFORE current running segment (excluding live seconds)
    this.elapsedSeconds = 0; // Total seconds displayed
    this.todayLoggedSecondsBase = 0; // Sum of all NON‑running entries today (running entry excluded to avoid double count)
    this.lastStoppedSeconds = 0; // Retain last task time after stop
  }

  async init() {
    const isAuthenticated = await this.api.init();
    if (isAuthenticated) {
      await this.loadCurrentTimer();
    }
    return isAuthenticated;
  }

  async loadCurrentTimer() {
    try {
      console.log("Loading current timer...");
      console.log("Current user ID:", this.api.userId);

      const entries = await this.api.getTimeEntries();
      console.log("Retrieved time entries:", entries);

      if (entries.time_entries && entries.time_entries.length > 0) {
        const runningEntries = entries.time_entries.filter(
          (entry) => entry.is_running
        );
        console.log(
          "Total entries:",
          entries.time_entries.length,
          "Running entries:",
          runningEntries.length
        );

        if (runningEntries.length > 0) {
          console.log("Running entries details:");
          runningEntries.forEach((entry, index) => {
            console.log(
              `  ${index + 1}. User: ${entry.user?.name} (ID: ${
                entry.user?.id
              }) - ${entry.project?.name}/${entry.task?.name}`
            );
          });
        }

        // User ID checking - try to filter by user, but don't fail completely
        if (!this.api.userId) {
          console.warn(
            "⚠️  No user ID available! Cannot filter timers safely."
          );
          console.log(
            "🔧 Showing no timers to prevent displaying team timers. Please re-authenticate."
          );
          this.currentTimer = null;
          return;
        }

        console.log(
          "🔍 Looking for timers belonging to user ID:",
          this.api.userId
        );

        const runningEntry = entries.time_entries.find(
          (entry) =>
            entry.is_running && entry.user && entry.user.id === this.api.userId
        );

        if (runningEntry) {
          console.log("✅ Found YOUR running timer:", {
            user: runningEntry.user.name,
            userId: runningEntry.user.id,
            project: runningEntry.project?.name,
            task: runningEntry.task?.name,
          });
          this.currentTimer = runningEntry;
          const startIso =
            runningEntry.timer_started_at ||
            runningEntry.timer_started_time ||
            runningEntry.created_at;
          this.timerStartedAt = startIso ? new Date(startIso) : new Date();
          const hoursAtFetch = runningEntry.hours || 0; // includes current segment up to fetch
          const runningSecondsSoFar = Math.max(
            0,
            (Date.now() - this.timerStartedAt.getTime()) / 1000
          );
          this.baseHours = Math.max(
            0,
            hoursAtFetch - runningSecondsSoFar / 3600
          );
          console.log(
            `[TimerCalc] loadCurrentTimer hoursAtFetch=${hoursAtFetch.toFixed(
              4
            )} runningSecondsSoFar=${runningSecondsSoFar} baseHours=${this.baseHours.toFixed(
              4
            )}`
          );
          this.elapsedSeconds = Math.floor(hoursAtFetch * 3600);
          this.startInterval();
          // Attempt to preselect project & task in UI if available
          try {
            if (runningEntry.project?.id) {
              // Ensure projects loaded later will honor this selection
              const desiredProjectId = runningEntry.project.id;
              setTimeout(() => {
                const projOption = projectSelect?.querySelector(
                  `option[value="${desiredProjectId}"]`
                );
                if (projOption) {
                  projectSelect.value = desiredProjectId;
                  handleProjectChange().then(() => {
                    if (runningEntry.task?.id) {
                      const taskOption = taskSelect?.querySelector(
                        `option[value="${runningEntry.task.id}"]`
                      );
                      if (taskOption) taskSelect.value = runningEntry.task.id;
                    }
                  });
                }
              }, 300); // slight delay so project list can populate
            }
          } catch (e) {
            console.warn("Prefill project/task failed", e);
          }
        } else {
          console.log(
            "❌ No running timer found for your user ID:",
            this.api.userId
          );
          if (runningEntries.length > 0) {
            console.log(
              "⚠️  There are running timers, but none belong to you:"
            );
            runningEntries.forEach((entry, index) => {
              console.log(
                `   ${index + 1}. User ID ${entry.user?.id} (${
                  entry.user?.name
                }) - NOT YOU`
              );
            });
          }
          this.currentTimer = null;
        }
      } else {
        console.log("No time entries found");
        this.currentTimer = null;
      }
    } catch (error) {
      console.error("Failed to load current timer:", error);
      this.currentTimer = null;
    }
  }

  async startTimer(projectId, taskId, notes) {
    try {
      if (this.currentTimer) {
        await this.stopCurrentTimer();
      }

      // Attempt to find an existing (stopped) entry for same project/task/issue reference today to restart instead of creating a new one.
      let entry = null;
      try {
        const today = this.api.getLocalDateString();
        const list = await this.api.getTimeEntries(today);
        const timeEntries = list?.time_entries || [];
        // Extract issue token (#123:) from notes if present for robust matching
        const issueTokenMatch = (notes || "").match(/#\d+:/);
        // Prefer matching by issue token then fallback to exact notes
        entry = timeEntries.find((e) => {
          if (e.is_running) return false; // only restart stopped entries
          if (e.project?.id !== projectId || e.task?.id !== taskId)
            return false;
          const eNotes = e.notes || "";
          if (issueTokenMatch && eNotes.includes(issueTokenMatch[0]))
            return true;
          // fallback: exact notes match (trim to ignore trailing space differences)
          return eNotes.trim() === (notes || "").trim();
        });
        if (entry) {
          console.log(
            "🔁 Resuming existing entry instead of creating new",
            entry.id
          );
          entry = await this.api.restartTimer(entry.id);
        }
      } catch (e) {
        console.warn("Resume attempt failed; falling back to new entry", e);
        entry = null;
      }

      if (!entry) {
        entry = await this.api.startTimer(projectId, taskId, notes);
      }
      this.currentTimer = entry;
      const startIso = entry.timer_started_at || entry.created_at;
      this.timerStartedAt = startIso ? new Date(startIso) : new Date();
      const hoursAtFetch = entry.hours || 0;
      const runningSecondsSoFar = Math.max(
        0,
        (Date.now() - this.timerStartedAt.getTime()) / 1000
      );
      this.baseHours = Math.max(0, hoursAtFetch - runningSecondsSoFar / 3600);
      this.elapsedSeconds = Math.floor(hoursAtFetch * 3600);
      console.log(
        `[TimerCalc] startTimer hoursAtFetch=${hoursAtFetch.toFixed(
          4
        )} runningSecondsSoFar=${runningSecondsSoFar} baseHours=${this.baseHours.toFixed(
          4
        )}`
      );
      this.startInterval();
      // Persist active timer metadata for content scripts (e.g., GitHub button state)
      try {
        chrome.storage.local.set({
          activeTimerMeta: {
            id: entry.id,
            projectId: projectId,
            taskId: taskId,
            projectName: entry.project?.name || "",
            taskName: entry.task?.name || "",
            notes: notes || "",
            startedAt: this.timerStartedAt.toISOString(),
          },
        });
      } catch (e) {
        console.warn("Failed to store activeTimerMeta", e);
      }
      // Notify background script to update icon to active state
      try {
        chrome.runtime.sendMessage({
          action: "startTimer",
          data: {
            id: entry.id,
            projectId: projectId,
            taskId: taskId,
            startTime: this.timerStartedAt.toISOString(),
          },
        });
      } catch (e) {
        console.warn("Failed to notify background script of timer start", e);
      }
      return entry;
    } catch (error) {
      console.error("Failed to start timer:", error);
      throw error;
    }
  }

  async stopCurrentTimer() {
    if (!this.currentTimer) return;
    try {
      // Capture final elapsed before clearing
      this.lastStoppedSeconds = this.elapsedSeconds;
      await this.api.stopTimer(this.currentTimer.id);
      this.currentTimer = null;
      this.stopInterval();
      try {
        chrome.storage.local.remove(["activeTimerMeta"]);
      } catch (e) {
        console.warn("Failed clearing activeTimerMeta", e);
      }
      // Notify background script to update icon to inactive state
      try {
        chrome.runtime.sendMessage({ action: "stopTimer" });
      } catch (e) {
        console.warn("Failed to notify background script of timer stop", e);
      }
      return true;
    } catch (error) {
      console.error("Failed to stop timer:", error);
      throw error;
    }
  }
  startInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.intervalId = setInterval(() => {
      if (this.timerStartedAt) {
        const runningSecondsLive = Math.max(
          0,
          (Date.now() - this.timerStartedAt.getTime()) / 1000
        );
        this.elapsedSeconds = Math.floor(
          this.baseHours * 3600 + runningSecondsLive
        );
        this.updateTimerDisplay();
        updateDailyTotalUI();
      }
    }, 1000);
    this.updateTimerDisplay();
    updateDailyTotalUI();
  }

  stopInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    // Don't zero elapsedSeconds immediately; preserve it until a new start.
    this.timerStartedAt = null;
    this.baseHours = 0;
    // Keep elapsedSeconds as the final total so display remains.
    this.updateTimerDisplay();
  }

  // Check for external timer changes (e.g., started in desktop app or web interface)
  async syncWithExternalTimer() {
    try {
      console.log("🔄 Checking for external timer changes...");

      const entries = await this.api.getTimeEntries();
      const runningEntry = entries.time_entries?.find(
        (entry) =>
          entry.is_running && entry.user && entry.user.id === this.api.userId
      );

      // Case 1: External timer is running, but we don't have one locally
      if (runningEntry && !this.currentTimer) {
        console.log("✨ External timer detected! Syncing...", {
          project: runningEntry.project?.name,
          task: runningEntry.task?.name,
        });

        this.currentTimer = runningEntry;
        const startIso =
          runningEntry.timer_started_at ||
          runningEntry.timer_started_time ||
          runningEntry.created_at;
        this.timerStartedAt = startIso ? new Date(startIso) : new Date();
        const hoursAtFetch = runningEntry.hours || 0;
        const runningSecondsSoFar = Math.max(
          0,
          (Date.now() - this.timerStartedAt.getTime()) / 1000
        );
        this.baseHours = Math.max(0, hoursAtFetch - runningSecondsSoFar / 3600);
        this.elapsedSeconds = Math.floor(hoursAtFetch * 3600);
        this.startInterval();

        // Update UI
        updateStatusBar();
        updateTimerUI();

        // Notify background script
        chrome.runtime.sendMessage({
          action: "startTimer",
          data: runningEntry,
        });

        return true;
      }

      // Case 2: We have a local timer, but no timer is running externally
      if (!runningEntry && this.currentTimer) {
        console.log(
          "⚠️ Local timer exists but no external timer found - timer may have been stopped externally"
        );
        await this.stopCurrentTimer();
        updateStatusBar();
        updateTimerUI();
        return true;
      }

      // Case 3: Both exist - check if they're the same timer
      if (runningEntry && this.currentTimer) {
        if (runningEntry.id !== this.currentTimer.id) {
          console.log("🔄 Different timer detected externally! Switching...");
          await this.stopCurrentTimer();

          // Start the external timer locally
          this.currentTimer = runningEntry;
          const startIso =
            runningEntry.timer_started_at ||
            runningEntry.timer_started_time ||
            runningEntry.created_at;
          this.timerStartedAt = startIso ? new Date(startIso) : new Date();
          const hoursAtFetch = runningEntry.hours || 0;
          const runningSecondsSoFar = Math.max(
            0,
            (Date.now() - this.timerStartedAt.getTime()) / 1000
          );
          this.baseHours = Math.max(
            0,
            hoursAtFetch - runningSecondsSoFar / 3600
          );
          this.elapsedSeconds = Math.floor(hoursAtFetch * 3600);
          this.startInterval();

          updateStatusBar();
          updateTimerUI();

          chrome.runtime.sendMessage({
            action: "startTimer",
            data: runningEntry,
          });

          return true;
        }
      }

      console.log("✅ Timer state in sync");
      return false;
    } catch (error) {
      console.error("Failed to sync with external timer:", error);
      return false;
    }
  }

  // Start periodic sync to detect external timer changes
  startPeriodicSync() {
    // Check every 30 seconds for external changes
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    this.syncIntervalId = setInterval(async () => {
      await this.syncWithExternalTimer();
    }, 30000); // 30 seconds

    console.log("🔄 Periodic timer sync started (every 30 seconds)");
  }

  stopPeriodicSync() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
      console.log("⏹️ Periodic timer sync stopped");
    }
  }

  updateTimerDisplay() {
    const totalSeconds = this.elapsedSeconds;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const compact =
      hours > 0
        ? `${hours}:${minutes.toString().padStart(2, "0")}`
        : `${minutes}:${seconds.toString().padStart(2, "0")}`;
    if (statusTimerCompact) statusTimerCompact.textContent = compact;
    // Badge now maintained centrally by background script for consistency.
    // We keep legacy update only if background badge disabled.
    try {
      chrome.storage.sync.get(["disableBadge"], (res) => {
        if (res && res.disableBadge === true) {
          chrome.browserAction.setBadgeText({
            text: this.currentTimer ? compact : "",
          });
          chrome.browserAction.setBadgeBackgroundColor({
            color: this.currentTimer ? "#238636" : "#6e7781",
          });
        }
      });
    } catch (_) {}
  }

  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
}

// Security: HTML escaping function to prevent XSS attacks
function escapeHtml(unsafe) {
  if (typeof unsafe !== "string") return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Global instances
const timerManager = new TimerManager();
// Removed recentEntriesCache (no longer used after simplification)
let projects = [];
let tasks = [];
let projectsLoaded = false;
let lastSelection = null; // { projectId, taskId }

// DOM elements
const authSection = document.getElementById("authSection");
const mainSection = document.getElementById("mainSection");
const subdomainInput = document.getElementById("subdomain");
const accessTokenInput = document.getElementById("accessToken");
const loginBtn = document.getElementById("loginBtn");
// Legacy timer button removed from UI (was large start/stop). Keep reference if present for backward compatibility.
const timerBtn = document.getElementById("timerBtn");
const projectSelect = document.getElementById("projectSelect");
const taskSelect = document.getElementById("taskSelect");
const descriptionInput = document.getElementById("description");
// Settings removed; single behavior flag removed.
// Settings UI elements (may be null if HTML not yet updated)
// Removed legacy issue reference settings UI elements.

// In‑memory settings cache with defaults
let settingsCache = { openHarvestAfterStart: false }; // retained for compatibility if storage key exists
const recentEntriesList = document.getElementById("recentEntriesList");
const logoutBtn = document.getElementById("logoutBtn");
const testOpenBtn = document.getElementById("testOpenBtn");
const openHarvestLink = document.getElementById("openHarvestLink");
const statusBar = document.getElementById("currentTaskStatus");
const statusToggleBtn = document.getElementById("statusToggleBtn");
const statusTaskText = document.getElementById("statusTaskText");
const statusProjectEl = document.getElementById("statusProject");
const statusTaskEl = document.getElementById("statusTask");
const statusTimerCompact = document.getElementById("statusTimerCompact");
const startNewTaskBtn = document.getElementById("startNewTaskBtn");

// Event listeners
document.addEventListener("DOMContentLoaded", initializePopup);
document.addEventListener("DOMContentLoaded", () => {
  // Initialize translations
  if (typeof i18n !== "undefined") {
    i18n.translatePage();

    // Set up language selector
    const languageSelect = document.getElementById("languageSelect");
    if (languageSelect) {
      // Set current language preference
      const savedPref = i18n.getSavedPreference();
      languageSelect.value = savedPref;

      // Listen for language changes
      languageSelect.addEventListener("change", (e) => {
        const newLang = e.target.value;
        i18n.setLanguage(newLang);
        console.log("🌍 Language changed via selector:", newLang);
      });
    }
  }

  try {
    chrome.runtime.sendMessage({ action: "popupAck" });
  } catch {
    // ignore
  }
  try {
    window.postMessage({ action: "popupAckReady" }, "*");
  } catch {}
});
loginBtn.addEventListener("click", handleLogin);
function bindStatusToggle() {
  if (!statusToggleBtn || statusToggleBtn.__bound) return;
  statusToggleBtn.__bound = true;
  statusToggleBtn.addEventListener("click", async () => {
    try {
      if (timerManager.currentTimer) {
        await timerManager.stopCurrentTimer();
        updateTimerUI();
        updateStatusBar();
        await loadRecentEntries();
        requestContextRefreshIfIdle();
      } else {
        await attemptStartFromUI();
        updateStatusBar();
      }
    } catch (e) {
      console.warn("Status toggle failed", e);
    }
  });
}
bindStatusToggle();

if (timerBtn) {
  timerBtn.disabled = true; // Disabled until projects load
  timerBtn.addEventListener("click", handleTimerToggle);
} else {
  console.warn("timerBtn not found at script load; adding fallback binder");
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("timerBtn");
    if (btn && !btn.__bound) {
      btn.__bound = true;
      btn.disabled = true;
      btn.addEventListener("click", handleTimerToggle);
      updateTimerUI?.();
    }
  });
}

openHarvestLink?.addEventListener("click", (e) => {
  e.preventDefault();
  openHarvestWebApp();
});

// --- UI STATE HELPERS ----------------------------------------------------
function updateStatusBar() {
  try {
    if (!statusBar) return;
    const running = !!timerManager.currentTimer;
    if (running) {
      statusBar.style.display = "flex";
      statusBar.classList.add("running");
      statusToggleBtn.textContent = "■";
      statusToggleBtn.title = "Stop current timer";

      // Show edit link when timer is running
      const statusEditLink = document.getElementById("statusEditLink");
      if (statusEditLink && timerManager.api?.subdomain) {
        statusEditLink.style.display = "inline-block";
        statusEditLink.href = `https://${timerManager.api.subdomain}.harvestapp.com/time`;
      }

      const t = timerManager.currentTimer;
      statusTaskText.textContent =
        (t.notes || "").slice(0, 120) || "Running...";
      if (statusProjectEl) {
        const clientName =
          t.project?.client?.name || t.client?.name || "No Client";
        const projectName = t.project?.name || "";
        statusProjectEl.textContent = projectName
          ? `${clientName} → ${projectName}`
          : "";
        statusProjectEl.style.display = projectName ? "inline" : "none";
      }
      if (statusTaskEl) {
        statusTaskEl.textContent = t.task?.name || "";
        statusTaskEl.style.display = t.task?.name ? "inline" : "none";
      }
    } else {
      statusBar.classList.remove("running");
      statusToggleBtn.textContent = "▶";
      statusToggleBtn.title = "Start timer";

      // Hide edit link when no timer running
      const statusEditLink = document.getElementById("statusEditLink");
      if (statusEditLink) {
        statusEditLink.style.display = "none";
      }

      // Hide the entire status bar when no timer is running
      statusBar.style.display = "none";

      if (statusProjectEl) statusProjectEl.style.display = "none";
      if (statusTaskEl) statusTaskEl.style.display = "none";
      // When idle, if we have lastStoppedSeconds and no running timer, keep that time visible.
      if (!timerManager.currentTimer && timerManager.timerStartedAt === null) {
        timerManager.updateTimerDisplay();
      }
    }
  } catch (e) {
    console.warn("updateStatusBar failed", e);
  }
}

// New Task start button wiring
if (startNewTaskBtn) {
  startNewTaskBtn.addEventListener("click", async () => {
    startNewTaskBtn.disabled = true;
    try {
      // Stop current timer if running (no confirmation needed)
      if (timerManager.currentTimer) {
        await timerManager.stopCurrentTimer();
      }
      // Start new task
      await attemptStartFromUI();
      updateStatusBar();
    } catch (error) {
      console.error("Failed to start task:", error);
      showError(
        t("error_start_task", "Failed to start task") + ": " + error.message
      );
    } finally {
      startNewTaskBtn.disabled = false;
    }
  });
}

// Function removed - edit functionality replaced with direct link to Harvest

function requestContextRefreshIfIdle() {
  if (timerManager.currentTimer) return;
  try {
    chrome.runtime.sendMessage({ action: "harvestRequestPageContext" });
  } catch {}
}

function updateTimerUI() {
  // Reduced: just sync status bar state
  try {
    updateStatusBar();
  } catch (e) {
    console.warn("updateTimerUI minimal failed", e);
  }
}

// Cleanup any existing interval
if (window.__harvestCompactInterval) {
  clearInterval(window.__harvestCompactInterval);
  window.__harvestCompactInterval = null;
}

let eventListenersRegistered = false;

async function initializePopup() {
  console.log("🚀 Initializing popup...");

  // Register event listeners once (use optional chaining for safety)
  if (!eventListenersRegistered) {
    projectSelect?.addEventListener("change", handleProjectChange);
    logoutBtn?.addEventListener("click", handleLogout);
    testOpenBtn?.addEventListener("click", () => {
      console.log("Test button clicked");
      openHarvestWebApp();
    });
    eventListenersRegistered = true;
  }

  const isAuthenticated = await timerManager.init();
  console.log("🔐 Authentication result:", isAuthenticated);

  // Legacy cleanup: remove any stale auto-start pendingTimerStart objects
  try {
    chrome.storage.local.get(["pendingTimerStart"], (res) => {
      const pending = res.pendingTimerStart;
      if (pending && pending.autoStart) {
        chrome.storage.local.remove(["pendingTimerStart"], () => {
          console.log("Removed legacy autoStart pendingTimerStart");
        });
      }
    });
  } catch (e) {
    console.warn("Legacy pendingTimerStart cleanup failed", e);
  }

  // Load openHarvestAfterStart if previously stored (legacy)
  chrome.storage.sync.get(["openHarvestAfterStart"], (res) => {
    settingsCache.openHarvestAfterStart = !!res.openHarvestAfterStart;
  });

  if (isAuthenticated) {
    console.log("✅ User is authenticated, showing main section");
    await showMainSection();
  } else {
    console.log("❌ User not authenticated, showing login");
    showAuthSection();
  }
}

function showAuthSection() {
  authSection.style.display = "block";
  mainSection.style.display = "none";
  logoutBtn.style.display = "none";
}

// Prefill form with last used project and task from recent entries
async function prefillLastProjectAndTask() {
  try {
    console.log("🔄 Attempting to prefill last project and task...");

    // Get today's entries
    const today = timerManager.api.getLocalDateString();
    const data = await timerManager.api.getTimeEntries(today);
    const entries = data.time_entries || [];

    // Filter to user's entries and sort by most recent
    const userEntries = entries
      .filter((e) => e.user?.id === timerManager.api.userId)
      .sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));

    if (userEntries.length === 0) {
      console.log("No recent entries found for prefill");
      return;
    }

    // Get the most recent entry
    const lastEntry = userEntries[0];
    const projectId = lastEntry.project?.id;
    const taskId = lastEntry.task?.id;

    console.log("📌 Last used project:", projectId, "task:", taskId);

    if (!projectId || !taskId) {
      console.log("Last entry missing project or task");
      return;
    }

    // Set project
    const projectSelect = document.getElementById("projectSelect");
    if (projectSelect && projectId) {
      projectSelect.value = projectId.toString();

      // Trigger project change to load tasks
      await handleProjectChange();

      // Wait a moment for tasks to load, then set task
      setTimeout(() => {
        const taskSelect = document.getElementById("taskSelect");
        if (taskSelect && taskId) {
          taskSelect.value = taskId.toString();
          console.log("✅ Prefilled project and task from last entry");
        }
      }, 100);
    }
  } catch (error) {
    console.error("Failed to prefill last project and task:", error);
    // Don't show error to user - this is just a convenience feature
  }
}

async function showMainSection() {
  try {
    console.log("🎯 Showing main section...");
    authSection.style.display = "none";
    mainSection.style.display = "block";
    logoutBtn.style.display = "block";

    console.log(
      "✅ Main section visibility set. Timer button element:",
      !!document.getElementById("timerBtn")
    );

    // Show user info
    displayUserInfo();

    // Load data with error handling for each step
    try {
      await loadProjects();
      // Prefill last used project and task from today's entries
      await prefillLastProjectAndTask();
      // Try prefill immediately before anything else modifies description
      await applyHarvestPrefill();
      ensureDescriptionPrefill();
      // New: always force an active tab snapshot of title/URL so description reliably reflects current page.
      forceActiveTabPrefill();
    } catch (error) {
      console.error("Failed to load projects or apply prefill:", error);
    }

    try {
      await loadRecentEntries();
    } catch (error) {
      console.error("Failed to load recent entries:", error);
    }

    // Attempt to prefill project/task from reused notes
    // attemptPrefillProjectTaskFromNotes retained but only useful after user typed text; skip here for empty field

    // Always call updateTimerUI to ensure the button is shown
    updateTimerUI();
    updateStatusBar();

    // Immediately check for external timer changes on popup open
    try {
      await timerManager.syncWithExternalTimer();
    } catch (error) {
      console.error("Failed initial external timer sync:", error);
    }

    // Start periodic sync to detect external timer changes
    timerManager.startPeriodicSync();

    // Check for pending timer start from content script
    try {
      await handlePendingTimerStart();
    } catch (error) {
      console.error("Failed to handle pending timer start:", error);
    }
    try {
      await handlePendingTimerStop();
    } catch (error) {
      console.error("Failed to handle pending timer stop:", error);
    }
  } catch (error) {
    console.error("Error in showMainSection:", error);
    // Ensure UI is still shown even if there are errors
    authSection.style.display = "none";
    mainSection.style.display = "block";
    logoutBtn.style.display = "block";
  }
}

async function handleLogin() {
  hideError(); // Clear any previous error messages

  const subdomain = subdomainInput.value.trim();
  const accessToken = accessTokenInput.value.trim();

  // Security: Validate input before processing
  if (!subdomain || !accessToken) {
    showError(t("error_fill_fields", "Please fill in both fields"));
    return;
  }

  // Validate subdomain format (alphanumeric, hyphens, no special chars)
  if (!/^[a-zA-Z0-9-]+$/.test(subdomain)) {
    showError(
      t(
        "error_invalid_subdomain",
        "Invalid subdomain format. Use only letters, numbers, and hyphens."
      )
    );
    return;
  }

  // Validate token format (should be a reasonable length)
  if (accessToken.length < 20 || accessToken.length > 200) {
    showError("Invalid access token format.");
    return;
  }

  // Check for suspicious patterns that might indicate injection attempts
  if (/<script|javascript:|onerror=/i.test(subdomain + accessToken)) {
    showError("Invalid characters detected in input.");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = t("loading", "Connecting...");

  try {
    const result = await timerManager.api.authenticate(subdomain, accessToken);
    if (result && result.success) {
      await showMainSection();
    } else {
      showError(
        t(
          "error_auth_failed",
          "Invalid credentials. Please check your subdomain and token."
        )
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    showError(t("error_auth_failed", `Connection failed: ${error.message}`));
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = t("auth_login_button", "Connect to Harvest");
  }
}

async function handleTimerToggle() {
  console.log("Timer button clicked!");

  if (!projectsLoaded) {
    console.warn("⏳ Projects still loading; cannot start timer yet");
    showError("Loading projects... please wait");
    return;
  }

  if (timerManager.currentTimer) {
    // Stop timer
    try {
      const runningId = timerManager.currentTimer.id;
      console.log("Stopping timer:", runningId);
      timerBtn?.setAttribute("data-state", "stopping");
      await timerManager.stopCurrentTimer();
      console.log("Stopped timer:", runningId);
      updateTimerUI();
      await loadRecentEntries();
    } catch (error) {
      console.error("Failed to stop timer:", error);
      showError("Failed to stop timer: " + error.message);
    } finally {
      timerBtn?.removeAttribute("data-state");
    }
  } else {
    // Start timer
    let projectId = projectSelect.value;
    let taskId = taskSelect.value;

    // Auto-select first project/task if none chosen yet but data loaded
    if (!projectId && projects.length > 0) {
      projectId = String(projects[0].id);
      projectSelect.value = projectId;
      await handleProjectChange();
    }
    if (!taskId && taskSelect.options.length > 1) {
      // pick first non-empty task option
      const firstTaskOpt = Array.from(taskSelect.options).find((o) => o.value);
      if (firstTaskOpt) {
        taskId = firstTaskOpt.value;
        taskSelect.value = taskId;
      }
    }
    const notes = descriptionInput.value;

    console.log("Starting timer with:", { projectId, taskId, notes });

    if (!projectId || !taskId) {
      console.warn("Start blocked: missing project/task", {
        projectId,
        taskId,
      });
      showError("Select project & task first");
      return;
    }

    try {
      const result = await timerManager.startTimer(
        parseInt(projectId),
        parseInt(taskId),
        notes
      );
      console.log("Timer started successfully:", result);
      // Remember selection
      lastSelection = { projectId, taskId };
      chrome.storage.local.set({ lastSelection });
      updateTimerUI();

      // Conditionally open Harvest web app if user enabled setting
      let shouldOpen = settingsCache.openHarvestAfterStart;
      if (shouldOpen) {
        openHarvestWebApp();
        showError("✓ Timer started! Opening Harvest...");
      } else {
        showError("✓ Timer started");
      }
      setTimeout(hideError, 2000);
    } catch (error) {
      console.error("Failed to start timer:", error);
      showError("Failed to start timer: " + error.message);
    }
  }
}

// Unified start helper used by status bar toggle (and could be reused elsewhere)
async function attemptStartFromUI() {
  if (!projectsLoaded) {
    showError("Loading projects... please wait");
    return;
  }
  // Early return removed - caller (Start Task button) handles stopping current timer

  let projectId = projectSelect.value;
  let taskId = taskSelect.value;
  // Auto-pick first valid project/task if none selected yet
  if (!projectId && projects.length > 0) {
    projectId = String(projects[0].id);
    projectSelect.value = projectId;
    await handleProjectChange();
  }
  if (!taskId && taskSelect.options.length > 1) {
    const firstTaskOpt = Array.from(taskSelect.options).find((o) => o.value);
    if (firstTaskOpt) {
      taskId = firstTaskOpt.value;
      taskSelect.value = taskId;
    }
  }
  const notes = descriptionInput.value;
  if (!projectId || !taskId) {
    showError("Select project & task first");
    return;
  }
  try {
    await timerManager.startTimer(parseInt(projectId), parseInt(taskId), notes);
    lastSelection = { projectId, taskId };
    chrome.storage.local.set({ lastSelection });
    updateTimerUI();
    showError("✓ Timer started");
    setTimeout(hideError, 1500);
  } catch (e) {
    console.error("attemptStartFromUI failed", e);
    showError("Failed to start timer: " + e.message);
  }
}

let isHandlingProjectChange = false;

async function handleProjectChange() {
  // Prevent concurrent execution
  if (isHandlingProjectChange) {
    console.warn(
      "⚠️ handleProjectChange already running, skipping duplicate call"
    );
    return;
  }

  isHandlingProjectChange = true;

  try {
    const projectId = projectSelect.value;
    console.log("🔄 Project changed to ID:", projectId);
    console.log(
      "📊 Current taskSelect options count BEFORE clear:",
      taskSelect.options.length
    );

    // Clear all options first
    taskSelect.innerHTML = "";
    // Add default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select Task";
    taskSelect.appendChild(defaultOption);

    console.log(
      "📊 Current taskSelect options count AFTER clear:",
      taskSelect.options.length
    );

    if (projectId) {
      let project = projects.find((p) => p.id == projectId);
      if (!project) {
        console.warn("❌ Project not found in cached list");
        return;
      }

      console.log("📋 Selected project:", project.name, `(ID: ${project.id})`);

      // Lazy-load task assignments if missing or empty
      if (!project.task_assignments || project.task_assignments.length === 0) {
        console.log("🔄 Fetching task assignments for project", project.id);
        const assignments = await timerManager.api.getProjectTaskAssignments(
          project.id
        );
        project.task_assignments = assignments; // mutate cached project
        console.log(`📥 Retrieved ${assignments.length} task assignments`);
      }

      if (project.task_assignments && project.task_assignments.length > 0) {
        let addedTasks = 0;
        console.log(
          `🔄 About to add ${project.task_assignments.length} task assignments`
        );
        project.task_assignments.forEach((assignment, _index) => {
          const tObj = assignment.task;
          if (!tObj) return;
          const task = tasks.find((t) => t.id === tObj.id) || tObj; // fall back to task from assignment
          const option = document.createElement("option");
          option.value = task.id;
          option.textContent = task.name;
          taskSelect.appendChild(option);
          addedTasks++;
        });
        console.log(
          `✅ Populated ${addedTasks} tasks for project ${project.name}`
        );
        console.log(
          "📊 Final taskSelect options count:",
          taskSelect.options.length
        );
      } else {
        console.warn(
          "⚠️ No active task assignments available for this project"
        );
        const opt = document.createElement("option");
        opt.disabled = true;
        opt.textContent = "No tasks available";
        taskSelect.appendChild(opt);
        showError("No active tasks in this project");
      }
    }
  } finally {
    isHandlingProjectChange = false;
  }
}

async function handleLogout() {
  await timerManager.api.clearData();
  timerManager.currentTimer = null;
  timerManager.stopInterval();
  timerManager.stopPeriodicSync(); // Stop external timer sync
  showAuthSection();
}

let isLoadingProjects = false;

async function loadProjects() {
  // Prevent concurrent execution
  if (isLoadingProjects) {
    console.warn("⚠️ loadProjects already running, skipping duplicate call");
    return;
  }

  isLoadingProjects = true;

  try {
    console.log("🔍 Loading projects and tasks...");
    const [projectsData, tasksData] = await Promise.all([
      timerManager.api.getProjects(),
      timerManager.api.getTasks(),
    ]);

    projects = projectsData.projects || [];
    tasks = tasksData.tasks || [];

    console.log(
      `📋 Loaded ${projects.length} projects and ${tasks.length} tasks`
    );

    // Debug first few projects
    if (projects.length > 0) {
      console.log("First few projects:");
      projects.slice(0, 3).forEach((project, index) => {
        console.log(
          `  Project ${index + 1}: ${project.client?.name || "No Client"} → ${
            project.name
          } (ID: ${project.id})`
        );
        console.log(
          `    Task assignments: ${project.task_assignments?.length || 0}`
        );
        if (project.task_assignments && project.task_assignments.length > 0) {
          project.task_assignments
            .slice(0, 2)
            .forEach((assignment, taskIndex) => {
              console.log(
                `      Task ${taskIndex + 1}: ${assignment.task?.name} (ID: ${
                  assignment.task?.id
                })`
              );
            });
        }
      });
    }

    console.log(
      "📊 ProjectSelect options count BEFORE clear:",
      projectSelect.options.length
    );
    projectSelect.innerHTML = "";
    const defaultProjectOption = document.createElement("option");
    defaultProjectOption.value = "";
    defaultProjectOption.textContent = "Select Project";
    projectSelect.appendChild(defaultProjectOption);
    console.log(
      "📊 ProjectSelect options count AFTER clear:",
      projectSelect.options.length
    );

    // Check for duplicate project IDs in the data
    const projectIds = new Set();
    const duplicates = [];
    projects.forEach((project) => {
      if (projectIds.has(project.id)) {
        duplicates.push(project.name);
      }
      projectIds.add(project.id);
    });

    if (duplicates.length > 0) {
      console.error("⚠️ DUPLICATE PROJECT IDs DETECTED:", duplicates);
    }

    // Group projects by client
    const projectsByClient = new Map();
    projects.forEach((project) => {
      const clientName = project.client?.name || "No Client";
      if (!projectsByClient.has(clientName)) {
        projectsByClient.set(clientName, []);
      }
      projectsByClient.get(clientName).push(project);
    });

    // Sort clients alphabetically
    const sortedClients = Array.from(projectsByClient.keys()).sort((a, b) => {
      // Put "No Client" at the end
      if (a === "No Client") return 1;
      if (b === "No Client") return -1;
      return a.localeCompare(b);
    });

    let addedProjects = 0;
    sortedClients.forEach((clientName) => {
      const clientProjects = projectsByClient.get(clientName);

      // Sort projects within each client alphabetically
      clientProjects.sort((a, b) => a.name.localeCompare(b.name));

      // Create optgroup for this client
      const optgroup = document.createElement("optgroup");
      optgroup.label = clientName;

      // Add all projects for this client
      clientProjects.forEach((project) => {
        const option = document.createElement("option");
        option.value = project.id;
        option.textContent = project.name;
        optgroup.appendChild(option);
        addedProjects++;
      });

      projectSelect.appendChild(optgroup);
    });

    console.log(
      `✅ Projects populated in dropdown: ${addedProjects} projects grouped by ${sortedClients.length} clients`
    );
    console.log(
      "📊 Final projectSelect options count:",
      projectSelect.options.length
    );
    projectsLoaded = true;
    if (timerBtn) timerBtn.disabled = false;

    // Try to restore last selection
    chrome.storage.local.get(["lastSelection"], async (res) => {
      if (res.lastSelection) {
        lastSelection = res.lastSelection;
        if (lastSelection.projectId) {
          projectSelect.value = String(lastSelection.projectId);
          await handleProjectChange();
          if (lastSelection.taskId) {
            const taskOpt = Array.from(taskSelect.options).find(
              (o) => o.value == lastSelection.taskId
            );
            if (taskOpt) taskSelect.value = String(lastSelection.taskId);
          }
          return; // restored selection; skip smart auto-select
        }
      }
      // Smart auto-select: find first project that actually has active task assignments
      if (!projectSelect.value && projects.length) {
        for (const proj of projects) {
          // Ensure task assignments are loaded
          if (!proj.task_assignments || proj.task_assignments.length === 0) {
            const assignments =
              await timerManager.api.getProjectTaskAssignments(proj.id);
            proj.task_assignments = assignments;
          }
          if (proj.task_assignments && proj.task_assignments.length > 0) {
            projectSelect.value = proj.id;
            await handleProjectChange();
            // pick first task
            const firstTask = proj.task_assignments[0]?.task;
            if (firstTask) {
              const opt = Array.from(taskSelect.options).find(
                (o) => parseInt(o.value) === firstTask.id
              );
              if (opt) taskSelect.value = opt.value;
            }
            console.log(
              "🤖 Smart auto-selected project with tasks:",
              proj.name
            );
            break;
          }
        }
      }
    });
  } catch (error) {
    console.error("Failed to load projects:", error);
    showError("Failed to load projects");
    projectsLoaded = false;
  } finally {
    isLoadingProjects = false;
  }
}

// loadRecentEntries: earlier verbose implementation removed in favor of unified version later in file.
// (Removed duplicate showError/hideError/prefillIssueLink definitions later in file to satisfy linter.)

// Load and display recent entries (last 7 days) for current user
async function loadRecentEntries() {
  try {
    const today = new Date();
    const toDate = timerManager.api.getLocalDateString(today);
    const from = new Date(today.getTime() - 6 * 24 * 3600 * 1000);
    const fromDate = timerManager.api.getLocalDateString(from);
    console.log(`[RecentEntries] Range ${fromDate} -> ${toDate}`);

    if (!timerManager.api.userId) {
      console.warn(
        "[RecentEntries] Missing userId; ask user to re-authenticate"
      );
      recentEntriesList.innerHTML =
        '<div class="entry-empty">Re-authenticate to see recent entries.</div>';
      return;
    }

    const data = await timerManager.api.getTimeEntriesRange(fromDate, toDate);
    const all = data.time_entries || [];
    console.log(`[RecentEntries] Raw count: ${all.length}`);

    const userEntries = all
      .filter((e) => e.user?.id === timerManager.api.userId)
      .sort((a, b) => {
        const d = (b.spent_date || "").localeCompare(a.spent_date || "");
        if (d !== 0) return d;
        return (b.updated_at || "").localeCompare(a.updated_at || "");
      });

    console.log(`[RecentEntries] Filtered count: ${userEntries.length}`);
    recentEntriesList.innerHTML = "";
    if (userEntries.length === 0) {
      recentEntriesList.innerHTML =
        '<div class="entry-empty">No time logged in the last 7 days.</div>';
      return;
    }

    // (recentEntriesCache removed)

    // Compute today's base total excluding the running entry (we'll add live seconds separately)
    const todayStr = timerManager.api.getLocalDateString();
    let baseSeconds = 0;
    let runningStaticSeconds = 0;
    userEntries.forEach((e) => {
      if (e.spent_date !== todayStr) return;
      const hours = e.hours || 0;
      const seconds = Math.round(hours * 3600);
      if (timerManager.currentTimer && e.id === timerManager.currentTimer.id) {
        // capture static portion only (not added to base to avoid double count)
        runningStaticSeconds = seconds;
      } else {
        baseSeconds += seconds;
      }
    });
    timerManager.todayLoggedSecondsBase = baseSeconds; // running excluded
    updateDailyTotalUI();

    userEntries.slice(0, 3).forEach((entry) => {
      const a = document.createElement("a");
      a.className = "entry-item entry-link";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      // Prefer stored subdomain; fall back to accountId string if needed
      const sub = timerManager.api.subdomain || "app";
      // Convert spent_date YYYY-MM-DD to /YYYY/M/D/ path (no leading zeros for M/D) then append entry id
      const parts = (entry.spent_date || "").split("-");
      let y = parts[0],
        m = parts[1],
        d = parts[2];
      if (m && m.startsWith("0")) m = m.slice(1);
      if (d && d.startsWith("0")) d = d.slice(1);
      a.href = `https://${sub}.harvestapp.com/time/day/${y}/${m}/${d}/${entry.id}`;
      const hours = entry.hours || 0;
      const whole = Math.floor(hours);
      const minutes = Math.round((hours - whole) * 60);
      const formatted = `${whole}:${minutes.toString().padStart(2, "0")}`;
      const clientName =
        entry.project?.client?.name || entry.client?.name || "No Client";
      const projectName = entry.project?.name || "Unknown Project";
      const taskName = entry.task?.name || "Unknown Task";
      const notes = entry.notes || "";

      // Security: Escape all user-controlled content to prevent XSS
      a.innerHTML = `
        <div class="entry-info">
          <div class="entry-project">${escapeHtml(clientName)} → ${escapeHtml(
        projectName
      )}</div>
          <div class="entry-task">${escapeHtml(taskName)}</div>
          ${notes ? `<div class="entry-notes">${escapeHtml(notes)}</div>` : ""}
        </div>
        <div class="entry-time">${escapeHtml(formatted)}</div>`;
      recentEntriesList.appendChild(a);
    });
  } catch (err) {
    console.error("[RecentEntries] Failed:", err);
  }
}

function updateDailyTotalUI() {
  try {
    const el = document.getElementById("dailyTotal");
    if (!el) return;
    // Total = base (non-running entries) + live running elapsed seconds (if any)
    let totalSeconds = timerManager.todayLoggedSecondsBase;
    if (timerManager.currentTimer && timerManager.timerStartedAt) {
      totalSeconds += timerManager.elapsedSeconds; // elapsedSeconds already includes static+live portion
    }
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    el.textContent = `${h}h ${m.toString().padStart(2, "0")}m`;
  } catch (e) {
    console.warn("updateDailyTotalUI failed", e);
  }
}

// Removed attemptPrefillProjectTaskFromNotes (unused after simplification)

async function handlePendingTimerStart() {
  try {
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(["pendingTimerStart"], resolve);
    });

    if (result.pendingTimerStart) {
      const pending = result.pendingTimerStart;

      // Only process if it's recent (within 30 seconds)
      if (Date.now() - pending.timestamp < 30000) {
        console.log("Found pending timer start:", pending);

        // Preserve existing description if user typed; otherwise set to pending.task
        const hadUserText =
          descriptionInput.value && descriptionInput.value.trim().length > 0;
        if (!hadUserText) {
          descriptionInput.value = pending.task;
        }
        // Issue link enrichment removed in simplified model.

        // Try to match project name (case-insensitive substring) to an existing project option
        if (projects.length) {
          const normalized = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
          const target = normalized(pending.project || "");
          const match = projects.find(
            (p) =>
              normalized(p.name).includes(target) ||
              target.includes(normalized(p.name))
          );
          if (match) {
            projectSelect.value = match.id;
            await handleProjectChange();
          }
        }

        // If we auto selected project and have tasks loaded, attempt a task match
        if (taskSelect.options.length > 1) {
          const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
          const targetTask = norm(pending.task || "");
          for (const opt of taskSelect.options) {
            if (!opt.value) continue;
            if (
              norm(opt.textContent).includes(targetTask) ||
              targetTask.includes(norm(opt.textContent))
            ) {
              taskSelect.value = opt.value;
              break;
            }
          }
        }

        // Always passive: never auto-start; just inform user
        showError(`Ready: ${pending.project} — ${pending.task}`);
        setTimeout(hideError, 3000);
      }

      // Clear the pending request (legacy autoStart removed)
      chrome.storage.local.remove(["pendingTimerStart"]);
    }
  } catch (error) {
    console.error("Failed to handle pending timer start:", error);
  }
}

// Passive prefill (no auto start) for content-script initiated context
async function applyHarvestPrefill() {
  try {
    const result = await new Promise((r) =>
      chrome.storage.local.get(["harvestPrefill"], r)
    );
    const prefill = result.harvestPrefill;
    if (!prefill) return;
    const desc = document.getElementById("description") || descriptionInput;
    if (desc) {
      const base = prefill.task || "";
      const urlLine = prefill.url ? `\n${prefill.url}` : "";
      const newComposite = `${base}${urlLine}`.trim();
      // Use a dataset flag to track whether user has manually edited.
      if (!desc.dataset.userEdited) {
        // Update if empty OR previously autoFilled with different value.
        if (
          !desc.value.trim() ||
          desc.dataset.autoFilled === "true" ||
          desc.value !== newComposite
        ) {
          desc.value = newComposite;
          desc.dataset.autoFilled = "true";
        }
      }
    }
    // Leave the prefill in storage so user can reopen popup repeatedly; could clear if older than 10 min
    if (Date.now() - (prefill.timestamp || 0) > 10 * 60 * 1000) {
      chrome.storage.local.remove(["harvestPrefill"]);
    }
    // Reflect any new description text in status bar when idle
    if (!timerManager.currentTimer) {
      updateStatusBar();
    }
  } catch (e) {
    console.warn("applyHarvestPrefill failed", e);
  }
}

// Fallback: request context if description still empty after prefill attempt
function ensureDescriptionPrefill() {
  try {
    if (timerManager.currentTimer) return; // don't overwrite while running
    const desc = document.getElementById("description");
    if (!desc) return;
    if (
      !desc.value ||
      !desc.value.trim() ||
      desc.dataset.autoFilled === "true"
    ) {
      requestContextRefreshIfIdle();
      setTimeout(async () => {
        if (
          !desc.value ||
          !desc.value.trim() ||
          desc.dataset.autoFilled === "true"
        ) {
          // Fallback: try to pull active tab title via tabs API
          try {
            if (chrome.tabs && chrome.tabs.query) {
              const tabs = await new Promise((resolve) =>
                chrome.tabs.query(
                  { active: true, currentWindow: true },
                  resolve
                )
              );
              if (tabs && tabs[0]) {
                const t = tabs[0];
                const title = (t.title || "Untitled").trim();
                const url = t.url || "";
                desc.value = url ? `${title}\n${url}` : title;
                updateStatusBar();
              }
            }
          } catch (e) {
            console.warn("Active tab fallback failed", e);
          }
        }
      }, 400);
    }
  } catch (e) {
    console.warn("ensureDescriptionPrefill failed", e);
  }
}

// Force grab of active tab (title + URL) regardless of current description content.
// Will not overwrite if user explicitly edited (dataset.userEdited) or a timer is running.
function forceActiveTabPrefill() {
  try {
    const desc = document.getElementById("description");
    if (!desc) return;
    // Never overwrite explicit manual edits
    if (desc.dataset.userEdited === "true") return;
    if (chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        try {
          if (!tabs || !tabs[0]) return;
          const t = tabs[0];
          const title = (t.title || "Untitled").trim();
          const url = t.url || "";
          const composite = url ? `${title}\n${url}` : title;
          // Only update if title fragment changed (ignore if existing starts with same title)
          const current = desc.value || "";
          if (current.split("\n")[0] !== title) {
            desc.value = composite;
            desc.dataset.autoFilled = "true";
            updateStatusBar();
          }
        } catch (e) {
          console.warn("forceActiveTabPrefill inner failed", e);
        }
      });
    }
  } catch (e) {
    console.warn("forceActiveTabPrefill failed", e);
  }
}

// Expose for testing (non-destructive in production)
try {
  if (typeof window !== "undefined") {
    window.forceActiveTabPrefill = forceActiveTabPrefill;
  }
} catch (_) {}

// Listen for on-demand page context to enrich description if needed
chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.action === "harvestPageContext" && msg.data) {
    const desc = document.getElementById("description") || descriptionInput;
    if (!desc) return;
    const base = msg.data.title || msg.data.composed || "";
    const urlLine = msg.data.url ? `\n${msg.data.url}` : "";
    const composite = `${base}${urlLine}`.trim();
    if (!desc.dataset.userEdited) {
      if (
        !desc.value.trim() ||
        desc.dataset.autoFilled === "true" ||
        desc.value !== composite
      ) {
        desc.value = composite;
        desc.dataset.autoFilled = "true";
      }
    }
    // If no timer running, reflect in status bar
    if (!timerManager.currentTimer) {
      updateStatusBar();
    }
  }
});

// Mark when user manually edits description so auto updates stop.
document.addEventListener("input", (e) => {
  const desc = document.getElementById("description");
  if (!desc) return;
  if (e.target === desc) {
    if (desc.value.trim()) {
      desc.dataset.userEdited = "true";
      desc.dataset.autoFilled = "false";
    } else if (!desc.value.trim()) {
      delete desc.dataset.userEdited; // allow auto-fill again if cleared
    }
  }
});

async function handlePendingTimerStop() {
  try {
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(["pendingTimerStop"], resolve);
    });
    if (result.pendingTimerStop) {
      const pending = result.pendingTimerStop;
      if (Date.now() - pending.timestamp < 30000) {
        if (timerManager.currentTimer) {
          try {
            await timerManager.stopCurrentTimer();
            updateTimerUI();
            await loadRecentEntries();
            showError("✓ Timer stopped");
            setTimeout(hideError, 1500);
          } catch (e) {
            console.warn("Pending stop failed", e);
          }
        }
      }
      chrome.storage.local.remove(["pendingTimerStop"]);
    }
  } catch (e) {
    console.error("handlePendingTimerStop failed", e);
  }
}

function displayUserInfo() {
  const userInfoElement = document.getElementById("userInfo");
  const userNameElement = document.getElementById("userName");
  const accountNameElement = document.getElementById("accountName");

  if (timerManager.api.userName && timerManager.api.accountName) {
    userNameElement.textContent = timerManager.api.userName;
    accountNameElement.textContent = timerManager.api.accountName;
    userInfoElement.style.display = "block";
  } else {
    userInfoElement.style.display = "none";
  }
}

async function openHarvestWebApp() {
  console.log("openHarvestWebApp called");

  // Get account ID from storage
  let accountId;
  try {
    const storage = await chrome.storage.local.get(["harvestAccountId"]);
    accountId = storage.harvestAccountId;
  } catch (error) {
    console.error("Failed to get account ID from storage:", error);
  }

  // Fallback to timerManager if available
  if (
    !accountId &&
    timerManager &&
    timerManager.api &&
    timerManager.api.subdomain
  ) {
    accountId = timerManager.api.subdomain;
  }

  if (!accountId) {
    console.error("No account ID available");
    alert("Please log in first to access your Harvest account.");
    return;
  }

  // Create URL to Harvest web app
  const harvestURL = `https://${accountId}.harvestapp.com/time`;

  console.log("Attempting to open Harvest web app:", harvestURL);
  console.log("Chrome tabs API available:", !!chrome.tabs);
  console.log(
    "Chrome tabs create available:",
    !!(chrome.tabs && chrome.tabs.create)
  );

  // Method 1: Use chrome.tabs API (preferred for extensions)
  if (chrome.tabs && chrome.tabs.create) {
    console.log("Using chrome.tabs.create");
    chrome.tabs.create(
      {
        url: harvestURL,
        active: true,
      },
      (tab) => {
        if (chrome.runtime.lastError) {
          console.error("chrome.tabs.create failed:", chrome.runtime.lastError);
          fallbackOpenMethod(harvestURL);
        } else {
          console.log("Successfully opened tab:", tab.id);
        }
      }
    );
    return;
  }

  // Fallback methods
  fallbackOpenMethod(harvestURL);
}

function fallbackOpenMethod(harvestURL) {
  console.log("Using fallback methods to open URL");

  // Method 2: window.open
  try {
    console.log("Trying window.open");
    const win = window.open(harvestURL, "_blank", "noopener,noreferrer");
    if (win) {
      console.log("window.open succeeded");
      return;
    }
    console.log("window.open returned null");
  } catch (e) {
    console.error("window.open failed:", e);
  }

  // Method 3: link click fallback
  try {
    const a = document.createElement("a");
    a.href = harvestURL;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log("Link click fallback attempted");
    return;
  } catch (e) {
    console.error("Link click fallback failed:", e);
  }

  // Method 4: background script
  try {
    chrome.runtime.sendMessage({ action: "openTab", url: harvestURL });
  } catch (e) {
    console.error("Background open failed:", e);
  }
}

function showError(message) {
  const errorElement = document.getElementById("errorMessage");
  if (!errorElement) return;
  errorElement.textContent = message;
  errorElement.style.display = "block";
  if (showError._timeout) clearTimeout(showError._timeout);
  showError._timeout = setTimeout(() => {
    errorElement.style.display = "none";
  }, 5000);
}

// Explicit hide helper (some callers already schedule hide via setTimeout)
function hideError() {
  const errorElement = document.getElementById("errorMessage");
  if (!errorElement) return;
  if (showError._timeout) {
    clearTimeout(showError._timeout);
    showError._timeout = null;
  }
  errorElement.style.display = "none";
}

// (GitHub issue enrichment removed – legacy function deleted)

// Final safeguard: ensure listeners bound if DOM already loaded
try {
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    if (typeof initializePopup === "function") initializePopup();
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      if (typeof initializePopup === "function") initializePopup();
    });
  }
} catch (e) {
  console.error("Popup auto-init guard failed", e);
}
