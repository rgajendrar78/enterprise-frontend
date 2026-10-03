# Architecture

```
proxy.ts                  navigation gate — cookie presence, before anything renders
   │
app/(route)/page.tsx      routes only, no logic
   └── features/<name>/   components/ services/ data/  ← the application
          └── api/hooks → api/client   envelope, auth header, refresh, errors
                 └── backend
```

Three kinds of state, never mixed:

| State                          | Lives in                        |
| ------------------------------ | ------------------------------- |
| Server data                    | TanStack Query                  |
| Session (token, profile)       | Zustand + localStorage + cookie |
| UI state (open, input, page N) | `useState` / `usePagination`    |

Server data in Zustand is the mistake this layout prevents — you inherit cache
invalidation and staleness by hand.

## Decisions

- **Thin routes.** Moving `/users` to `/admin/users` is a file move.
- **One axios instance, one error path.** Only `api/client.ts` may import axios's
  default export (eslint-enforced); every failure lands in the query client's
  cache handlers. Status side effects live in `routeByStatus` alone.
- **Single-flight refresh.** Six parallel 401s trigger one refresh, not six.
- **Permission gating is UX**, not security. The API enforces the same string.
- **Validation mirrored, asserted.** A one-sided change fails CI instead of
  producing a form the API rejects.
- **Cookie mirror** for the navigation gate: presence only, no JWT crypto per
  navigation.
- **Tokens in localStorage** — a deliberate trade for a client-agnostic bearer
  API, XSS-exposed, and there is no CSP configured. Both the mitigations and the
  gap are spelled out in
  [DATA-AND-AUTH.md](DATA-AND-AUTH.md#why-localstorage-and-what-it-costs).
  Upgrade path: HttpOnly cookie set by the API, then delete `utils/auth-cookie.ts`.
- **One colour system, lint-enforced.** Every colour is a semantic token in
  `app/globals.css`, derived from a single hue knob; raw palette utilities, hex,
  `rgb()`/`oklch()` and `dark:` colour overrides all fail the build. See
  [UI.md](UI.md).
- **Theme is an attribute, not a dependency.** A pre-paint head script resolves
  the preference (including "system") and writes `<html data-theme>`; `useTheme`
  reads it through `useSyncExternalStore`. No `next-themes`, and exactly one dark
  block in the stylesheet.
- **shadcn/ui, added on demand.** The components a screen actually needs are
  installed — one `radix-ui` dependency, no library of unused parts. `select` is
  deliberately not among them; `<SearchableSelect>` covers every list of choices,
  rows-per-page included. `Button` carries the only local edit: `isLoading`.
- **Third-party palettes get remapped.** `components/ui/sonner.tsx` binds
  sonner's colour variables to the tokens, so nothing renders in a colour the
  design system does not own.
- **A resource is a line, not a folder of hooks.** `createCrudApi` returns list,
  one, create, update and delete on one query key, and `<FormDialog>` carries the
  dialog shell plus both save guards. A new module is its columns, its fields and
  its filters — everything else is already shared, so a fix lands once for every
  screen. Only what a resource has _beyond_ CRUD is hand-written.
- **No `@tanstack/react-table`.** `<DataTable>` is a typed column list over a
  plain table — enough for server-paginated lists. Swap it in when you need
  resizing, grouping or virtualisation.
- **React Compiler is on** — no defensive `useMemo`/`useCallback`.

## Seams (where to extend without a rewrite)

| Want to change                   | Touch                                    |
| -------------------------------- | ---------------------------------------- |
| Auth transport (HttpOnly cookie) | `api/client.ts` + `utils/auth-cookie.ts` |
| A status side effect             | `routeByStatus`                          |
| Error copy                       | `extractErrorMessage`                    |
| Query key shape                  | `createQueryKeys`                        |
| What every resource can do       | `api/crud.ts` (`createCrudApi`)          |
| What every form dialog does      | `components/shared/form-dialog.tsx`      |
| Backend location / gateway       | `config/env.ts` + `api/endpoints.ts`     |
| Client telemetry (Sentry, RUM)   | `emit` in `utils/logger.ts`              |
| Theme                            | tokens in `app/globals.css`              |

Deployable as a container (standalone output, `PORT`/`HOSTNAME`, non-root) or on
any Node host; `/api/health` answers ECS and Kubernetes probes and is excluded
from the navigation gate.

## Build

**One bundler: Turbopack**, the Next 16 default for `dev` and `build`. There is
deliberately no second build script — two paths drift, and a bug that appears
only in the bundler CI does not use is the worst kind to debug.

`.next/cache` stays flat across builds; a long-running dev server is where it
grows. Deleting `.next` is always safe and costs one cold build, which is also
the memory peak. On a constrained runner cap it deliberately
(`NODE_OPTIONS=--max-old-space-size=4096 pnpm build`) — an arbitrary cap turns a
slow build into an OOM crash. If a machine genuinely cannot fit it,
`pnpm exec next build --webpack` still works, but that is an escape hatch, not a
second supported path — webpack is deprecated in Next. Resize the runner, do not
fork the bundler.

Every `verify` step is a second or two on a developer machine. If one becomes
minutes, look at what you added rather than deleting the step.

## Not here on purpose

The rest of the shadcn catalogue (one CLI command each), i18n, Server Actions,
Storybook, Playwright, MSW, charts, Sentry, a Content-Security-Policy header. Add
when needed — the CSP first if you are handling anything sensitive.

## Scaling

Features never import each other's internals; anything two of them share moves up
to `components/shared/`, `hooks/`, `utils/` or `types/`. The one exception is a
feature's `services/`, which is its public data layer — sharing it keeps one
query key and one cache entry. That single rule keeps a 100-screen app navigable.

**Within a screen**, in order: keep pagination server-side (never fetch a whole
table to filter in the browser) · raise `staleTime` per query rather than
globally · split heavy, rare UI with `next/dynamic` and watch the First Load JS
column in `next build` · virtualise only if a page genuinely renders thousands of
rows. Details in
[ADD-A-FEATURE.md](ADD-A-FEATURE.md#when-the-screen-needs-to-scale).

**A second app** (admin + portal): copy the template, and extract the API client,
envelope types and primitives into an internal package when duplication actually
hurts — not before.

**If the backend splits into services**, point `API.<domain>` at a gateway. No
component changes; that is the whole benefit of one endpoint catalogue.
