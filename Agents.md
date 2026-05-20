# Agent Instructions

## Project Context

Kirigami is a Python toolkit plus web app for reorganizing and analyzing
dialogue-oriented text, especially Discourse topics.

- Backend: `src/kirigami/api.py` is the FastAPI app.
- Frontend: `apps/web` is a Next.js App Router app.
- Topic pages live under `apps/web/app/topics/[topicId]/page.tsx`.
- The main topic UI is `apps/web/components/conversation-workbench.tsx`.
- Topic document loading and frontend topic types are under `apps/web/topic`.
- Backend Discourse fetching/export code is under `src/kirigami/discourse`.
- Tests are under `tests`.

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Backend docs: `http://localhost:8000/docs`

Use `mise run setup` to install Python, uv, and frontend dependencies. Use
`mise run dev` to run the FastAPI backend and Next.js frontend together.

## Frontend Notes

The web app uses Next.js, React, TypeScript, Tailwind CSS, ESLint, Prettier, and
Vitest. Run frontend commands with `--prefix apps/web` from the repo root, or
run them inside `apps/web`.

Prettier depends on `prettier-plugin-tailwindcss` installed in `apps/web`, so if
formatting a single frontend file manually, run Prettier from `apps/web`, for
example:

```bash
npx prettier components/conversation-workbench.tsx --write
```

The topic Sources tab should behave like a Discourse topic stream:

- Posts scroll on the main document, not inside a nested scroll panel.
- The right timeline stays fixed on desktop while the source post stream is in
  view.
- The timeline must never sit above the top of the source posts.
- Timeline dragging should avoid React-driven layout churn that causes blinking
  or jitter. Prefer pointer refs, `requestAnimationFrame`, and direct DOM style
  updates for high-frequency drag or scroll positioning.

## Python Notes

Use `uv` through `mise` where possible. Python linting is Ruff. The configured
Python version comes from `KIRIGAMI_PYTHON_VERSION` in `mise.toml`.

Common checks:

```bash
uv run --python "$KIRIGAMI_PYTHON_VERSION" --extra dev ruff check .
uv run --python "$KIRIGAMI_PYTHON_VERSION" --extra dev --extra web pytest
```

## Required Finish Rule

Always finish any code or documentation change by running:

```bash
mise run lint
```

If `mise run lint` reports any error, fix the error and rerun `mise run lint`
until it passes. Do not hand work back while this command is failing unless the
failure is caused by an external blocker that cannot be fixed in the repository.
