"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Archive,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  ListTodo,
  MoreVertical,
  Pencil,
  Plus,
  X,
  RotateCcw,
  Moon,
  Sun,
} from "lucide-react";

import styles from "./page.module.css";

type TaskStatus = "Todo" | "In-Progress" | "Complete";
type TaskFilter = "all" | "active" | "completed" | "archived";

type TaskTopic = string;

type Task = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  topic: TaskTopic;
  archivedAt: string | null;
};

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

type TaskForm = {
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  topic: TaskTopic;
};


const emptyForm: TaskForm = {
  title: "",
  description: "",
  dueDate: "",
  status: "Todo",
  topic: "",
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

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskError, setTaskError] = useState("");
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [form, setForm] = useState<TaskForm>(emptyForm);
  const [openMenuTaskId, setOpenMenuTaskId] = useState<number | null>(
    null,
  );

  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(
    null,
  );

  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("todo-theme");

    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
      return;
    }

    const prefersDarkMode = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    setIsDarkMode(prefersDarkMode);
  }, []);
  const unarchivedTasks = tasks.filter((task) => !task.archivedAt);

  const archivedTasks = tasks.filter((task) => Boolean(task.archivedAt));

  const totalTasks = unarchivedTasks.length;

  const completedTasks = unarchivedTasks.filter(
    (task) => task.status === "Complete",
  ).length;

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



  const activeTasks = unarchivedTasks.filter(
    (task) => task.status === "In-Progress"
  ).length;

  const overdueTasks = unarchivedTasks.filter(
    isTaskOverdue,
  ).length;

  const filteredTasks =
    filter === "archived"
      ? archivedTasks
      : unarchivedTasks.filter((task) => {
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

  function toggleDarkMode() {
    setIsDarkMode((currentMode) => {
      const newMode = !currentMode;

      window.localStorage.setItem(
        "todo-theme",
        newMode ? "dark" : "light",
      );

      return newMode;
    });
  }

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

  async function dropTask(status: TaskStatus) {
    if (draggedTaskId === null || filter === "archived") {
      return;
    }

    await changeTaskStatus(draggedTaskId, status);
    setDraggedTaskId(null);
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
    <section
      className={`${styles.page} ${
        isDarkMode ? styles.darkMode : ""
      }`}
    >
      <header className={styles.header}>
        <nav className={styles.headerInner} aria-label="Main navigation">
          <h1 className={styles.logo}>
            <strong className={styles.logoIcon} aria-hidden="true">
              <Check size={22} strokeWidth={3} />
            </strong>

            My Todo
          </h1>

          <menu className={styles.headerActions}>
            <li>
              <button
                className={styles.themeButton}
                onClick={toggleDarkMode}
                aria-label={
                  isDarkMode
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                title={
                  isDarkMode
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                type="button"
              >
                {isDarkMode ? (
                  <Sun size={19} aria-hidden="true" />
                ) : (
                  <Moon size={19} aria-hidden="true" />
                )}

                <strong className={styles.themeButtonText}>
                  {isDarkMode ? "Light" : "Dark"}
                </strong>
              </button>
            </li>

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
          </menu>
        </nav>
      </header>

      <main className={styles.main}>
        {taskError && (
            <p className={styles.errorMessage} role="alert">
              {taskError}
            </p>
          )}
        
                
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
        </nav>

        <section className={boardClass} aria-label="Task board">
          {displayedStatuses.map((status) => {
            const column = getColumnDetails(status);
            const columnTasks = getTasksByStatus(status);

            return (
              <article
                  className={styles.column}
                  key={status}
                  onDragOver={(event) => {
                    if (filter !== "archived") {
                      event.preventDefault();
                    }
                  }}
                  onDrop={() => void dropTask(status)}
                >
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
                    const isOverdue = isTaskOverdue(task);

                    return (
                      <li
                          className={`${styles.taskCard} ${
                            filter !== "archived" ? styles.draggableCard : ""
                          }`}
                          key={task.id}
                          draggable={filter !== "archived"}
                          onDragStart={() => setDraggedTaskId(task.id)}
                          onDragEnd={() => setDraggedTaskId(null)}
                        >
                        <header className={styles.taskTop}>
                          <button
                            className={`${styles.checkbox} ${
                              isComplete ? styles.checkedCheckbox : ""
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
                                | Overdue
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
                                <Pencil size={16} aria-hidden="true" />
                              </button>
                            </li>

                            <li className={styles.menuWrapper}>
                              <button
                                className={styles.iconButton}
                                onClick={() =>
                                  setOpenMenuTaskId((currentId) =>
                                    currentId === task.id ? null : task.id,
                                  )
                                }
                                aria-label={`Open actions for ${task.title}`}
                                aria-expanded={openMenuTaskId === task.id}
                                type="button"
                              >
                                <MoreVertical size={18} aria-hidden="true" />
                              </button>

                              {openMenuTaskId === task.id && (
                                <>
                                  <button
                                    className={styles.popupBackdrop}
                                    onClick={() => setOpenMenuTaskId(null)}
                                    aria-label="Close task actions"
                                    type="button"
                                  />

                                  <section
                                    className={styles.actionPopup}
                                    aria-label={`Actions for ${task.title}`}
                                  >
                                    <header className={styles.popupHeader}>
                                      <strong>Change task</strong>
                                    </header>

                                    <section className={styles.popupActions}>
                                      {filter === "archived" ? (
                                        <button
                                          className={styles.popupActionButton}
                                          onClick={() => void restoreTask(task.id)}
                                          type="button"
                                        >
                                          <RotateCcw size={17} aria-hidden="true" />
                                          Restore
                                        </button>
                                      ) : (
                                        <>
                                          {task.status !== "Todo" && (
                                            <button
                                              className={styles.popupActionButton}
                                              onClick={() =>
                                                void changeTaskStatus(task.id, "Todo")
                                              }
                                              type="button"
                                            >
                                              <Circle size={17} aria-hidden="true" />
                                              To Do
                                            </button>
                                          )}

                                          {task.status !== "In-Progress" && (
                                            <button
                                              className={styles.popupActionButton}
                                              onClick={() =>
                                                void changeTaskStatus(task.id, "In-Progress")
                                              }
                                              type="button"
                                            >
                                              <Clock3 size={17} aria-hidden="true" />
                                              In Progress
                                            </button>
                                          )}

                                          {task.status !== "Complete" && (
                                            <button
                                              className={styles.popupActionButton}
                                              onClick={() =>
                                                void changeTaskStatus(task.id, "Complete")
                                              }
                                              type="button"
                                            >
                                              <CheckCircle2 size={17} aria-hidden="true" />
                                              Complete
                                            </button>
                                          )}

                                          <button
                                            className={`${styles.popupActionButton} ${styles.archiveAction}`}
                                            onClick={() => void archiveTask(task.id)}
                                            type="button"
                                          >
                                            <Archive size={17} aria-hidden="true" />
                                            Archive
                                          </button>
                                        </>
                                      )}
                                    </section>
                                  </section>
                                </>
                                
                              )}
                        
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

                  <input
                    type="text"
                    value={form.topic}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        topic: event.target.value,
                      }))
                    }
                    placeholder="e.g. Database"
                    required
                  />
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
    </section>
  );
}