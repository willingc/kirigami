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
- `[tool.hatch.build.targets.wheel.force-include]` ships the built
  `kirigami/static/` directory inside the wheel (the dir itself is gitignored
  since it's a build artifact).
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

`deploy.sh` builds the frontend, copies the static export into the Python
package, and triggers the cloud deploy:

```bash
./deploy.sh
```

What it runs:

1. `cd apps/web && npm ci && npm run build` → produces `apps/web/out/`.
2. `rm -rf kirigami/static && cp -r apps/web/out kirigami/static`.
3. `uv run fastapi cloud deploy` from the repo root.

On first deploy the CLI links the project to a FastAPI Cloud app
(`.fastapicloud/cloud.json`). When prompted for "Path to the directory
containing your app," **leave it empty** — `pyproject.toml` is at the repo root
and the package is at `kirigami/`, so the deploy root and the runtime cwd are
both the repo root.

## Environment Variables

All Discourse credentials are optional. With nothing set, the backend hits
`https://discuss.python.org` anonymously and only public topics are reachable.
Set credentials if you need authenticated endpoints or higher rate limits:

```bash
uv run fastapi cloud env set DISCOURSE_BASE_URL "https://discuss.python.org"
uv run fastapi cloud env set DISCOURSE_USERNAME "your-discourse-username"
uv run fastapi cloud env set --secret DISCOURSE_API_KEY "your-discourse-api-key"
uv run fastapi cloud env set --secret DISCOURSE_USER_API_KEY "your-user-api-key"
```

`KIRIGAMI_CORS_ORIGINS` only matters if you host the frontend separately. With
the bundled static deploy, frontend and backend share an origin and CORS is a
no-op.

If you need a custom cache directory for fetched Discourse data:

```bash
uv run fastapi cloud env set KIRIGAMI_DISCOURSE_CACHE_DIR "/tmp/kirigami/discourse"
```

## Notes

- The `docker/`, `Caddyfile`, and `docker-compose.yml` files in the repo are
  for an alternative self-hosted deploy and are unrelated to FastAPI Cloud.
  `.fastapicloudignore` excludes them from the cloud bundle.
- Keep `.env` local. Configure production values through FastAPI Cloud
  environment variables.

References:

- https://fastapicloud.com/docs/getting-started/existing-project/
- https://fastapicloud.com/docs/builds-and-deployments/configuring-fastapi/
