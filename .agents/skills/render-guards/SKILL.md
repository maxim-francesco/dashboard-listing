# Skill: render-guards

> Destination: `.agents/skills/render-guards/SKILL.md`
> Read-only. Produces an inventory, never a proposal.

## When this applies

Any page assembled from child components where the children decide for themselves
whether to render. Symptom: the parent renders children unconditionally, and the
children contain `return null`.

Canonical case in this repo: `src/pages/Dashboard.tsx` is 70 lines, renders 10
children with no conditions, and 6 of the 10 are absent on the local database.

**Run this before any layout work on such a page.** Reading the parent tells you
nothing about what is on screen. Designing a layout for 10 blocks when 3 render
is the failure this skill prevents.

## The guard table

One row per child. All four columns required.

| component | guard, verbatim + file:line | data state producing null | visible shell while loading? |
|---|---|---|---|

Rules:

- **Verbatim.** Quote the `if (...) return null;` exactly, with its line number.
  Paraphrase loses the predicate, and the predicate is the whole point.
- **Every guard, not the first.** A component with three exit paths gets all
  three listed. Loading guards count.
- **Name the data state in domain terms**, not code terms. Not
  `activeExpiring.length === 0` but "no reservation expiring within 3 days" —
  because the next question is always whether that state is the current one.
- **Shell column is a yes/no with a line reference.** `return null` while loading
  and a skeleton while loading produce different layouts. A component that
  returns null while loading makes the page reflow as data arrives.

## Mutual exclusion

After the table, check whether any two children can render simultaneously.
Answer **from the guards alone**, never from the database — the database is one
sample, the guards are the rule.

State the conclusion plainly. If two guards do not exclude each other, say so;
do not soften it. If they do exclude each other, quote both predicates and show
that one is the negation of the other.

Real example: `AllClearCard:71-77` filters messages with the same predicate as
`ActionCallList:84-90`. One renders only when that set is empty, the other only
when it is not. They cannot both appear. That fact decides where "Ești la zi"
goes in the layout.

## Occupancy projection

For each child, project presence against the known state of the database, and
label it as a projection, not a measurement:

| component | projected | why |
|---|---|---|

Then state the total: N of M children visible. If the underlying table is empty,
say which table.

This is a projection because the guards are read from code and the data from a
separate inventory. Confirm it in the browser before relying on it — but the
projection is what makes the browser round worth doing at all.

## Never-null set

List the children that cannot return null under any condition, including
fallback text. These are the only components safe to place where emptiness would
break the layout — a fixed-width shelf, a column that must not collapse.

`WeeklySummaryCard` renders fallback text when the query fails.
`StockPulse` renders section A unconditionally. Those two are the never-null set
on the start page, and that is why the shelf is built from them.

## Layout consequences to report

- Which columns or regions can become empty, and which cannot.
- Whether `:empty` can apply — it requires literally zero child nodes, so a
  stray `{" "}` inside the container invalidates it.
- Whether any child renders a wrapper when disabled rather than returning null.
  A hidden wrapper defeats `:empty` silently.

## Do not

- Do not modify a child to make it easier to observe. Children stay frozen; the
  laboratory uses fake blocks instead.
- Do not propose reordering, merging, or removing components. The table is input
  to a decision made elsewhere.
- Do not report only the current occupancy. The degenerate cases (zero children,
  one child, all children) are what the layout must survive.