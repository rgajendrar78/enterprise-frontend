# Enterprise Frontend

Next.js 16 (App Router) + Tailwind 4 + TanStack Query. **Feature-sliced** — each
screen owns its components, data and services, and shares only what a second
feature genuinely needs.

Auth with token refresh, permission gating, error handling, a data table,
pagination, a design system, CI and a staging/production deploy are already
wired. You add features.

Works with any API returning `{ success, message, data, meta }` — the shape the
companion `enterprise-backend` template serves.

## Architecture

```
  app/(group)/page.tsx        routes only — a page renders a feature, nothing else
        │
  features/<name>/            ← the application: components/ services/ data/
        │
  api/hooks ─▶ api/client     envelope, auth header, single-flight refresh, error routing
        │
     backend

  proxy.ts                    navigation gate (cookie presence) — runs before any of it
```

Three kinds of state, never mixed:

| State                          | Lives in                        |
| ------------------------------ | ------------------------------- |
| Server data                    | TanStack Query                  |
| Session (token, profile)       | Zustand + localStorage + cookie |
| UI state (open, input, page N) | `useState` / `usePagination`    |

Server data in Zustand is the mistake this layout prevents — you inherit cache
invalidation and staleness by hand. Full reasoning:
**[ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

## Quick start

```bash
corepack enable && pnpm install
cp .env.example .env.local     # point NEXT_PUBLIC_API_URL at your API
pnpm dev                       # http://localhost:3000
```

Rename `name` in `package.json` — the only rename required, nothing is branded.
`NEXT_PUBLIC_API_URL` **must include the API version**, e.g.
`http://localhost:4000/api/v1`. Start the backend first, or every request 404s.

Node 24 (`.nvmrc`), pnpm 11.5 (`packageManager`). Both are enforced: `preinstall`
rejects npm/yarn/bun and `.npmrc` sets `engine-strict`.

The `users` feature is a worked example; the plumbing around it is not. Removing
it is a delete plus one nav entry.

## Where new code goes

```
src/
├── app/                  # routes only: page.tsx renders a feature
│   ├── (auth)/           # public: sign-in, forgot-password, reset-password
│   ├── (app)/            # authenticated shell: dashboard, users, users/[id], account
│   └── layout providers error global-error not-found globals.css
├── proxy.ts              # Next 16 navigation gate (was middleware.ts)
├── api/                  # client, endpoints, hooks, query-client, query-keys
├── components/ui|layout|shared
├── config/env.ts constants/ hooks/ stores/ types/ utils/
└── features/<name>/      # one screen: index.tsx + components/ services/ data/
                          # several:   <screen>/ folders, shared parts at the root
```

Placement is decided by **who uses it**, in one step:

| Used by                         | Lives in                                           |
| ------------------------------- | -------------------------------------------------- |
| one screen                      | that screen's folder                               |
| two screens of the same feature | the feature root                                   |
| two features                    | `components/shared/`, `hooks/`, `utils/`, `types/` |

Never reach sideways into a sibling screen's folder — if two screens need it, it
has already moved up. A feature may import another feature's `services/` (its
public data layer, so both share one cache entry) and nothing else. Recipe:
**[ADD-A-FEATURE.md](docs/ADD-A-FEATURE.md)**.

