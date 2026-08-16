---
name: safe-commit
description: Stages and commits changes safely with explicit per-path staging, a secret scan, and a pre-commit diff review, and never pushes. Use whenever asked to commit, stage, save work to git, or record a change in version control.
---

# Safe commit

## Sequence — do not reorder, do not skip

1. `git status --short`
   Paste it. Identify every changed path.

2. Stage ONLY the files this task changed, one explicit path per file:
   `git add src/components/customers/CustomerRow.tsx`
   `git add .` and `git add -A` are forbidden. If a file changed that you did
   not intend to change, stop and report it instead of staging it.

3. `git diff --cached --name-only`
   Paste it. Confirm the list is exactly what you intended, nothing more.
   package.json and package-lock.json carry deliberate uncommitted changes —
   they must NOT appear here unless the task was about them.

4. Secret scan on the staged content:
   `git diff --cached | Select-String -Pattern "api[_-]?key|secret|token|password|Bearer |postgres://|mongodb://|-----BEGIN"`
   Paste the result. If anything matches, STOP and report. Do not commit.

5. `npx tsc --noEmit` — must be 0 errors. Paste exit code.

6. Commit with a conventional-commit message:
   `git commit -m "feat(customers): dense desktop table layout for customer list"`
   Types: feat, fix, refactor, chore, style. Scope is the feature area.
   Subject is imperative, lowercase, no trailing period, under 72 characters.

7. `git log --oneline -3` to confirm.

## Never
- `git push` — under any phrasing, including "push it up" or "publish".
  If asked, reply that pushing is done by the user and stop.
- `git commit -a` or `git commit -am`
- amending, rebasing, resetting, or reverting without an explicit instruction
  that names the command
- committing when a machine check failed