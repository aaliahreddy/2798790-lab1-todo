
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