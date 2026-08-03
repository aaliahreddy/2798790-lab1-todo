# SQLite task handling

**User:** Anonymous  
**Created:** 8/3/2026 12:02:38  
**Updated:** 8/3/2026 12:02:40  
**Exported:** 8/3/2026 12:46:33  
**Link:** [https://chatgpt.com/share/6a70673e-e9b8-83ea-ba2a-7137030f81f3](https://chatgpt.com/share/6a70673e-e9b8-83ea-ba2a-7137030f81f3)  

## Prompt:
03/08/2026, 10:58:58

[Attachment: Pasted text(4).txt]

[Attachment: image(4).png]

[Attachment: image(5).png]

import db from "@/lib/database";

type TaskRow = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  topic: string;
  status: "Todo" | "In-Progress" | "Complete";
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function GET() {
  try {
    const query = db.prepare(`
      SELECT
        id,
        title,
        description,
        due_date AS dueDate,
        topic,
        status,
        archived_at AS archivedAt,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM tasks
      WHERE archived_at IS NULL
      ORDER BY
        CASE status
          WHEN 'Todo' THEN 1
          WHEN 'In-Progress' THEN 2
          WHEN 'Complete' THEN 3
          ELSE 4
        END,
        topic COLLATE NOCASE ASC,
        due_date ASC,
        title COLLATE NOCASE ASC
    `);

    const tasks = query.all() as TaskRow[];

    return Response.json(tasks);
  } catch (error) {
    console.error("Failed to retrieve tasks:", error);

    return Response.json(
      {
        error: "Failed to retrieve tasks",
      },
      {
        status: 500,
      },
    );
  }
}CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    title TEXT NOT NULL
        CHECK (length(trim(title)) > 0),

    description TEXT NOT NULL DEFAULT '',

    due_date TEXT NOT NULL
        CHECK (
            length(due_date) = 10
            AND due_date GLOB '????-??-??'
            AND date(due_date) IS NOT NULL
        ),

    topic TEXT NOT NULL
        CHECK (length(trim(topic)) > 0),

    status TEXT NOT NULL DEFAULT 'Todo'
        CHECK (
            status IN (
                'Todo',
                'In-Progress',
                'Complete'
            )
        ),

    archived_at TEXT DEFAULT NULL,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS update_tasks_updated_at
AFTER UPDATE OF
    title,
    description,
    due_date,
    topic,
    status,
    archived_at
ON tasks
FOR EACH ROW
BEGIN
    UPDATE tasks
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

CREATE INDEX IF NOT EXISTS idx_tasks_archived
    ON tasks (archived_at);

CREATE INDEX IF NOT EXISTS idx_tasks_status
    ON tasks (status);

CREATE INDEX IF NOT EXISTS idx_tasks_topic
    ON tasks (topic COLLATE NOCASE);

CREATE INDEX IF NOT EXISTS idx_tasks_due_date
    ON tasks (due_date);

CREATE INDEX IF NOT EXISTS idx_tasks_active_sort
    ON tasks (
        archived_at,
        status,
        topic COLLATE NOCASE,
        due_date
    );
Here is my tsx, sql and route.ts files along with my file organisation. I want to now add functionality to my todo app. I want to be able to create tasks and archive tasks and when the page reloads or the application is restarted all the information should persist. I also want to indicate overdue tasks by changing the dates to red and using the word overdue as well as add a tile indicating the number of overdue tasks. An existing task should be able to be edited and survive a page reload. If the application is stopped and restarted, all data persists. I just want the code that I need to change in order to implement all of this, not for you to give me the files directly.

## Response:
03/08/2026, 10:59:01

> **Updating task management with SQLite persistence**
>
>
> **Updated task management with SQLite persistence**
>
> 
>
> **Searching the web**
>
>
> **Designing task persistence**
>
> I’m planning a separate loading effect and reusable request helpers for fetching, creating, updating, archiving, and restoring tasks. Each handler will await server responses, update state from returned data, and surface failures clearly.
>
> **Designed task persistence**
>
> 
>
> **Searching the web**
>
>
> **Planning persistence changes**
>
> I’m connecting the existing UI handlers to the SQLite-backed routes rather than changing the schema. I’ll replace client-only state updates with loading, creating, editing, completing, archiving, restoring, and reordering requests while preserving the current page structure.
>
> **Planned persistence changes**
>
> 
>
> **Searched 1 website**
>
> 
>
> Worked for 3m 7s

Your current page stores tasks only in React state, so create, edit, archive and status changes disappear when the page reloads. `Pasted text.txt` The solution is to send those changes to your existing SQLite route using `POST` and `PATCH`. Next.js Route Handlers support these HTTP methods inside `app/api/.../route.ts`. ([Next.js](https://nextjs.org/docs/app/getting-started/route-handlers?utm_source=chatgpt.com))

Your existing `schema.sql` already contains every column required, including `archived_at` and `updated_at`, so **you do not need to change it**.

## 1. Replace `app/api/tasks/route.ts`

Replace everything currently in `route.ts` with:

```ts
import db from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TaskStatus = "Todo" | "In-Progress" | "Complete";

type TaskRow = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  topic: string;
  status: TaskStatus;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const taskSelect = `
  SELECT
    id,
    title,
    description,
    due_date AS dueDate,
    topic,
    status,
    archived_at AS archivedAt,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM tasks
`;

function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    value === "Todo" ||
    value === "In-Progress" ||
    value === "Complete"
  );
}

function isValidDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  );
}

function getTaskById(id: number) {
  return db
    .prepare(`${taskSelect} WHERE id = ?`)
    .get(id) as TaskRow | undefined;
}

export async function GET() {
  try {
    /*
     * Return archived and unarchived tasks.
     * The page decides which tasks to display.
     */
    const tasks = db
      .prepare(`
        ${taskSelect}
        ORDER BY
          CASE WHEN archived_at IS NULL THEN 0 ELSE 1 END,
          CASE status
            WHEN 'Todo' THEN 1
            WHEN 'In-Progress' THEN 2
            WHEN 'Complete' THEN 3
            ELSE 4
          END,
          topic COLLATE NOCASE ASC,
          due_date ASC,
          title COLLATE NOCASE ASC
      `)
      .all() as TaskRow[];

    return Response.json(tasks);
  } catch (error) {
    console.error("Failed to retrieve tasks:", error);

    return Response.json(
      {
        error: "Failed to retrieve tasks",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const rawBody: unknown = await request.json();

    if (
      !rawBody ||
      typeof rawBody !== "object" ||
      Array.isArray(rawBody)
    ) {
      return Response.json(
        {
          error: "Invalid request body",
        },
        {
          status: 400,
        },
      );
    }

    const body = rawBody as Record<string, unknown>;

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const topic =
      typeof body.topic === "string" ? body.topic.trim() : "";

    const dueDate = body.dueDate;
    const status = body.status ?? "Todo";

    if (!title) {
      return Response.json(
        {
          error: "A title is required",
        },
        {
          status: 400,
        },
      );
    }

    if (!topic) {
      return Response.json(
        {
          error: "A topic is required",
        },
        {
          status: 400,
        },
      );
    }

    if (!isValidDate(dueDate)) {
      return Response.json(
        {
          error: "A valid due date is required",
        },
        {
          status: 400,
        },
      );
    }

    if (!isTaskStatus(status)) {
      return Response.json(
        {
          error: "Invalid task status",
        },
        {
          status: 400,
        },
      );
    }

    const result = db
      .prepare(`
        INSERT INTO tasks (
          title,
          description,
          due_date,
          topic,
          status
        )
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(
        title,
        description,
        dueDate,
        topic,
        status,
      );

    const task = getTaskById(Number(result.lastInsertRowid));

    return Response.json(task, {
      status: 201,
    });
  } catch (error) {
    console.error("Failed to create task:", error);

    return Response.json(
      {
        error: "Failed to create task",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const rawBody: unknown = await request.json();

    if (
      !rawBody ||
      typeof rawBody !== "object" ||
      Array.isArray(rawBody)
    ) {
      return Response.json(
        {
          error: "Invalid request body",
        },
        {
          status: 400,
        },
      );
    }

    const body = rawBody as Record<string, unknown>;
    const id = body.id;

    if (
      typeof id !== "number" ||
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return Response.json(
        {
          error: "A valid task ID is required",
        },
        {
          status: 400,
        },
      );
    }

    if (!getTaskById(id)) {
      return Response.json(
        {
          error: "Task not found",
        },
        {
          status: 404,
        },
      );
    }

    const updateFields: string[] = [];
    const updateValues: Array<string | null> = [];

    if ("title" in body) {
      const title =
        typeof body.title === "string" ? body.title.trim() : "";

      if (!title) {
        return Response.json(
          {
            error: "A title is required",
          },
          {
            status: 400,
          },
        );
      }

      updateFields.push("title = ?");
      updateValues.push(title);
    }

    if ("description" in body) {
      if (typeof body.description !== "string") {
        return Response.json(
          {
            error: "Invalid description",
          },
          {
            status: 400,
          },
        );
      }

      updateFields.push("description = ?");
      updateValues.push(body.description.trim());
    }

    if ("dueDate" in body) {
      if (!isValidDate(body.dueDate)) {
        return Response.json(
          {
            error: "A valid due date is required",
          },
          {
            status: 400,
          },
        );
      }

      updateFields.push("due_date = ?");
      updateValues.push(body.dueDate);
    }

    if ("topic" in body) {
      const topic =
        typeof body.topic === "string" ? body.topic.trim() : "";

      if (!topic) {
        return Response.json(
          {
            error: "A topic is required",
          },
          {
            status: 400,
          },
        );
      }

      updateFields.push("topic = ?");
      updateValues.push(topic);
    }

    if ("status" in body) {
      if (!isTaskStatus(body.status)) {
        return Response.json(
          {
            error: "Invalid task status",
          },
          {
            status: 400,
          },
        );
      }

      updateFields.push("status = ?");
      updateValues.push(body.status);
    }

    if ("archivedAt" in body) {
      if (
        body.archivedAt !== null &&
        typeof body.archivedAt !== "string"
      ) {
        return Response.json(
          {
            error: "Invalid archive date",
          },
          {
            status: 400,
          },
        );
      }

      updateFields.push("archived_at = ?");
      updateValues.push(body.archivedAt);
    }

    if (updateFields.length === 0) {
      return Response.json(
        {
          error: "No task changes were supplied",
        },
        {
          status: 400,
        },
      );
    }

    db.prepare(`
      UPDATE tasks
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `).run(...updateValues, id);

    const updatedTask = getTaskById(id);

    return Response.json(updatedTask);
  } catch (error) {
    console.error("Failed to update task:", error);

    return Response.json(
      {
        error: "Failed to update task",
      },
      {
        status: 500,
      },
    );
  }
}
```

SQLite packages such as `better-sqlite3` should run in the Node.js runtime rather than an Edge runtime, which is why the route explicitly uses `runtime = "nodejs"`. ([Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config?utm_source=chatgpt.com))

---

## 2. Change the `Task` type in `page.tsx`

Replace your current `Task` type with:

```ts
type Task = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  topic: TaskTopic;
  archivedAt: string | null;
};
```

Immediately underneath it, add:

```ts
type TaskUpdate = Partial<
  Pick<
    Task,
    | "title"
    | "description"
    | "dueDate"
    | "status"
    | "topic"
    | "archivedAt"
  >
>;
```

---

## 3. Delete `initialTasks`

Delete the entire block beginning with:

```ts
const initialTasks: Task[] = [
```

and ending with its closing:

```ts
];
```

Tasks must now come from SQLite rather than being hard-coded in the browser.

---

## 4. Add the overdue helper functions

Place these functions above `export default function HomePage()`:

```ts
function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isTaskOverdue(task: Task) {
  return (
    !task.archivedAt &&
    task.status !== "Complete" &&
    task.dueDate < getTodayDate()
  );
}
```

Because your dates use the `YYYY-MM-DD` format, they can be compared safely in this form.

---

## 5. Change the tasks state

Replace:

```ts
const [tasks, setTasks] = useState<Task[]>(initialTasks);
```

with:

```ts
const [tasks, setTasks] = useState<Task[]>([]);
const [taskError, setTaskError] = useState("");
```

---

## 6. Fetch the tasks when the page loads

Add this separate `useEffect` underneath your existing dark-mode `useEffect`:

```ts
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

---

## 7. Add a reusable database update function

Add this function inside `HomePage`, before `handleSubmit`:

```ts
async function updateTaskInDatabase(
  taskId: number,
  changes: TaskUpdate,
) {
  const response = await fetch("/api/tasks", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: taskId,
      ...changes,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error ?? "Failed to update task");
  }

  const updatedTask = result as Task;

  setTasks((currentTasks) =>
    currentTasks.map((task) =>
      task.id === updatedTask.id ? updatedTask : task,
    ),
  );
}

function displayTaskError(error: unknown) {
  setTaskError(
    error instanceof Error
      ? error.message
      : "Something went wrong while saving the task",
  );
}
```

---

## 8. Replace `handleSubmit`

Replace your entire existing `handleSubmit` function with:

```ts
async function handleSubmit(
  event: FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  const title = form.title.trim();
  const description = form.description.trim();
  const topic = form.topic.trim();

  if (!title || !topic || !form.dueDate) {
    return;
  }

  const taskDetails = {
    title,
    description,
    dueDate: form.dueDate,
    status: form.status,
    topic,
  };

  try {
    setTaskError("");

    if (editingTaskId !== null) {
      await updateTaskInDatabase(
        editingTaskId,
        taskDetails,
      );
    } else {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskDetails),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Failed to create task",
        );
      }

      const createdTask = result as Task;

      setTasks((currentTasks) => [
        ...currentTasks,
        createdTask,
      ]);
    }

    closeModal();
  } catch (error) {
    displayTaskError(error);
  }
}
```

---

## 9. Replace all the task-changing functions

Replace `toggleCompleted` with:

```ts
async function toggleCompleted(task: Task) {
  try {
    setTaskError("");

    await updateTaskInDatabase(task.id, {
      status:
        task.status === "Complete"
          ? "Todo"
          : "Complete",
    });
  } catch (error) {
    displayTaskError(error);
  }
}
```

Replace `changeTaskStatus` with:

```ts
async function changeTaskStatus(
  taskId: number,
  status: TaskStatus,
) {
  try {
    setTaskError("");

    await updateTaskInDatabase(taskId, {
      status,
    });

    setOpenMenuTaskId(null);
  } catch (error) {
    displayTaskError(error);
  }
}
```

Replace `archiveTask` with:

```ts
async function archiveTask(taskId: number) {
  try {
    setTaskError("");

    await updateTaskInDatabase(taskId, {
      archivedAt: new Date().toISOString(),
    });

    setOpenMenuTaskId(null);
  } catch (error) {
    displayTaskError(error);
  }
}
```

Replace `restoreTask` with:

```ts
async function restoreTask(taskId: number) {
  try {
    setTaskError("");

    await updateTaskInDatabase(taskId, {
      archivedAt: null,
    });

    setOpenMenuTaskId(null);
  } catch (error) {
    displayTaskError(error);
  }
}
```

Replace `dropTask` with:

```ts
async function dropTask(status: TaskStatus) {
  if (draggedTaskId === null || filter === "archived") {
    return;
  }

  await changeTaskStatus(draggedTaskId, status);
  setDraggedTaskId(null);
}
```

---

## 10. Calculate the overdue task total

Under your existing `activeTasks` calculation, add:

```ts
const overdueTasks = unarchivedTasks.filter(
  isTaskOverdue,
).length;
```

It should look like:

```ts
const activeTasks = totalTasks - completedTasks;

const overdueTasks = unarchivedTasks.filter(
  isTaskOverdue,
).length;
```

---

## 11. Display API errors

Inside your `<main className={styles.main}>`, before the stats grid, add:

```tsx
{taskError && (
  <p className={styles.errorMessage} role="alert">
    {taskError}
  </p>
)}
```

---

## 12. Add the overdue statistics tile

Inside `styles.statsGrid`, add this new card after your completed-tasks card:

```tsx
<article className={styles.statCard}>
  <figure
    className={`${styles.statIcon} ${styles.redBackground}`}
    aria-hidden="true"
  >
    <CalendarDays size={27} />
  </figure>

  <section className={styles.statContent}>
    <h2 className={styles.statLabel}>
      Overdue Tasks
    </h2>

    <output
      className={`${styles.statNumber} ${styles.redText}`}
    >
      {overdueTasks}
    </output>

    <p className={styles.statDescription}>
      Tasks past their due date
    </p>
  </section>
</article>
```

---

## 13. Mark individual task dates as overdue

Inside:

```tsx
{columnTasks.map((task) => {
```

You currently have:

```tsx
const isComplete = task.status === "Complete";
```

Change that section to:

```tsx
const isComplete = task.status === "Complete";
const isOverdue = isTaskOverdue(task);
```

Then replace the existing `<time>` element with:

```tsx
<time
  className={`${styles.date} ${
    isOverdue
      ? styles.overdueDate
      : column.colourClass
  }`}
  dateTime={task.dueDate}
>
  <CalendarDays size={14} aria-hidden="true" />

  {formatDate(task.dueDate)}

  {isOverdue && (
    <strong className={styles.overdueLabel}>
      Overdue
    </strong>
  )}
</time>
```

---

## 14. Update the asynchronous button calls

For the checkbox, change:

```tsx
onClick={() => toggleCompleted(task)}
```

to:

```tsx
onClick={() => void toggleCompleted(task)}
```

For status changes, use:

```tsx
onClick={() =>
  void changeTaskStatus(task.id, "Todo")
}
```

```tsx
onClick={() =>
  void changeTaskStatus(task.id, "In-Progress")
}
```

```tsx
onClick={() =>
  void changeTaskStatus(task.id, "Complete")
}
```

For archive and restore:

```tsx
onClick={() => void archiveTask(task.id)}
```

```tsx
onClick={() => void restoreTask(task.id)}
```

Change your column drop handler to:

```tsx
onDrop={() => void dropTask(status)}
```

---

## 15. Add these styles to `page.module.css`

Add:

```css
.redBackground {
  background: #fee2e2;
  color: #dc2626;
}

.redText {
  color: #dc2626;
}

.overdueDate {
  color: #dc2626 !important;
}

.overdueLabel {
  font-weight: 700;
  text-transform: uppercase;
}

.errorMessage {
  margin-bottom: 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid #fecaca;
  border-radius: 0.75rem;
  background: #fef2f2;
  color: #b91c1c;
  font-weight: 600;
}

.darkMode .redBackground {
  background: rgba(239, 68, 68, 0.16);
  color: #f87171;
}

.darkMode .redText,
.darkMode .overdueDate {
  color: #f87171 !important;
}

.darkMode .errorMessage {
  border-color: rgba(248, 113, 113, 0.4);
  background: rgba(127, 29, 29, 0.25);
  color: #fca5a5;
}
```

Since there are now four statistics cards, change your existing `.statsGrid` columns to:

```css
.statsGrid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}
```

Add or update the responsive rules:

```css
@media (max-width: 1100px) {
  .statsGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .statsGrid {
    grid-template-columns: 1fr;
  }
}
```

After these changes, creating, editing, completing, moving, archiving and restoring a task will update `data/todo.db`. Reloading the browser or stopping and restarting `npm run dev` will read the tasks back from that database.

---

**Sources:**

- [Getting Started: Route Handlers | Next.js](https://nextjs.org/docs/app/getting-started/route-handlers?utm_source=chatgpt.com)

## Prompt:
03/08/2026, 11:21:42

I have an error somewhere, please help me find it
it is this taskError
<main className={styles.main}
      {taskError && (
          <p className={styles.errorMessage} role="alert">
            {taskError}
          </p>
        )}
        >
                
        <section className={styles.statsGrid} aria-label="Task summary">
          <article className={styles.statCard}>
            <figure
              className={`${styles.statIcon} ${styles.redBackground}`}
              aria-hidden="true"
            >
              <CalendarDays size={27} />
            </figure>

            <section className={styles.statContent}>
              <h2 className={styles.statLabel}>
                Overdue Tasks
              </h2>

## Response:
03/08/2026, 11:21:47

The error is because the opening `<main>` tag is not closed with `>` before you render `taskError`.

You currently have:

```tsx
<main className={styles.main}
  {taskError && (
    <p className={styles.errorMessage} role="alert">
      {taskError}
    </p>
  )}
>
```

Change it to:

```tsx
<main className={styles.main}>
  {taskError && (
    <p className={styles.errorMessage} role="alert">
      {taskError}
    </p>
  )}

  <section className={styles.statsGrid} aria-label="Task summary">
    <article className={styles.statCard}>
      <figure
        className={`${styles.statIcon} ${styles.redBackground}`}
        aria-hidden="true"
      >
        <CalendarDays size={27} />
      </figure>

      <section className={styles.statContent}>
        <h2 className={styles.statLabel}>Overdue Tasks</h2>
      </section>
    </article>
  </section>
</main>
```

The important part is:

```tsx
<main className={styles.main}>
```

The `>` must appear immediately after `className={styles.main}`. Everything displayed inside `<main>` must come after it.

## Prompt:
03/08/2026, 11:24:03

I still have an error

[Attachment: Pasted text(6).txt]

## Response:
03/08/2026, 11:24:06

The problem is not `taskError`. The syntax error is caused by an extra block immediately after your `archiveTask` function. `Pasted text.txt`

You currently have:

```tsx
async function archiveTask(taskId: number) {
  try {
    setTaskError("");

    await updateTaskInDatabase(taskId, {
      archivedAt: new Date().toISOString(),
    });

    setOpenMenuTaskId(null);
  } catch (error) {
    displayTaskError(error);
  }
}

  setOpenMenuTaskId(null);
}
```

Delete these two extra lines:

```tsx
setOpenMenuTaskId(null);
}
```

The corrected section should be:

```tsx
async function archiveTask(taskId: number) {
  try {
    setTaskError("");

    await updateTaskInDatabase(taskId, {
      archivedAt: new Date().toISOString(),
    });

    setOpenMenuTaskId(null);
  } catch (error) {
    displayTaskError(error);
  }
}

async function restoreTask(taskId: number) {
  try {
    setTaskError("");

    await updateTaskInDatabase(taskId, {
      archivedAt: null,
    });

    setOpenMenuTaskId(null);
  } catch (error) {
    displayTaskError(error);
  }
}
```

VS Code may underline `taskError` or another later part of the file because the extra `}` causes TypeScript to misunderstand everything that follows it.

## Prompt:
03/08/2026, 11:30:00

I want the tiles to be in order "Total tasks", "Active tasks", Completed tasks, Overdue tasks but I currently only have 3 tiles, It is missing the total tasks tile

## Response:
03/08/2026, 11:30:04

> **Reordering Stats Tiles with Total Tasks First

Replace the current stats grid in `app/page.tsx` with this block. `totalTasks` is already calculated and will display the overall task count.【turn1file0†L31-L34】【turn1file0†L211-L236】

```tsx
<section className={styles.statsGrid} aria-label="Task summary">
  <article className={styles.statTile}>
    <div className={styles.statLabel}>Total Tasks</div>
    <div className={styles.statValue}>{totalTasks}</div>
  </article>

  <article className={styles.statTile}>
    <div className={styles.statLabel}>Active Tasks</div>
    <div className={styles.statValue}>{activeTasks}</div>
  </article>

  <article className={styles.statTile}>
    <div className={styles.statLabel}>Completed Tasks</div>
    <div className={styles.statValue}>{completedTasks}</div>
  </article>

  <article className={styles.statTile}>
    <div className={styles.statLabel}>Overdue Tasks</div>
    <div className={styles.statValue}>{overdueTasks}</div>
  </article>
</section>
```

This adds the missing total card and changes the order to:

1. Total Tasks
2. Active Tasks
3. Completed Tasks
4. Overdue Tasks**
>
>
> **Computing Task Sorting and Formatting Utilities**
>
> 
>
> Worked for 22s

Your current `statsGrid` starts with **Overdue Tasks**, followed by **Active Tasks** and **Completed Tasks**, so the original **Total Tasks** card was accidentally replaced. `Pasted text.txt`

Replace your entire current stats section:

```tsx
<section className={styles.statsGrid} aria-label="Task summary">
  ...
</section>
```

with this:

```tsx
<section className={styles.statsGrid} aria-label="Task summary">
  {/* 1. Total Tasks */}
  <article className={styles.statCard}>
    <figure
      className={`${styles.statIcon} ${styles.purpleBackground}`}
      aria-hidden="true"
    >
      <ListTodo size={27} />
    </figure>

    <section className={styles.statContent}>
      <h2 className={styles.statLabel}>Total Tasks</h2>

      <output
        className={`${styles.statNumber} ${styles.purpleText}`}
      >
        {totalTasks}
      </output>

      <p className={styles.statDescription}>
        All tasks in your list
      </p>
    </section>
  </article>

  {/* 2. Active Tasks */}
  <article className={styles.statCard}>
    <figure
      className={`${styles.statIcon} ${styles.orangeBackground}`}
      aria-hidden="true"
    >
      <Clock3 size={27} />
    </figure>

    <section className={styles.statContent}>
      <h2 className={styles.statLabel}>Active Tasks</h2>

      <output
        className={`${styles.statNumber} ${styles.orangeText}`}
      >
        {activeTasks}
      </output>

      <p className={styles.statDescription}>
        Tasks still in progress
      </p>
    </section>
  </article>

  {/* 3. Completed Tasks */}
  <article className={styles.statCard}>
    <figure
      className={`${styles.statIcon} ${styles.greenBackground}`}
      aria-hidden="true"
    >
      <CheckCircle2 size={27} />
    </figure>

    <section className={styles.statContent}>
      <h2 className={styles.statLabel}>Completed Tasks</h2>

      <output
        className={`${styles.statNumber} ${styles.greenText}`}
      >
        {completedTasks}
      </output>

      <p className={styles.statDescription}>
        Tasks you have completed
      </p>
    </section>
  </article>

  {/* 4. Overdue Tasks */}
  <article className={styles.statCard}>
    <figure
      className={`${styles.statIcon} ${styles.redBackground}`}
      aria-hidden="true"
    >
      <CalendarDays size={27} />
    </figure>

    <section className={styles.statContent}>
      <h2 className={styles.statLabel}>Overdue Tasks</h2>

      <output
        className={`${styles.statNumber} ${styles.redText}`}
      >
        {overdueTasks}
      </output>

      <p className={styles.statDescription}>
        Tasks past their due date
      </p>
    </section>
  </article>
</section>
```

Also make sure your `.statsGrid` in `page.module.css` uses four columns:

```css
.statsGrid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
}
```

For smaller screens, use:

```css
@media (max-width: 1100px) {
  .statsGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .statsGrid {
    grid-template-columns: 1fr;
  }
}
```

The order will then be:

**Total Tasks → Active Tasks → Completed Tasks → Overdue Tasks**.

## Prompt:
03/08/2026, 11:38:17

I want to move the Add Task button to the far right side of where the Archive button is

## Response:
03/08/2026, 11:38:19

> **Moving Add Task Button into Filters Row**
>
>
> **Moved Add Task button into filters row**
>
> 
>
> Worked for 15s

Your filter bar already uses `display: flex`, so move the main **Add Task** button into that bar and give it `margin-left: auto`. This will place it at the far right, after **Archive**. `Pasted text.txt`

## 1. Remove the Add Task button from the header

Inside `headerActions`, delete this entire `<li>`:

```tsx
<li>
  <button
    className={styles.primaryButton}
    onClick={() => openAddModal()}
    type="button"
  >
    <Plus size={18} aria-hidden="true" />
    Add Task
  </button>
</li>
```

Leave the dark-mode button in the header.

## 2. Add it after the Archive button

Find your Archive filter button:

```tsx
<button
  className={`${styles.filterButton} ${
    filter === "archived" ? styles.activeFilter : ""
  }`}
  onClick={() => setFilter("archived")}
  aria-pressed={filter === "archived"}
  type="button"
>
  <Archive size={17} aria-hidden="true" />
  Archive
</button>
```

Immediately after it, but still inside the same `<nav className={styles.filters}>`, add:

```tsx
<button
  className={`${styles.primaryButton} ${styles.filterAddButton}`}
  onClick={() => openAddModal()}
  type="button"
>
  <Plus size={18} aria-hidden="true" />
  Add Task
</button>
```

The complete ending of the filter section should therefore look like:

```tsx
<button
  className={`${styles.filterButton} ${
    filter === "archived" ? styles.activeFilter : ""
  }`}
  onClick={() => setFilter("archived")}
  aria-pressed={filter === "archived"}
  type="button"
>
  <Archive size={17} aria-hidden="true" />
  Archive
</button>

<button
  className={`${styles.primaryButton} ${styles.filterAddButton}`}
  onClick={() => openAddModal()}
  type="button"
>
  <Plus size={18} aria-hidden="true" />
  Add Task
</button>
```

## 3. Add this to `page.module.css`

```css
.filterAddButton {
  margin-left: auto;
  flex: 0 0 auto;
}
```

Your existing `.filters` rule is already a flex container, so `margin-left: auto` pushes the Add Task button to the far-right edge. `page.module.css`

For smaller screens, add this inside your existing mobile media query:

```css
@media (max-width: 620px) {
  .filterAddButton {
    margin-left: 8px;
    flex: 0 0 auto;
  }
}
```

The row will then appear as:

**All | Active | Completed | Archive                 Add Task**

## Prompt:
03/08/2026, 11:41:54

Also in active, completed and archived I just want it to be a list of tasks sortable by due date and topic and must include the status information too

## Response:
03/08/2026, 11:42:04

> **Designing filtered task views**
>
> I’m updating `/completed/archived/active` so they become sortable task lists with visible status, while preserving the existing board layout for `all`. I’ll keep filtering tied to task state and use semantic elements without adding unnecessary wrappers.
>
> **Designed filtered task views**
>
> 
>
> **Implement Sortable Task Lists for Filtered Views**
>
>
> **Building list sorting**
>
> I’m replacing the non-`all` board rendering with a single sorted list, ordered by due date or topic, while keeping `all` as the existing multi-column board and showing each task’s current status.
>
> **Inspecting File Citation Details**
>
>
> **Updating Task Management Interface Logic**
>
> 
>
> Worked for 1m 48s

Your existing `filteredTasks` logic already selects the correct tasks for **Active**, **Completed**, and **Archived**. The main change is to render those filters as one sortable list instead of using the three-column board. Keep the board only for **All**. `Pasted text.txt`

## 1. Add a sorting type

Directly underneath `TaskFilter`, add:

```tsx
type TaskSort =
  | "dueDateAscending"
  | "dueDateDescending"
  | "topicAscending"
  | "topicDescending";
```

So that section becomes:

```tsx
type TaskStatus = "Todo" | "In-Progress" | "Complete";
type TaskFilter = "all" | "active" | "completed" | "archived";

type TaskSort =
  | "dueDateAscending"
  | "dueDateDescending"
  | "topicAscending"
  | "topicDescending";
```

## 2. Add the sorting state

Immediately after your `filter` state, add:

```tsx
const [listSort, setListSort] =
  useState<TaskSort>("dueDateAscending");
```

It should look like:

```tsx
const [tasks, setTasks] = useState<Task[]>([]);
const [taskError, setTaskError] = useState("");
const [filter, setFilter] = useState<TaskFilter>("all");

const [listSort, setListSort] =
  useState<TaskSort>("dueDateAscending");
```

## 3. Create the sorted list

Immediately after your existing `filteredTasks` calculation, add:

```tsx
const sortedListTasks = [...filteredTasks].sort(
  (taskA, taskB) => {
    const dateComparison =
      getDueDateValue(taskA.dueDate) -
      getDueDateValue(taskB.dueDate);

    const topicComparison = taskA.topic.localeCompare(
      taskB.topic,
      undefined,
      {
        sensitivity: "base",
      },
    );

    const titleComparison = taskA.title.localeCompare(
      taskB.title,
      undefined,
      {
        sensitivity: "base",
      },
    );

    if (listSort === "dueDateDescending") {
      return -dateComparison || topicComparison || titleComparison;
    }

    if (listSort === "topicAscending") {
      return topicComparison || dateComparison || titleComparison;
    }

    if (listSort === "topicDescending") {
      return -topicComparison || dateComparison || titleComparison;
    }

    return dateComparison || topicComparison || titleComparison;
  },
);
```

This gives you four choices:

- Earliest due date first
- Latest due date first
- Topic A-Z
- Topic Z-A

## 4. Add the list helper functions

Inside `HomePage`, place these functions before your `return` statement:

```tsx
function getListHeading() {
  if (filter === "active") {
    return "Active Tasks";
  }

  if (filter === "completed") {
    return "Completed Tasks";
  }

  if (filter === "archived") {
    return "Archived Tasks";
  }

  return "Tasks";
}

function getStatusLabel(status: TaskStatus) {
  if (status === "In-Progress") {
    return "In Progress";
  }

  if (status === "Complete") {
    return "Completed";
  }

  return "To Do";
}

function getStatusClass(status: TaskStatus) {
  if (status === "In-Progress") {
    return styles.statusInProgress;
  }

  if (status === "Complete") {
    return styles.statusComplete;
  }

  return styles.statusTodo;
}
```

Then add this function immediately underneath them:

```tsx
function renderFilteredTaskList() {
  return (
    <section
      className={styles.listView}
      aria-label={`${getListHeading()} list`}
    >
      <header className={styles.listHeader}>
        <section className={styles.listHeaderText}>
          <h2 className={styles.listHeading}>
            {getListHeading()}
          </h2>

          <p className={styles.listDescription}>
            {sortedListTasks.length}{" "}
            {sortedListTasks.length === 1 ? "task" : "tasks"}
          </p>
        </section>

        <label className={styles.sortControl}>
          <strong>Sort by</strong>

          <select
            value={listSort}
            onChange={(event) =>
              setListSort(event.target.value as TaskSort)
            }
          >
            <option value="dueDateAscending">
              Due date: earliest first
            </option>

            <option value="dueDateDescending">
              Due date: latest first
            </option>

            <option value="topicAscending">
              Topic: A to Z
            </option>

            <option value="topicDescending">
              Topic: Z to A
            </option>
          </select>
        </label>
      </header>

      <ul className={styles.filteredTaskList}>
        {sortedListTasks.length === 0 && (
          <li className={styles.listEmptyState}>
            <CheckCircle2 size={30} aria-hidden="true" />

            <p>No tasks in this section</p>
          </li>
        )}

        {sortedListTasks.map((task) => {
          const isComplete = task.status === "Complete";
          const isOverdue = isTaskOverdue(task);

          return (
            <li className={styles.listTaskCard} key={task.id}>
              <header className={styles.listTaskTop}>
                {filter !== "archived" && (
                  <button
                    className={`${styles.checkbox} ${
                      isComplete
                        ? styles.checkedCheckbox
                        : ""
                    }`}
                    onClick={() => void toggleCompleted(task)}
                    aria-label={
                      isComplete
                        ? `Mark ${task.title} as active`
                        : `Mark ${task.title} as completed`
                    }
                    type="button"
                  >
                    {isComplete && (
                      <Check
                        size={14}
                        strokeWidth={3}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                )}

                <section className={styles.listTaskText}>
                  <header className={styles.listTaskBadges}>
                    <small className={styles.topicBadge}>
                      {task.topic}
                    </small>

                    <strong
                      className={`${styles.statusBadge} ${getStatusClass(
                        task.status,
                      )}`}
                    >
                      {getStatusLabel(task.status)}
                    </strong>
                  </header>

                  <h3
                    className={
                      isComplete
                        ? styles.completedTitle
                        : ""
                    }
                  >
                    {task.title}
                  </h3>

                  {task.description && (
                    <p>{task.description}</p>
                  )}
                </section>
              </header>

              <footer className={styles.listTaskBottom}>
                <time
                  className={`${styles.date} ${
                    isOverdue
                      ? styles.overdueDate
                      : ""
                  }`}
                  dateTime={task.dueDate}
                >
                  <CalendarDays
                    size={14}
                    aria-hidden="true"
                  />

                  {formatDate(task.dueDate)}

                  {isOverdue && (
                    <strong className={styles.overdueLabel}>
                      Overdue
                    </strong>
                  )}
                </time>

                <menu className={styles.taskActions}>
                  <li>
                    <button
                      className={styles.iconButton}
                      onClick={() => openEditModal(task)}
                      aria-label={`Edit ${task.title}`}
                      type="button"
                    >
                      <Pencil
                        size={16}
                        aria-hidden="true"
                      />
                    </button>
                  </li>

                  <li>
                    {filter === "archived" ? (
                      <button
                        className={styles.iconButton}
                        onClick={() =>
                          void restoreTask(task.id)
                        }
                        aria-label={`Restore ${task.title}`}
                        title="Restore task"
                        type="button"
                      >
                        <RotateCcw
                          size={16}
                          aria-hidden="true"
                        />
                      </button>
                    ) : (
                      <button
                        className={styles.iconButton}
                        onClick={() =>
                          void archiveTask(task.id)
                        }
                        aria-label={`Archive ${task.title}`}
                        title="Archive task"
                        type="button"
                      >
                        <Archive
                          size={16}
                          aria-hidden="true"
                        />
                      </button>
                    )}
                  </li>
                </menu>
              </footer>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

The status information is displayed using a badge containing:

- **To Do**
- **In Progress**
- **Completed**

This is particularly useful in Active and Archived because those lists can contain more than one status.

## 5. Show the board only when “All” is selected

Find your existing board beginning with:

```tsx
<section className={boardClass} aria-label="Task board">
```

Add this immediately before it:

```tsx
{filter === "all" ? (
```

Your beginning should now look like:

```tsx
{filter === "all" ? (
  <section className={boardClass} aria-label="Task board">
```

Keep all your current board code unchanged.

Then find the closing `</section>` belonging to the board, immediately before `</main>`.

Change that ending from:

```tsx
</section>
</main>
```

to:

```tsx
  </section>
) : (
  renderFilteredTaskList()
)}
</main>
```

The complete structure should be:

```tsx
{filter === "all" ? (
  <section className={boardClass} aria-label="Task board">
    {/* Your existing board code remains here */}
  </section>
) : (
  renderFilteredTaskList()
)}
```

Do not paste the comment as a replacement for your board; keep all the existing board content between the opening and closing `<section>`.

## 6. Add the list CSS

Add this to `page.module.css`:

```css
.listView {
  padding: 24px;
  border: 1px solid #e7e8ef;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.94);
}

.listHeader {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.listHeaderText {
  min-width: 0;
}

.listHeading {
  margin: 0 0 5px;
  color: #323341;
  font-size: 21px;
}

.listDescription {
  margin: 0;
  color: #747684;
  font-size: 14px;
}

.sortControl {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #4a4c59;
  font-size: 14px;
}

.sortControl select {
  min-height: 40px;
  padding: 0 36px 0 12px;
  border: 1px solid #dedfe7;
  border-radius: 8px;
  color: #323341;
  background: white;
}

.filteredTaskList {
  display: grid;
  gap: 12px;
}

.listTaskCard {
  padding: 18px;
  border: 1px solid #e3e4eb;
  border-radius: 11px;
  background: white;
  box-shadow: 0 3px 10px rgba(27, 28, 37, 0.035);
}

.listTaskTop {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.listTaskText {
  min-width: 0;
  flex: 1;
}

.listTaskText h3 {
  margin: 0 0 7px;
  color: #30313e;
  font-size: 16px;
}

.listTaskText p {
  margin: 0;
  color: #747684;
  font-size: 14px;
  line-height: 1.5;
}

.listTaskBadges {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.statusBadge {
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 750;
}

.statusTodo {
  color: #5b30df;
  background: #f0ecff;
}

.statusInProgress {
  color: #d87500;
  background: #fff3df;
}

.statusComplete {
  color: #16863a;
  background: #eaf8ed;
}

.listTaskBottom {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #ececf1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.listEmptyState {
  min-height: 180px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  border: 1px dashed #d8d9e2;
  border-radius: 11px;
  color: #747684;
}

.listEmptyState p {
  margin: 0;
}
```

Add this to your mobile media query:

```css
@media (max-width: 620px) {
  .listView {
    padding: 14px;
  }

  .listHeader {
    align-items: stretch;
    flex-direction: column;
  }

  .sortControl {
    align-items: stretch;
    flex-direction: column;
  }

  .sortControl select {
    width: 100%;
  }

  .listTaskBottom {
    align-items: flex-start;
  }
}
```

For dark mode, add:

```css
.darkMode .listView,
.darkMode .listTaskCard {
  border-color: #383a49;
  background: #242633;
}

.darkMode .listHeading,
.darkMode .listTaskText h3 {
  color: #f2f2f6;
}

.darkMode .listDescription,
.darkMode .listTaskText p,
.darkMode .sortControl {
  color: #b9bac5;
}

.darkMode .sortControl select {
  border-color: #454756;
  color: #f2f2f6;
  background: #2d2f3c;
}

.darkMode .listTaskBottom {
  border-color: #3c3e4c;
}

.darkMode .listEmptyState {
  border-color: #454756;
  color: #b9bac5;
}
```

The final behaviour will be:

- **All:** existing three-column task board.
- **Active:** one list containing To Do and In Progress tasks.
- **Completed:** one list containing completed tasks.
- **Archived:** one list containing all archived tasks and their previous statuses.
- Each list can be sorted by due date or topic.

## Prompt:
03/08/2026, 11:51:30

I have an error

[Attachment: Pasted text(7).txt]

## Prompt:
03/08/2026, 11:52:44

there is an error in my code, can you help me find it

[Attachment: Pasted text(8).txt]

## Response:
03/08/2026, 11:52:47

> **Locating scope errors**
>
> I’m seeing the main compile problem: `renderFilteredTaskList` is declared inside `useEffect`, but JSX calls it outside that scope. I’d move the helper functions into the component body, after `sortedListTasks`, and before the return.
>
> **Located scope errors**
>
> 
>
> **Fix render function scope and active task filtering**
>
>
> **Fixing helper scope**
>
> I’m finding the compile error in `HomePage`: `renderFilteredTaskList` is defined inside `useEffect`, then called from JSX outside it. Keep `useEffect` only for loading tasks, and move `getListHeading`, `getColumnDetails`, and `renderFilteredTaskList` into the component body before `return`.
>
> **Fixed helper scope**
>
> 
>
> **Move helper functions outside `useEffect` scope**
>
>
> **Fixed task list rendering scope and moved helpers outside useEffect**
>
> 
>
> Worked for 38s

I found the error. Your list helper functions are inside the task-loading `useEffect`, but you call `renderFilteredTaskList()` later in your JSX, outside that effect. Therefore, TypeScript cannot find it. `Pasted text.txt`

## 1. Fix the task-loading `useEffect`

Replace your entire second `useEffect`-the one beginning with:

```tsx
useEffect(() => {
  let ignoreResponse = false;
```

and ending with:

```tsx
}, []);
```

with this:

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
        throw new Error(
          result.error ?? "Failed to load tasks",
        );
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

The `useEffect` should contain only the database loading logic.

## 2. Move these functions outside the `useEffect`

Cut these four functions from their current position:

```tsx
function getListHeading() {
  // ...
}

function getStatusLabel(status: TaskStatus) {
  // ...
}

function getStatusClass(status: TaskStatus) {
  // ...
}

function renderFilteredTaskList() {
  // ...
}
```

Paste them inside `HomePage`, immediately after your existing `getColumnDetails` function and immediately before:

```tsx
return (
```

The structure should look like this:

```tsx
function getColumnDetails(status: TaskStatus) {
  if (status === "In-Progress") {
    return {
      title: "In Progress",
      icon: <Clock3 size={18} />,
      colourClass: styles.orange,
    };
  }

  if (status === "Complete") {
    return {
      title: "Completed",
      icon: <CheckCircle2 size={18} />,
      colourClass: styles.green,
    };
  }

  return {
    title: "To Do",
    icon: <Circle size={18} />,
    colourClass: styles.purple,
  };
}

function getListHeading() {
  if (filter === "active") {
    return "Active Tasks";
  }

  if (filter === "completed") {
    return "Completed Tasks";
  }

  if (filter === "archived") {
    return "Archived Tasks";
  }

  return "Tasks";
}

function getStatusLabel(status: TaskStatus) {
  if (status === "In-Progress") {
    return "In Progress";
  }

  if (status === "Complete") {
    return "Completed";
  }

  return "To Do";
}

function getStatusClass(status: TaskStatus) {
  if (status === "In-Progress") {
    return styles.statusInProgress;
  }

  if (status === "Complete") {
    return styles.statusComplete;
  }

  return styles.statusTodo;
}

function renderFilteredTaskList() {
  // Keep all your existing renderFilteredTaskList code here.
}

return (
```

Do not leave another copy of these functions inside the `useEffect`.

## 3. Correct your Active Tasks count

Your Active filter contains both `Todo` and `In-Progress` tasks, but your tile currently counts only `In-Progress` tasks.

Replace:

```tsx
const activeTasks = unarchivedTasks.filter(
  (task) => task.status === "In-Progress",
).length;
```

with:

```tsx
const activeTasks = unarchivedTasks.filter(
  (task) => task.status !== "Complete",
).length;
```

Your ternary rendering at the bottom is valid and can remain:

```tsx
{filter === "all" ? (
  <section className={boardClass} aria-label="Task board">
    {/* existing board */}
  </section>
) : (
  renderFilteredTaskList()
)}
```

The main compile error is the location of `renderFilteredTaskList`, not this ternary.



---
Powered by [ChatGPT Exporter](https://www.chatgptexporter.com)