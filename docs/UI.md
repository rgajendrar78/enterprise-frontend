# UI and design system

Tailwind 4, configured entirely in `src/app/globals.css` — there is no
`tailwind.config.js`. That file is the whole design system.

## Tokens

One token set, defined once for light and once for dark: `background`,
`foreground`, `card`, `popover`, `field`, `primary`, `secondary`, `muted`,
`accent`, `destructive`, `success`, `warning`, `info`, `border`, `input`, `ring`,
`overlay`, `radius`.

**No colour is written anywhere else.** Not a palette utility (`bg-<hue>-500`,
`text-white`), not a hex, not `rgb()`/`hsl()`/`oklch()` — lint fails the build on
each, so light and dark cannot drift apart one component at a time. Nor a `dark:`
colour override: both themes already live in `globals.css`, so a `dark:bg-…` at a
call site is a second palette that repaints one component and leaves every other
surface behind. Lint rejects those too, everywhere except `components/ui/`, which
is regenerated surface.

Need a shade that does not exist? Add the token to **both** blocks in
`globals.css`; every component picks it up.

## The elevation ladder

Four tokens are a ladder, and every surface in the app is one of them:

| Token          | The plane           | Painted on                                   |
| -------------- | ------------------- | -------------------------------------------- |
| `--background` | the page canvas     | `<body>`, the area beside the sidebar        |
| `--card`       | a panel on it       | sidebar, header, `<Card>`, `<DataTable>`     |
| `--popover`    | floating above that | dropdown, popover, dialog, toast             |
| `--field`      | a control's fill    | `<Input>`, every trigger, the command search |

The ladder is stacked in the same order in both themes — light separates the
planes with white-on-grey plus a shadow, dark steps lightness instead, because a
shadow is invisible on black. Holding the _relationship_ constant is what makes
the sidebar read as a rail and a dropdown read as floating either way round.
`src/app/globals.spec.ts` asserts it: the ladder cannot invert, `--field` cannot
drift off the panel plane, and no token can be defined in one theme block and
forgotten in the other.

A new panel is `bg-card`, not `bg-background` — that one reads as a hole punched
through the page. `--field` is the reason a search box, the select beside it and
that select's own search row are one colour. Nothing gets a fill any other way:
`bg-input` is a lint error, because `--input` is a control's **border**.

## Rebranding is one line

Three numbers sit at the top of `globals.css`, and every colour in the app is
built from them:

| Knob        | Is                                                 | Default             |
| ----------- | -------------------------------------------------- | ------------------- |
| `--brand-h` | the hue angle everything derives from              | `264` (indigo)      |
| `--brand-c` | how saturated the brand itself is — `0` is grey    | `0.17`              |
| `--tint-c`  | how far the hue reaches the greys — `0` is neutral | `0.008` (a whisper) |

Change `--brand-h` and the filled button, the focus ring, the active nav item,
the canvas, the borders and every panel move with it, in **both** themes, with no
other edit — nothing else in the repo mentions a hue, and `globals.spec.ts` fails
the build on a neutral that stops following. A neutral spelled with a literal hue
(`oklch(0.95 0.03 264)`) is a corner of the app that silently stops rebranding.

At the default the brand renders `#3461c9` on light and `#7ba3f5` on dark; every
foreground/background pair the app actually puts together measures **AA or
better** (the filled button is 5.4:1 light, 7.2:1 dark). The four semantic
colours are deliberately outside the knob — a success stays green whatever the
brand is. Working in oklch is what makes this safe: a hue a display cannot reach
at a given lightness is gamut-mapped as a whole colour instead of clipped per
channel, so no choice of `--brand-h` can produce a muddy button.

## Theming

**Light / dark is one button** in the header — no menu: it flips to whichever
theme is not showing. Until the first click the preference is **system**, so a
fresh visit follows the OS. Kept in localStorage, no dependency.

A blocking script in the document head resolves the preference before first paint
(so no flash) and writes the answer to `<html data-theme>`; `useTheme` reads that
same source through `useSyncExternalStore` rather than mirroring it into React
state. Because "system" is resolved **before** it reaches the attribute,
`globals.css` needs exactly **one** dark block, not a media-query copy of the same
tokens to keep in sync. `@custom-variant dark` repoints Tailwind's `dark:` at the
attribute too, so shadcn components that ship `dark:` classes follow the toggle
rather than only the OS.

Read or set the theme only through `useTheme()`. Never introduce a `.dark` class.

## Buttons

