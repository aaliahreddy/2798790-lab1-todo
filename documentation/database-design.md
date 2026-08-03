# Database Design

The application uses SQLite because it is a local-first, single-user application. All persistent application data is stored in one database file located at `data/todo.db`.

## Tables and Relationships

There is only one table: `tasks`.

## `tasks` table

| Column | SQLite type | Null allowed | Default | Purpose |
|---|---|---:|---|---|
| `id` | `INTEGER` | No | Auto-generated | Primary key that uniquely identifies a task. |
| `title` | `TEXT` | No | None | Required task title.|
| `description` | `TEXT` | No | Empty string | Optional descriptive text to describe the task. |
| `due_date` | `TEXT` | No | None | Required due date stored in ISO `YYYY-MM-DD`. |
| `topic` | `TEXT` | No | None | Required user-entered topic. |
| `status` | `TEXT` | No | `Todo` | Current task status. |
| `archived_at` | `TEXT` | Yes | `NULL` | Archive timestamp.|
| `created_at` | `TEXT` | No | Current timestamp | Records when the task was created. |
| `updated_at` | `TEXT` | No | Current timestamp | Records when the task was most recently updated by the application. |

Each row in the table represents one task. There are no table relationships because the database contains only one table.

---

**AI Declaration**: The preceding document was reviewed and edited with: ChatGPT-Web[GPT-5.6 Thinking]