// Use CommonJS to avoid ESM-in-CJS loader warning when native config loader is used
const { defineConfig } = require("vitest/config");
const path = require("path");

module.exports = defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },

  test: {
    environment: "node",
  },
});