Four variants, one meaning each — a screen never invents a fifth, and never
colours a button at its call site:

| Variant       | For                                                         |
| ------------- | ----------------------------------------------------------- |
| default       | The one primary action — submit, Save, Done, New user, Edit |
| `outline`     | Everything secondary beside it — Cancel, Clear, Back        |
| `destructive` | Delete, and nothing else                                    |
| `ghost`       | Icon-only toolbar controls — header, row actions, theme     |

`outline` is not only the Cancel button — it is what every `<SearchableSelect>`,
`<DatePicker>` and `<DateRangePicker>` trigger renders as. It shares `bg-field`
and `border-input` with `<Input>` on purpose: a filter bar is one control at
several widths, and the moment that variant paints its own fill the search box
and the select beside it stop matching.

## Components

`src/components/ui/` holds real shadcn/ui components: alert-dialog, badge,
button, calendar, card, command, dialog, dropdown-menu, form, input, label,
popover, skeleton, sonner, table. **`select` is deliberately absent** — see
`<SearchableSelect>`, which searches by default. `Button` carries one local
addition, `isLoading`.

Add more with `pnpm dlx shadcn@latest add <component>`. **Read the output**: the
generator hardcodes `text-white`, `bg-black/50` and `bg-background` on things
that float, all remapped here to tokens. Re-run lint after any `shadcn add` — it
points at whatever the new file hardcoded, and `pnpm test` at whatever it
unstacked.

Hand-edits to generated files have two sanctioned kinds, each commented in place
because `shadcn add` overwrites the file and you re-apply them: a small addition
every screen needs (`Button`'s `isLoading`), and putting a colour the generator
hardcoded back on a token.

Status colours go through `<StatusBadge>`, and `components/ui/sonner.tsx` remaps
sonner's own palette onto the tokens, so a success toast is the same green as a
success badge.

Forms are react-hook-form + Zod, schemas in `features/<name>/data/`, limits from
`src/constants/validation.ts` (mirrors the backend; a spec fails if they drift).

The favicon is `src/app/icon.svg` — a neutral placeholder Next serves
automatically. Scrollbars are restyled in `globals.css`: thin, no stepper arrows,
thumb on the `border` token, so they follow the theme instead of the OS.

## Shared primitives worth knowing

The canonical list is in [CLAUDE.md](../CLAUDE.md#use-what-exists). The two most
often rebuilt by mistake:

**`GlobalFilter` is declarative.** Describe `search` / `select` / `date` controls
and `usePagination` holds the state. A `select` renders a `<SearchableSelect>`, a
`date` a `<DatePicker>` and a `daterange` a `<DateRangePicker>` writing both
params at once — so filtering looks and behaves the same on every screen.

**Row actions are declarative too.** Each entry carries its own permission and a
per-row veto, so the menu adapts instead of branching:

```ts
const actions: RowAction<User>[] = [
  { label: "Edit", icon: Pencil, permission: PERMISSION.USERS_UPDATE, onSelect: onEdit },
  // `confirm` is asked before `onSelect` — the handler is already the answer to it.
  {
    label: "Delete",
    icon: Trash2,
    destructive: true,
    hidden: isSelf,
    confirm: deleteUserPrompt,
    onSelect: onDelete,
  },
];
```

## Guards

Both are mounted once at the root (`app/providers.tsx`) and reached from
anywhere.

`useConfirm()` returns `confirm(options) => Promise<boolean>`, so no screen keeps
dialog state and a destructive handler is `if (await confirm({…})) mutate(id)`.
Delete **and sign out** go through it, because the bar is "one click, and not
undoable in one click", not "destroys data". Never `window.confirm`.

`useUnsavedChanges(isDirty)` registers a form as dirty: closing the tab raises
the browser warning, and `<NavigationGuard>` catches in-app link clicks in the
capture phase. `<FormDialog>` calls it for you and routes Escape, the overlay,
the X and Cancel through the same question, so a dialog form never has to. **The one gap, stated rather than hidden:** the
browser's **Back** button is not intercepted — `popstate` fires after the entry
is gone, and blocking it means fighting the user's own history.

## The reference implementation

**`features/users/` is it** — and it is two screens, so it also shows the folder
layout for one: `user-list/` and `user-detail/` each own their components, while
`services/`, `types/` and the shared edit dialog sit at the feature root so both
screens hit one cache entry. Between them they cover filtering, server-side sort
and pagination, row click-through, a create/edit dialog with an unsaved-changes
guard, a role change inside that form, delete with confirmation, and restore of a
soft-deleted row.
