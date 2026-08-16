---
name: browser-measure
description: Drives a live Chrome browser through the chrome-devtools MCP server to resize viewports, capture screenshots, and measure real DOM geometry after a UI change. Use whenever a layout, spacing, alignment, or density change needs proof rather than visual judgement.
---

# Browser measurement

The admin app runs at http://localhost:9003. Never navigate to production
(dashboard-listing-h5mo.vercel.app) or to any URL outside localhost.

## Order of operations
navigate_page → wait → resize_page → evaluate_script → take_screenshot
Never screenshot before resizing — you will capture the previous viewport.

## Prefer snapshots and scripts over screenshots
take_snapshot and evaluate_script return text and cost almost nothing.
take_screenshot returns an image and is expensive. Take a screenshot only when
the user needs to SEE something, or when the skill explicitly requires one for
the regression record. Never take a screenshot to check a number — measure it.

## The two viewports
- 390 x 844 — mobile regression gate
- 1600 x 900 — desktop working surface (the container caps at 1600px)

## Standard measurement
Run this at each viewport and paste the raw JSON output:

    JSON.stringify({
      vw: window.innerWidth,
      rows: document.querySelectorAll('[data-row]').length,
      rowH: document.querySelector('[data-row]')?.getBoundingClientRect().height,
      scrollH: document.scrollingElement.scrollHeight,
      cols: [...document.querySelectorAll('[data-col]')]
              .map(e => [e.dataset.col, Math.round(e.getBoundingClientRect().left)])
    })

Header and first-row column left edges must be identical. Report the delta in
px per column. A delta of 1px or more is a defect, not a rounding artefact.

## Console must be clean
Run list_console_messages after every change. React key warnings, hydration
errors, and failed image requests are defects to report — they are frequently
the real cause of a layout that "looks slightly off".

## Never
- click, fill, or submit anything that writes data — this database holds
  21 real dealers' records
- navigate away from localhost:9003
- record performance traces unless explicitly asked