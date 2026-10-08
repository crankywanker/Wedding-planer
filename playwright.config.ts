import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  use: { baseURL: "http://localhost:3200" },
  webServer: {
    command: "npm run build && npx next start -p 3200",
    url: "http://localhost:3200/api/status",
    timeout: 180_000,
    reuseExistingServer: false,
    // Demo mode: no API key, so the flow is deterministic.
    env: { DEMO_MODE: "true" },
  },
});
