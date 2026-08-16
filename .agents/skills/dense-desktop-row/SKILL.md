---
name: dense-desktop-row
description: Converts a mobile list card into a dual-layout component with a dense 54px desktop table row while leaving mobile styling completely untouched. Use when asked to densify a list, add a desktop table layout, reduce row height, add column headers, or improve information density on a listing, customers, leads, or messages page.
---

# Dense desktop row

## The pattern
One component, two sibling blocks:

    <div className="... lg:hidden">      {/* existing mobile card — DO NOT TOUCH */}
    <div className="hidden lg:flex ...">  {/* new desktop row */}

Never convert the mobile card into a responsive layout. Never add `lg:` classes
to the mobile block. Duplication here is intentional and correct.

## Recipe

1. Read the existing component in full. Identify every field the mobile card
   shows and where each value comes from.
2. Leave the mobile block byte-identical. Verify at the end with
   `git diff` that no unprefixed or `sm:`/`md:` class changed.
3. Build the desktop block using the column widths in the UI contract rule.
4. Add a column header in the parent list page, `hidden lg:flex`, with
   `border border-transparent`, using the same width classes in the same order.
5. Add a desktop skeleton variant matching 54px.
6. Check whether the list has segments or filters where a column means something
   different (e.g. an active price vs a sale price). Handle it — do not render
   the same value twice under two headings.

## Alignment verification — required, not optional
After building, measure. Do not judge alignment from a screenshot.

    document.querySelectorAll('[data-col]').forEach(el =>
      console.log(el.dataset.col, el.getBoundingClientRect().left))

Header column left edges must match row column left edges to 0px. If they do
not, the cause is almost always a box-model difference between header and row:
check border, padding, and gap on both.

Also report, before and after:
- visible row count at 1600px width
- row height in px
- container scrollHeight

## Sorting
A dense table invites sorting, but adding sort UI is a separate task. If the
default order is wrong for the user's job (e.g. newest first when the dealer
cares about oldest stock), say so and propose it — do not implement it unasked.

## Do not
- virtualize the list
- add pagination
- change the data fetching
- change row click behaviour or navigation targets
- touch grouping/bucketing logic in the parent page