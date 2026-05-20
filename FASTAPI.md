# FastAPI Cloud Deployment

This deploys the FastAPI backend only. FastAPI Cloud does not use this repo's
Docker, Caddy, or Next.js frontend configuration; host the frontend separately
and point it at the deployed API URL.

## Project Configuration

The repo is configured for FastAPI Cloud with:

- `.python-version` set to `3.13`
- `fastapi` in the root `pyproject.toml` dependencies so the cloud runtime can
  import the app
- `fastapi[standard]` in the `web` optional dependency group for the local CLI
  and dev server
- `[tool.fastapi] entrypoint = "kirigami.api:app"`

The entrypoint points to the FastAPI app exported from `kirigami/api.py`.
The Docker backend image installs FastAPI directly, so Docker does not depend on
the optional `web` group.

## Verify Locally

Install dependencies:

```bash
mise run setup
```

Verify the configured app can be imported:

```bash
uv run python -c "from kirigami.api import app; print(app.title)"
```

Optionally run the FastAPI dev server from the configured entrypoint:

```bash
uv run --extra web fastapi dev
```

## Environment Variables

Set the Discourse credentials in FastAPI Cloud. Use secrets for API keys:

```bash
fastapi cloud env set DISCOURSE_BASE_URL "https://discuss.python.org"
fastapi cloud env set DISCOURSE_USERNAME "your-discourse-username"
fastapi cloud env set --secret DISCOURSE_API_KEY "your-discourse-api-key"
fastapi cloud env set --secret DISCOURSE_USER_API_KEY "your-user-api-key"
```

Set CORS to the frontend origin that will call the API:

```bash
fastapi cloud env set KIRIGAMI_CORS_ORIGINS "https://your-frontend-domain"
```

If you need a custom cache directory in the cloud runtime, set:

```bash
fastapi cloud env set KIRIGAMI_DISCOURSE_CACHE_DIR "/tmp/kirigami/discourse"
```

## Deploy

FastAPI Cloud's migration checklist expects `fastapi[standard]` to be available
for CLI workflows. This repo keeps the heavier `standard` extra in the `web`
optional dependency group, while keeping plain `fastapi` in root dependencies so
the cloud runtime can import `kirigami.api:app`.

Before deploying, sync the API extra locally so the `fastapi` CLI is available:

```bash
uv sync --extra web
```

Login and deploy from the repository root:

```bash
fastapi login
uv run --extra web fastapi deploy
```

After deployment, set the frontend's `NEXT_PUBLIC_API_BASE_URL` to the FastAPI
Cloud app URL.

## Notes

- Do not rely on `docker-compose.yml` for FastAPI Cloud; it builds and runs the
  Python app directly.
- Keep `.env` local. Configure production values through FastAPI Cloud
  environment variables.
- If `fastapi dev` cannot find the app, check `[tool.fastapi]` in
  `pyproject.toml`.

References:

- https://fastapicloud.com/docs/getting-started/existing-project/
- https://fastapicloud.com/docs/builds-and-deployments/configuring-fastapi/
