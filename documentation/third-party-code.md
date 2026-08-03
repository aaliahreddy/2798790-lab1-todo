# Third-Party Code

This document lists the third-party packages installed and the reason why each was chosen. Exact package versions are recorded in `package-lock.json`.

## Application Dependencies
| Package | Reason |
| --- | --- |
| `next` | Provides the application framework, App Router, API route handlers, development server, and production build tooling used by the todo application.  |
| `react`  | Provides the component, state, event, and rendering model used to build the interactive user interface. |
| `react-dom`  | Connects React component to the browser DOM and is required by Next.js for client-side and server-side rendering. |
| `better-sqlite3`  | Provides a simple synchronous SQLite interface for Node.js and allows task data to persist locally in a single database file. |
| `lucide-react`  | Provides the consistent task, status, archive, calendar, theme and action icons used throughout the interface. |

## Development Dependencies

| Package | Reason |
|---|---|
| `@playwright/test` | Runs end-to-end tests in a real browser so that task creation, editing, archiving, sorting, overdue display, and persistence can be tested as user-visible behaviour. |
| `vitest` | Provides support for running unit tests on individual functions and isolated application logic. |
| `typescript` | Adds static type checking for task objects, API request data, database results, and React component code. |
| `@types/node` | Supplies TypeScript definitions for Node.js APIs used by the server, scripts, filesystem access, and environment variables. |
| `@types/react` | Supplies TypeScript definitions for React component, hooks, forms, events, and JSX. |
| `@types/react-dom` | Supplies TypeScript definitions for React DOM rendering. |
| `@types/better-sqlite3` | Supplies TypeScript definitions for the `better-sqlite3` database API. |
| `eslint` | Checks the source code for common JavaScript and TypeScript mistakes and helps maintain consistent code quality. |
| `eslint-config-next` | Applies the linting rules recommended for Next.js, React, accessibility, and framework-specific behaviour. |
| `tailwindcss` | Provides utility-based CSS tooling for styling the application. |
| `@tailwindcss/postcss` | Integrates Tailwind CSS with PostCSS so that Tailwind styles can be processed during development and production builds. |


## Licensing Note

The third-party packages listed above were installed through npm and are used through their public APIs. Exact dependency information is recorded in `package.json` and `package-lock.json`.

No third-party source code was copied directly into the repository.

---

**AI Declaration**: The preceding document was reviewed and edited with: ChatGPT-Web[GPT-5.6 Thinking]