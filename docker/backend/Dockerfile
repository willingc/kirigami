FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

COPY pyproject.toml uv.lock README.md ./
COPY kirigami ./kirigami

RUN uv sync --locked --no-dev

EXPOSE 8000

CMD ["sh", "-c", "python -m kirigami migrate && exec uvicorn kirigami.api:app --host 0.0.0.0 --port 8000"]
