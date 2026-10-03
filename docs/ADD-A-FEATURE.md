# Adding a feature

A worked example: an `orders` screen against `/api/v1/orders`. Every file, in
the order you create them. Copy the shape, change the nouns.

```
src/features/orders/
├── index.tsx                       # the screen
├── components/orders-columns.tsx   # table columns
├── components/order-form-dialog.tsx
├── data/order-form-schema.ts       # zod
├── services/use-orders.ts          # TanStack Query hooks
└── types/index.ts                  # request payload shapes
```

## 1. Constants first

```ts
// constants/app.ts — mirror the backend, exactly
export const PERMISSION = {
  // …
  ORDERS_READ: "orders:read",
  ORDERS_CREATE: "orders:create",
} as const;

// constants/routes.ts
export const ROUTES = { /* … */ orders: "/orders" } as const;

// api/endpoints.ts
export const API = {
  // …
  orders: { list: "/orders", byId: (id: string) => `/orders/${id}` },
} as const;
```

Never write a path or a permission string anywhere else.

## 2. Types

```ts
// types/order.ts (shared shape) — or features/orders/types for payloads only
export interface Order {
  id: string;
  reference: string;
  amount: string;
  createdAt: string;
}

// features/orders/types/index.ts
export interface CreateOrderBody {
  reference: string;
  amount: string;
  customerId: string;
}
```

## 3. Service hooks — the only place that fetches

One line gets the five hooks every resource has, on one query key, so every write
invalidates every list and detail of it:

```ts
// services/use-orders.ts
"use client";

export const ordersApi = createCrudApi<Order, CreateOrderBody, UpdateOrderBody>(
  "orders",
  API.orders,
);
```

| Call                        | Does                                    |
| --------------------------- | --------------------------------------- |
| `ordersApi.useList(params)` | `{ items, meta }`, previous page kept   |
| `ordersApi.useOne(id)`      | one row                                 |
| `ordersApi.useCreate()`     | `POST /orders`                          |
| `ordersApi.useUpdate()`     | `PATCH /orders/:id` with `{ id, data }` |
| `ordersApi.useRemove()`     | `DELETE /orders/:id`                    |

Anything the resource has **beyond** CRUD is written beside it, invalidating the
same key — a status transition, an endpoint behind its own permission:

```ts
export function useApproveOrder() {
  return useApiMutation<Order, string>({
    method: "patch",
    url: (id) => API.orders.approve(id),
    invalidate: [ordersApi.keys.all],
  });
}
```

No `useEffect` + `fetch`. No `try/catch` — a failure is toasted once, globally,
and no success copy: the API already sent the sentence.

**Write each extra hook in the same change as the component that calls it.**
`knip` fails the build on an export nothing imports.

## 4. Columns

```tsx
// components/orders-columns.tsx
export function buildOrderColumns({ onEdit }: Options): Column<Order>[] {
  return [
    { key: "reference", header: "Reference", sortable: true, cell: (o) => o.reference },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      cell: (o) => formatNumber(Number(o.amount)),
    },
    { key: "createdAt", header: "Created", sortable: true, cell: (o) => formatDate(o.createdAt) },
    rowActionsColumn(actions),
  ];
}
```

A select filter spells out `allLabel` ("All roles", "Hide deleted") — derived
from the field name it reads "All role", and for a flag it states the opposite of
what it does.

`sortable: true` sends `?sort=<key>:asc|desc` — the key must be allow-listed by
the backend service.

The actions menu is a list, never hand-built JSX. Each entry carries its own
permission and a per-row veto, so the menu adapts instead of branching:

```ts
const actions: RowAction<Order>[] = [
  { label: "Edit", icon: Pencil, permission: PERMISSION.ORDERS_UPDATE, onSelect: onEdit },
  {
    label: "Delete",
    icon: Trash2,
    destructive: true,
    separatorBefore: true,
    permission: PERMISSION.ORDERS_DELETE,
    hidden: (order) => order.status === STATUS.PAID, // the API refuses it too
    // Asked before `onSelect` runs, so no screen can forget the question.
    confirm: (order) => ({ title: `Delete ${order.reference}?`, confirmLabel: "Delete" }),
    onSelect: onDelete,
  },
];
```

## 5. Form

Schema in `data/`, dialog in `components/`. `<FormDialog>` is the whole shell —
it owns the dialog, the unsaved-changes guard, the discard question on every way
out, the reset, and when to close. This file is the fields and what to save:

```tsx
export function OrderFormDialog({ open, onOpenChange, order }: Props) {
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    // `values`, not `defaultValues` — it re-syncs when the row changes.
    values: { reference: order?.reference ?? "", status: order?.status ?? STATUS.PENDING },
  });

  const create = ordersApi.useCreate();
  const update = ordersApi.useUpdate();

  /** Awaited: the dialog closes on resolve and stays open, input intact, on failure. */
  const save = async (values: OrderFormValues) => {
    if (order) await update.mutateAsync({ id: order.id, data: values });
    else await create.mutateAsync(values);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={order ? "Edit order" : "New order"}
      form={form}
      onSubmit={save}
    >
      <TextField control={form.control} name="reference" label="Reference" />
      <SelectField control={form.control} name="status" label="Status" options={STATUS_OPTIONS} />
    </FormDialog>
  );
}
```

