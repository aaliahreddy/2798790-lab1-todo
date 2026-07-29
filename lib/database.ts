import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

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