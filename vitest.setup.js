// Provide minimal browser extension API & DOM shims for tests
import { beforeAll } from "vitest";

beforeAll(() => {
  global.chrome = {
    storage: {
      sync: {
        get: (_keys, cb) => cb({}),
        set: (_d, cb) => cb && cb(),
        clear: (cb) => cb && cb(),
      },
      local: {
        get: (_keys, cb) => cb({}),
        set: (_d, cb) => cb && cb(),
        remove: (_k, cb) => cb && cb(),
      },
    },
    runtime: { sendMessage: () => {}, onMessage: { addListener: () => {} } },
    browserAction: {
      setBadgeText: () => {},
      setBadgeBackgroundColor: () => {},
    },
    tabs: { query: (_q, cb) => cb([]) },
  };
});
