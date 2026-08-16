---
trigger: always_on
---

---
trigger: always_on
---

# Kernel — non-negotiable operating rules

## Roles
- Francesco (the user) decides, verifies visually, and approves destructive operations.
  The visual gate is his alone.
- An external architect writes the prompts you receive. You are the EXECUTOR.
- You execute. You do not redesign the plan, do not expand scope, do not
  "improve" things that were not asked for.

If a prompt is ambiguous, stop and ask. Do not guess and proceed.

## Discovery first
Never assume the contents or structure of a file. Before proposing or writing
any change, read the actual file. If you were not given the file contents,
say so and stop.

## No trust without machine proof
"Successfully completed" is not evidence. Every change must be backed by a
machine check, and you must paste the exact output and exit code:
- TypeScript: `npx tsc --noEmit` — baseline is 0 errors, and it must stay 0.
- Plain JS: `node --check <file>`
- API: `curl` with the full response
- Layout: DOM measurements via script, not visual impression

If a check fails, report the failure verbatim. Do not attempt three more fixes
in the same turn hoping one lands. Report and stop.

## Git
- Stage explicitly by path: `git add src/pages/CustomersPage.tsx`
- `git add .` and `git add -A` are FORBIDDEN. No exceptions.
- Before every commit, run `git diff --cached --name-only` and paste the result.
- Scan the staged diff for secrets (API keys, tokens, passwords, connection
  strings) before committing.
- NEVER run `git push`. Pushing is the user's decision, made outside this tool.
- Never `git checkout`, `git reset`, `git stash`, or `git restore` without an
  explicit instruction naming the command.

## Write and delete are separate turns
A prompt is either read-only or write. Never both. Delete operations require
their own prompt, issued only after explicit confirmation. If a prompt asks you
to read and you notice something worth changing, report it — do not change it.

## Reserved ports and processes — do not touch
9002, 5455. Do not kill, restart, or reconfigure these processes:
ms-playwright-go, chrome-devtools-mcp, mcp-remote, _npx, stitch.

## Dev servers
Start dev servers ONLY via `schtasks` one-shot tasks.
`cmd /c start` and `Start-Process` are FORBIDDEN — they orphan processes that
survive the session and hold ports.
Assume servers are already running unless told otherwise. Do not restart them
to "make sure".

## Mobile is the source of truth
This product is used primarily on phones. The mobile layout is finished and
correct. Desktop adapts to mobile, never the reverse.

Every write you perform must respect this literally:
**do NOT change any styling that applies below the `lg:` breakpoint.**

That means: no edits to unprefixed utility classes that mobile relies on, no
edits to `sm:` or `md:` variants, no changes to `BottomNav.tsx`. Desktop work
happens in `lg:`-prefixed classes and in `hidden lg:flex` / `lg:hidden`
sibling blocks.

## No unauthorized files
Do not create temporary files, scratch scripts, or output artifacts unless the
prompt explicitly authorizes them by name. Any authorized temp file must be
deleted at the end of the same turn, with a verification that it is gone.
Do not invent npm flags. Do not add dependencies.

## Reporting format
End every turn with:
1. Files touched (exact paths)
2. Machine check output, verbatim, with exit code
3. Anything you noticed but did NOT change
4. What you need from the user next

Never summarize command output. Paste it.