# kirigami

[Application](https://kirigami.fastapicloud.dev/) | [Documentation](https://willingc.github.io/kirigami/)

Kirigami is a Python toolkit for reorganizing and analyzing dialogue-oriented
text. This repository now includes a starter web application with a Next.js
frontend and a FastAPI backend.

## Web template

The web template is split into two pieces:

- `kirigami/api.py` exposes the Python backend.
- `apps/web` contains the Next.js App Router frontend.

Install the Python and Next.js dependencies:

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
mise run deploy:docker
```

Or deploy to FastAPI Cloud (builds the Next.js static export and bundles it
into the FastAPI app, so frontend and backend ship together behind one URL):

```bash
mise run deploy:fastapi
```

See [FASTAPI.md](FASTAPI.md) for FastAPI Cloud deploy details.

Build and preview the documentation site (Zensical):

```bash
mise run docs:build
mise run docs:serve
```

Published at [willingc.github.io/kirigami](https://willingc.github.io/kirigami/) from the `gh-pages` branch on push to `main`.

Run the Python and frontend checks:

```bash
mise run test
```

Default URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Backend docs: `http://localhost:8000/docs`
- Caddy deploy proxy: `https://www.dpodoesnt.work`

In development, `NEXT_PUBLIC_API_BASE_URL` points browser requests directly at
the backend. In deploy mode, browser requests use same-origin `/api/...` through
Caddy, while `KIRIGAMI_API_BASE_URL` keeps Next.js server-side requests on the
internal backend URL.

`mise run deploy:docker` runs `docker compose up -d --build` and builds three
images: FastAPI backend, static frontend, and Caddy. Caddy listens on all interfaces on
ports `80` and `443` for `https://www.dpodoesnt.work`; Caddy obtains and renews
the Let's Encrypt certificate automatically. Override `KIRIGAMI_CADDY_ADDR` to
change the Caddy site address. The backend CORS defaults allow local development
origins plus `https://www.dpodoesnt.work`; use `KIRIGAMI_CORS_ORIGINS` or
`KIRIGAMI_CORS_ORIGIN_REGEX` for other public hosts.

Docker Compose loads `.env` into all three services. For the Caddy deployment,
leave `NEXT_PUBLIC_API_BASE_URL` empty so browser requests use same-origin
`/api/...` through Caddy; set `KIRIGAMI_API_BASE_URL=http://backend:8000` for
server-side Next.js requests.

The deploy wrapper starts a Nix-provided Docker daemon when one is not already
available at `DOCKER_HOST`. Its default storage path is
`KIRIGAMI_DOCKER_DATA_ROOT=/opt/kirigami-docker`; point that variable at a
mounted volume when the root disk is small.

## Gratitude

Hosting for the kirigami application is generously provided by: [FastAPI Cloud](https://fastapicloud.com/).
