# CLAUDE.md

Rules for anyone — human or AI — writing code here. Context:
[ARCHITECTURE.md](docs/ARCHITECTURE.md). Recipe:
[ADD-A-FEATURE.md](docs/ADD-A-FEATURE.md). Detail:
[DATA-AND-AUTH.md](docs/DATA-AND-AUTH.md) · [UI.md](docs/UI.md).

## The standard

Every change is production-ready and review-ready: scalable, readable,
optimized, DRY, SOLID, secure, maintainable, simple — and **correct and secure
before anything else**.

- **Fit before you write.** Read the neighbouring code and match its
  architecture, naming, placement and error handling. Use what exists (the table
  below) before adding anything new.
- **Feature-local by default.** A util, component, service, type or constant
  moves to `components/shared/`, `hooks/`, `utils/`, `types/` or `constants/`
  only when a **second** feature genuinely needs it — never in anticipation.
  The one exception is the **design system**: every control in "Use what exists"
  below ships whether or not a screen uses it yet (`<DatePicker>` and the `date`
  filter are there today with no caller). That is the point of a primitive — the
  rule forbids inventing abstractions, not stocking the toolbox.
- **Think first.** Validation, empty and error states, loading and race
  conditions, permissions and data exposure, unnecessary re-renders and
  refetches, backward compatibility, regression risk.
- **Simple over clever.** No speculative abstraction, no hack, no deprecated
  pattern, no dead code, no bare literal, no dependency for what a few lines do.
- **Minimal code, full type safety.** No `any`, no suppressed error, no weakened
  rule to pass a build — fix the cause.
- **Comments: at most 1–2 per file**, only where the _why_ is not evident —
  JSX `{/* */}` and doc-comments included; a lint directive is not a comment.
- **"Done" means verified**, not written: re-read your own diff for bugs, edge
  cases and side effects, then `pnpm verify`.
- **Ship nothing below 10/10 in a senior review.** If something cannot be fixed
  in scope, say so plainly rather than quietly shipping a 7/10.

## Non-negotiable

1. `pnpm verify` must pass before anything is "done".
2. knip fails on unused code — a new dependency lands with its first import.
   Two deliberate exemptions: exports used only inside their own file, and
   `components/ui/**`, which is generated library surface you regenerate with the
   shadcn CLI rather than prune. Your own code has no exemption.
3. Browser config is `NEXT_PUBLIC_*`, added to the Zod schema **and**
   `.env.example`. No secrets. Any default is **development-only** (see
   `buildEnvSchema`): the value is inlined at build time, so a default in a
   production build silently ships `localhost`. Missing at build = build fails.
4. Never hand-edit `pnpm-lock.yaml`. pnpm only.
5. Conventional Commits — commitlint enforces them, and they are what release
   automation reads the day you add it.

## Changing what already ships

Nothing you add may break an existing screen, route, primitive, test or deploy.
Before touching anything outside the feature you are working in:

- **Extend, never rewrite.** A new screen fits the existing architecture. If it
  seems to need a new pattern, you have either missed the existing one or the
  requirement is genuinely new — say which.
- **Shared code has consumers.** Anything in `components/shared/`, `hooks/`,
  `utils/`, `types/`, `constants/` or `api/` is used by more than one feature:
  find every caller before changing a signature or a prop, and keep the old
  behaviour working. A new optional prop is safe; a renamed or removed one is not.
- **The API is the contract, and it is not yours.** Mirror it — permission
  strings in `constants/app.ts`, field limits in `constants/validation.ts`. Never
  reshape server data at the component level; do it in the service hook.
