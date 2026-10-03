# AGENTS.md

The rules for this repo live in **[CLAUDE.md](CLAUDE.md)** — read it first,
whichever assistant you are.

Then: [ARCHITECTURE.md](docs/ARCHITECTURE.md) for why, and
[ADD-A-FEATURE.md](docs/ADD-A-FEATURE.md) for the step-by-step recipe.
[DATA-AND-AUTH.md](docs/DATA-AND-AUTH.md) and [UI.md](docs/UI.md) hold the data
layer and the design system.

Nothing is done until `pnpm verify` passes.

## Driving one well

Prompts that work, because they name the rule file rather than the symptom:

> **New screen** — Read CLAUDE.md and ADD-A-FEATURE.md, then build the invoices
> screen: filter bar (search + status), sortable paginated table, create/edit
> dialog, delete confirm. Reuse the shared primitives — do not build a new table
> or filter, and no raw colours. Finish with `pnpm verify` green.
>
> **A field on what exists** — Add `phone` to users: the form, the table column,
> and the limits in `src/constants/validation.ts`. The mirror spec must still
> pass.
>
> **Review before merging** — Review the diff against CLAUDE.md. Flag inline
> literals, hardcoded routes or permissions, raw palette colours, data fetching
> outside a service hook, anything duplicating an existing helper.
>
> **When CI is red** — `pnpm verify` fails, here is the output. Fix the cause,
> not the rule. Never weaken a lint rule or add a knip ignore to make it pass.

Done means `pnpm verify` green **and** an honest list of what was skipped — ask
for it explicitly ("then tell me what you left out and why").

- **Point at the rule, not the symptom** ("CLAUDE.md → No magic values" beats
  "don't hardcode that"), and keep it to **one feature per session** — agents
  drift when asked for four at once. Correcting the same thing twice means a
  missing line in `CLAUDE.md`; write it there.
- **Make it run.** A green build is not a working screen — have it start the app
  and click through, in both light and dark.
- **Read these yourself:** auth and permission changes, anything handling money,
  dependency upgrades. The navigation gate, permission gating and `pnpm audit`
  narrow the blast radius; they do not replace reading the diff.
