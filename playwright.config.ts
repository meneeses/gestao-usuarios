import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5200",
    viewport: { width: 1440, height: 960 },
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command:
        "PORT=3200 CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5200 npm run dev -w backend",
      url: "http://127.0.0.1:3200/api/health",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "API_PROXY_TARGET=http://127.0.0.1:3200 npm run dev -w frontend -- --port 5200",
      url: "http://127.0.0.1:5200",
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
