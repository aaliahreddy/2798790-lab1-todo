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
}