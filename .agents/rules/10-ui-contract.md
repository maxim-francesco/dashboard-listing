---
trigger: always_on
---

---
trigger: glob
globs: src/**/*.tsx
---

# UI contract — admin dashboard

## Design posture
This is a dense internal admin tool for car dealers who work on it all day.
Information density and scannability beat visual flourish. Explicitly avoid:
glassmorphism, gradients, decorative animation, oversized hero sections,
generous whitespace on desktop, card grids where a table belongs.

Do not introduce a new visual language. Match what already exists.

## Two-layout pattern
List rows carry two sibling layouts in one component:
- mobile: `lg:hidden` — the existing card, untouched
- desktop: `hidden lg:flex` — a dense table row

Never make one layout responsive into the other. Two blocks, one component.

## Desktop row geometry (measured, authoritative)
- Row height: 54px. Padding `px-3 py-1.5`, `items-center`, `gap-3`.
- Row container: `bg-card border border-border rounded-lg hover:bg-accent/5
  transition-colors w-full select-none`
- The column header row MUST carry `border border-transparent` so its box model
  is byte-identical to a row. Without it, header and rows misalign by 2px.
- Header is `hidden lg:flex`.
- List gap: `gap-2.5 lg:gap-1`

## Column widths (shared across every list surface)
Use these exact widths so stock, customers, and leads align with each other:
- thumbnail / avatar: `w-16` (64x40 image) or `w-9` avatar, `shrink-0`
- primary identity (name / car): `flex-1 min-w-0` + `truncate`
- money: `w-32 shrink-0 text-right text-[15px] font-semibold tabular-nums`
- status: `w-28 shrink-0 flex justify-center text-[13px]`
- secondary metric: `w-24 shrink-0 text-right text-[13px] tabular-nums`
- tertiary metric: `w-20 shrink-0 text-right text-[13px] tabular-nums`
- trailing action button: fixed size, `shrink-0`, `e.stopPropagation()` on click

Every numeric column gets `tabular-nums`. No exceptions — without it, columns
jitter as values change.

## Type scale
- 20px semibold — page title
- 17px medium — mobile row primary
- 15px semibold — desktop row primary and money
- 14px — mobile secondary
- 13px — desktop secondary, all metrics
- 11px uppercase tracking-wide — column headers and group headers

Do not introduce sizes outside this scale.

## Color tokens — use these, never raw Tailwind palette colors
foreground, muted-foreground, card, border, input, muted, accent, primary,
admin-bg, destructive + destructive/10, warning + warning-light,
success + success-light.

Writing `text-gray-500`, `bg-slate-100`, or a hex value in this codebase is a
defect. The only pre-existing exceptions are the lead-type dot colors and badge
classes already defined in CustomerRow.tsx — do not extend that pattern.

## Container
`DashboardLayout` uses `max-w-7xl lg:max-w-[1600px]`. Design desktop layouts
for 1600px of usable width, not 1920.

## Empty and loading states
Every list needs a real empty state with a sentence telling the user what would
put data there. Skeletons must have a desktop variant matching the 54px row —
a mobile skeleton behind a desktop table is a visible glitch.