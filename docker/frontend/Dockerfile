FROM node:24-alpine AS deps

WORKDIR /app/apps/web

COPY apps/web/package*.json ./
RUN npm ci

FROM node:24-alpine AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_BASE_URL=""
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY apps/web ./apps/web

RUN npm run build --prefix apps/web

FROM caddy:2-alpine AS runner

COPY docker/frontend/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/apps/web/out /srv

EXPOSE 3000

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
