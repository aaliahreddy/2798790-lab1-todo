import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const testDatabasePath = path.join(
  process.cwd(),
  ".tmp",
  "playwright-todo.db",
);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",

  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  webServer: {
    command:
      "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120_000,

    env: {
      ...process.env,
      DATABASE_PATH: testDatabasePath,
    },
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});