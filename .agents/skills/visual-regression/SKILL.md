---
name: visual-regression
description: Captures and measures the UI at mobile and desktop viewports after a layout change, producing screenshots and DOM measurements that prove mobile did not regress. Use after any styling, layout, or component change, or when asked to verify, capture, screenshot, or measure the interface.
---

# Visual regression

Mobile is the source of truth. The purpose of this skill is to PROVE that a
desktop change did not alter mobile, and to quantify what changed on desktop.

## Viewports
- Mobile: 390 x 844 — this is the regression gate
- Desktop: 1600 x 900 — this is the working surface (the app container caps at
  1600px; capturing at 1920 measures empty page background, not the layout)

## Procedure
For each affected route, at each viewport:
1. Resize the viewport to the exact dimensions.
2. Capture a screenshot.
3. Run the measurement script and paste the raw output.

## Measurements to report
Always report before and after, as numbers:

    JSON.stringify({
      rows: document.querySelectorAll('[data-row]').length,
      rowHeight: document.querySelector('[data-row]')?.getBoundingClientRect().height,
      scrollHeight: document.scrollingElement.scrollHeight,
      viewport: [window.innerWidth, window.innerHeight]
    })

Plus, for table layouts, the column left-edge alignment check between header
and first row (must be 0px apart).

## Screenshot files
Save to: `C:\Users\Francesco\Desktop\Projects\_screenshots\<round-name>\`
Use a NEW EMPTY folder per round — never reuse a folder, never overwrite.
Name files `<route>-<width>.png`, e.g. `customers-390.png`, `customers-1600.png`.
Report the full absolute path of every file written, and the exact file names.

## The mobile gate
Mobile screenshots must be visually identical to before the change. In addition,
run `git diff` on every touched component and confirm that no unprefixed,
`sm:`, or `md:` class was modified. Paste the diff.

If mobile changed in any way — even improved — that is a FAILURE. Report it and
stop.

## If capture is unavailable
If you cannot capture screenshots in this environment, say so plainly, provide
the DOM measurements, and ask the user for manual captures with the exact
absolute path and file names you need. Do not proceed to the next phase without
them.