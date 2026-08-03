# Todo App Design CSS

**User:** Anonymous  
**Created:** 8/3/2026 12:42:59  
**Updated:** 8/3/2026 12:43:00  
**Exported:** 8/3/2026 12:43:24  
**Link:** [https://chatgpt.com/share/6a7070b3-b1f4-83ea-bd0a-2f320df14938](https://chatgpt.com/share/6a7070b3-b1f4-83ea-bd0a-2f320df14938)  

## Prompt:
29/07/2026, 17:19:19

[Attachment: ChatGPT Image Jul 29, 2026 at 05_18_32 PM.png]

This is the design I want for my Todo app. Please can you help me with the css and tx to create it

## Response:
29/07/2026, 17:19:22

> **Building the task board**
>
> I’m planning a compilable React page with local task state, filtering, editable cards, status columns, and icon-based controls. I’ll keep dependencies minimal, use sample tasks matching the screenshot, and include responsive styling.
>
> **Built the task board**
>
> 
>
> **Designing the implementation**
>
> I’m preparing a self-contained React/TSX task board with local state, sample tasks, filtering, editing, deletion, status columns, due dates, and responsive styling. I’m keeping it dependency-light so the lab can connect persistence afterward.
>
> **Designed the implementation**
>
> 
>
> Worked for 1m 28s

I assume by “tx” you mean **TSX**. The code below gives you a close version of the design with:

- Three task columns
- Total, active and completed statistics
- All, Active and Completed filters
- Add and edit task modal
- Delete and complete buttons
- Responsive styling for smaller screens

This first version stores tasks in React state so you can get the design working. Your SQLite API can then replace the temporary task data.

## 1. Install the icon package

From your project terminal, run:

```bash
npm install lucide-react
```

Because this is a third-party package, add `lucide-react` to your `THIRD_PARTY_CODE.md` file.

## 2. Replace `app/page.tsx`

Use `src/app/page.tsx` instead when your project has a `src` folder.

```tsx
"use client";

import { FormEvent, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  CheckSquare2,
  Circle,
  Clock3,
  ListTodo,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import styles from "./page.module.css";

type TaskStatus = "todo" | "in-progress" | "completed";
type TaskFilter = "all" | "active" | "completed";

type Task = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
};

type TaskForm = {
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
};

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Design landing page",
    description: "Create the initial landing page for the app",
    dueDate: "2026-08-05",
    status: "todo",
  },
  {
    id: 2,
    title: "Add database schema",
    description: "Create the SQLite tables for tasks",
    dueDate: "2026-08-06",
    status: "todo",
  },
  {
    id: 3,
    title: "Implement task filters",
    description: "Add All, Active and Completed filters",
    dueDate: "2026-08-07",
    status: "todo",
  },
  {
    id: 4,
    title: "Write README",
    description: "Document the project for submission",
    dueDate: "2026-08-08",
    status: "todo",
  },
  {
    id: 5,
    title: "Build add task form",
    description: "Create a form for adding new tasks",
    dueDate: "2026-08-04",
    status: "in-progress",
  },
  {
    id: 6,
    title: "Connect to SQLite",
    description: "Set up the database connection in Next.js",
    dueDate: "2026-08-04",
    status: "in-progress",
  },
  {
    id: 7,
    title: "Display task list",
    description: "Fetch tasks from the database and display them",
    dueDate: "2026-08-05",
    status: "in-progress",
  },
  {
    id: 8,
    title: "Set up Next.js project",
    description: "Initialise the project and install dependencies",
    dueDate: "2026-07-29",
    status: "completed",
  },
  {
    id: 9,
    title: "Create layout and UI",
    description: "Set up the basic layout and styling",
    dueDate: "2026-07-30",
    status: "completed",
  },
  {
    id: 10,
    title: "Create tasks table",
    description: "Create the tasks table in SQLite",
    dueDate: "2026-07-30",
    status: "completed",
  },
  {
    id: 11,
    title: "Add task model",
    description: "Define the Task type and validation",
    dueDate: "2026-07-31",
    status: "completed",
  },
  {
    id: 12,
    title: "Test database connection",
    description: "Verify the database can be queried",
    dueDate: "2026-07-31",
    status: "completed",
  },
];

const emptyForm: TaskForm = {
  title: "",
  description: "",
  dueDate: "",
  status: "todo",
};

function formatDate(date: string) {
  if (!date) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [form, setForm] = useState<TaskForm>(emptyForm);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task) => task.status === "completed",
  ).length;
  const activeTasks = totalTasks - completedTasks;

  const filteredTasks = tasks.filter((task) => {
    if (filter === "active") {
      return task.status !== "completed";
    }

    if (filter === "completed") {
      return task.status === "completed";
    }

    return true;
  });

  const displayedStatuses: TaskStatus[] =
    filter === "active"
      ? ["todo", "in-progress"]
      : filter === "completed"
        ? ["completed"]
        : ["todo", "in-progress", "completed"];

  const boardClass =
    displayedStatuses.length === 1
      ? `${styles.board} ${styles.oneColumn}`
      : displayedStatuses.length === 2
        ? `${styles.board} ${styles.twoColumns}`
        : `${styles.board} ${styles.threeColumns}`;

  function openAddModal(status: TaskStatus = "todo") {
    setEditingTaskId(null);
    setForm({
      ...emptyForm,
      status,
    });
    setIsModalOpen(true);
  }

  function openEditModal(task: Task) {
    setEditingTaskId(task.id);
    setForm({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      status: task.status,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingTaskId(null);
    setForm(emptyForm);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    const description = form.description.trim();

    if (!title) {
      return;
    }

    if (editingTaskId !== null) {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === editingTaskId
            ? {
                ...task,
                title,
                description,
                dueDate: form.dueDate,
                status: form.status,
              }
            : task,
        ),
      );
    } else {
      const newTask: Task = {
        id: Date.now(),
        title,
        description,
        dueDate: form.dueDate,
        status: form.status,
      };

      setTasks((currentTasks) => [...currentTasks, newTask]);
    }

    closeModal();
  }

  function toggleCompleted(task: Task) {
    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === task.id
          ? {
              ...currentTask,
              status:
                currentTask.status === "completed" ? "todo" : "completed",
            }
          : currentTask,
      ),
    );
  }

  function deleteTask(taskId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?",
    );

    if (!confirmed) {
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId),
    );
  }

  function getTasksByStatus(status: TaskStatus) {
    return filteredTasks.filter((task) => task.status === status);
  }

  function getColumnDetails(status: TaskStatus) {
    if (status === "in-progress") {
      return {
        title: "In Progress",
        icon: <Clock3 size={18} />,
        colourClass: styles.orange,
      };
    }

    if (status === "completed") {
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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>
              <Check size={22} strokeWidth={3} />
            </span>
            <span>My Todo</span>
          </div>

          <button
            className={styles.primaryButton}
            onClick={() => openAddModal()}
            type="button"
          >
            <Plus size={18} />
            Add Task
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.statsGrid}>
          <article className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.purpleBackground}`}>
              <ListTodo size={27} />
            </div>

            <div>
              <p className={styles.statLabel}>Total Tasks</p>
              <p className={`${styles.statNumber} ${styles.purpleText}`}>
                {totalTasks}
              </p>
              <p className={styles.statDescription}>All tasks in your list</p>
            </div>
          </article>

          <article className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.orangeBackground}`}>
              <Clock3 size={27} />
            </div>

            <div>
              <p className={styles.statLabel}>Active Tasks</p>
              <p className={`${styles.statNumber} ${styles.orangeText}`}>
                {activeTasks}
              </p>
              <p className={styles.statDescription}>Tasks still in progress</p>
            </div>
          </article>

          <article className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.greenBackground}`}>
              <CheckCircle2 size={27} />
            </div>

            <div>
              <p className={styles.statLabel}>Completed Tasks</p>
              <p className={`${styles.statNumber} ${styles.greenText}`}>
                {completedTasks}
              </p>
              <p className={styles.statDescription}>
                Tasks you have completed
              </p>
            </div>
          </article>
        </section>

        <section className={styles.filters} aria-label="Task filters">
          <button
            className={`${styles.filterButton} ${
              filter === "all" ? styles.activeFilter : ""
            }`}
            onClick={() => setFilter("all")}
            aria-pressed={filter === "all"}
            type="button"
          >
            <ListTodo size={17} />
            All
          </button>

          <button
            className={`${styles.filterButton} ${
              filter === "active" ? styles.activeFilter : ""
            }`}
            onClick={() => setFilter("active")}
            aria-pressed={filter === "active"}
            type="button"
          >
            <Circle size={17} />
            Active
          </button>

          <button
            className={`${styles.filterButton} ${
              filter === "completed" ? styles.activeFilter : ""
            }`}
            onClick={() => setFilter("completed")}
            aria-pressed={filter === "completed"}
            type="button"
          >
            <CheckCircle2 size={17} />
            Completed
          </button>
        </section>

        <section className={boardClass}>
          {displayedStatuses.map((status) => {
            const column = getColumnDetails(status);
            const columnTasks = getTasksByStatus(status);

            return (
              <article className={styles.column} key={status}>
                <div className={styles.columnHeader}>
                  <div className={styles.columnHeading}>
                    <span
                      className={`${styles.columnIcon} ${column.colourClass}`}
                    >
                      {column.icon}
                    </span>

                    <h2>{column.title}</h2>

                    <span
                      className={`${styles.countBadge} ${column.colourClass}`}
                    >
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                <div className={styles.taskList}>
                  {columnTasks.length === 0 && (
                    <div className={styles.emptyState}>
                      <CheckSquare2 size={30} />
                      <p>No tasks in this section</p>
                    </div>
                  )}

                  {columnTasks.map((task) => (
                    <div className={styles.taskCard} key={task.id}>
                      <div className={styles.taskTop}>
                        <button
                          className={`${styles.checkbox} ${
                            task.status === "completed"
                              ? styles.checkedCheckbox
                              : ""
                          }`}
                          onClick={() => toggleCompleted(task)}
                          aria-label={
                            task.status === "completed"
                              ? `Mark ${task.title} as active`
                              : `Mark ${task.title} as completed`
                          }
                          type="button"
                        >
                          {task.status === "completed" && (
                            <Check size={14} strokeWidth={3} />
                          )}
                        </button>

                        <div className={styles.taskContent}>
                          <h3
                            className={
                              task.status === "completed"
                                ? styles.completedTitle
                                : ""
                            }
                          >
                            {task.title}
                          </h3>

                          {task.description && <p>{task.description}</p>}
                        </div>
                      </div>

                      <div className={styles.taskBottom}>
                        <span
                          className={`${styles.date} ${column.colourClass}`}
                        >
                          <CalendarDays size={14} />
                          {formatDate(task.dueDate)}
                        </span>

                        <div className={styles.taskActions}>
                          <button
                            className={styles.iconButton}
                            onClick={() => openEditModal(task)}
                            aria-label={`Edit ${task.title}`}
                            type="button"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            className={`${styles.iconButton} ${styles.deleteButton}`}
                            onClick={() => deleteTask(task.id)}
                            aria-label={`Delete ${task.title}`}
                            type="button"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className={`${styles.addColumnButton} ${column.colourClass}`}
                  onClick={() => openAddModal(status)}
                  type="button"
                >
                  <Plus size={18} />
                  Add Task
                </button>
              </article>
            );
          })}
        </section>
      </main>

      {isModalOpen && (
        <div
          className={styles.modalOverlay}
          onMouseDown={closeModal}
          role="presentation"
        >
          <div
            className={styles.modal}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-modal-title"
          >
            <div className={styles.modalHeader}>
              <h2 id="task-modal-title">
                {editingTaskId === null ? "Add New Task" : "Edit Task"}
              </h2>

              <button
                className={styles.closeButton}
                onClick={closeModal}
                aria-label="Close task form"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.formGroup}>
                <span>Title</span>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      title: event.target.value,
                    }))
                  }
                  placeholder="e.g. Build task list page"
                  required
                  autoFocus
                />
              </label>

              <label className={styles.formGroup}>
                <span>Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      description: event.target.value,
                    }))
                  }
                  placeholder="e.g. Display all tasks from the database"
                  rows={4}
                />
              </label>

              <div className={styles.formRow}>
                <label className={styles.formGroup}>
                  <span>Due Date</span>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        dueDate: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className={styles.formGroup}>
                  <span>Status</span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        status: event.target.value as TaskStatus,
                      }))
                    }
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
              </div>

              <div className={styles.formActions}>
                <button
                  className={styles.secondaryButton}
                  onClick={closeModal}
                  type="button"
                >
                  Cancel
                </button>

                <button className={styles.primaryButton} type="submit">
                  {editingTaskId === null ? "Add Task" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

## 3. Create `app/page.module.css`

Create this file in the same folder as `page.tsx`.

```css
:global(*) {
  box-sizing: border-box;
}

:global(html) {
  background: #f7f8fc;
}

:global(body) {
  margin: 0;
  background:
    radial-gradient(circle at top left, rgba(103, 66, 230, 0.035), transparent 30%),
    #f7f8fc;
  color: #171824;
  font-family:
    Arial,
    Helvetica,
    sans-serif;
}

:global(button),
:global(input),
:global(textarea),
:global(select) {
  font: inherit;
}

:global(button) {
  cursor: pointer;
}

.page {
  min-height: 100vh;
}

.header {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid #e8e9ef;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
}

.headerInner {
  width: min(1500px, calc(100% - 48px));
  min-height: 86px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 25px;
  font-weight: 750;
  letter-spacing: -0.6px;
}

.logoIcon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: white;
  background: linear-gradient(145deg, #7453ed, #4d25d4);
  box-shadow: 0 8px 20px rgba(91, 51, 218, 0.25);
}

.primaryButton {
  min-height: 44px;
  padding: 0 20px;
  border: none;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: white;
  background: linear-gradient(135deg, #6d43e6, #4f25d3);
  font-weight: 700;
  box-shadow: 0 7px 18px rgba(83, 43, 204, 0.2);
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;
}

.primaryButton:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(83, 43, 204, 0.28);
}

.primaryButton:active {
  transform: translateY(0);
}

.main {
  width: min(1500px, calc(100% - 48px));
  margin: 0 auto;
  padding: 24px 0 60px;
}

.statsGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.statCard {
  min-height: 135px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 22px;
  border: 1px solid #e7e8ef;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 4px 15px rgba(27, 28, 37, 0.035);
}

.statIcon {
  width: 70px;
  height: 70px;
  flex: 0 0 70px;
  display: grid;
  place-items: center;
  border-radius: 50%;
}

.purpleBackground {
  color: #6240dc;
  background: #f0ecff;
}

.orangeBackground {
  color: #f08b00;
  background: #fff3df;
}

.greenBackground {
  color: #198d3b;
  background: #eaf8ed;
}

.statLabel {
  margin: 0 0 6px;
  color: #323341;
  font-size: 16px;
  font-weight: 700;
}

.statNumber {
  margin: 0 0 7px;
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
}

.purpleText {
  color: #5b30df;
}

.orangeText {
  color: #ec8500;
}

.greenText {
  color: #16863a;
}

.statDescription {
  margin: 0;
  color: #747684;
  font-size: 14px;
}

.filters {
  min-height: 68px;
  margin: 18px 0;
  padding: 11px 28px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e7e8ef;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.94);
}

.filterButton {
  min-height: 42px;
  padding: 0 20px;
  border: 1px solid transparent;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: #4a4c59;
  background: transparent;
  font-weight: 650;
  transition:
    color 160ms ease,
    background 160ms ease,
    transform 160ms ease;
}

.filterButton:hover {
  color: #5b32dc;
  background: #f4f1ff;
}

.activeFilter {
  color: white;
  background: linear-gradient(135deg, #6d43e6, #4f25d3);
  box-shadow: 0 6px 15px rgba(83, 43, 204, 0.2);
}

.activeFilter:hover {
  color: white;
  background: linear-gradient(135deg, #6d43e6, #4f25d3);
}

.board {
  display: grid;
  align-items: start;
  gap: 20px;
}

.threeColumns {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.twoColumns {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.oneColumn {
  grid-template-columns: minmax(0, 1fr);
  max-width: 700px;
}

.column {
  padding: 16px;
  border: 1px solid #e4e5ec;
  border-radius: 16px;
  background: rgba(250, 250, 253, 0.9);
  box-shadow: 0 4px 14px rgba(20, 21, 29, 0.035);
}

.columnHeader {
  padding: 2px 4px 14px;
}

.columnHeading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.columnHeading h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 750;
}

.columnIcon {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: white;
}

.countBadge {
  min-width: 30px;
  height: 26px;
  padding: 0 9px;
  display: inline-grid;
  place-items: center;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 800;
  background: white;
}

.purple {
  color: #653edf;
}

.orange {
  color: #f08b00;
}

.green {
  color: #178c3d;
}

.taskList {
  display: grid;
  gap: 1px;
  overflow: hidden;
  border: 1px solid #e0e1e8;
  border-radius: 12px;
  background: #e0e1e8;
}

.taskCard {
  min-height: 128px;
  padding: 17px;
  background: white;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;
}

.taskCard:hover {
  position: relative;
  z-index: 2;
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(25, 26, 34, 0.08);
}

.taskTop {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.checkbox {
  width: 21px;
  height: 21px;
  flex: 0 0 21px;
  margin-top: 1px;
  padding: 0;
  display: grid;
  place-items: center;
  border: 1.5px solid #a8acb8;
  border-radius: 5px;
  color: white;
  background: white;
}

.checkbox:hover {
  border-color: #6841df;
}

.checkedCheckbox {
  border-color: #0f8b78;
  background: #0f8b78;
}

.taskContent {
  min-width: 0;
}

.taskContent h3 {
  margin: 0 0 7px;
  color: #282934;
  font-size: 15px;
  font-weight: 750;
  line-height: 1.3;
}

.taskContent h3.completedTitle {
  color: #858794;
  text-decoration: line-through;
}

.taskContent p {
  margin: 0;
  overflow: hidden;
  color: #7c7e8b;
  font-size: 13px;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.taskBottom {
  margin-top: 16px;
  padding-left: 35px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.date {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
}

.taskActions {
  display: flex;
  gap: 5px;
}

.iconButton {
  width: 30px;
  height: 30px;
  padding: 0;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 7px;
  color: #5b5d69;
  background: transparent;
  transition:
    color 160ms ease,
    background 160ms ease;
}

.iconButton:hover {
  color: #5830d8;
  background: #f1edff;
}

.deleteButton:hover {
  color: #d43a4a;
  background: #fff0f2;
}

.addColumnButton {
  margin-top: 10px;
  padding: 10px 7px;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: transparent;
  font-weight: 750;
}

.emptyState {
  min-height: 150px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  color: #989aa5;
  background: white;
  text-align: center;
}

.emptyState p {
  margin: 0;
  font-size: 14px;
}

.modalOverlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  padding: 24px;
  display: grid;
  place-items: center;
  overflow-y: auto;
  background: rgba(21, 17, 36, 0.38);
  backdrop-filter: blur(3px);
}

.modal {
  width: min(500px, 100%);
  border: 1px solid #e1e2e9;
  border-radius: 15px;
  background: white;
  box-shadow: 0 24px 70px rgba(24, 17, 51, 0.25);
  animation: modalEnter 180ms ease-out;
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modalHeader {
  padding: 20px 22px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modalHeader h2 {
  margin: 0;
  font-size: 18px;
}

.closeButton {
  width: 34px;
  height: 34px;
  padding: 0;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 8px;
  color: #696b78;
  background: transparent;
}

.closeButton:hover {
  color: #252631;
  background: #f1f2f6;
}

.form {
  padding: 4px 22px 22px;
}

.formGroup {
  display: grid;
  gap: 7px;
  margin-bottom: 16px;
}

.formGroup span {
  color: #343541;
  font-size: 13px;
  font-weight: 750;
}

.formGroup input,
.formGroup textarea,
.formGroup select {
  width: 100%;
  border: 1px solid #dfe1e8;
  border-radius: 8px;
  outline: none;
  color: #242530;
  background: white;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.formGroup input,
.formGroup select {
  height: 44px;
  padding: 0 12px;
}

.formGroup textarea {
  min-height: 100px;
  padding: 12px;
  resize: vertical;
}

.formGroup input:focus,
.formGroup textarea:focus,
.formGroup select:focus {
  border-color: #7755e8;
  box-shadow: 0 0 0 3px rgba(105, 65, 223, 0.11);
}

.formGroup input::placeholder,
.formGroup textarea::placeholder {
  color: #aaacb6;
}

.formRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.formActions {
  padding-top: 5px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.secondaryButton {
  min-height: 44px;
  padding: 0 20px;
  border: 1px solid #dedfe6;
  border-radius: 9px;
  color: #666875;
  background: white;
  font-weight: 700;
}

.secondaryButton:hover {
  background: #f6f6f9;
}

@media (max-width: 1100px) {
  .threeColumns {
    grid-template-columns: 1fr;
  }

  .twoColumns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 850px) {
  .statsGrid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .statCard {
    min-height: 110px;
  }
}

@media (max-width: 620px) {
  .headerInner,
  .main {
    width: min(100% - 28px, 1500px);
  }

  .headerInner {
    min-height: 72px;
  }

  .logo {
    font-size: 20px;
  }

  .logoIcon {
    width: 34px;
    height: 34px;
  }

  .header .primaryButton {
    min-width: 44px;
    padding: 0 12px;
    font-size: 0;
  }

  .header .primaryButton svg {
    width: 20px;
    height: 20px;
  }

  .main {
    padding-top: 16px;
  }

  .statCard {
    padding: 18px;
  }

  .statIcon {
    width: 58px;
    height: 58px;
    flex-basis: 58px;
  }

  .filters {
    padding: 8px;
    overflow-x: auto;
  }

  .filterButton {
    flex: 1 0 auto;
    justify-content: center;
    padding: 0 13px;
  }

  .column {
    padding: 12px;
  }

  .taskBottom {
    padding-left: 0;
  }

  .formRow {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .formActions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
```

## 4. Start the application

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Important for your lab

This version uses:

```tsx
const [tasks, setTasks] = useState<Task[]>(initialTasks);
```

That means tasks will reset when the page refreshes. The eventual database version should:

- `GET /api/tasks` when the page loads
- `POST /api/tasks` when adding
- `PUT /api/tasks/[id]` when editing or completing
- `DELETE /api/tasks/[id]` when deleting

The design and component structure can remain the same; only the four task-handling functions need to be connected to your SQLite API.

## Prompt:
29/07/2026, 17:26:44

we are not allowed to use divs or spans

## Response:
29/07/2026, 17:27:13

> **Planning semantic markup**
>
> I’m restructuring the interface around labels, buttons, headings, sections, lists, and articles instead of generic containers. I’m also checking whether icon components remain acceptable, since they’re third-party elements rather than `div` or `span` tags.
>
> **Planned semantic markup**
>
> 
>
> Worked for 43s

You’re right. The page should use **semantic HTML elements** such as `header`, `main`, `section`, `article`, `nav`, `ul`, `li`, `footer`, `form`, and `aside`.

Below is a corrected `page.tsx` that contains **no `<div>` or `<span>` elements**.

## Replace `app/page.tsx`

```tsx
"use client";

import { FormEvent, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  ListTodo,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import styles from "./page.module.css";

type TaskStatus = "todo" | "in-progress" | "completed";
type TaskFilter = "all" | "active" | "completed";

type Task = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
};

type TaskForm = {
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
};

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Design landing page",
    description: "Create the initial landing page for the app",
    dueDate: "2026-08-05",
    status: "todo",
  },
  {
    id: 2,
    title: "Add database schema",
    description: "Create SQLite tables for tasks",
    dueDate: "2026-08-06",
    status: "todo",
  },
  {
    id: 3,
    title: "Implement task filters",
    description: "Add All, Active and Completed filters",
    dueDate: "2026-08-07",
    status: "todo",
  },
  {
    id: 4,
    title: "Write README",
    description: "Document the project for submission",
    dueDate: "2026-08-08",
    status: "todo",
  },
  {
    id: 5,
    title: "Build add task form",
    description: "Create a form to add new tasks",
    dueDate: "2026-08-04",
    status: "in-progress",
  },
  {
    id: 6,
    title: "Connect to SQLite",
    description: "Set up the database connection in Next.js",
    dueDate: "2026-08-04",
    status: "in-progress",
  },
  {
    id: 7,
    title: "Display tasks list",
    description: "Fetch tasks from the database and display them",
    dueDate: "2026-08-05",
    status: "in-progress",
  },
  {
    id: 8,
    title: "Set up Next.js project",
    description: "Initialise the project and install dependencies",
    dueDate: "2026-07-29",
    status: "completed",
  },
  {
    id: 9,
    title: "Create layout and UI",
    description: "Set up the basic layout and styling",
    dueDate: "2026-07-30",
    status: "completed",
  },
  {
    id: 10,
    title: "Create tasks table",
    description: "Create the tasks table in SQLite",
    dueDate: "2026-07-30",
    status: "completed",
  },
  {
    id: 11,
    title: "Add task model",
    description: "Define the Task type and validation",
    dueDate: "2026-07-31",
    status: "completed",
  },
  {
    id: 12,
    title: "Test database connection",
    description: "Verify the database can be queried",
    dueDate: "2026-07-31",
    status: "completed",
  },
];

const emptyForm: TaskForm = {
  title: "",
  description: "",
  dueDate: "",
  status: "todo",
};

function formatDate(date: string) {
  if (!date) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [form, setForm] = useState<TaskForm>(emptyForm);

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "completed",
  ).length;

  const activeTasks = totalTasks - completedTasks;

  const filteredTasks = tasks.filter((task) => {
    if (filter === "active") {
      return task.status !== "completed";
    }

    if (filter === "completed") {
      return task.status === "completed";
    }

    return true;
  });

  const displayedStatuses: TaskStatus[] =
    filter === "active"
      ? ["todo", "in-progress"]
      : filter === "completed"
        ? ["completed"]
        : ["todo", "in-progress", "completed"];

  const boardClass =
    displayedStatuses.length === 1
      ? `${styles.board} ${styles.oneColumn}`
      : displayedStatuses.length === 2
        ? `${styles.board} ${styles.twoColumns}`
        : `${styles.board} ${styles.threeColumns}`;

  function openAddModal(status: TaskStatus = "todo") {
    setEditingTaskId(null);

    setForm({
      ...emptyForm,
      status,
    });

    setIsModalOpen(true);
  }

  function openEditModal(task: Task) {
    setEditingTaskId(task.id);

    setForm({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      status: task.status,
    });

    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingTaskId(null);
    setForm(emptyForm);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    const description = form.description.trim();

    if (!title) {
      return;
    }

    if (editingTaskId !== null) {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === editingTaskId
            ? {
                ...task,
                title,
                description,
                dueDate: form.dueDate,
                status: form.status,
              }
            : task,
        ),
      );
    } else {
      const newTask: Task = {
        id: Date.now(),
        title,
        description,
        dueDate: form.dueDate,
        status: form.status,
      };

      setTasks((currentTasks) => [...currentTasks, newTask]);
    }

    closeModal();
  }

  function toggleCompleted(task: Task) {
    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === task.id
          ? {
              ...currentTask,
              status:
                currentTask.status === "completed" ? "todo" : "completed",
            }
          : currentTask,
      ),
    );
  }

  function deleteTask(taskId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?",
    );

    if (!confirmed) {
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId),
    );
  }

  function getTasksByStatus(status: TaskStatus) {
    return filteredTasks.filter((task) => task.status === status);
  }

  function getColumnDetails(status: TaskStatus) {
    if (status === "in-progress") {
      return {
        title: "In Progress",
        icon: <Clock3 size={18} />,
        colourClass: styles.orange,
      };
    }

    if (status === "completed") {
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

  return (
    <>
      <header className={styles.header}>
        <nav className={styles.headerInner} aria-label="Main navigation">
          <h1 className={styles.logo}>
            <strong className={styles.logoIcon} aria-hidden="true">
              <Check size={22} strokeWidth={3} />
            </strong>

            My Todo
          </h1>

          <button
            className={styles.primaryButton}
            onClick={() => openAddModal()}
            type="button"
          >
            <Plus size={18} />
            Add Task
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.statsGrid} aria-label="Task summary">
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
        </section>

        <nav className={styles.filters} aria-label="Task filters">
          <button
            className={`${styles.filterButton} ${
              filter === "all" ? styles.activeFilter : ""
            }`}
            onClick={() => setFilter("all")}
            aria-pressed={filter === "all"}
            type="button"
          >
            <ListTodo size={17} />
            All
          </button>

          <button
            className={`${styles.filterButton} ${
              filter === "active" ? styles.activeFilter : ""
            }`}
            onClick={() => setFilter("active")}
            aria-pressed={filter === "active"}
            type="button"
          >
            <Circle size={17} />
            Active
          </button>

          <button
            className={`${styles.filterButton} ${
              filter === "completed" ? styles.activeFilter : ""
            }`}
            onClick={() => setFilter("completed")}
            aria-pressed={filter === "completed"}
            type="button"
          >
            <CheckCircle2 size={17} />
            Completed
          </button>
        </nav>

        <section className={boardClass} aria-label="Task board">
          {displayedStatuses.map((status) => {
            const column = getColumnDetails(status);
            const columnTasks = getTasksByStatus(status);

            return (
              <article className={styles.column} key={status}>
                <header className={styles.columnHeader}>
                  <section className={styles.columnHeading}>
                    <figure
                      className={`${styles.columnIcon} ${column.colourClass}`}
                      aria-hidden="true"
                    >
                      {column.icon}
                    </figure>

                    <h2>{column.title}</h2>

                    <output
                      className={`${styles.countBadge} ${column.colourClass}`}
                      aria-label={`${columnTasks.length} tasks`}
                    >
                      {columnTasks.length}
                    </output>
                  </section>
                </header>

                <ul className={styles.taskList}>
                  {columnTasks.length === 0 && (
                    <li className={styles.emptyState}>
                      <CheckCircle2 size={30} aria-hidden="true" />

                      <p>No tasks in this section</p>
                    </li>
                  )}

                  {columnTasks.map((task) => (
                    <li className={styles.taskCard} key={task.id}>
                      <header className={styles.taskTop}>
                        <button
                          className={`${styles.checkbox} ${
                            task.status === "completed"
                              ? styles.checkedCheckbox
                              : ""
                          }`}
                          onClick={() => toggleCompleted(task)}
                          aria-label={
                            task.status === "completed"
                              ? `Mark ${task.title} as active`
                              : `Mark ${task.title} as completed`
                          }
                          type="button"
                        >
                          {task.status === "completed" && (
                            <Check size={14} strokeWidth={3} />
                          )}
                        </button>

                        <section className={styles.taskContent}>
                          <h3
                            className={
                              task.status === "completed"
                                ? styles.completedTitle
                                : ""
                            }
                          >
                            {task.title}
                          </h3>

                          {task.description && <p>{task.description}</p>}
                        </section>
                      </header>

                      <footer className={styles.taskBottom}>
                        <time
                          className={`${styles.date} ${column.colourClass}`}
                          dateTime={task.dueDate}
                        >
                          <CalendarDays size={14} aria-hidden="true" />
                          {formatDate(task.dueDate)}
                        </time>

                        <menu className={styles.taskActions}>
                          <li>
                            <button
                              className={styles.iconButton}
                              onClick={() => openEditModal(task)}
                              aria-label={`Edit ${task.title}`}
                              type="button"
                            >
                              <Pencil size={16} />
                            </button>
                          </li>

                          <li>
                            <button
                              className={`${styles.iconButton} ${styles.deleteButton}`}
                              onClick={() => deleteTask(task.id)}
                              aria-label={`Delete ${task.title}`}
                              type="button"
                            >
                              <Trash2 size={16} />
                            </button>
                          </li>
                        </menu>
                      </footer>
                    </li>
                  ))}
                </ul>

                <footer>
                  <button
                    className={`${styles.addColumnButton} ${column.colourClass}`}
                    onClick={() => openAddModal(status)}
                    type="button"
                  >
                    <Plus size={18} />
                    Add Task
                  </button>
                </footer>
              </article>
            );
          })}
        </section>
      </main>

      {isModalOpen && (
        <aside
          className={styles.modalOverlay}
          onMouseDown={closeModal}
          aria-label="Task form overlay"
        >
          <section
            className={styles.modal}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-modal-title"
          >
            <header className={styles.modalHeader}>
              <h2 id="task-modal-title">
                {editingTaskId === null ? "Add New Task" : "Edit Task"}
              </h2>

              <button
                className={styles.closeButton}
                onClick={closeModal}
                aria-label="Close task form"
                type="button"
              >
                <X size={20} />
              </button>
            </header>

            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.formGroup}>
                <strong>Title</strong>

                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      title: event.target.value,
                    }))
                  }
                  placeholder="e.g. Build task list page"
                  required
                  autoFocus
                />
              </label>

              <label className={styles.formGroup}>
                <strong>Description</strong>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      description: event.target.value,
                    }))
                  }
                  placeholder="e.g. Display all tasks from the database"
                  rows={4}
                />
              </label>

              <fieldset className={styles.formRow}>
                <legend className={styles.visuallyHidden}>
                  Task details
                </legend>

                <label className={styles.formGroup}>
                  <strong>Due Date</strong>

                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        dueDate: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className={styles.formGroup}>
                  <strong>Status</strong>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        status: event.target.value as TaskStatus,
                      }))
                    }
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
              </fieldset>

              <footer className={styles.formActions}>
                <button
                  className={styles.secondaryButton}
                  onClick={closeModal}
                  type="button"
                >
                  Cancel
                </button>

                <button className={styles.primaryButton} type="submit">
                  {editingTaskId === null ? "Add Task" : "Save Changes"}
                </button>
              </footer>
            </form>
          </section>
        </aside>
      )}
    </>
  );
}
```

## Make these CSS changes

Most of the previous CSS can stay because CSS classes can be placed on any HTML element.

Add these resets near the top of `page.module.css`:

```css
:global(ul),
:global(menu),
:global(figure),
:global(fieldset) {
  margin: 0;
  padding: 0;
}

:global(ul),
:global(menu) {
  list-style: none;
}

:global(fieldset) {
  min-width: 0;
  border: 0;
}
```

Update `.logo` to remove the default heading margin:

```css
.logo {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 25px;
  font-weight: 750;
  letter-spacing: -0.6px;
}
```

Add this so the number output displays properly:

```css
.statContent {
  display: grid;
}

.statNumber {
  display: block;
  margin: 0 0 7px;
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
}
```

Change this existing selector:

```css
.formGroup span {
```

to:

```css
.formGroup strong {
  color: #343541;
  font-size: 13px;
  font-weight: 750;
}
```

Add the visually hidden class for the `fieldset` legend:

```css
.visuallyHidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  white-space: nowrap;
  border: 0;
  clip: rect(0, 0, 0, 0);
}
```

Because the action buttons are now inside a semantic `<menu>`, update the task actions:

```css
.taskActions {
  margin: 0;
  padding: 0;
  display: flex;
  gap: 5px;
}
```

This version uses:

- `header` for the page and task headings
- `nav` for navigation and filters
- `main` for the main content
- `section` for grouped content
- `article` for cards and columns
- `ul` and `li` for task lists
- `footer` for card actions
- `time` for due dates
- `output` for calculated totals
- `aside` for the modal overlay
- `fieldset` for related form fields

There are no `div` or `span` elements in the component.

## Prompt:
29/07/2026, 17:40:08

the lab requires the list to be sorted by topic, status and by due date - this version only sorts by status and due date - what can we do to ensure it is sorted by topic

## Response:
29/07/2026, 17:40:11

> **Designing sort controls**
>
> I’m adding a `topic` field, topic selection in the task form, topic badges on cards, and a compact sort control for topic, status, or due date. I’ll preserve status columns while sorting cards within each column.
>
> **Designed sort controls**
>
> 
>
> **Refining task organization**
>
> I’m treating topic as task data rather than another board column. I’ll keep status as the kanban grouping, then sort cards within each column by topic and due date, with topic badges for quick scanning.
>
> **Refined task organization**
>
> 
>
> Worked for 47s

The cleanest solution is to treat **topic as a property of each task**, rather than creating another board column.

Your board will then be organised as:

1. **Status** — the existing To Do, In Progress and Completed columns.
2. **Topic** — tasks inside each column are grouped alphabetically by topic.
3. **Due date** — tasks with the same topic are ordered from earliest to latest.

For example, a To Do column could appear in this order:

```text
Database
  Add database schema       2 August
  Connect database          5 August

Development
  Build task page           3 August
  Add task filters          7 August

Documentation
  Write README              8 August
```

## 1. Add a topic type

Add this near your existing types:

```tsx
type TaskStatus = "todo" | "in-progress" | "completed";

type TaskTopic =
  | "Database"
  | "Development"
  | "Documentation"
  | "Testing";
```

Then update your `Task` type:

```tsx
type Task = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  topic: TaskTopic;
};
```

Update `TaskForm` as well:

```tsx
type TaskForm = {
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  topic: TaskTopic;
};
```

## 2. Update the empty form

```tsx
const emptyForm: TaskForm = {
  title: "",
  description: "",
  dueDate: "",
  status: "todo",
  topic: "Development",
};
```

## 3. Give every task a topic

Update your initial task data:

```tsx
const initialTasks: Task[] = [
  {
    id: 1,
    title: "Design landing page",
    description: "Create the initial landing page for the app",
    dueDate: "2026-08-05",
    status: "todo",
    topic: "Development",
  },
  {
    id: 2,
    title: "Add database schema",
    description: "Create SQLite tables for tasks",
    dueDate: "2026-08-06",
    status: "todo",
    topic: "Database",
  },
  {
    id: 3,
    title: "Implement task filters",
    description: "Add All, Active and Completed filters",
    dueDate: "2026-08-07",
    status: "todo",
    topic: "Development",
  },
  {
    id: 4,
    title: "Write README",
    description: "Document the project for submission",
    dueDate: "2026-08-08",
    status: "todo",
    topic: "Documentation",
  },
  {
    id: 5,
    title: "Build add task form",
    description: "Create a form to add new tasks",
    dueDate: "2026-08-04",
    status: "in-progress",
    topic: "Development",
  },
  {
    id: 6,
    title: "Connect to SQLite",
    description: "Set up the database connection in Next.js",
    dueDate: "2026-08-04",
    status: "in-progress",
    topic: "Database",
  },
  {
    id: 7,
    title: "Display tasks list",
    description: "Fetch tasks from the database and display them",
    dueDate: "2026-08-05",
    status: "in-progress",
    topic: "Development",
  },
  {
    id: 8,
    title: "Set up Next.js project",
    description: "Initialise the project and install dependencies",
    dueDate: "2026-07-29",
    status: "completed",
    topic: "Development",
  },
  {
    id: 9,
    title: "Create layout and UI",
    description: "Set up the basic layout and styling",
    dueDate: "2026-07-30",
    status: "completed",
    topic: "Development",
  },
  {
    id: 10,
    title: "Create tasks table",
    description: "Create the tasks table in SQLite",
    dueDate: "2026-07-30",
    status: "completed",
    topic: "Database",
  },
  {
    id: 11,
    title: "Add task model",
    description: "Define the Task type and validation",
    dueDate: "2026-07-31",
    status: "completed",
    topic: "Database",
  },
  {
    id: 12,
    title: "Test database connection",
    description: "Verify the database can be queried",
    dueDate: "2026-07-31",
    status: "completed",
    topic: "Testing",
  },
];
```

## 4. Add the sorting function

Place this outside your component, below `formatDate`:

```tsx
const statusOrder: Record<TaskStatus, number> = {
  todo: 1,
  "in-progress": 2,
  completed: 3,
};

function getDueDateValue(dueDate: string) {
  if (!dueDate) {
    return Number.MAX_SAFE_INTEGER;
  }

  return new Date(`${dueDate}T00:00:00`).getTime();
}

function sortTasks(taskA: Task, taskB: Task) {
  const statusComparison =
    statusOrder[taskA.status] - statusOrder[taskB.status];

  if (statusComparison !== 0) {
    return statusComparison;
  }

  const topicComparison = taskA.topic.localeCompare(taskB.topic);

  if (topicComparison !== 0) {
    return topicComparison;
  }

  return (
    getDueDateValue(taskA.dueDate) -
    getDueDateValue(taskB.dueDate)
  );
}
```

This sorting function uses the following priority:

```text
Status → Topic → Due date
```

Tasks without a due date are placed last.

## 5. Update `getTasksByStatus`

Replace your existing function:

```tsx
function getTasksByStatus(status: TaskStatus) {
  return filteredTasks.filter((task) => task.status === status);
}
```

With:

```tsx
function getTasksByStatus(status: TaskStatus) {
  return [...filteredTasks]
    .filter((task) => task.status === status)
    .sort(sortTasks);
}
```

The spread operator creates a copy before sorting, which prevents React state from being modified directly.

Because your board already displays the statuses in this order:

```tsx
["todo", "in-progress", "completed"]
```

the status sorting is represented by the columns, while tasks inside each column are ordered by topic and due date.

## 6. Include topic when editing a task

Update `openEditModal`:

```tsx
function openEditModal(task: Task) {
  setEditingTaskId(task.id);

  setForm({
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    status: task.status,
    topic: task.topic,
  });

  setIsModalOpen(true);
}
```

## 7. Include topic when saving a task

Inside the editing section of `handleSubmit`, include:

```tsx
topic: form.topic,
```

The completed editing object should look like this:

```tsx
task.id === editingTaskId
  ? {
      ...task,
      title,
      description,
      dueDate: form.dueDate,
      status: form.status,
      topic: form.topic,
    }
  : task
```

Also update your new task object:

```tsx
const newTask: Task = {
  id: Date.now(),
  title,
  description,
  dueDate: form.dueDate,
  status: form.status,
  topic: form.topic,
};
```

## 8. Add topic to the form

Add this form field above the due date and status fields:

```tsx
<label className={styles.formGroup}>
  <strong>Topic</strong>

  <select
    value={form.topic}
    onChange={(event) =>
      setForm((currentForm) => ({
        ...currentForm,
        topic: event.target.value as TaskTopic,
      }))
    }
  >
    <option value="Database">Database</option>
    <option value="Development">Development</option>
    <option value="Documentation">Documentation</option>
    <option value="Testing">Testing</option>
  </select>
</label>
```

This uses a semantic `label` and `select`, so it does not introduce any `div` or `span` elements.

## 9. Display the topic on each task card

Inside `taskContent`, place a topic badge above the task heading:

```tsx
<section className={styles.taskContent}>
  <small className={styles.topicBadge}>
    {task.topic}
  </small>

  <h3
    className={
      task.status === "completed"
        ? styles.completedTitle
        : ""
    }
  >
    {task.title}
  </h3>

  {task.description && <p>{task.description}</p>}
</section>
```

## 10. Add the topic styling

Add this to `page.module.css`:

```css
.topicBadge {
  width: fit-content;
  margin: 0 0 7px;
  padding: 4px 8px;
  display: block;
  border-radius: 6px;
  color: #6040c9;
  background: #f0ecff;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.4px;
  line-height: 1;
  text-transform: uppercase;
}
```

You may also slightly increase the task card height:

```css
.taskCard {
  min-height: 145px;
  padding: 17px;
  background: white;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;
}
```

## What this means for the lab

The final application now meets all three sorting requirements:

- **Status:** tasks are placed in To Do, In Progress and Completed columns.
- **Topic:** tasks inside each status column are ordered alphabetically by topic.
- **Due date:** tasks belonging to the same topic are ordered from earliest to latest.

The topic must eventually also be added to your SQLite table:

```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    topic TEXT NOT NULL,
    status TEXT NOT NULL,
    due_date TEXT
);
```

That ensures the topic is stored permanently rather than existing only in the frontend.

## Prompt:
29/07/2026, 17:51:49

I think my sql is fine
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    title TEXT NOT NULL
        CHECK (length(trim(title)) > 0),

    description TEXT NOT NULL DEFAULT '',

    due_date TEXT NOT NULL,

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

CREATE INDEX IF NOT EXISTS idx_tasks_archived
    ON tasks (archived_at);

CREATE INDEX IF NOT EXISTS idx_tasks_due_date
    ON tasks (due_date);

CREATE INDEX IF NOT EXISTS idx_tasks_topic
    ON tasks (topic);

CREATE INDEX IF NOT EXISTS idx_tasks_status
    ON tasks (status);

## Response:
29/07/2026, 17:52:03

Yes, your table design is solid and already includes the required `topic`, `status`, and `due_date` fields. You do **not** need to replace it with the simpler schema I provided.

There are just a few details to be aware of.

### 1. Your frontend values must match the database exactly

Your database accepts only:

```text
Todo
In-Progress
Complete
```

Earlier, the TSX used:

```text
todo
in-progress
completed
```

Those values would fail your database `CHECK` constraint. Update the TypeScript type to:

```tsx
type TaskStatus = "Todo" | "In-Progress" | "Complete";
```

And update the form options:

```tsx
<select
  value={form.status}
  onChange={(event) =>
    setForm((currentForm) => ({
      ...currentForm,
      status: event.target.value as TaskStatus,
    }))
  }
>
  <option value="Todo">To Do</option>
  <option value="In-Progress">In Progress</option>
  <option value="Complete">Completed</option>
</select>
```

Your status checks must then also use those exact values:

```tsx
const completedTasks = tasks.filter(
  (task) => task.status === "Complete",
).length;
```

```tsx
if (filter === "active") {
  return task.status !== "Complete";
}

if (filter === "completed") {
  return task.status === "Complete";
}
```

### 2. `updated_at` will not update automatically

This:

```sql
updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
```

sets the value when the task is created, but SQLite does not automatically change it when the row is edited.

You can update it explicitly in your SQL:

```sql
UPDATE tasks
SET
    title = ?,
    description = ?,
    due_date = ?,
    topic = ?,
    status = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
```

That is usually simpler and clearer than creating a trigger.

### 3. Sort using all three required fields

For your app’s main query, you can sort directly in SQLite:

```sql
SELECT
    id,
    title,
    description,
    due_date,
    topic,
    status,
    archived_at,
    created_at,
    updated_at
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
    due_date ASC;
```

This gives you:

```text
Status → Topic → Due date
```

`COLLATE NOCASE` ensures that topics such as `Work` and `work` are sorted without case affecting their position.

However, because your interface already separates tasks into status columns, your query could instead order by:

```sql
ORDER BY
    topic COLLATE NOCASE ASC,
    due_date ASC;
```

The board columns visually provide the status ordering.

### 4. Consider a combined index

Your separate indexes are valid. Since your application will probably retrieve non-archived tasks and sort them by status, topic, and due date, a combined index could also help:

```sql
CREATE INDEX IF NOT EXISTS idx_tasks_active_sort
    ON tasks (
        archived_at,
        status,
        topic COLLATE NOCASE,
        due_date
    );
```

For a small lab application, the performance difference will be negligible, so this is optional.

### 5. Ensure dates use one format

Store `due_date` in ISO format:

```text
2026-08-05
```

This is important because SQLite text dates sort correctly when they consistently use `YYYY-MM-DD`.

Your schema is therefore fine. The main changes needed are in the frontend and queries: make the status strings match your database and use `ORDER BY topic, due_date` within each status column.

## Prompt:
29/07/2026, 17:57:37

please give me the whole schema.sql that I need to replace it with

## Response:
29/07/2026, 17:57:56

Replace your entire `schema.sql` with this:

```sql
-- schema.sql
-- SQLite schema for the Todo application

CREATE TABLE IF NOT EXISTS tasks (
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

-- Automatically update updated_at whenever task information changes

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

-- Index used when filtering active and archived tasks

CREATE INDEX IF NOT EXISTS idx_tasks_archived
    ON tasks (archived_at);

-- Index used when filtering or sorting by status

CREATE INDEX IF NOT EXISTS idx_tasks_status
    ON tasks (status);

-- Index used when filtering or sorting by topic

CREATE INDEX IF NOT EXISTS idx_tasks_topic
    ON tasks (topic COLLATE NOCASE);

-- Index used when sorting by due date

CREATE INDEX IF NOT EXISTS idx_tasks_due_date
    ON tasks (due_date);

-- Combined index for the main task-list query:
-- archived status, task status, topic and due date

CREATE INDEX IF NOT EXISTS idx_tasks_active_sort
    ON tasks (
        archived_at,
        status,
        topic COLLATE NOCASE,
        due_date
    );
```

Your main query can then meet the lab’s sorting requirement with:

```sql
SELECT
    id,
    title,
    description,
    due_date,
    topic,
    status,
    archived_at,
    created_at,
    updated_at
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
    due_date ASC;
```

This sorts tasks by:

```text
Status → Topic → Due date
```

Your TypeScript must use the same status values:

```tsx
type TaskStatus = "Todo" | "In-Progress" | "Complete";
```

One important point: `CREATE TABLE IF NOT EXISTS` will not modify an existing table. If your development database already exists and you are allowed to reset it, delete the existing `.db` file and rerun your database setup so this schema is applied from scratch.

## Prompt:
29/07/2026, 17:59:18

where do I put the main query?

## Response:
29/07/2026, 17:59:21

> **Explaining where database queries belong**
>
>
> **Searched 6 websites**
>
> 
>
> Worked for 20s

The **main `SELECT` query does not go inside `schema.sql`**. `schema.sql` creates the table, indexes, and trigger. The query for loading tasks belongs in your **tasks API route**.

For a Next.js App Router project, create or update:

```text
src/app/api/tasks/route.ts
```

Or, when your project does not have a `src` folder:

```text
app/api/tasks/route.ts
```

Next.js uses `route.ts` files inside the `app` directory for API request handlers such as `GET`, `POST`, `PUT`, and `DELETE`. ([Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/route?utm_source=chatgpt.com))

## `app/api/tasks/route.ts`

Assuming your database connection is exported from `lib/db.ts`, use:

```ts
import db from "@/lib/db";

export async function GET() {
  try {
    const tasks = db
      .prepare(
        `
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
        `,
      )
      .all();

    return Response.json(tasks);
  } catch (error) {
    console.error("Failed to retrieve tasks:", error);

    return Response.json(
      { error: "Failed to retrieve tasks" },
      { status: 500 },
    );
  }
}
```

This query sorts the returned tasks in this order:

```text
Status → Topic → Due date → Title
```

SQLite processes the expressions in an `ORDER BY` from left to right: the first expression determines the primary order, and subsequent expressions break ties. ([SQLite](https://www.sqlite.org/lang_select.html?utm_source=chatgpt.com))

## Why the query uses aliases

Your database columns use snake case:

```text
due_date
archived_at
created_at
updated_at
```

Your TypeScript interface is likely using camel case:

```text
dueDate
archivedAt
createdAt
updatedAt
```

Therefore:

```sql
due_date AS dueDate
```

lets the API return data that already matches your frontend:

```ts
type Task = {
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
```

## Your frontend then retrieves the sorted tasks

In your page or task component:

```tsx
async function loadTasks() {
  const response = await fetch("/api/tasks");

  if (!response.ok) {
    throw new Error("Failed to load tasks");
  }

  const taskData: Task[] = await response.json();
  setTasks(taskData);
}
```

The structure should therefore look approximately like this:

```text
src/
├── app/
│   ├── api/
│   │   └── tasks/
│   │       └── route.ts       ← SELECT query goes here
│   ├── page.tsx
│   └── page.module.css
│
├── lib/
│   └── db.ts                  ← SQLite connection
│
└── database/
    └── schema.sql             ← CREATE TABLE and indexes
```

Your `schema.sql` remains unchanged. Only the SQL used to **retrieve the tasks** belongs in the `GET` function.

---

**Sources:**

- [File-system conventions: route.js | Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/route?utm_source=chatgpt.com)
- [SELECT](https://www.sqlite.org/lang_select.html?utm_source=chatgpt.com)

## Prompt:
29/07/2026, 18:00:46

do I have to put the main query there

## Response:
29/07/2026, 18:00:54

No. You do **not** have to place the query directly inside `app/api/tasks/route.ts`.

The query only needs to run wherever your application retrieves tasks from SQLite. A cleaner structure is to place the SQL in a database helper function, then call that function from the API route.

For example:

### `src/lib/tasks.ts`

```ts
import db from "@/lib/db";

export function getTasks() {
  return db
    .prepare(
      `
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
        due_date ASC
      `,
    )
    .all();
}
```

Then your API route stays simple:

### `src/app/api/tasks/route.ts`

```ts
import { getTasks } from "@/lib/tasks";

export async function GET() {
  try {
    const tasks = getTasks();

    return Response.json(tasks);
  } catch (error) {
    console.error("Failed to retrieve tasks:", error);

    return Response.json(
      { error: "Failed to retrieve tasks" },
      { status: 500 },
    );
  }
}
```

Your files would look like:

```text
src/
├── app/
│   └── api/
│       └── tasks/
│           └── route.ts
├── lib/
│   ├── db.ts
│   └── tasks.ts
└── database/
    └── schema.sql
```

So:

- `schema.sql` creates the database structure.
- `tasks.ts` contains queries.
- `route.ts` handles browser/API requests.

For a small lab, putting the query directly in `route.ts` is also acceptable. The separate `tasks.ts` file is simply neater and easier to maintain.

## Prompt:
29/07/2026, 18:01:57

I am confused, please explain in depth what I have to do

## Response:
29/07/2026, 18:02:08

> **Understanding the structure**
>
> I’m keeping this practical: the schema creates the table, `db.ts` connects to PostgreSQL, and `route.ts` exposes database operations. For this lab, add the SQL query inside your existing `GET` handler and verify it through the browser or an API client.
>
> **Understood the structure**
>
> 
>
> Worked for 14s

The confusion is coming from mixing up **database setup** and **database usage**. They are separate.

Your app needs three main parts:

```text
schema.sql  → creates the tasks table
route.ts    → reads and changes tasks in the table
page.tsx    → displays those tasks in the browser
```

## How the app works

When someone opens your Todo app:

```text
page.tsx
   ↓ requests tasks from /api/tasks

route.ts
   ↓ runs a SELECT query

SQLite database
   ↓ returns task rows

route.ts
   ↓ converts rows to JSON

page.tsx
   ↓ displays the tasks
```

The important point is:

> `schema.sql` creates the table. It does not normally retrieve and display the tasks.

Your `SELECT ... ORDER BY ...` query should therefore run when your API receives a request for the task list.

For your lab, the simplest approach is to put that query directly in:

```text
app/api/tasks/route.ts
```

There is no need to create a separate `tasks.ts` helper file yet.

---

# Step 1: Keep your `schema.sql`

Your `schema.sql` should contain the table, trigger, and indexes.

It should look like this:

```sql
-- Creates the table used to store tasks

CREATE TABLE IF NOT EXISTS tasks (
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

-- Updates updated_at whenever a task is changed

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

-- Indexes improve searching and sorting

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
```

This file is only responsible for defining the database structure.

It tells SQLite:

- which columns exist;
- which values are allowed;
- which columns are required;
- how timestamps are handled;
- which indexes should exist.

Do **not** put the main `SELECT` query at the bottom of this file.

---

# Step 2: Make sure you have a database connection

You should have a file similar to:

```text
src/lib/db.ts
```

or:

```text
lib/db.ts
```

The exact location depends on whether your project uses a `src` folder.

A basic `db.ts` using `better-sqlite3` might look like this:

```ts
import Database from "better-sqlite3";
import path from "path";

const databasePath = path.join(process.cwd(), "database", "todo.db");

const db = new Database(databasePath);

db.pragma("foreign_keys = ON");

export default db;
```

This file opens your SQLite database.

The line:

```ts
export default db;
```

allows other files, such as your API route, to use the connection.

Your project might already have a working `db.ts`. Do not replace it unnecessarily if your current connection works.

---

# Step 3: Create the tasks API route

Create this folder structure:

```text
src/
└── app/
    └── api/
        └── tasks/
            └── route.ts
```

When you do not have a `src` folder, use:

```text
app/
└── api/
    └── tasks/
        └── route.ts
```

The file must be called exactly:

```text
route.ts
```

Put the following inside it:

```ts
import db from "@/lib/db";

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
```

This is where the main query goes.

---

# What this query does

The first part selects the columns:

```sql
SELECT
    id,
    title,
    description,
    due_date AS dueDate,
    topic,
    status
```

Your database uses snake case:

```text
due_date
```

Your TypeScript uses camel case:

```text
dueDate
```

This part converts the name:

```sql
due_date AS dueDate
```

It does not change the database column. It only changes the name returned by the query.

---

## It excludes archived tasks

This part:

```sql
WHERE archived_at IS NULL
```

means:

> Only return tasks that have not been archived.

When a task is archived, `archived_at` will contain a date and time. It will then stop appearing in the normal task list.

---

## It sorts by status

This section gives each status a numerical position:

```sql
CASE status
    WHEN 'Todo' THEN 1
    WHEN 'In-Progress' THEN 2
    WHEN 'Complete' THEN 3
    ELSE 4
END
```

That means the status order is:

```text
1. Todo
2. In-Progress
3. Complete
```

SQLite would normally sort text alphabetically. Alphabetically, `Complete` could appear before `Todo`, which is not the order you want.

The `CASE` statement gives you control over the order.

---

## It then sorts by topic

```sql
topic COLLATE NOCASE ASC
```

This sorts topics alphabetically:

```text
Database
Development
Documentation
Personal
Testing
Work
```

`COLLATE NOCASE` means capitalisation does not affect the sorting.

For example:

```text
database
Database
DATABASE
```

are treated the same for sorting purposes.

---

## It then sorts by due date

```sql
due_date ASC
```

This puts the earliest due date first.

For example:

```text
2026-08-01
2026-08-04
2026-08-10
```

This works because your dates are stored in:

```text
YYYY-MM-DD
```

format.

---

## It finally sorts by title

```sql
title COLLATE NOCASE ASC
```

This is only used when two tasks have the same:

- status;
- topic;
- due date.

It gives the result a predictable order.

The complete sorting priority is therefore:

```text
Status
  ↓
Topic
  ↓
Due date
  ↓
Title
```

---

# Step 4: Test the API route

Start the app:

```bash
npm run dev
```

Then visit this address in your browser:

```text
http://localhost:3000/api/tasks
```

You should see something similar to:

```json
[
  {
    "id": 1,
    "title": "Create database",
    "description": "Create the SQLite tasks table",
    "dueDate": "2026-08-01",
    "topic": "Database",
    "status": "Todo",
    "archivedAt": null,
    "createdAt": "2026-07-29 15:30:00",
    "updatedAt": "2026-07-29 15:30:00"
  }
]
```

When there are no tasks, you should see:

```json
[]
```

That is not an error. It only means the table is empty.

When you see an error such as:

```text
no such table: tasks
```

it means your schema has not been applied to the database file that your app is opening.

---

# Step 5: Update your TypeScript task type

In your `page.tsx`, make sure your type matches the database:

```tsx
type TaskStatus = "Todo" | "In-Progress" | "Complete";

type Task = {
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
```

The spelling must match exactly.

These are valid:

```text
Todo
In-Progress
Complete
```

These would not match your database:

```text
todo
in-progress
completed
```

SQLite will reject lowercase or different status values because of your `CHECK` constraint.

---

# Step 6: Load tasks in `page.tsx`

At the top of `page.tsx`, import `useEffect`:

```tsx
import { FormEvent, useEffect, useState } from "react";
```

Change your tasks state from static example tasks:

```tsx
const [tasks, setTasks] = useState<Task[]>(initialTasks);
```

to:

```tsx
const [tasks, setTasks] = useState<Task[]>([]);
```

Add loading and error state:

```tsx
const [isLoading, setIsLoading] = useState(true);
const [loadError, setLoadError] = useState("");
```

Then add this inside your component:

```tsx
useEffect(() => {
  async function loadTasks() {
    try {
      setIsLoading(true);
      setLoadError("");

      const response = await fetch("/api/tasks");

      if (!response.ok) {
        throw new Error("The task request failed");
      }

      const taskData: Task[] = await response.json();

      setTasks(taskData);
    } catch (error) {
      console.error("Unable to load tasks:", error);
      setLoadError("Unable to load your tasks.");
    } finally {
      setIsLoading(false);
    }
  }

  loadTasks();
}, []);
```

This runs once when the page opens.

It sends a request to:

```text
/api/tasks
```

Next.js then runs the `GET` function inside:

```text
app/api/tasks/route.ts
```

The API runs the SQL query and returns the sorted tasks.

---

# Step 7: Display loading and error messages

Inside your `main` element, before the board, you could add:

```tsx
{isLoading && (
  <p className={styles.message}>
    Loading tasks...
  </p>
)}

{loadError && (
  <p className={styles.errorMessage}>
    {loadError}
  </p>
)}
```

This still follows your rule of not using `div` or `span`.

You can add basic CSS:

```css
.message {
  margin: 20px 0;
  color: #666875;
  text-align: center;
}

.errorMessage {
  margin: 20px 0;
  color: #b42318;
  text-align: center;
}
```

---

# Step 8: Update all status comparisons in the page

Because your database uses:

```text
Todo
In-Progress
Complete
```

all frontend comparisons must use those exact values.

For completed tasks:

```tsx
const completedTasks = tasks.filter(
  (task) => task.status === "Complete",
).length;
```

For active tasks:

```tsx
const activeTasks = tasks.filter(
  (task) => task.status !== "Complete",
).length;
```

For filters:

```tsx
const filteredTasks = tasks.filter((task) => {
  if (filter === "active") {
    return task.status !== "Complete";
  }

  if (filter === "completed") {
    return task.status === "Complete";
  }

  return true;
});
```

Your displayed statuses should be:

```tsx
const displayedStatuses: TaskStatus[] =
  filter === "active"
    ? ["Todo", "In-Progress"]
    : filter === "completed"
      ? ["Complete"]
      : ["Todo", "In-Progress", "Complete"];
```

Your status information function should check:

```tsx
function getColumnDetails(status: TaskStatus) {
  if (status === "In-Progress") {
    return {
      title: "In Progress",
      colourClass: styles.orange,
    };
  }

  if (status === "Complete") {
    return {
      title: "Completed",
      colourClass: styles.green,
    };
  }

  return {
    title: "To Do",
    colourClass: styles.purple,
  };
}
```

---

# Step 9: Do you still need frontend sorting?

Because the SQL query already sorts the tasks, you do not strictly need another full sorting function in `page.tsx`.

However, your board separates the tasks into different status columns:

```text
To Do
In Progress
Completed
```

You can use this function:

```tsx
function getTasksByStatus(status: TaskStatus) {
  return tasks.filter((task) => task.status === status);
}
```

The tasks are already returned in topic and due-date order by SQLite. Filtering them by status preserves that order.

For example, suppose the API returns:

```text
Todo — Database — 1 August
Todo — Database — 5 August
Todo — Documentation — 2 August
In-Progress — Database — 3 August
Complete — Testing — 4 August
```

When the frontend filters for `Todo`, it keeps:

```text
Database — 1 August
Database — 5 August
Documentation — 2 August
```

That means the database sorting is still preserved.

---

# Step 10: Understand where each operation eventually goes

Your `/api/tasks/route.ts` will normally contain:

```text
GET  → retrieve tasks
POST → create a new task
```

A second route will normally contain:

```text
PUT or PATCH → edit a task
DELETE       → delete or archive a task
```

That second file would usually be:

```text
app/api/tasks/[id]/route.ts
```

But you do not need to solve every operation at once.

Start by making sure this works:

```text
GET /api/tasks
```

Once opening:

```text
http://localhost:3000/api/tasks
```

shows your task data, your connection and main query are working.

---

# The minimum you need to do now

Your immediate steps are:

1. Keep `schema.sql` for creating the table.
2. Make sure `lib/db.ts` connects to the SQLite file.
3. Create `app/api/tasks/route.ts`.
4. Put the `SELECT ... ORDER BY ...` query in its `GET` function.
5. Test `/api/tasks` in the browser.
6. Update `page.tsx` to fetch from `/api/tasks`.
7. Make all frontend status values match `Todo`, `In-Progress`, and `Complete`.

Your simplified file structure should be:

```text
todo/
├── database/
│   ├── schema.sql
│   └── todo.db
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── tasks/
│   │   │       └── route.ts
│   │   ├── page.tsx
│   │   └── page.module.css
│   │
│   └── lib/
│       └── db.ts
│
├── package.json
└── README.md
```

The direct answer to your original question is:

> Yes, your app needs to run the main query somewhere. For your current lab, put it directly inside the `GET` function in `app/api/tasks/route.ts`. Do not put it in `schema.sql`, and do not create an extra `tasks.ts` helper file yet.

## Prompt:
29/07/2026, 18:04:59

I have lib/database

## Response:
29/07/2026, 18:05:09

That is completely fine. You **do not need to create `lib/db.ts`**. Use your existing `lib/database` file or folder as the database connection.

The only thing that changes is the import inside your API route.

## Your likely structure

Your project may look like this:

```text
todo/
├── app/
│   ├── api/
│   │   └── tasks/
│   │       └── route.ts
│   └── page.tsx
│
├── lib/
│   └── database.ts
│
├── database/
│   └── schema.sql
│
└── package.json
```

Or, when using a `src` folder:

```text
todo/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── tasks/
│   │   │       └── route.ts
│   │   └── page.tsx
│   │
│   └── lib/
│       └── database.ts
│
├── database/
│   └── schema.sql
│
└── package.json
```

## 1. Do not create another database connection file

Previously, I referred to:

```text
lib/db.ts
```

Since you already have:

```text
lib/database
```

use that instead.

For example, when the file is:

```text
lib/database.ts
```

your import should be:

```ts
import db from "@/lib/database";
```

Not:

```ts
import db from "@/lib/db";
```

## 2. Create the API route

Create:

```text
app/api/tasks/route.ts
```

Or, when your project has a `src` folder:

```text
src/app/api/tasks/route.ts
```

Put this inside:

```ts
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
    const tasks = db
      .prepare(
        `
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
        `,
      )
      .all() as TaskRow[];

    return Response.json(tasks);
  } catch (error) {
    console.error("Failed to retrieve tasks:", error);

    return Response.json(
      { error: "Failed to retrieve tasks" },
      { status: 500 },
    );
  }
}
```

The important line is:

```ts
import db from "@/lib/database";
```

That connects the route to the database connection you already have.

## 3. What each file does

### `database/schema.sql`

This creates the table, trigger, and indexes:

```text
schema.sql
    ↓
Creates the tasks table
```

It does not normally display or retrieve tasks.

### `lib/database.ts`

This opens the SQLite database connection:

```text
lib/database.ts
    ↓
Connects your Next.js app to SQLite
```

### `app/api/tasks/route.ts`

This runs the query:

```text
route.ts
    ↓
Uses the database connection
    ↓
Selects and sorts the tasks
    ↓
Returns the tasks as JSON
```

### `app/page.tsx`

This requests and displays the tasks:

```text
page.tsx
    ↓
Calls /api/tasks
    ↓
Receives the sorted tasks
    ↓
Displays them on the page
```

## 4. Test the route

Run:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000/api/tasks
```

You should see either a list of tasks:

```json
[
  {
    "id": 1,
    "title": "Complete README",
    "description": "Write the project documentation",
    "dueDate": "2026-08-05",
    "topic": "Documentation",
    "status": "Todo",
    "archivedAt": null,
    "createdAt": "2026-07-29 16:00:00",
    "updatedAt": "2026-07-29 16:00:00"
  }
]
```

Or, when the table is currently empty:

```json
[]
```

An empty array means the route and database query worked, but there are no tasks yet.

One detail still depends on your existing file: `lib/database` must export the connection as its default export for `import db from "@/lib/database"` to work. Paste the contents of that file and I’ll match the route exactly to it.

## Prompt:
29/07/2026, 18:07:04

I have some errors in here please help me fix them

[Attachment: Pasted text.txt]

## Response:
29/07/2026, 18:07:08

> **Correcting status mismatches**
>
> I’m aligning every task status to the same capitalization, especially “Todo,” “In Progress,” and “Complete.” I’m also checking filters, sorting, column lookup, and checkbox behavior so the page remains consistent.
>
> **Corrected status mismatches**
>
> 
>
> Worked for 33s

The errors come from using two different sets of status values. Your type and database expect:

```text
Todo
In-Progress
Complete
```

But several parts of the file still use:

```text
todo
in-progress
completed
```

TypeScript correctly rejects those lowercase values because they are not part of `TaskStatus`. `Pasted text.txt`

Replace your entire `page.tsx` with this corrected version:

```tsx
"use client";

import { FormEvent, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  ListTodo,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import styles from "./page.module.css";

type TaskStatus = "Todo" | "In-Progress" | "Complete";
type TaskFilter = "all" | "active" | "completed";

type TaskTopic =
  | "Database"
  | "Development"
  | "Documentation"
  | "Testing";

type Task = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  topic: TaskTopic;
};

type TaskForm = {
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  topic: TaskTopic;
};

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Design landing page",
    description: "Create the initial landing page for the app",
    dueDate: "2026-08-05",
    status: "Todo",
    topic: "Development",
  },
  {
    id: 2,
    title: "Add database schema",
    description: "Create SQLite tables for tasks",
    dueDate: "2026-08-06",
    status: "Todo",
    topic: "Database",
  },
  {
    id: 3,
    title: "Implement task filters",
    description: "Add All, Active and Completed filters",
    dueDate: "2026-08-07",
    status: "Todo",
    topic: "Development",
  },
  {
    id: 4,
    title: "Write README",
    description: "Document the project for submission",
    dueDate: "2026-08-08",
    status: "Todo",
    topic: "Documentation",
  },
  {
    id: 5,
    title: "Build add task form",
    description: "Create a form to add new tasks",
    dueDate: "2026-08-04",
    status: "In-Progress",
    topic: "Development",
  },
  {
    id: 6,
    title: "Connect to SQLite",
    description: "Set up the database connection in Next.js",
    dueDate: "2026-08-04",
    status: "In-Progress",
    topic: "Database",
  },
  {
    id: 7,
    title: "Display tasks list",
    description: "Fetch tasks from the database and display them",
    dueDate: "2026-08-05",
    status: "In-Progress",
    topic: "Development",
  },
  {
    id: 8,
    title: "Set up Next.js project",
    description: "Initialise the project and install dependencies",
    dueDate: "2026-07-29",
    status: "Complete",
    topic: "Development",
  },
  {
    id: 9,
    title: "Create layout and UI",
    description: "Set up the basic layout and styling",
    dueDate: "2026-07-30",
    status: "Complete",
    topic: "Development",
  },
  {
    id: 10,
    title: "Create tasks table",
    description: "Create the tasks table in SQLite",
    dueDate: "2026-07-30",
    status: "Complete",
    topic: "Database",
  },
  {
    id: 11,
    title: "Add task model",
    description: "Define the Task type and validation",
    dueDate: "2026-07-31",
    status: "Complete",
    topic: "Database",
  },
  {
    id: 12,
    title: "Test database connection",
    description: "Verify the database can be queried",
    dueDate: "2026-07-31",
    status: "Complete",
    topic: "Testing",
  },
];

const emptyForm: TaskForm = {
  title: "",
  description: "",
  dueDate: "",
  status: "Todo",
  topic: "Development",
};

const statusOrder: Record<TaskStatus, number> = {
  Todo: 1,
  "In-Progress": 2,
  Complete: 3,
};

function formatDate(date: string) {
  if (!date) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function getDueDateValue(dueDate: string) {
  if (!dueDate) {
    return Number.MAX_SAFE_INTEGER;
  }

  return new Date(`${dueDate}T00:00:00`).getTime();
}

function sortTasks(taskA: Task, taskB: Task) {
  const statusComparison =
    statusOrder[taskA.status] - statusOrder[taskB.status];

  if (statusComparison !== 0) {
    return statusComparison;
  }

  const topicComparison = taskA.topic.localeCompare(taskB.topic, undefined, {
    sensitivity: "base",
  });

  if (topicComparison !== 0) {
    return topicComparison;
  }

  const dateComparison =
    getDueDateValue(taskA.dueDate) - getDueDateValue(taskB.dueDate);

  if (dateComparison !== 0) {
    return dateComparison;
  }

  return taskA.title.localeCompare(taskB.title, undefined, {
    sensitivity: "base",
  });
}

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [form, setForm] = useState<TaskForm>(emptyForm);

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "Complete",
  ).length;

  const activeTasks = totalTasks - completedTasks;

  const filteredTasks = tasks.filter((task) => {
    if (filter === "active") {
      return task.status !== "Complete";
    }

    if (filter === "completed") {
      return task.status === "Complete";
    }

    return true;
  });

  const displayedStatuses: TaskStatus[] =
    filter === "active"
      ? ["Todo", "In-Progress"]
      : filter === "completed"
        ? ["Complete"]
        : ["Todo", "In-Progress", "Complete"];

  const boardClass =
    displayedStatuses.length === 1
      ? `${styles.board} ${styles.oneColumn}`
      : displayedStatuses.length === 2
        ? `${styles.board} ${styles.twoColumns}`
        : `${styles.board} ${styles.threeColumns}`;

  function openAddModal(status: TaskStatus = "Todo") {
    setEditingTaskId(null);

    setForm({
      ...emptyForm,
      status,
    });

    setIsModalOpen(true);
  }

  function openEditModal(task: Task) {
    setEditingTaskId(task.id);

    setForm({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      status: task.status,
      topic: task.topic,
    });

    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingTaskId(null);
    setForm(emptyForm);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    const description = form.description.trim();

    if (!title || !form.dueDate) {
      return;
    }

    if (editingTaskId !== null) {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === editingTaskId
            ? {
                ...task,
                title,
                description,
                dueDate: form.dueDate,
                status: form.status,
                topic: form.topic,
              }
            : task,
        ),
      );
    } else {
      const newTask: Task = {
        id: Date.now(),
        title,
        description,
        dueDate: form.dueDate,
        status: form.status,
        topic: form.topic,
      };

      setTasks((currentTasks) => [...currentTasks, newTask]);
    }

    closeModal();
  }

  function toggleCompleted(task: Task) {
    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === task.id
          ? {
              ...currentTask,
              status:
                currentTask.status === "Complete"
                  ? "Todo"
                  : "Complete",
            }
          : currentTask,
      ),
    );
  }

  function deleteTask(taskId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?",
    );

    if (!confirmed) {
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId),
    );
  }

  function getTasksByStatus(status: TaskStatus) {
    return [...filteredTasks]
      .filter((task) => task.status === status)
      .sort(sortTasks);
  }

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

  return (
    <>
      <header className={styles.header}>
        <nav className={styles.headerInner} aria-label="Main navigation">
          <h1 className={styles.logo}>
            <strong className={styles.logoIcon} aria-hidden="true">
              <Check size={22} strokeWidth={3} />
            </strong>

            My Todo
          </h1>

          <button
            className={styles.primaryButton}
            onClick={() => openAddModal()}
            type="button"
          >
            <Plus size={18} aria-hidden="true" />
            Add Task
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.statsGrid} aria-label="Task summary">
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
        </section>

        <nav className={styles.filters} aria-label="Task filters">
          <button
            className={`${styles.filterButton} ${
              filter === "all" ? styles.activeFilter : ""
            }`}
            onClick={() => setFilter("all")}
            aria-pressed={filter === "all"}
            type="button"
          >
            <ListTodo size={17} aria-hidden="true" />
            All
          </button>

          <button
            className={`${styles.filterButton} ${
              filter === "active" ? styles.activeFilter : ""
            }`}
            onClick={() => setFilter("active")}
            aria-pressed={filter === "active"}
            type="button"
          >
            <Circle size={17} aria-hidden="true" />
            Active
          </button>

          <button
            className={`${styles.filterButton} ${
              filter === "completed" ? styles.activeFilter : ""
            }`}
            onClick={() => setFilter("completed")}
            aria-pressed={filter === "completed"}
            type="button"
          >
            <CheckCircle2 size={17} aria-hidden="true" />
            Completed
          </button>
        </nav>

        <section className={boardClass} aria-label="Task board">
          {displayedStatuses.map((status) => {
            const column = getColumnDetails(status);
            const columnTasks = getTasksByStatus(status);

            return (
              <article className={styles.column} key={status}>
                <header className={styles.columnHeader}>
                  <section className={styles.columnHeading}>
                    <figure
                      className={`${styles.columnIcon} ${column.colourClass}`}
                      aria-hidden="true"
                    >
                      {column.icon}
                    </figure>

                    <h2>{column.title}</h2>

                    <output
                      className={`${styles.countBadge} ${column.colourClass}`}
                      aria-label={`${columnTasks.length} tasks`}
                    >
                      {columnTasks.length}
                    </output>
                  </section>
                </header>

                <ul className={styles.taskList}>
                  {columnTasks.length === 0 && (
                    <li className={styles.emptyState}>
                      <CheckCircle2 size={30} aria-hidden="true" />
                      <p>No tasks in this section</p>
                    </li>
                  )}

                  {columnTasks.map((task) => {
                    const isComplete = task.status === "Complete";

                    return (
                      <li className={styles.taskCard} key={task.id}>
                        <header className={styles.taskTop}>
                          <button
                            className={`${styles.checkbox} ${
                              isComplete ? styles.checkedCheckbox : ""
                            }`}
                            onClick={() => toggleCompleted(task)}
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

                          <section className={styles.taskContent}>
                            <small className={styles.topicBadge}>
                              {task.topic}
                            </small>

                            <h3
                              className={
                                isComplete ? styles.completedTitle : ""
                              }
                            >
                              {task.title}
                            </h3>

                            {task.description && <p>{task.description}</p>}
                          </section>
                        </header>

                        <footer className={styles.taskBottom}>
                          <time
                            className={`${styles.date} ${column.colourClass}`}
                            dateTime={task.dueDate}
                          >
                            <CalendarDays size={14} aria-hidden="true" />
                            {formatDate(task.dueDate)}
                          </time>

                          <menu className={styles.taskActions}>
                            <li>
                              <button
                                className={styles.iconButton}
                                onClick={() => openEditModal(task)}
                                aria-label={`Edit ${task.title}`}
                                type="button"
                              >
                                <Pencil size={16} aria-hidden="true" />
                              </button>
                            </li>

                            <li>
                              <button
                                className={`${styles.iconButton} ${styles.deleteButton}`}
                                onClick={() => deleteTask(task.id)}
                                aria-label={`Delete ${task.title}`}
                                type="button"
                              >
                                <Trash2 size={16} aria-hidden="true" />
                              </button>
                            </li>
                          </menu>
                        </footer>
                      </li>
                    );
                  })}
                </ul>

                <footer>
                  <button
                    className={`${styles.addColumnButton} ${column.colourClass}`}
                    onClick={() => openAddModal(status)}
                    type="button"
                  >
                    <Plus size={18} aria-hidden="true" />
                    Add Task
                  </button>
                </footer>
              </article>
            );
          })}
        </section>
      </main>

      {isModalOpen && (
        <aside
          className={styles.modalOverlay}
          onMouseDown={closeModal}
          aria-label="Task form overlay"
        >
          <section
            className={styles.modal}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-modal-title"
          >
            <header className={styles.modalHeader}>
              <h2 id="task-modal-title">
                {editingTaskId === null ? "Add New Task" : "Edit Task"}
              </h2>

              <button
                className={styles.closeButton}
                onClick={closeModal}
                aria-label="Close task form"
                type="button"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.formGroup}>
                <strong>Title</strong>

                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      title: event.target.value,
                    }))
                  }
                  placeholder="e.g. Build task list page"
                  required
                  autoFocus
                />
              </label>

              <label className={styles.formGroup}>
                <strong>Description</strong>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      description: event.target.value,
                    }))
                  }
                  placeholder="e.g. Display all tasks from the database"
                  rows={4}
                />
              </label>

              <fieldset className={styles.formRow}>
                <legend className={styles.visuallyHidden}>
                  Task details
                </legend>

                <label className={styles.formGroup}>
                  <strong>Topic</strong>

                  <select
                    value={form.topic}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        topic: event.target.value as TaskTopic,
                      }))
                    }
                    required
                  >
                    <option value="Database">Database</option>
                    <option value="Development">Development</option>
                    <option value="Documentation">Documentation</option>
                    <option value="Testing">Testing</option>
                  </select>
                </label>

                <label className={styles.formGroup}>
                  <strong>Due Date</strong>

                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        dueDate: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label className={styles.formGroup}>
                  <strong>Status</strong>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        status: event.target.value as TaskStatus,
                      }))
                    }
                    required
                  >
                    <option value="Todo">To Do</option>
                    <option value="In-Progress">In Progress</option>
                    <option value="Complete">Completed</option>
                  </select>
                </label>
              </fieldset>

              <footer className={styles.formActions}>
                <button
                  className={styles.secondaryButton}
                  onClick={closeModal}
                  type="button"
                >
                  Cancel
                </button>

                <button className={styles.primaryButton} type="submit">
                  {editingTaskId === null ? "Add Task" : "Save Changes"}
                </button>
              </footer>
            </form>
          </section>
        </aside>
      )}
    </>
  );
}
```

The important fixes are:

```tsx
status: "Todo"
status: "In-Progress"
status: "Complete"
```

instead of the lowercase versions.

I also corrected these areas:

- `emptyForm`
- `statusOrder`
- `displayedStatuses`
- `openAddModal`
- `toggleCompleted`
- `getColumnDetails`
- completed-task styling and checkbox checks
- required due-date validation
- deterministic sorting by status, topic, due date, then title

This version still uses no `div` or `span` elements.

## Prompt:
29/07/2026, 18:10:47

when I open it the browser thing says Create Next App how do I change this

## Response:
29/07/2026, 18:10:50

> **Explaining Next.js Metadata and Favicon Editing**
>
>
> **Searched 1 website**
>
> 
>
> Worked for 16s

That is the **browser tab title**. It comes from the metadata in your root `layout.tsx`, not from `page.tsx`.

Open one of these files, depending on your project structure:

```text
app/layout.tsx
```

or:

```text
src/app/layout.tsx
```

Near the top, you should see something like:

```tsx
export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};
```

Replace it with:

```tsx
export const metadata: Metadata = {
  title: "My Todo",
  description: "A task management application",
};
```

Your complete `layout.tsx` may look similar to this:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Todo",
  description: "A task management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Do **not** add `"use client"` to `layout.tsx`. Next.js allows static page metadata such as the browser title to be exported from a layout or page file, and the root layout metadata is inherited by the pages inside it. ([Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/layout?utm_source=chatgpt.com))

Save the file and refresh the browser. The tab should change from:

```text
Create Next App
```

to:

```text
My Todo
```

If it still shows the old title, stop and restart the development server:

```bash
Control + C
npm run dev
```

The small icon beside the title is controlled separately by `app/favicon.ico`; changing the title will not change that icon. ([Next.js](https://nextjs.org/docs/app/getting-started/metadata-and-og-images?utm_source=chatgpt.com))

---

**Sources:**

- [File-system conventions: layout.js | Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/layout?utm_source=chatgpt.com)

## Prompt:
29/07/2026, 18:12:40

how to commit on separate lines

## Response:
29/07/2026, 18:12:47

Run each Git command on its own line in the terminal:

```bash
git add .
```

Press **Enter**, then:

```bash
git commit -m "Update Todo app design and task sorting"
```

Press **Enter**, then:

```bash
git push
```

So your terminal should look like:

```bash
git add .
git commit -m "Update Todo app design and task sorting"
git push
```

For a commit message with multiple paragraphs, use:

```bash
git commit -m "Update Todo app" -m "Added topic sorting, semantic HTML, and updated styling."
```



---
Powered by [ChatGPT Exporter](https://www.chatgptexporter.com)