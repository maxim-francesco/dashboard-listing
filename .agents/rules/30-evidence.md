---
trigger: always_on
---

# Evidence discipline

> Destination: `.agents/rules/30-evidence.md`
> Mode: `always_on`

Applies to every investigation, every report, every claim. These are not style
preferences — each one exists because a report that violated it produced a wrong
conclusion that cost a round.

## Identity before content

Any new-chat task that reads or writes this repo starts by confirming the
workspace: `git rev-parse --show-toplevel`, branch, `package.json` name, and the
existence of one signature file that must be present plus one that must be absent.

If the check fails: report the answers, output `WRONG WORKSPACE — HALTED`, read
nothing else, and do **not** attempt to locate the correct repo. A discovery
report once arrived from an entirely different project (medical domain,
`DOCTOR`/`RECEPTIONIST` roles) with no error signal anywhere in it.

## Say what kind of claim you are making

Three labels, never mixed:

- **VERIFIED** — a command was run or a file was read, and the output is quoted.
- **HYPOTHESIS** — plausible, not checked. Must name the one check that would
  settle it.
- **STRUCTURALLY UNDECIDABLE** — the data needed does not exist. Name the column,
  table, or file that would make the question answerable.

"Insufficient evidence" is not a valid conclusion when the real situation is that
the schema cannot express the answer. `Message` has no `updatedAt`, so lead
lifecycle is not under-evidenced — it is unmonitorable by construction.

## Coincidental matches

Verification SQL translates a JS predicate literally, including branches that are
dead on current data. If a branch is dead, label the result
`coincidental match on current data` — never `MATCHES EXACTLY`.

Example: `reminderAt` is NULL on all 387 rows, so the second branch of the
`actionNeeded` predicate never fires. SQL that reproduces the whole predicate
appears to confirm the implementation while testing half of it.

## Vacuous evidence

`count(*) WHERE <predicate>` on an empty table proves nothing. Always report the
table total first, then the filtered count. Zero out of zero is not agreement.

## ETL artefacts that look like activity

`updatedAt > createdAt` is invalid as an activity signal in this repo:
`migrate.js:327-328` copies both timestamps from the source.

If a ratio is 100% (21/21, 738/760), that is an import signature, not usage.
**Report the ratio, not just the number.**

## Source schema provenance

Before any conclusion about what a column *means*: does `saasclone` have that
column?

- No → the values are defaults, and say nothing about this product.
- Yes → the values describe the **old** system, not this one.

`status` is NEW on all 387 messages because the source has no `status` column.
`isRead` describes what a dealer read in a product that no longer exists.

## Request counting: the key, not the URL

React Query deduplicates on `queryKey`. Never report "these two components call
the same endpoint" without comparing keys.

- Different key, same URL → a real duplicate network request.
- Same key, different URL → a cache collision.
- Same key, same URL → deduplicated. Not a finding.

A report that lists endpoint overlaps without keys is wrong in both directions.

## Self-guarded components

When a component may `return null`, reading the parent does not tell you what is
on screen. Before any layout claim about a composed page, produce the guard
table: component | guard quoted verbatim with file:line | the data state that
produces null | whether a shell renders while loading.

See `skills/render-guards/`.

## Measure the user's path

A script that reads the database directly validates the generator, not the
product. Five catalogs were validated through Prisma while the browser path was
reading a reduced public payload; no artefact on disk ever showed the bug.
An artefact meant to prove what the user sees is produced the way the user
produces it.

## Never transcribe a figure between turns

Every number in a report is read from the run just executed. A carried-over byte
size and timestamp once passed review and was caught only by comparing against
the previous turn.

## An unmet acceptance criterion is stated first, not footnoted

Reporting a failed criterion under "noticed but not changed" while the rest
reads as complete is a reporting failure even when the scope constraint was
honoured.

## Prohibited tools & output paths

- `curl.exe` is **prohibited** in this workspace, without exception —
  `Invoke-WebRequest` only.
- Screenshots go to `C:\Users\Francesco\Desktop\Projects\_screenshots\<run-folder>\`,
  never inside the repo.

## Paths are claims too

Do not infer a path from a folder name or a convention. There is no
`src/components/layout/` in this repo. `src/pages/Listings.tsx` looks unrouted
and is live via `ListingsPage.tsx`.

Before declaring a file dead or a path existent: grep for imports across `src/`,
check routes in `App.tsx`, paste the evidence.

## Scope every number

A count without a tenant is not a fact. One tenant has 12 AVAILABLE / 16 SOLD;
another has 68 in stock. The "12 vs 68 contradiction" was two tenants, not a bug.

Every reported number carries: unit (rows or entities), tenant scope, time
window, and whether it came from the server or was derived in the browser.

## Report shape

- Quote verbatim. Do not summarise code that a decision depends on.
- Findings only when findings were asked for. No proposals, no refactor
  suggestions, no "you might also want to" — those are a separate turn.
- End with what was **not** done and what was not verified. A gap named is
  cheap; a gap discovered later is a round.