Fields are one line each — `<TextField>` for a plain input, `<SelectField>` for
any list of choices. Anything else (a switch, a file) still uses `<FormField>`
directly, inside the same `<FormDialog>`.

```ts
// data/order-form-schema.ts
export const orderFormSchema = z.object({
  reference: z.string().min(3).max(40),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a number"),
});
export type OrderFormValues = z.infer<typeof orderFormSchema>;
```

Reuse the shared limits so the UI rejects what the API would:

```ts
import { VALIDATION } from "@/constants/validation";
```

## 6. Screen

`useCrudScreen` owns the state every list screen keeps: pagination, a debounced
copy of it for the query, and which row the form is on. Deleting keeps no state
at all — the row menu asks before it calls you.

```tsx
// index.tsx
export function OrdersPage() {
  const router = useRouter();
  const screen = useCrudScreen<Order>();

  const orders = ordersApi.useList(screen.params);
  const remove = ordersApi.useRemove();

  const columns = buildOrderColumns({
    onEdit: screen.openEdit,
    onDelete: (order) => remove.mutate(order.id), // `confirm` on the action asked first
  });

  return (
    <>
      <PageHeader title="Orders" description="…" actions={<PermissionGate …>…</PermissionGate>} />
      <GlobalFilter pagination={screen.pagination} filters={ORDER_FILTERS} />
      {/* One prop: rows, count, loading, refreshing and failure all come off the
          query, so no screen can wire four states and forget the fifth. */}
      <DataTable
        columns={columns}
        query={orders}
        pagination={screen.pagination}
        onRowClick={(order) => router.push(ROUTES.order(order.id))}
      />
      <OrderFormDialog
        key={screen.formKey}
        open={screen.isFormOpen}
        onOpenChange={screen.setFormOpen}
        order={screen.editing}
      />
    </>
  );
}
```

`formKey` remounts the dialog when the row changes, so it never shows the
previous row's values.

### A second screen

A detail page makes this feature two screens, so each moves into its own folder —
`order-list/`, `order-detail/` — while `services/`, `types/` and anything both
use stay at the feature root. One data layer means the list and the detail share
a cache entry and one invalidation. `features/users/` is the worked example.

## 7. Route + navigation

```tsx
// app/(app)/orders/page.tsx — thin, always
export const metadata: Metadata = { title: "Orders" };
export default function Page() {
  return <OrdersPage />;
}
```

```ts
// constants/navigation.ts
{ href: ROUTES.orders, label: "Orders", icon: Package, permission: PERMISSION.ORDERS_READ }
```

The sidebar entry hides itself for users without the permission; the API
enforces it for real.

## 8. Ship

```bash
pnpm verify
git commit -m "feat(orders): add orders screen"
```

## Checklist

- [ ] Permission + route + endpoint in `constants/` and `api/endpoints.ts`
- [ ] All fetching in `services/`, one `createCrudApi` per resource; only
      beyond-CRUD calls hand-written, invalidating `<resource>Api.keys.all`
- [ ] Columns and form in their own files — screen stays short
- [ ] `useCrudScreen` for list state; no local `page`/`editing`/`pendingDelete`
- [ ] `rowActionsColumn` for the menu, `<FormDialog>` for the form,
      `<TextField>` / `<SelectField>` for the fields
- [ ] Destructive actions ask first — `confirm` on the `RowAction`, or
      `await confirm(prompt)` for a button outside a menu
- [ ] `<DataTable query={…}>` / `<GlobalFilter>` / `<PermissionGate>` reused, not
      rebuilt — and sorting goes through `pagination`, never a hand-built `sort` string
- [ ] Semantic tokens only — no `bg-<hue>-500`, no hex, no `rgb()` (lint fails)
- [ ] Backgrounds come off the ladder — a panel is `bg-card`, a control is
      `bg-field`; no `bg-input`, no `dark:` colour override (lint fails)
- [ ] Page under `app/(app)/` is a 3-line wrapper
- [ ] Two or more screens? Each in its own folder, shared parts at the feature root
- [ ] `pnpm verify` green

## When the screen needs to scale

1. **Keep pagination server-side.** Never fetch a whole table to filter in the
   browser. Every filter is a query param.
2. **Raise `staleTime` per query** for data that rarely changes, instead of
   disabling refetching globally.
3. **Split heavy, rare UI** — charts, editors, maps — with `next/dynamic`.
   Watch the First Load JS column in `next build`.
4. **Virtualise only if a page genuinely renders thousands of rows**
   (`@tanstack/react-virtual`), and swap `<DataTable>` for
   `@tanstack/react-table` when you need grouping, resizing or column pinning.
   The `Column<T>` shape maps over.
5. **Many screens?** They stay independent folders under `features/`; anything
   two of them share moves up to `components/shared/`, `hooks/` or `utils/`.
6. **Backend split into services?** Point `API.<domain>` at the gateway. No
   component changes — that is the whole benefit of one endpoint catalogue.
