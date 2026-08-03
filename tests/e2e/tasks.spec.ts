import {
  expect,
  type Page,
  test,
} from "@playwright/test";

type TaskInput = {
  title: string;
  description: string;
  topic: string;
  dueDate: string;
  status?: "Todo" | "In-Progress" | "Complete";
};

function taskFilters(page: Page) {
  return page.getByRole("navigation", {
    name: "Task filters",
  });
}

async function openAddTaskDialog(page: Page) {
  await taskFilters(page)
    .getByRole("button", {
      name: "Add Task",
      exact: true,
    })
    .click();

  const dialog = page.getByRole("dialog", {
    name: "Add New Task",
    exact: true,
  });

  await expect(dialog).toBeVisible();

  return dialog;
}
async function addTask(
  page: Page,
  task: TaskInput,
) {
  const dialog = await openAddTaskDialog(page);

  await dialog
    .getByRole("textbox", {
      name: "Title",
      exact: true,
    })
    .fill(task.title);

  await dialog
    .getByRole("textbox", {
      name: "Description",
      exact: true,
    })
    .fill(task.description);

  await dialog
    .getByRole("textbox", {
      name: "Topic",
      exact: true,
    })
    .fill(task.topic);

  await dialog
    .getByLabel("Due Date", {
      exact: true,
    })
    .fill(task.dueDate);

  await dialog
    .getByRole("combobox", {
      name: "Status",
      exact: true,
    })
    .selectOption(task.status ?? "Todo");

  await dialog
    .getByRole("button", {
      name: "Add Task",
      exact: true,
    })
    .click();

  await expect(dialog).toBeHidden();

  await expect(
    page.getByRole("heading", {
      name: task.title,
      exact: true,
    }),
  ).toBeVisible();
}

function taskCard(page: Page, title: string) {
  return page.locator("li").filter({
    has: page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "My Todo",
    }),
  ).toBeVisible();
});

