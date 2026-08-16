---
trigger: always_on
---

---
trigger: always_on
---

# Stack facts and known traps

## Stack
React 18 + Vite 8 (Rolldown) + TypeScript + Tailwind + shadcn/ui +
TanStack Query + react-router. Admin app runs on port 9003
(`npm run dev -- --port 9003 --strictPort`).
`vite.config.ts` has 9002 hardcoded — that port is RESERVED, do not use it.
Backend: separate repo, port 5000. Postgres in Docker on host port 5456.
Active branch: v2.

Credentials are never stored in this repo or in these rules. If you need a test
login, ask for it.

## TRAP 1 — Vite 8 double-wraps CJS default exports
Rolldown wraps CJS packages that use `exports.default`, so the real export ends
up at `m.default.default`. Symptom: a component renders as `[object Object]`
or throws "is not a function" at runtime while `tsc` passes cleanly.

Fix pattern, already applied in QrCodeModal.tsx:

    import * as PkgModule from "some-cjs-package";
    const NS: any = (PkgModule as any).default ?? PkgModule;
    const Component: any = NS?.default ?? NS?.NamedExport ?? NS;

Apply this to ANY CJS dependency that fails at runtime. Suspect it before
suspecting your own code.

## TRAP 2 — npm install fails without a flag
vite@8.0.3 and @vitejs/plugin-react-swc@3.11.0 are an officially unsupported
pair (the plugin declares vite ^4–^7). Plain `npm install` fails with ERESOLVE.
`--legacy-peer-deps` is required. Do NOT run installs on your own initiative;
propose them and wait.

## TRAP 3 — package.json and package-lock.json are dirty
Both carry an uncommitted, deliberate change. Never stage them as collateral.
Never "clean up" the working tree.

## Known open defects — report, do not fix unasked
- Leads are not linked to listings: the Lead-uri column is "—" on all listings.
- The test password is rendered in the login UI; unclear whether it is gated
  on `import.meta.env.DEV`.
- The CSV catalog feed in /settings emits a localhost URL.
- Lists are unvirtualized: 185 rows on /messages, 160 on /customers, 68 on stock.
- Four contradictory counts exist across Today / Customers / Messages / Reports.
- /reviews renders a header with zero rows and no empty state.
- /reports Y-axis labels are clipped.

If your work touches one of these, mention it. Fixing it is a separate task.

## Files that look dead but are alive
`src/pages/Listings.tsx` is not routed directly in App.tsx — it is rendered
through ListingsPage.tsx. It is LIVE. Do not delete it.
Before calling any file dead, prove it: grep for imports across src/ and check
App.tsx routes. Paste the proof.