---
name: discovery-readonly
description: Performs strictly read-only codebase investigation before any change is proposed. Gathers file contents with line numbers, symbol usage across the repo, routing, and data shapes, then stops without writing. Use when asked to investigate, inspect, audit, understand, or map existing code, or at the start of any redesign or refactor task.
---

# Read-only discovery

## Absolute constraints
During a discovery turn you may NOT:
write, create, edit, move, rename, or delete any file; run npm, yarn, or pnpm
install/build/dev; start or restart a server; create temp files; run any git
command that changes state (add, commit, checkout, reset, stash, restore, push).

Allowed: reading files, grep, directory listing, `git status`, `git log`,
`git branch`, `git diff` (read-only), and `npx tsc --noEmit`.

## Output discipline
Paste COMPLETE, VERBATIM output for every step. Do not summarize. Do not
paraphrase. Do not explain what the code does unless asked — the person reading
this output can read code. If a command produces nothing, write "NO OUTPUT"
explicitly for that step, so the difference between "empty" and "forgot" is
visible.

Number your steps to match the numbering in the prompt.

## Standard step set
Run these unless the prompt says otherwise:

1. Repo state
   `git branch --show-current`, `git status --short`, `git log --oneline -4`

2. Folder inventory for the area under investigation
   `Get-ChildItem -Path "<dir>" -Recurse -File | Select-Object FullName, Length | Format-Table -AutoSize`

3. Full source of each target file WITH line numbers:
   `Select-String -Path "<file>" -Pattern '^' | ForEach-Object { "{0,4}: {1}" -f $_.LineNumber, $_.Line }`

4. Every usage of the exported symbols involved:
   `Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx | Select-String -Pattern '<Symbol1>|<Symbol2>' | ForEach-Object { "{0}:{1}: {2}" -f $_.Path, $_.LineNumber, $_.Line.Trim() }`

5. The data shape (interface / type declarations only)

6. How data is fetched (hook, query key, api layer function)

7. Routing: grep App.tsx for the relevant paths

8. Baseline typecheck: `npx tsc --noEmit` — report exit code and error count

## Why step 4 matters
A helper that looks local is often imported by another page. Moving or changing
it silently breaks that page, and TypeScript will not always catch it if the
signature is unchanged. Always map usage before proposing to move logic.

## Ending a discovery turn
After the last step: STOP. Do not propose changes. Do not write an
implementation plan. Do not say what you would do next. Wait for instruction.