- **A production change needs a way back.** Know before you merge how it is
  rolled back. See [DEPLOY.md](docs/DEPLOY.md#rollout-safety-and-rollback), and
  remember `NEXT_PUBLIC_*` changes mean a new image, not a restart.
- **Keep features extractable.** Import another feature's `services/` and nothing
  else — never its components, `data/` or internals. That one rule is what lets a
  feature move to another app, and lets the backend split into services behind a
  gateway without a component change.

## Principles, concretely

- **SRP** — `page.tsx` routes, `index.tsx` composes, `components/` render,
  `services/` fetch, `utils/` compute. Table columns and form sections get
  their own files before the screen file grows past ~200 lines.
- **DRY with a boundary** — one implementation of a _decision_
  (`extractErrorMessage`, `routeByStatus`, `createQueryKeys`, `<DataTable>`).
  Two components that merely look similar are not duplication.
- **OCP** — extend by adding to a map (`STATUS_VARIANT`, `NAV_ITEMS`,
  `API`), never by adding a `switch` inside a component.
- **Composition over props explosion** — if a component needs a sixth boolean
  flag, it is two components.
- **The API is the contract** — types in `types/api.ts` mirror the backend
  envelope. UI never reshapes server data at the component level; do it in the
  service hook.

## Use what exists

| Need                       | Use                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **A whole CRUD resource**  | **`createCrudApi<T, C, U>("orders", API.orders)`** — the five hooks                                                      |
| List fetch                 | `ordersApi.useList(params)` → `{ items, meta }`                                                                          |
| Single fetch               | `ordersApi.useOne(id)`                                                                                                   |
| Write beyond CRUD          | `useApiMutation`, invalidating `ordersApi.keys.all`                                                                      |
| **A whole list screen**    | **`useCrudScreen<T>()`** — paging + form state                                                                           |
| List state alone           | `usePagination()`                                                                                                        |
| Table                      | `<DataTable query={…}>` + `Column<T>[]`, `pagination={…}` — the query prop carries loading, refreshing, empty and failed |
| **Row action menu**        | **`rowActionsColumn(actions)`** + `RowAction<T>[]`                                                                       |
| Filter bar                 | `<GlobalFilter>` + `FilterConfig[]`                                                                                      |
| **Destructive row action** | **`confirm: prompt` on the `RowAction`**                                                                                 |
| **Destructive elsewhere**  | **`await useConfirm()({ … })`**                                                                                          |
| **A create/edit dialog**   | **`<FormDialog form onSubmit>`** — shell + guards                                                                        |
| **Text input in a form**   | **`<TextField control name label />`**                                                                                   |
| **A choice in a form**     | **`<SelectField control name label options />`**                                                                         |
| **Guard an edit form**     | `<FormDialog>` already does — `useUnsavedChanges` only outside one                                                       |
| Form                       | zod + RHF inside `<FormDialog>` (see `UserFormDialog`)                                                                   |
| **Any list of choices**    | **`<SearchableSelect>`** — always type-to-filter                                                                         |
| **A date**                 | **`<DatePicker>`** — never `<input type="date">`                                                                         |
| **A date range**           | **`<DateRangePicker>`** — one control, both ends                                                                         |
| **Apply-on-Done popover**  | **`useDraftPopover(value, onChange)`**                                                                                   |
| Query keys                 | `createQueryKeys("resource")`                                                                                            |
| Header / tile / pill       | `<PageHeader>` `<StatCard>` `<StatusBadge>`                                                                              |
| **A background**           | **the ladder** — `bg-card`, `bg-popover`, `bg-field`                                                                     |
| Empty result               | `<EmptyState>`                                                                                                           |
| Permissions                | `usePermission().can` / `<PermissionGate>`                                                                               |
| Classes / dates            | `cn` / `formatDate`, `formatNumber`                                                                                      |
| Error → message            | `extractErrorMessage(error)`                                                                                             |
| Error → branch on it       | `getErrorCode(error)` vs `ERROR_CODE.X`                                                                                  |
| Config / URLs              | `env` / `API.<domain>.<route>`                                                                                           |

## One button convention

Four variants, one meaning each — a screen never invents a fifth:

| Variant       | For                                                         |
| ------------- | ----------------------------------------------------------- |
| default       | The one primary action — submit, Save, Done, New user, Edit |
| `outline`     | Everything secondary beside it — Cancel, Clear, Back        |
| `destructive` | Delete, and nothing else                                    |
| `ghost`       | Icon-only toolbar controls — header, row actions, theme     |

**Never colour a button at its call site, and never write a hue anywhere else.**
Every colour derives from the `--brand-h` / `--brand-c` / `--tint-c` knobs at the top
of `globals.css`, and `globals.spec.ts` fails the build on a neutral that stops
following them. How that works: [UI.md](docs/UI.md#rebranding-is-one-line).

`outline` is not only the Cancel button — it is what every `<SearchableSelect>`,
`<DatePicker>` and `<DateRangePicker>` trigger renders as. It shares `bg-field` and
`border-input` with `<Input>` on purpose: a filter bar is one control at several
widths, and the moment that variant paints its own fill the search box and the select
beside it stop matching.

## No magic values

Nothing static is written inline. Where it lives:

| Static thing                            | File                      |
| --------------------------------------- | ------------------------- |
| Paths, redirect param, public paths     | `constants/routes.ts`     |
| Timeouts, debounce, cache times, cookie | `constants/config.ts`     |
| Roles, permissions, statuses, options   | `constants/app.ts`        |
| Field limits (mirrors the API)          | `constants/validation.ts` |
| Endpoint URLs                           | `api/endpoints.ts`        |
| Colour, surface, radius                 | `app/globals.css` tokens  |

A value used in one component may stay there **as a named const** — never as a
bare literal in the JSX. The moment a second file needs it, it moves up.
Third-party UI carrying its own palette (sonner) is remapped onto the tokens in
its wrapper, never left on library defaults.

## Where types live

| Type                                                     | Home                                    |
| -------------------------------------------------------- | --------------------------------------- |
| API envelope, list params                                | `types/api.ts`                          |
| Domain shape used by 2+ features (`User`)                | `types/<domain>.ts`                     |
| One feature's request payloads                           | `features/<name>/types/index.ts`        |
| Form values                                              | inferred from the zod schema in `data/` |
| A component's own contract (`Column<T>`, `FilterConfig`) | next to that component                  |
| Used in exactly one file                                 | that file, unexported                   |

A component's props belong beside the component — hoisting them to `types/`
buys indirection and nothing else.

**Feature boundaries:** a feature may import another feature's `services/` —
that is its public data layer, and sharing it keeps one query key and one cache
entry (`dashboard` reads `useUsers` this way). Never import another feature's
components, `data/` or internals; anything else two features need moves up to
`components/shared/`, `hooks/`, `utils/` or `types/`.

## Forms and destructive actions

Two things are easy to forget and expensive to miss, so both are one line:

- **An edit form is a `<FormDialog>`**, and both guards come with it: it holds
  `useUnsavedChanges(form.formState.isDirty)`, routes Escape, the overlay, the X and
  Cancel through the discard question, resets on the way out, and closes only when
  the awaited save resolves — a rejected one stays open with the input intact. Call
  `useUnsavedChanges` yourself only for a form that is not in a dialog.
- **A consequential action asks first.** Never `window.confirm`, and never a local
  `open`/`pending` state per screen. The bar is "one click, and not undoable in one
  click" — that covers delete **and sign out**, not only data loss. In a row menu it
  is declarative, so no screen can forget it:

  ```ts
  { label: "Delete", destructive: true, confirm: deleteUserPrompt, onSelect: (user) => remove.mutate(user.id) }
  ```

  Anywhere else — a Delete button on a detail page — it is the same prompt awaited:

  ```ts
  if (await confirm(deleteUserPrompt(user))) remove.mutate(user.id);
  ```

Hide an action the API would refuse anyway (`hidden: isSelf` on a `RowAction`)
instead of letting the person click into an error.

## Do not

- `useEffect` + `fetch`, or server data in Zustand.
- Reach for a native `<select>` or `<input type="date">`. `<SearchableSelect>`,
  `<DatePicker>` and `<DateRangePicker>` cover every choice and every date —
  rows-per-page included. shadcn's `<Select>` is not installed on purpose, and
  `<SearchableSelect>` searches by default; pass `searchable={false}` to opt out.
- Build a `yyyy-mm-dd` with `toISOString()`. It converts to UTC first and returns
  yesterday for half the world; `toDateInput` keeps the day the calendar showed.
- Hand-roll a row action menu, a dialog shell, a `<FormField>` block for a plain
  text input or a select, or `open`/`editing`/`pendingDelete` state for a list
  screen. Those are `rowActionsColumn`, `<FormDialog>`, `<TextField>`,
  `<SelectField>` and `useCrudScreen`.
- Write the same five query hooks per resource. `createCrudApi` is list, one,
  create, update and delete on one query key; only what a resource has **beyond**
  CRUD is hand-written beside it (`useChangeUserRole`).
- Import axios's **default export** anywhere but `src/api/client.ts` (lint
  error). Named helpers are fine — `utils/error.ts` uses `isAxiosError`; the rule
  protects the single configured instance, not the module.
- `try/catch` a query to toast — the cache handlers do it once, globally. A new API
  error code needs no client change: the envelope's `message` is what shows. Add a
  branch in `routeByStatus` only when the code needs a _side effect_ beyond the toast.
- `console.*` anywhere but `utils/logger.ts`. It writes one JSON line, the same shape
  the API writes, joined by `requestId` — and nothing at all from a production browser,
  because nobody reads that console. Point `emit` at an SDK when you want real telemetry.
- Hardcode a route, a permission or a status. Use `ROUTES.x`, `PERMISSION.X`,
  `STATUS.X`.
- Write a success or error message. **The API already sent one** — `useApiMutation`
  toasts the envelope's `message`, and failures go through `extractErrorMessage`.
  Copy here would be a second version of the same sentence, and the two drift:
  the server said "Logged in" while this side said "Signed in". `successMessage`
  exists to override that in the rare case the client genuinely knows better;
  copy the API cannot know lives in `CLIENT_MESSAGE` (`constants/errors.ts`).
- Write **any** colour value: a raw palette utility (`bg-<hue>-500`,
  `text-white`), a hex, `rgb()`, `hsl()`, `oklch()`. Every colour comes from a
  semantic token in `app/globals.css` (`bg-card`, `text-muted-foreground`,
  `bg-destructive`, `bg-overlay`) so it follows light and dark on its own. Lint
  fails the build on all of the above — if a token is missing, add it to
  `globals.css` in **both** `:root` and `:root[data-theme="dark"]` rather than
  reaching for a literal. Defined in only one of the two and the theme toggle
  works in one direction only, which `app/globals.spec.ts` now fails the build on.
- Pick a background any way but the ladder. Four planes, stacked in that order in
  both themes: `--background` is the page, `--card` is a panel on it (sidebar,
  header, `<Card>`, `<DataTable>`), `--popover` floats above that (dropdown,
  popover, dialog, toast), `--field` is a control's fill (`<Input>`, every
  trigger, the command search). A new panel is `bg-card`, not `bg-background` —
  that one reads as a hole punched through the page. A control's fill is
  `bg-field`, never `bg-input`: `--input` is its **border**, and using it as a
  fill is what made a select trigger a different colour from the search box
  beside it. Lint rejects `bg-input`.
