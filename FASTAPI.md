# FastAPI Cloud Deployment

This deploys both the FastAPI backend and the Next.js frontend together to
FastAPI Cloud. The Next.js app is statically exported and bundled into the
Python package as `kirigami/static/`; FastAPI serves those files alongside the
JSON API, so everything runs same-origin behind one URL.

## Project Configuration

- `.python-version` set to `3.13`.
- `fastapi[standard]` in the root `pyproject.toml` dependencies so the cloud
  runtime has the `fastapi` CLI available to launch the app.
- `[tool.fastapi] entrypoint = "kirigami.api:app"` points the cloud runtime at
  the FastAPI app exported from `kirigami/api.py`.
- `[tool.hatch.build.targets.wheel] artifacts = ["kirigami/static/**"]` ships
  the built `kirigami/static/` directory inside the wheel when it exists (the
  dir itself is gitignored since it's a build artifact).
- `.fastapicloudignore` keeps the build slim: it excludes the Next.js source
  (`apps/`), notebooks, docs, Docker config, tests, and dev tooling, while
  re-including `kirigami/static/` (which is gitignored).

## Frontend Static Export

`apps/web/next.config.js` is configured with `output: "export"`,
`trailingSlash: true`, and `images: { unoptimized: true }`.

The topic detail route (`/topics/[topicId]/`) is generated once as a placeholder
HTML shell with `generateStaticParams: [{ topicId: "_" }]`. At runtime, FastAPI's
SPA catch-all serves that same shell for any `/topics/<id>/` path, and the
client component reads the real topic ID from `window.location` and fetches the
document from the backend.

`apps/web/lib/api.ts` uses `clientApiBaseUrl()` (default `""` = same origin), so
no `NEXT_PUBLIC_API_BASE_URL` is needed when frontend and backend share an
origin.

## Verify Locally

Install dependencies:

```bash
uv sync
```

Verify the app imports:

```bash
uv run python -c "from kirigami.api import app; print(app.title)"
```

Run the FastAPI dev server:

```bash
uv run fastapi dev
```

Run the frontend dev server (in another terminal) — useful for editing the
Next.js app without rebuilding the static bundle:

```bash
cd apps/web && npm run dev
```

## Deploy

`mise run deploy:fastapi` builds the frontend, copies the static export into
the Python package, and triggers the cloud deploy:

```bash
mise run deploy:fastapi
```

For local deploys, copy `.env.dist` to `.env` and fill in:

```bash
FASTAPI_CLOUD_TOKEN=
FASTAPI_CLOUD_APP_ID=
```

`deploy.sh` loads `.env` automatically, validates those values, and then uses
the token-based CLI authentication path.

What it runs:

1. `uv sync --python "$KIRIGAMI_PYTHON_VERSION" --locked`.
2. `cd apps/web && npm ci && NEXT_PUBLIC_API_BASE_URL= KIRIGAMI_API_BASE_URL= npm run build`
   → produces `apps/web/out/`.
3. `rm -rf kirigami/static && cp -r apps/web/out kirigami/static`.
4. `uv run --python "$KIRIGAMI_PYTHON_VERSION" --locked fastapi cloud deploy`
   with `--app-id "$FASTAPI_CLOUD_APP_ID"` from the repo root.

On first deploy the CLI links the project to a FastAPI Cloud app
(`.fastapicloud/cloud.json`). When prompted for "Path to the directory
containing your app," **leave it empty** — `pyproject.toml` is at the repo root
and the package is at `kirigami/`, so the deploy root and the runtime cwd are
both the repo root.

### Continuous deployment

`.github/workflows/fastapicloud-deploy.yml` runs the same locked
build-and-deploy pipeline on every push to `main` (and on manual dispatch). It
needs two GitHub repository secrets:

- `FASTAPI_CLOUD_TOKEN` — a deploy token from FastAPI Cloud
- `FASTAPI_CLOUD_APP_ID` — the app ID from `.fastapicloud/cloud.json`

## Environment Variables

`.env.dist` contains local, Docker, CI, and FastAPI Cloud values. Do not copy it
wholesale into FastAPI Cloud. Use the tables below.

### FastAPI Cloud Runtime

Set these on the FastAPI Cloud app:

| Variable | FastAPI Cloud value |
| --- | --- |
| `DISCOURSE_BASE_URL` | `https://discuss.python.org` |
| `DISCOURSE_USERNAME` | `<discourse-username>` when using authenticated Discourse access; otherwise leave unset |
| `DISCOURSE_API_KEY` | `<secret>` when using authenticated Discourse access; otherwise leave unset |
| `KIRIGAMI_DISCOURSE_CACHE_DIR` | `/tmp/kirigami/discourse` |
| `KIRIGAMI_CORS_ORIGINS` | leave unset for the bundled same-origin frontend |
| `KIRIGAMI_CORS_ORIGIN_REGEX` | leave unset for the bundled same-origin frontend |

Use one Discourse authentication mode:

- API key mode: set `DISCOURSE_USERNAME=<discourse-username>` and
  `DISCOURSE_API_KEY=<secret>`.
- Public-only mode: leave both Discourse auth values unset.

Example:

```bash
uv run --locked fastapi cloud env set DISCOURSE_BASE_URL "https://discuss.python.org"
uv run --locked fastapi cloud env set KIRIGAMI_DISCOURSE_CACHE_DIR "/tmp/kirigami/discourse"
uv run --locked fastapi cloud env set DISCOURSE_USERNAME "<discourse-username>"
uv run --locked fastapi cloud env set --secret DISCOURSE_API_KEY "<secret>"
```

### Deploy Auth

These are required for local `mise run deploy:fastapi` and GitHub Actions, but
they are not FastAPI app runtime settings:

| Variable | Where to set | Value |
| --- | --- | --- |
| `FASTAPI_CLOUD_TOKEN` | local `.env` and GitHub secret | `<secret>` |
| `FASTAPI_CLOUD_APP_ID` | local `.env` and GitHub secret | `<fastapi-cloud-app-id>` |

### Frontend API URL

For FastAPI Cloud, the frontend and backend are served by the same FastAPI app,
so browser API calls must use same-origin `/api/...`.

| Variable | FastAPI Cloud value |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | do not set; must be empty during static build |
| `KIRIGAMI_API_BASE_URL` | do not set for FastAPI Cloud static deploy |

`NEXT_PUBLIC_API_BASE_URL` is baked into the static frontend at build time.
Setting it to `http://127.0.0.1:8000` causes deployed browsers to request
`http://127.0.0.1:8000/api/...`. `deploy.sh` explicitly clears
`NEXT_PUBLIC_API_BASE_URL` and `KIRIGAMI_API_BASE_URL` while running
`npm run build`, and the GitHub Actions workflow sets both variables to empty
at the job level, to prevent local `mise.toml` development defaults from
leaking into the cloud bundle. After the build, `deploy.sh` fails the deploy if
the static export contains localhost API URLs.

### Docker-Only Values

These `.env.dist` values are for `mise run deploy:docker` and should not be set
inside FastAPI Cloud:

| Variable | Docker value |
| --- | --- |
| `KIRIGAMI_API_BASE_URL` | `http://backend:8000` |
| `NEXT_PUBLIC_API_BASE_URL` | empty |
| `KIRIGAMI_CADDY_ADDR` | `https://www.dpodoesnt.work` |
| `KIRIGAMI_API_UPSTREAM` | `backend:8000` |
| `KIRIGAMI_WEB_UPSTREAM` | `frontend:3000` |
| `KIRIGAMI_DOCKER_DATA_ROOT` | `/opt/kirigami-docker` |
| `KIRIGAMI_DOCKERD_LOG` | `/tmp/kirigami-dockerd.log` |

## Notes

- The `docker/`, `Caddyfile`, and `docker-compose.yml` files in the repo are
  for an alternative self-hosted deploy and are unrelated to FastAPI Cloud.
  `.fastapicloudignore` excludes them from the cloud bundle.
- Keep `.env` local. Configure production values through FastAPI Cloud
  environment variables.

References:

- https://fastapicloud.com/docs/getting-started/existing-project/
- https://fastapicloud.com/docs/builds-and-deployments/configuring-fastapi/
