# Skill: data-provenance

> Destination: `.agents/skills/data-provenance/SKILL.md`
> Read-only. Produces a trace, never a fix.

## When this applies

Any time a displayed number is questioned, contradicted by another number, or
about to be moved to a different screen. Also before any change to a query, a
predicate, or a label containing a count.

## The trace

For each displayed value, follow the whole chain and report every link:

```
UI element → hook / query → endpoint URL → route → controller → Prisma call → table
```

Report as one row per displayed value:

| label verbatim | component:line | queryKey | endpoint | server or client | derivation file:line |

`label verbatim` means the Romanian string as written, including template
placeholders. `{unreadCount} mesaje noi`, not "unread count".

## Mandatory fields

A trace missing any of these is incomplete, and incomplete traces have produced
wrong conclusions here before:

**Unit** — rows or entities. 185 message rows and 159 distinct people are the same
predicate at different granularity. Both appeared on screen simultaneously as if
they were the same metric.

**Tenant scope** — which `businessId`, or all. A count without a tenant is not a
fact. One tenant has 12 AVAILABLE / 16 SOLD, another has 68 in stock.

**Time window** — all history, this month, today, last 7 days. "159 de sunat" is
everyone who ever wrote, presented as a queue.

**Soft delete** — does the query exclude deleted rows? Does the other query
comparing against it?

**DISTINCT** — present or absent, and on which column. `new Set(...).size` in the
browser and `COUNT(DISTINCT ...)` on the server are the same intent, and one of
them is usually missing.

**Pagination** — does the endpoint return everything, or a page? A client-side
`.length` over a paginated response is a bug that looks like a number.

**Server or client** — did the endpoint return this number, or did the browser
derive it from a fetched array? Mark CLIENT for anything from `.length`,
`.filter().length`, `.reduce()`, `.slice()`, `new Set(...).size`, or arithmetic
over fetched data.

## Key, not URL

`queryKey` is a required column, not optional. React Query deduplicates on the
key. Two components hitting one endpoint under different keys issue two requests;
one key mapped to two URLs is a cache collision.

When reporting overlaps, classify:
- different key, same URL → duplicate request
- same key, different URL → cache collision
- same key, same URL → deduplicated, not a finding

## Side-by-side predicate comparison

When two numbers disagree, put the two predicates next to each other literally —
the JS filter and the Prisma `where`, or the two JS filters — and mark every
difference. Do not summarise them as "roughly the same filter."

Then translate each to SQL against the local database and report the count. Label
any branch that cannot fire on current data as
`coincidental match on current data`, per `rules/30-evidence.md`.

## Source schema check

Before concluding anything about what a column means: does `saasclone` have that
column?

- No → the values are Prisma defaults. They describe nothing.
- Yes → the values were imported. They describe the old product.

This check has overturned three separate conclusions. Run it early, not last.

## Orphan endpoints

Note any endpoint that computes the value correctly on the server while the
frontend recomputes it in the browser. `/api/reports/profitability` is the known
case: it exists, it is correct, and the frontend ignores it in favour of
recalculating from `/listings/status/sold`.

## Output discipline

- Every claim carries file:line or a quoted command output.
- Report the table total before any filtered count.
- End with the fields you could not fill and why. A named gap costs a line; an
  unnamed one costs a round.
- No fixes, no proposals, no "the correct predicate would be". The trace is input
  to a product decision about vocabulary, which is made with Francesco.