- Write a **hue** anywhere but the brand knob. A neutral spelled with a literal hue
  (`oklch(0.95 0.03 264)`) is a corner of the app that silently stops rebranding —
  it takes `var(--brand-h)`, and a chroma of `0` if it is meant to stay grey. The
  four semantic colours are the exception: a success is green whatever the brand is.
- Add a `dark:` **colour** to anything. Both themes are already in `globals.css`,
  so `dark:bg-…` at a call site is a second palette: it repaints one component in
  one theme and silently leaves every other surface behind. If a token looks wrong
  in dark, the token is wrong — fix it once and every screen follows. Lint rejects
  these outside `components/ui/`, which is regenerated surface. (`dark:hidden` and
  friends are untouched; the rule only matches a colour property.)
- Read or set the theme anywhere but `useTheme()`, or introduce a `.dark` class.
  The resolved theme is `<html data-theme>`, written by the head script before
  first paint; "system" is resolved there and never reaches the attribute, which
  is what keeps the dark palette to a single block.
- Hand-edit shadcn-generated files, with two sanctioned kinds of exception, each
  commented in place because `shadcn add` overwrites the file and you re-apply
  them. **One**: a small addition every screen needs (`Button`'s `isLoading`).
  **Two**: putting a colour the generator hardcoded back on a token —
  `text-white` → `text-destructive-foreground` in `button.tsx`, `bg-black/50` →
  `bg-overlay` in the two overlays, and the generator's idea of a surface back
  onto the ladder (`bg-background` → `bg-field` on `Input` and the outline
  `Button`, `bg-background` → `bg-popover` on the two dialogs, which float above a
  dropdown and so cannot paint the page's own plane; the offset focus ring on
  `Dialog`'s close button, whose offset colour is the page background, → the one
  ring every other control uses). Re-run lint after any `shadcn add` — it points
  at whatever the new file hardcoded, and `pnpm test` at whatever it unstacked.
- Add `useMemo`/`useCallback` for memoisation — React Compiler is on.
- Touch `window`/`document`/`localStorage` at module scope or in a `useState`
  initialiser; it runs on the server too.
- Use `any`, or weaken a lint rule to pass a build.

## Adding a feature

Full worked example: [ADD-A-FEATURE.md](docs/ADD-A-FEATURE.md).

**One screen** — flat:

```
src/features/<name>/
├── index.tsx                # the screen
├── components/ services/use-<name>.ts data/<name>-schema.ts
```

**More than one screen** (a list and a detail page, a multi-step flow) — a folder
per screen, and the feature root holds only what **every** screen of it shares:

```
src/features/users/
├── services/use-users.ts       # one data layer → one query key, one cache
├── types/ data/ components/    # shared by both screens (the edit dialog lives here)
├── user-list/index.tsx  + components/ data/
└── user-detail/index.tsx + components/
```

The rule for placement is **who uses it**, in one step:

| Used by                         | Lives in                                           |
| ------------------------------- | -------------------------------------------------- |
| one screen                      | that screen's folder                               |
| two screens of the same feature | the feature root                                   |
| two features                    | `components/shared/`, `hooks/`, `utils/`, `types/` |

Never reach sideways into a sibling screen's folder — if two screens need it, it
has already moved up. Services are the exception that proves it: they sit at the
feature root precisely so both screens share one cache entry.

Then: URL in `api/endpoints.ts`, thin `app/(app)/<name>/page.tsx`, nav entry
with its permission in `constants/navigation.ts` — plus its `BREADCRUMB_LABELS`
entry there, and `DYNAMIC_SEGMENT_LABELS` if the screen has an `[id]` child —
and permission strings in `constants/app.ts` matching the backend.

## Tests and size

`*.spec.ts(x)` next to the source. Test error mapping, pagination, permissions,
branches — not that a component renders its props. Files: soft cap 300 lines,
hard cap 500.
