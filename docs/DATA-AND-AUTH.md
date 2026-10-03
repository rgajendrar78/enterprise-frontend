# Data and auth

Everything between a component and the API: the query layer, where errors go,
how a session works, and the contract this app expects of a backend.

## Fetching

A feature writes service hooks; nothing else fetches. A REST resource is one
line — `createCrudApi` returns the five hooks every one of them has, sharing a
single query key so any write invalidates every list and detail of it:

```ts
export const ordersApi = createCrudApi<Order, CreateOrderBody, UpdateOrderBody>(
  "orders",
  API.orders,
);

ordersApi.useList(params); // { items, meta }
ordersApi.useOne(id);
ordersApi.useCreate(); // mutateAsync(body)
ordersApi.useUpdate(); // mutateAsync({ id, data })
ordersApi.useRemove(); // mutateAsync(id)
```

Anything **beyond** CRUD — a status transition, an endpoint behind its own
permission — is written beside it on the three primitives underneath, invalidating
the same key:

```ts
export const useApproveOrder = () =>
  useApiMutation<Order, string>({
    method: "patch",
    url: (id) => API.orders.approve(id),
    invalidate: [ordersApi.keys.all],
  });
```

| Hook             | Returns                        | For                          |
| ---------------- | ------------------------------ | ---------------------------- |
| `useApiQuery`    | `data` — the envelope's `data` | one resource                 |
| `useApiList`     | `{ items, meta }`              | a paginated list             |
| `useApiMutation` | a mutation                     | a write + toast + invalidate |

`useApiList` keeps the previous page visible while the next loads. Query keys
come from `createQueryKeys("resource")` — never hand-built arrays, or two call
sites end up with two cache entries for the same data.

## Errors are never handled at the call site

The query client's cache handlers toast every failure once, globally. **No
`try/catch` around a query to show a message**, and no per-screen error state.

- A new API error code needs no client change: the envelope's `message` is what
  shows. Add a branch in `routeByStatus` only when a code needs a _side effect_
  beyond the toast.
- **403** warns. **4xx** is never retried; 5xx retries twice.
- **A 401 splits two ways.** From a form where you are offering credentials
  (sign-in, forgot, reset) it is the answer to that form — the API's message is
  toasted and the session is left alone. Anywhere else it means the session is
  over, so the client signs out and returns to sign-in. Without that split, a
  wrong password reloaded the page and threw the message away unread.
- **A deactivated account** gets `403 ACCOUNT_DISABLED`, not "wrong password".
  `routeByStatus` branches on that **code**: mid-session it ends the session, at
  the sign-in form it just shows the reason. That is why the UI branches on
  `errorCode` and never on message text.

## Logging

One JSON line, the same shape the API writes, joined to it by `requestId`. Next
is a server too, so `instrumentation.ts` and the route handlers print to stdout
and are collected like any backend.

A failed request is logged as a **warning**, never an error — from here even a
500 is the API's fault, already logged as an error over there under the same
`requestId`. `logger.error` is for the client's own faults, which `<ErrorTrap>`
reports. A request the app itself cancelled — a superseded query, a screen
unmounting — is neither logged nor toasted; navigating away is not a failure.

**In the browser, production writes nothing** — nobody reads a production
console, and real client telemetry is an SDK (Sentry, Datadog RUM, CloudWatch
RUM) wired into `emit`, which is the only function that changes. Development
still logs everything.

## Session

Login stores tokens in localStorage and mirrors the access token to a cookie;
`src/proxy.ts` checks that cookie's **presence** on every navigation — presence
only, never verification, so there is no JWT crypto per navigation. Axios
attaches the bearer, refreshes once on a 401 (single-flight: six parallel 401s
trigger one refresh, not six) and replays the request. `useSession()` re-reads
`/auth/me`, so permission changes land without re-login.

Screens: `sign-in`, `forgot-password`, `reset-password` (public) and
`change-password` at `/account` (signed in). The reset link carries its token as
`?token=` — a link that arrives without one says so instead of failing on submit.

**A new public route** goes under `src/app/(auth)/` **and** into `PUBLIC_PATHS`
in `src/constants/routes.ts` (exact match — `src/proxy.ts` reads that set).

Permissions are **UX only**; the API enforces the same string:

```tsx
const { can } = usePermission();
<PermissionGate permission={PERMISSION.USERS_DELETE}>…</PermissionGate>;
```

`constants/app.ts` mirrors the backend's permission strings and
`constants/validation.ts` mirrors its field limits — a spec fails if either
drifts, which is cheaper than a form that accepts what the API rejects.

### Why localStorage, and what it costs

**This is a deliberate trade, not an oversight.** localStorage is readable by any
XSS, which httpOnly cookies would prevent — but httpOnly means the browser, not
the app, decides what is sent, and that ends the bearer-token contract this API
offers every other client (a mobile app, a Go service).

What actually mitigates it here:

- Short access-token lifetimes backed by **server-side revocation** — change a
  password and every outstanding token stops working.
- The security headers in `next.config.ts`: `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.
- React escaping by default, and a lint rule against raw HTML injection.

**There is no Content-Security-Policy header configured.** That is the largest
remaining gap in this trade and it is stated rather than implied: a CSP is the
control that turns an injected script into a blocked one. Add it in
`next.config.ts` `headers()` — start in `Content-Security-Policy-Report-Only`,
because Next's inline bootstrap and the pre-paint theme script both need a nonce
or hash before an enforcing policy will let the page run.

If your threat model puts XSS above client-agnosticism, move to httpOnly cookies
plus CSRF tokens instead — that is an API change, not a client one. The seam is
`api/client.ts` + `utils/auth-cookie.ts`.

## What this app expects of an API

Nothing here is tied to one backend. It expects four things:

```jsonc
// list endpoints
GET /<resource>?page=1&limit=10&sort=field:asc&search=&<filters>
{ "success": true, "message": "Success", "data": [], "meta": { "page": 1, "limit": 10, "totalCount": 0, "totalPages": 1 } }

// everything else
{ "success": true, "message": "Saved", "data": {} }
{ "success": false, "message": "Validation failed", "errorCode": "VALIDATION_FAILED", "details": ["email must be an email"] }

// auth
POST /auth/login    { email, password } -> { accessToken, refreshToken, user: { id, email, name, role, permissions[] } }
POST /auth/refresh  { refreshToken }    -> same
GET  /auth/me                           -> user
```

Plus the status contract: **401** means the session is over on any ordinary call
and "those credentials are wrong" on `/auth/login`, `/auth/forgot-password` and
`/auth/reset-password`; **403** means forbidden; **4xx** is never retried.
Sorting sends `?sort=field:asc` — the shape the backend allow-lists.

**Success and error copy comes from the API.** `useApiMutation` toasts the
envelope's `message`; failures go through `extractErrorMessage`. Writing copy
here would be a second version of the same sentence, and the two drift — the
server said "Logged in" while this side said "Signed in". `successMessage`
overrides it in the rare case the client genuinely knows better; copy the API
cannot know lives in `CLIENT_MESSAGE` (`constants/errors.ts`).

If your API differs, **four files change and nothing else** — `types/api.ts` +
`api/hooks.ts` for the envelope, `api/client.ts` for the auth header and refresh,
`api/endpoints.ts` for paths, `constants/app.ts` for permission strings. The
companion NestJS starter serves exactly this, so the pair works with no adapter,
but a Django, Go or Rails API is a config change, not a rewrite.
