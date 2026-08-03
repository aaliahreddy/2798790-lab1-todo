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