import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.js"],
    coverage: {
      reporter: ["text", "lcov"],
      include: ["**/*.js"],
      exclude: [
        "**/icons/**",
        "scripts/**",
        "harvest-safari-extension.zip",
        "popup.html",
        "content.js",
        "background.js",
      ],
    },
  },
});
