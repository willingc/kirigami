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

If you use Nix, enter the project shell first:

```bash
nix develop
```

Run both services together:

```bash
mise run dev
```

Run the production-style Docker Compose stack behind Caddy:

```bash
mise run deploy
```

Run the Python and frontend checks:

```bash
mise run test
```

Default URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Backend docs: `http://localhost:8000/docs`
- Caddy deploy proxy: `https://0.0.0.0`

In development, `NEXT_PUBLIC_API_BASE_URL` points browser requests directly at
the backend. In deploy mode, browser requests use same-origin `/api/...` through
Caddy, while `KIRIGAMI_API_BASE_URL` keeps Next.js server-side requests on the
internal backend URL.

`mise run deploy` runs `docker compose up -d --build` and builds three images:
FastAPI backend, Next.js frontend, and Caddy. Caddy listens on all interfaces on
port `443` with `tls internal`, so browsers will see a local self-signed
certificate unless the Caddy local CA is trusted. Override `KIRIGAMI_CADDY_ADDR`
to change the Caddy bind address. The backend CORS defaults allow local
development origins plus HTTPS Caddy origins on port `443`; use
`KIRIGAMI_CORS_ORIGINS` or `KIRIGAMI_CORS_ORIGIN_REGEX` for other public hosts.

Docker Compose loads `.env` into all three services. For the Caddy deployment,
leave `NEXT_PUBLIC_API_BASE_URL` empty so browser requests use same-origin
`/api/...` through Caddy; set `KIRIGAMI_API_BASE_URL=http://backend:8000` for
server-side Next.js requests.

The deploy wrapper starts a Nix-provided Docker daemon when one is not already
available at `DOCKER_HOST`. Its default storage path is
`KIRIGAMI_DOCKER_DATA_ROOT=/opt/kirigami-docker`; point that variable at a
mounted volume when the root disk is small.
