import database from "../lib/database";

type TaskCountRow = {
  count: number;
};

export default function Home() {
  const result = database
    .prepare("SELECT COUNT(*) AS count FROM tasks")
    .get() as TaskCountRow;

  return (
    <main>
      <h1>Todo Application</h1>

      <p>SQLite database connected successfully.</p>

      <p>Tasks currently stored: {result.count}</p>
    </main>
  );
}