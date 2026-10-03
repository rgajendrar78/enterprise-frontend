# syntax=docker/dockerfile:1

# ─── base ─────────────────────────────────────────────────────────────────────
# pnpm on the PATH and one workdir. Only the build stages need it.

FROM node:24-alpine AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /app

# ─── deps ─────────────────────────────────────────────────────────────────────
# Manifests only, so editing source does not invalidate the install layer. No
# BuildKit cache mount: `docker build` must work without the buildx plugin.

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile

# ─── build ────────────────────────────────────────────────────────────────────
# Both args are required. NEXT_PUBLIC_* are inlined into the bundle here, so an
# image belongs to one environment and a missing value has to fail the build.

FROM deps AS build

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_NAME

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME

COPY . .

RUN pnpm build

# ─── runtime ──────────────────────────────────────────────────────────────────
# `output: "standalone"` traces the files the server needs, so nothing is installed
# here. Not FROM base — the shipped image never runs pnpm. `static/` is not traced.

FROM node:24-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
