# Testing with Playwright

**User:** Anonymous  
**Created:** 8/3/2026 12:47:15  
**Updated:** 8/3/2026 12:47:16  
**Exported:** 8/3/2026 12:47:27  
**Link:** [https://chatgpt.com/share/6a7071b3-b880-83ea-9fbd-e602dbd42ced](https://chatgpt.com/share/6a7071b3-b880-83ea-9fbd-e602dbd42ced)  

## Prompt:
03/08/2026, 12:10:18

I am required to test my application. I need 3+ tests that exercise real behaviour. So tests that include adding tasks, archiving tasks, overdue tasks, and UI tests. They must be deterministic and run against a throwaway database and pass from the single documented command. So these tests must be runnable by a single documented command. Please help me do this

## Response:
03/08/2026, 12:10:20

I’ll set this up as a small end-to-end test suite: one command, an isolated SQLite database, and tests for adding, archiving, overdue behaviour, and visible UI state.

The strongest fit here is Playwright end-to-end testing rather than render-only unit tests. It will click through your actual UI, call your real API routes, and persist into a temporary SQLite file that is deleted for every test run.

> **Implementing Todo App Enhancements and Testing**
>
>
> **Planning the test approach**
>
> I’m missing the actual uploaded app files, so I can’t honestly tailor selectors or database hooks yet. I’m checking the request’s testing goals and would next inspect the project structure before writing runnable Playwright tests.
>
> **Planned the test approach**
>
> 
>
> **Implemented and tested task manager enhancements after inspecting APIs and database schemas**
>
> 
>
> **Searching the web**
>
>
> **Searched 2 websites**
>
> 
>
> **Inspecting UI Labels and DOM Selectors**
>
>
> **Building the test suite**
>
> I’m shaping a deterministic end-to-end setup around the current UI: isolated test data, sequential execution, real browser interactions, and explicit assertions. I’ll keep the implementation focused on the requested path rather than inventing unrelated coverage.
>
> **Built the test suite**
>
> 
>
> **Inspected task manager UI, codebase, setup, and board selectors**
>
> 
>
> Worked for 2m 3s

A Playwright end-to-end suite is the best match for this requirement. It tests your actual page, API routes, and SQLite persistence through the browser rather than only testing isolated functions. Playwright can start the Next.js server automatically through its `webServer` configuration, while your app can receive a separate database path through an environment variable. ([Playwright](https://playwright.dev/docs/test-webserver?utm_source=chatgpt.com))

Your brief specifically awards full testing marks when at least three tests exercise real behaviour, run from one documented command, and do not depend on your development database. `lab_one.pdf`

## 1. Check this problem in `page.tsx`

In the latest version you uploaded, these functions appear to be declared **inside** the data-loading `useEffect`:

```tsx
getListHeading
getStatusLabel
getStatusClass
renderFilteredTaskList
```

However, `renderFilteredTaskList()` is later called outside that effect. Those functions must be moved outside the `useEffect`, but can remain inside `HomePage`. Otherwise the application will not compile and no test suite can start. `Pasted text.txt`

Your loading effect should end approximately like this:

```tsx
useEffect(() => {
  let ignoreResponse = false;

  async function loadTasks() {
    try {
      setTaskError("");

      const response = await fetch("/api/tasks", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to load tasks");
      }

      if (!ignoreResponse) {
        setTasks(result as Task[]);
      }
    } catch (error) {
      if (!ignoreResponse) {
        setTaskError(
          error instanceof Error
            ? error.message
            : "Failed to load tasks",
        );
      }
    }
  }

  void loadTasks();

  return () => {
    ignoreResponse = true;
  };
}, []);
```

Place `getListHeading`, `getStatusLabel`, `getStatusClass`, and `renderFilteredTaskList` after the effect.

---

# 2. Install Playwright

From the root of your project, run:

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

Playwright’s official setup uses `@playwright/test`, and installing Chromium gives the tests a consistent browser to run against. ([Playwright](https://playwright.dev/docs/intro?utm_source=chatgpt.com))

Create this folder structure:

```text
todo/
├── tests/
│   └── e2e/
│       └── tasks.spec.ts
├── scripts/
│   └── reset-test-db.mjs
├── playwright.config.ts
├── package.json
└── ...
```

---

# 3. Make your database path configurable

Your application must use the normal database during development and a different database during tests.

Open your `lib/database.ts` or whichever file contains:

```ts
new Database(...)
```

Add these imports:

```ts
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
```

Then use this database-path logic:

```ts
const defaultDatabasePath = path.join(
  process.cwd(),
  "data",
  "tasks.db",
);

const databasePath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : defaultDatabasePath;

fs.mkdirSync(path.dirname(databasePath), {
  recursive: true,
});

const database = new Database(databasePath);
```

Keep your existing schema initialisation after this. For example, if your code currently reads and executes `schema.sql`, leave that logic in place.

The important part is:

```ts
process.env.DATABASE_PATH
```

Next.js supports server-side environment variables through `process.env`, and values supplied directly to the process take precedence over `.env` files. ([Next.js](https://nextjs.org/docs/pages/guides/environment-variables?utm_source=chatgpt.com))

Do **not** prefix this variable with `NEXT_PUBLIC_`. The database path must only be available to server code.

---

# 4. Create the test-database reset script

Create:

```text
scripts/reset-test-db.mjs
```

Add:

```js
import fs from "node:fs";
import path from "node:path";

const testDatabasePath = path.join(
  process.cwd(),
  ".tmp",
  "playwright-todo.db",
);

fs.mkdirSync(path.dirname(testDatabasePath), {
  recursive: true,
});

// SQLite may create these extra files when WAL mode is enabled.
const databaseFiles = [
  testDatabasePath,
  `${testDatabasePath}-wal`,
  `${testDatabasePath}-shm`,
];

for (const filePath of databaseFiles) {
  fs.rmSync(filePath, {
    force: true,
  });
}

console.log("Test database reset.");
```

Every time `npm test` runs, this removes the previous test database. Your development database is never touched.

---

# 5. Create `playwright.config.ts`

Create this file in the root of the project:

```ts
import path from "node:path";
import {
  defineConfig,
  devices,
} from "@playwright/test";

const testDatabasePath = path.join(
  process.cwd(),
  ".tmp",
  "playwright-todo.db",
);

export default defineConfig({
  testDir: "./tests/e2e",

  // SQLite tests share one application server and one temporary database.
  fullyParallel: false,
  workers: 1,

  // Retries could create duplicate fixed test data.
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

    // Never accidentally test a manually running server that uses
    // the normal development database.
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
```

The `webServer` configuration starts your Next.js application before the tests, waits until it responds, and shuts it down afterward. The `baseURL` lets tests navigate to `/` without hardcoding the complete address. ([Playwright](https://playwright.dev/docs/test-webserver?utm_source=chatgpt.com))

---

# 6. Add four real behaviour tests

Create:

```text
tests/e2e/tasks.spec.ts
```

Add:

```ts
import {
  expect,
  type Page,
  test,
} from "@playwright/test";

type TaskInput = {
  title: string;
  description: string;
  topic: string;
  dueDate: string;
  status?: "Todo" | "In-Progress" | "Complete";
};

function taskFilters(page: Page) {
  return page.getByRole("navigation", {
    name: "Task filters",
  });
}

async function openAddTaskDialog(page: Page) {
  await taskFilters(page)
    .getByRole("button", {
      name: "Add Task",
    })
    .click();

  const dialog = page.getByRole("dialog", {
    name: "Add New Task",
  });

  await expect(dialog).toBeVisible();

  return dialog;
}

async function addTask(
  page: Page,
  task: TaskInput,
) {
  const dialog = await openAddTaskDialog(page);

  await dialog.getByLabel("Title").fill(task.title);

  await dialog
    .getByLabel("Description")
    .fill(task.description);

  await dialog.getByLabel("Topic").fill(task.topic);

  await dialog
    .getByLabel("Due Date")
    .fill(task.dueDate);

  await dialog
    .getByLabel("Status")
    .selectOption(task.status ?? "Todo");

  await dialog
    .getByRole("button", {
      name: "Add Task",
    })
    .click();

  await expect(dialog).toBeHidden();

  await expect(
    page.getByRole("heading", {
      name: task.title,
      exact: true,
    }),
  ).toBeVisible();
}

function taskCard(page: Page, title: string) {
  return page.locator("li").filter({
    has: page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "My Todo",
    }),
  ).toBeVisible();
});

test("adds a task and keeps it after a reload", async ({
  page,
}) => {
  const task = {
    title: "E2E persistent task",
    description:
      "Created through the real task form",
    topic: "Testing",
    dueDate: "2099-06-15",
    status: "In-Progress" as const,
  };

  await addTask(page, task);

  const card = taskCard(page, task.title);

  await expect(
    card.getByText(task.description, {
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    card.getByText("Testing", {
      exact: true,
    }),
  ).toBeVisible();

  // Reloading proves that the result came back from SQLite,
  // rather than only remaining in React state.
  await page.reload();

  await expect(
    page.getByRole("heading", {
      name: task.title,
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByText(task.description, {
      exact: true,
    }),
  ).toBeVisible();
});

test("archives a task and keeps it available in Archive", async ({
  page,
}) => {
  const title = "E2E task to archive";

  await addTask(page, {
    title,
    description: "This task will be archived",
    topic: "Administration",
    dueDate: "2099-07-01",
  });

  await page
    .getByRole("button", {
      name: `Open actions for ${title}`,
    })
    .click();

  const actions = page.getByLabel(
    `Actions for ${title}`,
  );

  await expect(actions).toBeVisible();

  await actions
    .getByRole("button", {
      name: "Archive",
      exact: true,
    })
    .click();

  // It must leave the normal active board.
  await expect(
    page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  ).toHaveCount(0);

  await taskFilters(page)
    .getByRole("button", {
      name: "Archive",
      exact: true,
    })
    .click();

  // It must still be viewable in the archive.
  await expect(
    page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  ).toBeVisible();

  // Prove that the archived state was saved to SQLite.
  await page.reload();

  await expect(
    page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", {
      name: `Restore ${title}`,
    }),
  ).toBeVisible();
});

test("visibly identifies an overdue task without using Overdue as a status", async ({
  page,
}) => {
  const title = "E2E overdue task";

  // This fixed date is safely in the past, making the test
  // deterministic regardless of when it is run.
  await addTask(page, {
    title,
    description:
      "A deliberately overdue task",
    topic: "Testing",
    dueDate: "2000-01-01",
    status: "Todo",
  });

  const card = taskCard(page, title);

  await expect(
    card.getByText(/Overdue/),
  ).toBeVisible();

  const dialog = await openAddTaskDialog(page);

  // Overdue is derived from the date and must not be a fourth status.
  await expect(
    dialog
      .getByLabel("Status")
      .locator("option"),
  ).toHaveText([
    "To Do",
    "In Progress",
    "Completed",
  ]);
});

test("filters tasks and sorts the UI by topic", async ({
  page,
}) => {
  const alphaTitle = "E2E Alpha topic task";
  const zuluTitle = "E2E Zulu topic task";

  await addTask(page, {
    title: zuluTitle,
    description: "Task with the later topic",
    topic: "Zulu",
    dueDate: "2099-08-01",
  });

  await addTask(page, {
    title: alphaTitle,
    description: "Task with the earlier topic",
    topic: "Alpha",
    dueDate: "2099-08-02",
  });

  await taskFilters(page)
    .getByRole("button", {
      name: "Active",
      exact: true,
    })
    .click();

  await page
    .getByLabel("Sort by")
    .selectOption("topicAscending");

  const activeList = page.locator(
    '[aria-label="Active Tasks list"]',
  );

  await expect(activeList).toBeVisible();

  const visibleTitles = await activeList
    .locator("h3")
    .allTextContents();

  const alphaPosition =
    visibleTitles.indexOf(alphaTitle);

  const zuluPosition =
    visibleTitles.indexOf(zuluTitle);

  expect(alphaPosition).toBeGreaterThanOrEqual(0);
  expect(zuluPosition).toBeGreaterThanOrEqual(0);
  expect(alphaPosition).toBeLessThan(zuluPosition);

  const alphaCard = taskCard(page, alphaTitle);

  // These assertions test the topic and status information
  // displayed in the list UI.
  await expect(
    alphaCard.getByText("Alpha", {
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    alphaCard.getByText("To Do", {
      exact: true,
    }),
  ).toBeVisible();
});
```

These tests cover:

1. Adding a task with all four required fields.
2. SQLite persistence after reloading.
3. Archiving and viewing an archived task.
4. Archived-state persistence.
5. Overdue visual behaviour.
6. Confirmation that overdue is not a status.
7. Filtering and topic sorting.
8. Topic and status information in the list UI.

They interact with your actual accessible labels and buttons, including the task form, action menu, archive filter, overdue label, and sorting control visible in your current component. `Pasted text.txt`

---

# 7. Update `package.json`

Inside `"scripts"`, add:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "node scripts/reset-test-db.mjs && playwright test",
    "test:ui": "node scripts/reset-test-db.mjs && playwright test --ui"
  }
}
```

Do not remove any other scripts you already have.

Your required single command is now:

```bash
npm test
```

`npm test` performs all of these steps automatically:

```text
Delete the old temporary database
        ↓
Start Next.js on port 3100
        ↓
Pass the temporary database path to the server
        ↓
Open Chromium
        ↓
Run all four tests
        ↓
Stop the Next.js server
```

---

# 8. Update `.gitignore`

Add:

```gitignore
# Playwright output
playwright-report/
test-results/

# Throwaway test database
.tmp/
```

Do not commit the generated test database or browser reports.

---

# 9. Add this to your README

Under your **Running It** section:

```md
### Running the tests

The tests use Playwright to exercise the application through a real
Chromium browser. The test command starts the Next.js server automatically
and uses a temporary SQLite database stored under `.tmp/`. It does not read
from or modify the normal development database.

Install the Playwright browser once after installing the npm packages:

```bash
npx playwright install chromium
```

Run the complete test suite with one command:

```bash
npm test
```

The command resets the temporary database and then runs all end-to-end tests.
```

Under **Third-Party Code**, add:

```md
- `@playwright/test` - used for deterministic browser-based end-to-end tests
  of task creation, persistence, archiving, overdue indicators, filtering and
  sorting.
```

---

# 10. Run it

Run:

```bash
npm test
```

A successful result should resemble:

```text
Test database reset.

Running 4 tests using 1 worker

✓ adds a task and keeps it after a reload
✓ archives a task and keeps it available in Archive
✓ visibly identifies an overdue task without using Overdue as a status
✓ filters tasks and sorts the UI by topic

4 passed
```

This approach meets the requirement because the tests exercise real browser and database behaviour, use a fresh isolated SQLite file, avoid dates that change unpredictably, and run from the single documented `npm test` command.

---

**Sources:**

- [Web server | Playwright](https://playwright.dev/docs/test-webserver?utm_source=chatgpt.com)
- [Guides: Environment Variables | Next.js](https://nextjs.org/docs/pages/guides/environment-variables?utm_source=chatgpt.com)

## Prompt:
03/08/2026, 12:23:39

this is my current database.ts
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export function createDatabase(databasePath: string) {
  
  const databaseDirectory = path.dirname(databasePath);

  fs.mkdirSync(databaseDirectory, {
    recursive: true,
  });

  const database = new Database(databasePath);

  database.pragma("foreign_keys = ON");
  database.pragma("journal_mode = WAL");

  const schemaPath = path.join(process.cwd(), "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");

  database.exec(schema);

  return database;
}

const databasePath =
  process.env.DATABASE_PATH ??
  path.join(process.cwd(), "data", "todo.db");

/*
 * Next.js reloads modules during development. Keeping the connection on
 * globalThis prevents unnecessary new database connections after reloads.
 */
const globalForDatabase = globalThis as typeof globalThis & {
  todoDatabase?: ReturnType<typeof createDatabase>;
};

const database =
  globalForDatabase.todoDatabase ?? createDatabase(databasePath);

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.todoDatabase = database;
}

export default database;

## Response:
03/08/2026, 12:23:50

> **Reviewing database setup**
>
> I’m checking whether `DATABASE_PATH` works for Playwright. It does: the path is read when the module loads, and each test run can point the server at a separate SQLite file. I’d only resolve the path and avoid stale global caching when switching databases in one process.
>
> **Reviewed database setup**
>
> 
>
> Worked for 10s

Your current `database.ts` already supports a throwaway test database correctly because it checks `process.env.DATABASE_PATH` first:

```ts
const databasePath =
  process.env.DATABASE_PATH ??
  path.join(process.cwd(), "data", "todo.db");
```

Therefore:

- Normal development uses `data/todo.db`.
- Playwright can set `DATABASE_PATH` to `.tmp/playwright-todo.db`.
- Your test run will not affect your normal database.
- `createDatabase()` automatically creates the directory and applies `schema.sql`.

You do **not** need to replace this file.

I would only make one small improvement by resolving the supplied path to an absolute path:

```ts
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export function createDatabase(databasePath: string) {
  const resolvedDatabasePath = path.resolve(databasePath);
  const databaseDirectory = path.dirname(resolvedDatabasePath);

  fs.mkdirSync(databaseDirectory, {
    recursive: true,
  });

  const database = new Database(resolvedDatabasePath);

  database.pragma("foreign_keys = ON");
  database.pragma("journal_mode = WAL");

  const schemaPath = path.join(process.cwd(), "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");

  database.exec(schema);

  return database;
}

const databasePath =
  process.env.DATABASE_PATH ??
  path.join(process.cwd(), "data", "todo.db");

/*
 * Next.js reloads modules during development. Keeping the connection on
 * globalThis prevents unnecessary new database connections after reloads.
 */
const globalForDatabase = globalThis as typeof globalThis & {
  todoDatabase?: ReturnType<typeof createDatabase>;
};

const database =
  globalForDatabase.todoDatabase ?? createDatabase(databasePath);

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.todoDatabase = database;
}

export default database;
```

The original version will still work, so this change is optional.

## Playwright configuration

Your `playwright.config.ts` should pass the temporary path into your existing database code:

```ts
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
```

When Playwright starts Next.js, your current logic effectively becomes:

```ts
const databasePath = "/your-project/.tmp/playwright-todo.db";
```

instead of:

```ts
const databasePath = "/your-project/data/todo.db";
```

## Reset script

Because you are using WAL mode, delete all three possible SQLite files:

```js
// scripts/reset-test-db.mjs

import fs from "node:fs";
import path from "node:path";

const testDatabasePath = path.join(
  process.cwd(),
  ".tmp",
  "playwright-todo.db",
);

fs.mkdirSync(path.dirname(testDatabasePath), {
  recursive: true,
});

const databaseFiles = [
  testDatabasePath,
  `${testDatabasePath}-wal`,
  `${testDatabasePath}-shm`,
];

for (const filePath of databaseFiles) {
  fs.rmSync(filePath, {
    force: true,
  });
}

console.log("Test database reset.");
```

Then add this command to `package.json`:

```json
{
  "scripts": {
    "test": "node scripts/reset-test-db.mjs && playwright test"
  }
}
```

Your single documented test command will therefore be:

```bash
npm test
```

One important detail: keep `reuseExistingServer: false`. Otherwise Playwright could connect to a Next.js server you already started manually, and that server might be connected to your normal `data/todo.db` database.

## Prompt:
03/08/2026, 12:28:33

I only passed 2 test cases
aaliahreddy@Aaliahs-MacBook-Air-5 todo % npm test

> todo@0.1.0 test
> node scripts/reset-test-db.mjs && playwright test

Test database reset.
[WebServer] ⚠ Warning: Next.js inferred your workspace root, but it may not be correct.
[WebServer]  We detected multiple lockfiles and selected the directory of /Users/aaliahreddy/package-lock.json as the root directory.
[WebServer]  To silence this warning, set `turbopack.root` in your Next.js config, or consider removing one of the lockfiles if it's not needed.
[WebServer]    See https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory for more information.
[WebServer]  Detected additional lockfiles: 
[WebServer]    * /Users/aaliahreddy/Documents/Aaliah 3rd Year/Semester 2/SDP/todo/package-lock.json
[WebServer] 

Running 4 tests using 1 worker

  ✓  1 [chromium] › tests/e2e/tasks.spec.ts:94:5 › adds a task and keeps it after a reload (1.2s)
  ✘  2 … tests/e2e/tasks.spec.ts:140:5 › archives a task and keeps it available in Archive (724ms)
  ✓  3 …ec.ts:211:5 › visibly identifies an overdue task without using Overdue as a status (719ms)
  ✘  4 …hromium] › tests/e2e/tasks.spec.ts:247:5 › filters tasks and sorts the UI by topic (414ms)

1) [chromium] › tests/e2e/tasks.spec.ts:140:5 › archives a task and keeps it available in Archive 

    Error: expect(locator).toBeVisible() failed

    Locator: getByLabel('Actions for E2E task to archive')
    Expected: visible
    Error: strict mode violation: getByLabel('Actions for E2E task to archive') resolved to 2 elements:
        1) <button type="button" aria-expanded="true" class="page-module__6l4uHW__iconButton" aria-label="Open actions for E2E task to archive">…</button> aka getByRole('button', { name: 'Open actions for E2E task to' })
        2) <section class="page-module__6l4uHW__actionPopup" aria-label="Actions for E2E task to archive">…</section> aka getByRole('region', { name: 'Actions for E2E task to' })

    Call log:
      - Expect "toBeVisible" with timeout 5000ms
      - waiting for getByLabel('Actions for E2E task to archive')

160 |   );
      161 |
    > 162 |   await expect(actions).toBeVisible();
          |                         ^
      163 |
      164 |   await actions
      165 |     .getByRole("button", {
        at /Users/aaliahreddy/Documents/Aaliah 3rd Year/Semester 2/SDP/todo/tests/e2e/tasks.spec.ts:162:25

    attachment #1: screenshot (image/png) ────────────────────────────────────────────────────────
    test-results/tasks-archives-a-task-and-keeps-it-available-in-Archive-chromium/test-failed-1.png
    ──────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/tasks-archives-a-task-and-keeps-it-available-in-Archive-chromium/error-context.md

    attachment #3: trace (application/zip) ───────────────────────────────────────────────────────
    test-results/tasks-archives-a-task-and-keeps-it-available-in-Archive-chromium/trace.zip
    Usage:

        npx playwright show-trace test-results/tasks-archives-a-task-and-keeps-it-available-in-Archive-chromium/trace.zip

    ──────────────────────────────────────────────────────────────────────────────────────────────

  2) [chromium] › tests/e2e/tasks.spec.ts:247:5 › filters tasks and sorts the UI by topic ────────

    Error: locator.fill: Error: strict mode violation: getByRole('dialog', { name: 'Add New Task' }).getByLabel('Topic') resolved to 2 elements:
        1) <textarea rows="4" placeholder="e.g. Display all tasks from the database">Task with the later topic</textarea> aka getByRole('textbox', { name: 'Description' })
        2) <input value="" required="" type="text" placeholder="e.g. Database"/> aka getByRole('textbox', { name: 'Topic' })

    Call log:
      - waiting for getByRole('dialog', { name: 'Add New Task' }).getByLabel('Topic')

47 |     .fill(task.description);
      48 |
    > 49 |   await dialog.getByLabel("Topic").fill(task.topic);
         |                                    ^
      50 |
      51 |   await dialog
      52 |     .getByLabel("Due Date")
        at addTask (/Users/aaliahreddy/Documents/Aaliah 3rd Year/Semester 2/SDP/todo/tests/e2e/tasks.spec.ts:49:36)
        at /Users/aaliahreddy/Documents/Aaliah 3rd Year/Semester 2/SDP/todo/tests/e2e/tasks.spec.ts:253:3

    attachment #1: screenshot (image/png) ────────────────────────────────────────────────────────
    test-results/tasks-filters-tasks-and-sorts-the-UI-by-topic-chromium/test-failed-1.png
    ──────────────────────────────────────────────────────────────────────────────────────────────

    Error Context: test-results/tasks-filters-tasks-and-sorts-the-UI-by-topic-chromium/error-context.md

    attachment #3: trace (application/zip) ───────────────────────────────────────────────────────
    test-results/tasks-filters-tasks-and-sorts-the-UI-by-topic-chromium/trace.zip
    Usage:

        npx playwright show-trace test-results/tasks-filters-tasks-and-sorts-the-UI-by-topic-chromium/trace.zip

    ──────────────────────────────────────────────────────────────────────────────────────────────

  2 failed
    [chromium] › tests/e2e/tasks.spec.ts:140:5 › archives a task and keeps it available in Archive 
    [chromium] › tests/e2e/tasks.spec.ts:247:5 › filters tasks and sorts the UI by topic ─────────
  2 passed (7.2s)

## Response:
03/08/2026, 12:28:36

Both failures are locator ambiguity, not broken application behaviour. I’ll tighten the selectors so each locator matches exactly one element.

> **Searching the web**
>
>
> **Clarifying locator matches**
>
> I’m identifying two likely causes: partial accessible-name matching for the action region, and malformed or overlapping label associations for the topic field. I’d use exact role-based locators, especially `region` and `textbox`, to avoid ambiguous matches.
>
> **Clarified locator matches**
>
> 
>
> **Applying exact locators**
>
> I’m treating the warning as unrelated. The failures come from strict matching: several locators resolve to multiple elements. I’d scope actions to exact regions, target form fields by exact accessible roles, and reselect the archive button after reloading.
>
> **Applied exact locators**
>
> 
>
> **Searched 1 website**
>
> 
>
> Worked for 35s

Your application behaviour is working. Both failures come from Playwright locators matching **two elements**, and Playwright requires action locators to resolve to exactly one element. Using a specific ARIA role and `exact: true` fixes this. ([Playwright](https://playwright.dev/docs/locators?utm_source=chatgpt.com))

## 1. Fix the `Topic` field locator

In your `addTask()` helper, replace the current field-filling code with this:

```ts
async function addTask(
  page: Page,
  task: TaskInput,
) {
  const dialog = await openAddTaskDialog(page);

  await dialog
    .getByRole("textbox", {
      name: "Title",
      exact: true,
    })
    .fill(task.title);

  await dialog
    .getByRole("textbox", {
      name: "Description",
      exact: true,
    })
    .fill(task.description);

  await dialog
    .getByRole("textbox", {
      name: "Topic",
      exact: true,
    })
    .fill(task.topic);

  await dialog
    .getByLabel("Due Date", {
      exact: true,
    })
    .fill(task.dueDate);

  await dialog
    .getByRole("combobox", {
      name: "Status",
      exact: true,
    })
    .selectOption(task.status ?? "Todo");

  await dialog
    .getByRole("button", {
      name: "Add Task",
      exact: true,
    })
    .click();

  await expect(dialog).toBeHidden();

  await expect(
    page.getByRole("heading", {
      name: task.title,
      exact: true,
    }),
  ).toBeVisible();
}
```

The important change is:

```ts
getByRole("textbox", {
  name: "Topic",
  exact: true,
})
```

Instead of:

```ts
getByLabel("Topic")
```

Your original locator was unexpectedly matching both the Description textarea and Topic input.

## 2. Fix the archive actions locator

Find this part of the archive test:

```ts
const actions = page.getByLabel(
  `Actions for ${title}`,
);

await expect(actions).toBeVisible();
```

Replace it with:

```ts
const actions = page.getByRole("region", {
  name: `Actions for ${title}`,
  exact: true,
});

await expect(actions).toBeVisible();
```

Your current HTML contains:

```html
<button aria-label="Open actions for E2E task to archive">
```

and:

```html
<section aria-label="Actions for E2E task to archive">
```

Because `getByLabel()` does partial matching by default, it found both. Selecting the `region` role specifically targets the `<section>`.

## 3. Use this corrected archive test

There is also one additional adjustment needed after reloading. Your filter will probably return to its default state, so you should click Archive again after `page.reload()`.

Replace the complete archive test with:

```ts
test("archives a task and keeps it available in Archive", async ({
  page,
}) => {
  const title = "E2E task to archive";

  await addTask(page, {
    title,
    description: "This task will be archived",
    topic: "Administration",
    dueDate: "2099-07-01",
  });

  await page
    .getByRole("button", {
      name: `Open actions for ${title}`,
      exact: true,
    })
    .click();

  const actions = page.getByRole("region", {
    name: `Actions for ${title}`,
    exact: true,
  });

  await expect(actions).toBeVisible();

  await actions
    .getByRole("button", {
      name: "Archive",
      exact: true,
    })
    .click();

  // The task should no longer appear in the normal task view.
  await expect(
    page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  ).toHaveCount(0);

  // Open the archive view.
  await taskFilters(page)
    .getByRole("button", {
      name: "Archive",
      exact: true,
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", {
      name: `Restore ${title}`,
      exact: true,
    }),
  ).toBeVisible();

  // Reload to confirm that the archived state was stored in SQLite.
  await page.reload();

  // Reloading resets the selected filter, so reopen Archive.
  await taskFilters(page)
    .getByRole("button", {
      name: "Archive",
      exact: true,
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", {
      name: `Restore ${title}`,
      exact: true,
    }),
  ).toBeVisible();
});
```

## 4. Optional consistency improvement

In `openAddTaskDialog()`, also make the button locator exact:

```ts
async function openAddTaskDialog(page: Page) {
  await taskFilters(page)
    .getByRole("button", {
      name: "Add Task",
      exact: true,
    })
    .click();

  const dialog = page.getByRole("dialog", {
    name: "Add New Task",
    exact: true,
  });

  await expect(dialog).toBeVisible();

  return dialog;
}
```

## 5. Run the tests again

```bash
npm test
```

The Next.js workspace-root message is only a warning and is unrelated to these two failed tests. After these locator changes, the expected result is:

```text
4 passed
```

---

**Sources:**

- [Locators | Playwright](https://playwright.dev/docs/locators?utm_source=chatgpt.com)

## Prompt:
03/08/2026, 12:33:07

are there any other tests I can add

[Attachment: Pasted text(9).txt]

## Response:
03/08/2026, 12:33:11

Yes. Your current app has several behaviours worth testing beyond the four you already have, especially editing, completion, restoring, sorting, and theme persistence.

> **Planning test coverage**
>
> I’m organizing end-to-end checks for action buttons, archive restoration, dark-mode persistence, and statistics updates. I’m also accounting for shared database state by using isolated names or baseline comparisons rather than assuming each test starts empty.
>
> **Planned test coverage**
>
> 
>
> **Designing test helpers**
>
> I’m grounding the test snippets in the existing UI: statistics use article headings and outputs, while task actions cover editing, completion, archiving, restoration, sorting, and dark-mode persistence. Baseline assertions should keep shared data from causing flaky results.
>
> Worked for 50s

Your current application also supports editing, marking tasks complete, restoring archived tasks, sorting in both directions, and saving the theme in `localStorage`, so these are good additional real-behaviour tests. `Pasted text.txt`

The **best three additional tests** would be:

1. Edit a task and confirm the changes survive a reload.
2. Mark a task complete and confirm the UI/statistics update.
3. Restore an archived task and confirm it returns to the board.

You can also test due-date sorting and dark-mode persistence.

## 1. Edit a task and verify persistence

Add this test to `tasks.spec.ts`:

```ts
test("edits a task and keeps the changes after reload", async ({
  page,
}) => {
  const originalTitle = "E2E task before editing";
  const updatedTitle = "E2E task after editing";

  await addTask(page, {
    title: originalTitle,
    description: "Original description",
    topic: "Original Topic",
    dueDate: "2099-09-01",
    status: "Todo",
  });

  await page
    .getByRole("button", {
      name: `Edit ${originalTitle}`,
      exact: true,
    })
    .click();

  const dialog = page.getByRole("dialog", {
    name: "Edit Task",
    exact: true,
  });

  await expect(dialog).toBeVisible();

  await dialog
    .getByRole("textbox", {
      name: "Title",
      exact: true,
    })
    .fill(updatedTitle);

  await dialog
    .getByRole("textbox", {
      name: "Description",
      exact: true,
    })
    .fill("Updated description");

  await dialog
    .getByRole("textbox", {
      name: "Topic",
      exact: true,
    })
    .fill("Updated Topic");

  await dialog
    .getByLabel("Due Date", {
      exact: true,
    })
    .fill("2099-10-15");

  await dialog
    .getByRole("combobox", {
      name: "Status",
      exact: true,
    })
    .selectOption("In-Progress");

  await dialog
    .getByRole("button", {
      name: "Save Changes",
      exact: true,
    })
    .click();

  await expect(dialog).toBeHidden();

  await expect(
    page.getByRole("heading", {
      name: originalTitle,
      exact: true,
    }),
  ).toHaveCount(0);

  const updatedCard = taskCard(page, updatedTitle);

  await expect(updatedCard).toBeVisible();

  await expect(
    updatedCard.getByText("Updated description", {
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    updatedCard.getByText("Updated Topic", {
      exact: true,
    }),
  ).toBeVisible();

  // Confirm that the edited information was saved to SQLite.
  await page.reload();

  await expect(
    page.getByRole("heading", {
      name: updatedTitle,
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByText("Updated description", {
      exact: true,
    }),
  ).toBeVisible();
});
```

This is a strong test because it exercises:

- Opening the edit form.
- Loading existing task information.
- Updating all task fields.
- Sending a `PATCH` request.
- Updating the page.
- Saving changes to SQLite.

---

## 2. Mark a task complete

```ts
test("marks a task as completed and saves the new status", async ({
  page,
}) => {
  const title = "E2E task to complete";

  await addTask(page, {
    title,
    description: "This task must be completed",
    topic: "Testing",
    dueDate: "2099-11-01",
    status: "Todo",
  });

  await page
    .getByRole("button", {
      name: `Mark ${title} as completed`,
      exact: true,
    })
    .click();

  // The task should now have a button that can mark it active again.
  await expect(
    page.getByRole("button", {
      name: `Mark ${title} as active`,
      exact: true,
    }),
  ).toBeVisible();

  // Confirm that it appears under the Completed filter.
  await taskFilters(page)
    .getByRole("button", {
      name: "Completed",
      exact: true,
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    taskCard(page, title).getByText("Completed", {
      exact: true,
    }),
  ).toBeVisible();

  // Reload and reopen the Completed filter to prove persistence.
  await page.reload();

  await taskFilters(page)
    .getByRole("button", {
      name: "Completed",
      exact: true,
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  ).toBeVisible();
});
```

This tests the checkbox, task filtering, status display, database update, and persistence.

---

## 3. Restore an archived task

```ts
test("restores an archived task to the normal board", async ({
  page,
}) => {
  const title = "E2E task to restore";

  await addTask(page, {
    title,
    description: "This task will be archived and restored",
    topic: "Archive Test",
    dueDate: "2099-12-01",
    status: "Todo",
  });

  await page
    .getByRole("button", {
      name: `Open actions for ${title}`,
      exact: true,
    })
    .click();

  const actions = page.getByRole("region", {
    name: `Actions for ${title}`,
    exact: true,
  });

  await actions
    .getByRole("button", {
      name: "Archive",
      exact: true,
    })
    .click();

  await taskFilters(page)
    .getByRole("button", {
      name: "Archive",
      exact: true,
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  ).toBeVisible();

  await page
    .getByRole("button", {
      name: `Restore ${title}`,
      exact: true,
    })
    .click();

  // It should disappear from the archived list.
  await expect(
    page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  ).toHaveCount(0);

  await taskFilters(page)
    .getByRole("button", {
      name: "All",
      exact: true,
    })
    .click();

  // It should be back on the main board.
  await expect(
    page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  ).toBeVisible();

  // Reload to confirm that archivedAt was saved as null.
  await page.reload();

  await expect(
    page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  ).toBeVisible();
});
```

---

## 4. Sort tasks by due date

You already test topic sorting. This test covers both directions of due-date sorting:

```ts
test("sorts active tasks by due date in both directions", async ({
  page,
}) => {
  const earlierTitle = "E2E earlier task";
  const laterTitle = "E2E later task";

  await addTask(page, {
    title: laterTitle,
    description: "Later task",
    topic: "Dates",
    dueDate: "2099-12-20",
    status: "Todo",
  });

  await addTask(page, {
    title: earlierTitle,
    description: "Earlier task",
    topic: "Dates",
    dueDate: "2099-12-10",
    status: "Todo",
  });

  await taskFilters(page)
    .getByRole("button", {
      name: "Active",
      exact: true,
    })
    .click();

  const activeList = page.locator(
    '[aria-label="Active Tasks list"]',
  );

  const sortControl = page.getByRole("combobox", {
    name: "Sort by",
    exact: true,
  });

  await sortControl.selectOption("dueDateAscending");

  let titles = await activeList.locator("h3").allTextContents();

  expect(titles.indexOf(earlierTitle)).toBeLessThan(
    titles.indexOf(laterTitle),
  );

  await sortControl.selectOption("dueDateDescending");

  titles = await activeList.locator("h3").allTextContents();

  expect(titles.indexOf(laterTitle)).toBeLessThan(
    titles.indexOf(earlierTitle),
  );
});
```

Because other tests may already have created tasks, this test compares the positions of the two specific tasks instead of assuming they are the only tasks present.

---

## 5. Confirm dark mode survives reload

```ts
test("saves the selected theme after reload", async ({
  page,
}) => {
  const darkModeButton = page.getByRole("button", {
    name: "Switch to dark mode",
    exact: true,
  });

  // The browser could initially prefer dark mode, so force a known state.
  if (await darkModeButton.isVisible()) {
    await darkModeButton.click();
  }

  await expect(
    page.getByRole("button", {
      name: "Switch to light mode",
      exact: true,
    }),
  ).toBeVisible();

  await expect
    .poll(async () =>
      page.evaluate(() =>
        window.localStorage.getItem("todo-theme"),
      ),
    )
    .toBe("dark");

  await page.reload();

  await expect(
    page.getByRole("button", {
      name: "Switch to light mode",
      exact: true,
    }),
  ).toBeVisible();

  expect(
    await page.evaluate(() =>
      window.localStorage.getItem("todo-theme"),
    ),
  ).toBe("dark");
});
```

For a completely deterministic version, set the theme before loading the page:

```ts
test("saves the selected theme after reload", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("todo-theme", "light");
  });

  await page.goto("/");

  await page
    .getByRole("button", {
      name: "Switch to dark mode",
      exact: true,
    })
    .click();

  await expect(
    page.getByRole("button", {
      name: "Switch to light mode",
      exact: true,
    }),
  ).toBeVisible();

  await page.reload();

  await expect(
    page.getByRole("button", {
      name: "Switch to light mode",
      exact: true,
    }),
  ).toBeVisible();
});
```

## Other useful smaller tests

You could additionally test:

- Clicking **Cancel** closes the task form without creating a task.
- Clicking the modal background closes the form.
- A completed overdue task no longer displays “Overdue”.
- Archived tasks are excluded from Total Tasks and Overdue Tasks.
- The Active filter displays Todo and In-Progress tasks but excludes completed tasks.
- Changing status through the three-dot action menu moves the task to the correct column.
- Required fields prevent submission when Title, Topic, or Due Date is empty.

For your submission, a suite of **7 or 8 meaningful tests** is more than sufficient. I would add the edit, complete, and restore tests first because they demonstrate the widest range of genuine application and database behaviour.



---
Powered by [ChatGPT Exporter](https://www.chatgptexporter.com)