test("adds a task and keeps it after a reload", async ({
  page,
}) => {
  const task = {
    title: "E2E persistent task",
    description:
      "Created through the real task form",
    topic: "Testing",
    dueDate: "2099-06-15",
    status: "In-Progress" as const,
  };

  await addTask(page, task);

  const card = taskCard(page, task.title);

  await expect(
    card.getByText(task.description, {
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    card.getByText("Testing", {
      exact: true,
    }),
  ).toBeVisible();

  // Reloading proves that the result came back from SQLite,
  // rather than only remaining in React state.
  await page.reload();

  await expect(
    page.getByRole("heading", {
      name: task.title,
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByText(task.description, {
      exact: true,
    }),
  ).toBeVisible();
});

test("archives a task and keeps it available in Archive", async ({
  page,
}) => {
  const title = "E2E task to archive";

  await addTask(page, {
    title,
    description: "This task will be archived",
    topic: "Administration",
    dueDate: "2099-07-01",
  });

  await page
    .getByRole("button", {
      name: `Open actions for ${title}`,
      exact: true,
    })
    .click();

  const actions = page.getByRole("region", {
    name: `Actions for ${title}`,
    exact: true,
  });

  await expect(actions).toBeVisible();

  await actions
    .getByRole("button", {
      name: "Archive",
      exact: true,
    })
    .click();

  // The task should no longer appear in the normal task view.
  await expect(
    page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  ).toHaveCount(0);

  // Open the archive view.
  await taskFilters(page)
    .getByRole("button", {
      name: "Archive",
      exact: true,
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", {
      name: `Restore ${title}`,
      exact: true,
    }),
  ).toBeVisible();

  // Reload to confirm that the archived state was stored in SQLite.
  await page.reload();

  // Reloading resets the selected filter, so reopen Archive.
  await taskFilters(page)
    .getByRole("button", {
      name: "Archive",
      exact: true,
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("button", {
      name: `Restore ${title}`,
      exact: true,
    }),
  ).toBeVisible();
});

test("visibly identifies an overdue task without using Overdue as a status", async ({
  page,
}) => {
  const title = "E2E overdue task";

  // This fixed date is safely in the past, making the test
  // deterministic regardless of when it is run.
  await addTask(page, {
    title,
    description:
      "A deliberately overdue task",
    topic: "Testing",
    dueDate: "2000-01-01",
    status: "Todo",
  });

  const card = taskCard(page, title);

  await expect(
    card.getByText(/Overdue/),
  ).toBeVisible();

  const dialog = await openAddTaskDialog(page);

  // Overdue is derived from the date and must not be a fourth status.
  await expect(
    dialog
      .getByLabel("Status")
      .locator("option"),
  ).toHaveText([
    "To Do",
    "In Progress",
    "Completed",
  ]);
});

test("filters tasks and sorts the UI by topic", async ({
  page,
}) => {
  const alphaTitle = "E2E Alpha topic task";
  const zuluTitle = "E2E Zulu topic task";

  await addTask(page, {
    title: zuluTitle,
    description: "Task with the later topic",
    topic: "Zulu",
    dueDate: "2099-08-01",
  });

  await addTask(page, {
    title: alphaTitle,
    description: "Task with the earlier topic",
    topic: "Alpha",
    dueDate: "2099-08-02",
  });

  await taskFilters(page)
    .getByRole("button", {
      name: "Active",
      exact: true,
    })
    .click();

  await page
    .getByLabel("Sort by")
    .selectOption("topicAscending");

  const activeList = page.locator(
    '[aria-label="Active Tasks list"]',
  );

  await expect(activeList).toBeVisible();

  const visibleTitles = await activeList
    .locator("h3")
    .allTextContents();

  const alphaPosition =
    visibleTitles.indexOf(alphaTitle);

  const zuluPosition =
    visibleTitles.indexOf(zuluTitle);

  expect(alphaPosition).toBeGreaterThanOrEqual(0);
  expect(zuluPosition).toBeGreaterThanOrEqual(0);
  expect(alphaPosition).toBeLessThan(zuluPosition);

  const alphaCard = taskCard(page, alphaTitle);

  // These assertions test the topic and status information
  // displayed in the list UI.
  await expect(
    alphaCard.getByText("Alpha", {
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    alphaCard.getByText("To Do", {
      exact: true,
    }),
  ).toBeVisible();
});

test("edits a task and keeps the changes after reload", async ({
  page,
}) => {
  const originalTitle = "E2E task before editing";
  const updatedTitle = "E2E task after editing";

  await addTask(page, {
    title: originalTitle,
    description: "Original description",
    topic: "Original Topic",
    dueDate: "2099-09-01",
    status: "Todo",
  });

  await page
    .getByRole("button", {
      name: `Edit ${originalTitle}`,
      exact: true,
    })
    .click();

  const dialog = page.getByRole("dialog", {
    name: "Edit Task",
    exact: true,
  });

  await expect(dialog).toBeVisible();

  await dialog
    .getByRole("textbox", {
      name: "Title",
      exact: true,
    })
    .fill(updatedTitle);

  await dialog
    .getByRole("textbox", {
      name: "Description",
      exact: true,
    })
    .fill("Updated description");

  await dialog
    .getByRole("textbox", {
      name: "Topic",
      exact: true,
    })
    .fill("Updated Topic");

  await dialog
    .getByLabel("Due Date", {
      exact: true,
    })
    .fill("2099-10-15");

  await dialog
    .getByRole("combobox", {
      name: "Status",
      exact: true,
    })
    .selectOption("In-Progress");

  await dialog
    .getByRole("button", {
      name: "Save Changes",
      exact: true,
    })
    .click();

  await expect(dialog).toBeHidden();

  await expect(
    page.getByRole("heading", {
      name: originalTitle,
      exact: true,
    }),
  ).toHaveCount(0);

  const updatedCard = taskCard(page, updatedTitle);

  await expect(updatedCard).toBeVisible();

  await expect(
    updatedCard.getByText("Updated description", {
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    updatedCard.getByText("Updated Topic", {
      exact: true,
    }),
  ).toBeVisible();

  // Confirm that the edited information was saved to SQLite.
  await page.reload();

  await expect(
    page.getByRole("heading", {
      name: updatedTitle,
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByText("Updated description", {
      exact: true,
    }),
  ).toBeVisible();
});

test("marks a task as completed and saves the new status", async ({
  page,
}) => {
  const title = "E2E task to complete";

  await addTask(page, {
    title,
    description: "This task must be completed",
    topic: "Testing",
    dueDate: "2099-11-01",
    status: "Todo",
  });

  await page
    .getByRole("button", {
      name: `Mark ${title} as completed`,
      exact: true,
    })
    .click();

  // The task should now have a button that can mark it active again.
  await expect(
    page.getByRole("button", {
      name: `Mark ${title} as active`,
      exact: true,
    }),
  ).toBeVisible();

  // Confirm that it appears under the Completed filter.
  await taskFilters(page)
    .getByRole("button", {
      name: "Completed",
      exact: true,
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    taskCard(page, title).getByText("Completed", {
      exact: true,
    }),
  ).toBeVisible();

  // Reload and reopen the Completed filter to prove persistence.
  await page.reload();

  await taskFilters(page)
    .getByRole("button", {
      name: "Completed",
      exact: true,
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  ).toBeVisible();
});

test("restores an archived task to the normal board", async ({
  page,
}) => {
  const title = "E2E task to restore";

  await addTask(page, {
    title,
    description: "This task will be archived and restored",
    topic: "Archive Test",
    dueDate: "2099-12-01",
    status: "Todo",
  });

  await page
    .getByRole("button", {
      name: `Open actions for ${title}`,
      exact: true,
    })
    .click();

  const actions = page.getByRole("region", {
    name: `Actions for ${title}`,
    exact: true,
  });

  await actions
    .getByRole("button", {
      name: "Archive",
      exact: true,
    })
    .click();

  await taskFilters(page)
    .getByRole("button", {
      name: "Archive",
      exact: true,
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  ).toBeVisible();

  await page
    .getByRole("button", {
      name: `Restore ${title}`,
      exact: true,
    })
    .click();

  // It should disappear from the archived list.
  await expect(
    page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  ).toHaveCount(0);

  await taskFilters(page)
    .getByRole("button", {
      name: "All",
      exact: true,
    })
    .click();

  // It should be back on the main board.
  await expect(
    page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  ).toBeVisible();

  // Reload to confirm that archivedAt was saved as null.
  await page.reload();

  await expect(
    page.getByRole("heading", {
      name: title,
      exact: true,
    }),
  ).toBeVisible();
});

test("sorts active tasks by due date in both directions", async ({
  page,
}) => {
  const earlierTitle = "E2E earlier task";
  const laterTitle = "E2E later task";

  await addTask(page, {
    title: laterTitle,
    description: "Later task",
    topic: "Dates",
    dueDate: "2099-12-20",
    status: "Todo",
  });

  await addTask(page, {
    title: earlierTitle,
    description: "Earlier task",
    topic: "Dates",
    dueDate: "2099-12-10",
    status: "Todo",
  });

  await taskFilters(page)
    .getByRole("button", {
      name: "Active",
      exact: true,
    })
    .click();

  const activeList = page.locator(
    '[aria-label="Active Tasks list"]',
  );

  const sortControl = page.getByRole("combobox", {
    name: "Sort by",
    exact: true,
  });

  await sortControl.selectOption("dueDateAscending");

  let titles = await activeList.locator("h3").allTextContents();

  expect(titles.indexOf(earlierTitle)).toBeLessThan(
    titles.indexOf(laterTitle),
  );

  await sortControl.selectOption("dueDateDescending");

  titles = await activeList.locator("h3").allTextContents();

  expect(titles.indexOf(laterTitle)).toBeLessThan(
    titles.indexOf(earlierTitle),
  );
});

test("saves the selected theme after reload", async ({
  page,
}) => {
  const darkModeButton = page.getByRole("button", {
    name: "Switch to dark mode",
    exact: true,
  });

  // The browser could initially prefer dark mode, so force a known state.
  if (await darkModeButton.isVisible()) {
    await darkModeButton.click();
  }

  await expect(
    page.getByRole("button", {
      name: "Switch to light mode",
      exact: true,
    }),
  ).toBeVisible();

  await expect
    .poll(async () =>
      page.evaluate(() =>
        window.localStorage.getItem("todo-theme"),
      ),
    )
    .toBe("dark");

  await page.reload();

  await expect(
    page.getByRole("button", {
      name: "Switch to light mode",
      exact: true,
    }),
  ).toBeVisible();

  expect(
    await page.evaluate(() =>
      window.localStorage.getItem("todo-theme"),
    ),
  ).toBe("dark");
});
