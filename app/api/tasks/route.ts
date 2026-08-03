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