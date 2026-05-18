# kirigami

Kirigami is a Python toolkit for reorganizing and analyzing dialogue-oriented
text. This repository now includes a starter web application with a Next.js
frontend and a FastAPI backend.

## Web template

The web template is split into two pieces:

- `src/kirigami/api.py` exposes the Python backend.
- `apps/web` contains the Next.js App Router frontend.

Install the Python web extra and the frontend dependencies:

```bash
mise run setup
```

Run both services together:

```bash
mise run dev
```

Run the Python and frontend checks:

```bash
mise run test
```

Default URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Backend docs: `http://localhost:8000/docs`

Set `NEXT_PUBLIC_API_BASE_URL` and `KIRIGAMI_API_BASE_URL` when the backend runs
somewhere other than `http://localhost:8000`.