**Before you build anything, check it does not exist.** The reuse table in
[CLAUDE.md](CLAUDE.md#use-what-exists) is the canonical list — a whole list
screen, a table, a filter bar, a confirm dialog, a date picker and a searchable
select are all already there.

## Environment

Both variables are in [`.env.example`](.env.example), validated by Zod in
`src/config/env.ts`, which `next.config.ts` imports — a bad value fails the
**build**, not the browser.

| Variable               | Meaning                                        |
| ---------------------- | ---------------------------------------------- |
| `NEXT_PUBLIC_API_URL`  | API base **including the version**, `…/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | Name in the header and page titles             |

`NEXT_PUBLIC_*` are **inlined into the bundle at build time**, so an image
belongs to exactly one environment. That is why **a production build has no
defaults**: a missing variable fails `next build` and names it, instead of
quietly baking `localhost` into an image nobody can reconfigure. Defaults still
apply outside production, so `pnpm dev` needs no file. Never put a secret here —
everything with this prefix ships to the browser.

## Commands

| Command                        | Does                                                             |
| ------------------------------ | ---------------------------------------------------------------- |
| `pnpm dev` / `build` / `start` | dev / production build / run the standalone build, as prod does  |
| `pnpm verify`                  | typecheck → lint → format → knip → test → audit → build (**CI**) |
| `pnpm test` / `test:watch`     | vitest                                                           |
| `pnpm lint:fix` / `format`     | fix lint / write prettier                                        |

`pnpm verify` is the gate: if it passes, CI passes. Restart `pnpm start` after
any rebuild — a build swaps the server and the chunk names underneath it, and the
symptom is a blank page whose HTML is still 200 while every `/_next/static/*`
request 500s.

## Workflow

1. Branch off `develop`.
2. Build inside one feature boundary. Read **[CLAUDE.md](CLAUDE.md)** first — it
   is the rule set for humans and AI alike.
3. `pnpm verify` green. Hooks help: pre-commit runs lint-staged, commit-msg runs
   commitlint (**Conventional Commits**), pre-push runs typecheck + lint + test.
4. PR into `develop`. CI runs `pnpm verify` on the exact commit. Review against
   CLAUDE.md — inline literals, hardcoded routes or permissions, raw palette
   colours, data fetching outside a service hook, anything duplicating an
   existing primitive.
5. Merge to `develop` → staging. Merge `develop` → `main` → production.

Tests are `*.spec.ts(x)` beside the source. Test error mapping, pagination,
permissions and branches — not that a component renders its props.

## CI/CD

```
commit ─▶ CI (pnpm verify) ─▶ docker build ─▶ registry ─▶ roll ─▶ health check
                                  │                              │
                       NEXT_PUBLIC_* baked in    revert + push ◀──┘ on failure
```

| Workflow                | Runs on                    | Does                                   |
| ----------------------- | -------------------------- | -------------------------------------- |
| `ci.yml`                | every PR, weekly, dispatch | `pnpm verify`                          |
| `deploy-staging.yml`    | push to `develop`          | CI, then **staging**                   |
| `deploy-production.yml` | push to `main`             | CI, then **production**                |
| `deploy.yml`            | called with an environment | build → ECR → roll the service → smoke |
| `deploy-ghcr.yml`       | called with an environment | build → GHCR → restart → smoke test    |
| `deploy-ec2.yml`        | called with an environment | build → tarball → PM2 reload → smoke   |

Each deploy calls the real `ci.yml` first, so only a commit that passed ships.
Because `NEXT_PUBLIC_*` are inlined, **one image belongs to one environment** —
the build reads them from that environment's GitHub variables, and fails before
the build if either is missing. Three targets, one line apart in the caller —
**`deploy.yml`** (ECR + ECS on EC2, OIDC, rolling with auto-rollback) is the
production one. Every variable to set, and how to roll back:
**[DEPLOY.md](docs/DEPLOY.md)**.

## Troubleshooting

| Symptom                                       | Cause and fix                                                                                                                      |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `This repo is pnpm-only`                      | You ran npm/yarn/bun. `corepack enable && pnpm install`.                                                                           |
| Build fails on env                            | Set every `NEXT_PUBLIC_*` in the build environment — a production build has no defaults, and the URL must be a full `http(s)` one. |
| Signed in, but every request 401s             | `NEXT_PUBLIC_API_URL` is missing the version, e.g. `.../api/v1`.                                                                   |
| Every request fails with a CORS error         | The API's `CORS_ORIGINS` does not list this origin.                                                                                |
| `pnpm verify` fails on knip                   | Something is unused. Import it or delete it — do not add an ignore.                                                                |
| Lint rejects a colour                         | Every colour is a token in `app/globals.css`. See [UI.md](docs/UI.md).                                                             |
| Blank page, `/_next/static/*` 500s            | You rebuilt without restarting `pnpm start`.                                                                                       |
| Works locally, every call fails in production | You are serving over plain HTTP — see [DEPLOY.md](docs/DEPLOY.md#serve-it-over-https).                                             |

## Docs

| File                                           | For                                                           |
| ---------------------------------------------- | ------------------------------------------------------------- |
| **[CLAUDE.md](CLAUDE.md)**                     | The rules — every developer, reviewer and AI reads this first |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)   | Layers, state, decisions, seams, scaling path                 |
| [docs/DATA-AND-AUTH.md](docs/DATA-AND-AUTH.md) | Query hooks, error routing, auth and session, API contract    |
| [docs/UI.md](docs/UI.md)                       | Design tokens, the surface ladder, components, theming        |
| [docs/ADD-A-FEATURE.md](docs/ADD-A-FEATURE.md) | Worked recipe for a new screen                                |
| [docs/DEPLOY.md](docs/DEPLOY.md)               | Environments, variables, rollout and rollback                 |

Other assistants: point them at [AGENTS.md](AGENTS.md), which forwards to
`CLAUDE.md`. Companion API: the `enterprise-backend` template, which serves this
envelope with no adapter.
