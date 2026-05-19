FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/src

WORKDIR /app

RUN pip install --no-cache-dir \
    "fastapi>=0.115" \
    "uvicorn[standard]>=0.34" \
    "httpx>=0.28" \
    "pydiscourse==1.7.0" \
    "python-dotenv>=1.0.1" \
    "requests>=2.34.2"

COPY src ./src

EXPOSE 8000

CMD ["uvicorn", "kirigami.api:app", "--host", "0.0.0.0", "--port", "8000"]
