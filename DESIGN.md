---
name: EGIC Operations Toolkit
description: An internal tool set like a German product data sheet — ruled, exact, and cross-referenced.
colors:
  ink-950: "#0e0e0d"
  ink-900: "#1a1a18"
  ink-700: "#3f3f3b"
  ink-600: "#55554f"
  ink-500: "#6d6d69"
  ink-400: "#9b9b97"
  ink-300: "#c4c4c0"
  ink-200: "#dcdcd9"
  ink-100: "#ededeb"
  ink-50: "#f6f6f5"
  sheet-white: "#ffffff"
  catalogue-cobalt: "#0047ab"
  cobalt-deep: "#003b8e"
  cobalt-wash: "#eef3fc"
  cobalt-tint: "#dae5f7"
  pass-green: "#17753a"
  fail-red: "#c0141c"
  caution-amber: "#a15c00"
typography:
  sheet-title:
    fontFamily: "Archivo Variable, IBM Plex Sans Arabic, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.25rem"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 72"
  section-title:
    fontFamily: "Archivo Variable, ui-sans-serif, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 0.95
    fontVariation: "'wdth' 72"
  title:
    fontFamily: "Archivo Variable, ui-sans-serif, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Archivo Variable, ui-sans-serif, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  spec-label:
    fontFamily: "Archivo Variable, ui-sans-serif, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    letterSpacing: "0.08em"
  figures:
    fontFamily: "Archivo Variable, ui-sans-serif, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    fontFeature: "'tnum', 'lnum'"
  arabic-data:
    fontFamily: "IBM Plex Sans Arabic, Archivo Variable, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
rounded:
  none: "0px"
  control: "3px"
  balloon: "9999px"
spacing:
  cell-x: "12px"
  cell-y: "8px"
  section-gap: "32px"
  gutter: "16px"
components:
  button-primary:
    backgroundColor: "{colors.catalogue-cobalt}"
    textColor: "{colors.sheet-white}"
    rounded: "{rounded.control}"
    height: "40px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.cobalt-deep}"
  button-secondary:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.ink-900}"
    rounded: "{rounded.control}"
    height: "32px"
    padding: "0 12px"
  button-secondary-hover:
    backgroundColor: "{colors.ink-950}"
    textColor: "{colors.sheet-white}"
  input:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.ink-950}"
    rounded: "{rounded.control}"
    height: "40px"
    padding: "0 12px"
  register-tab-active:
    backgroundColor: "{colors.ink-950}"
    textColor: "{colors.sheet-white}"
    rounded: "{rounded.none}"
    height: "44px"
  balloon:
    backgroundColor: "{colors.sheet-white}"
    textColor: "{colors.ink-950}"
    rounded: "{rounded.balloon}"
    size: "24px"
  balloon-selected:
    backgroundColor: "{colors.catalogue-cobalt}"
    textColor: "{colors.sheet-white}"
---

# Design System: EGIC Operations Toolkit

## Overview

**Creative North Star: "The Product Data Sheet"**

Every screen is a sheet from a German industrial catalogue: a title block at the top, register tabs to move between sheets, hairline-ruled specification tables, and numbered balloons that cross-reference one thing to another — a field on an ID card to its row, a map pin to its trader. The tool exists for staff whose work is exact (money, national numbers), so the design's job is to make derivation visible: totals say what they sum, extracted values point at where they were read.

Density is welcome; decoration is not. Hierarchy comes from rule weight (2px ink for sections, 1px hairlines for rows), condensed capitals for sheet titles, and tabular figures — not from cards, shadows or colour fields. Colour is scarce and semantic: cobalt only where something can be acted on or is selected, and three stamp colours for verdicts.

The world explicitly replaced a generic card-and-shadow SaaS dashboard look; that look is the anti-reference.

**Key Characteristics:**
- White sheet ground, ink-black section rules, hairline row rules.
- Condensed uppercase Archivo for sheet and section titles; tabular figures for every number.
- Numbered balloons as the cross-reference device.
- Catalogue cobalt reserved for actions, selection and focus.
- Arabic data typeset in IBM Plex Sans Arabic beside the English UI.

## Colors

A restrained ink-on-white palette with one working accent and three inspection stamps.

### Primary
- **Catalogue Cobalt** (#0047ab): primary buttons, links, focus rings, selected balloons, drop targets, the list selection band and the dimension bracket. Deepens to Cobalt Deep (#003b8e) on hover; Cobalt Wash (#eef3fc) and Cobalt Tint (#dae5f7) back selected or just-changed rows.

### Neutral
- **Sheet White** (#ffffff): the page and every panel. There is no grey desk behind the sheet.
- **Printer's Ink** (#0e0e0d): sheet titles, 2px section rules, the active register tab, outlined controls.
- **Body Ink** (#1a1a18): body text and values.
- **Secondary Ink** (#55554f): descriptions, spec labels, metadata (AA on white).
- **Hairline** (#dcdcd9): row rules and cell dividers.
- **Paper Tint** (#f6f6f5): the add-line form strip and hover rows.

### Stamps
- **Pass Green** (#17753a), **Fail Red** (#c0141c), **Caution Amber** (#a15c00): check verdict stamps, validation messages and warning panels only, each on its own 50-level wash.

### Named Rules
**The Cobalt Means Act Rule.** Cobalt appears only on something clickable, selected, focused or receiving a drop. A cobalt element that does nothing is a defect.

**The Stamp Rule.** Green, red and amber are verdicts. They never decorate, and never appear without the words that explain them.

## Typography

**Display Font:** Archivo Variable, width axis at 72% (with IBM Plex Sans Arabic, system-ui)
**Body Font:** Archivo Variable at normal width
**Arabic Data Font:** IBM Plex Sans Arabic

**Character:** An industrial grotesk that condenses into catalogue headings and relaxes into readable table text from one file; the Arabic companion carries names and addresses with equal weight.

### Hierarchy
- **Sheet title** (800, 2.5rem mobile / 3.25rem desktop, 0.95, uppercase, condensed): one per page, top-left.
- **Section title** (800, 1.25rem, uppercase, condensed): "Parts list", "Source document", "Trader register", always sitting on a 2px ink rule.
- **Title** (600, 1.0625rem): vehicle names and other row headers.
- **Body** (400, 0.875–0.9375rem, 1.5): descriptions capped at 62ch.
- **Spec label** (600, 0.6875rem, 0.08em tracking, uppercase, Secondary Ink): column heads, cell labels, form labels.
- **Figures** (tabular, lining): every quantity, price, total, ID digit and coordinate.

### Named Rules
**The Tabular Figures Rule.** Any number a person might compare down a column uses tabular lining figures.

**The Condensed Is For Titles Rule.** Condensed capitals name sheets and sections only; values and controls stay at normal width.

## Layout

Content sits in a centred sheet up to 84rem wide with a 16px mobile / 24px desktop gutter. Every page opens with the same heading block: sheet title and brief on the left, a bordered row of spec cells on the right, closed by a hairline. Below it, two-column working layouts appear at large sizes (parts list 17rem + vehicles; trader register 23rem + map; source document + extracted data at 1280px+) and stack into one column on phones, map first. Tables keep their semantics on desktop and restyle rows into stacked label/value entries below 640px, never scrolling sideways. Sections are separated by 2px ink rules and 32px of space; rows by 1px hairlines.

## Elevation & Depth

Flat by default. Depth is carried by rule weight and the black active tab, not shadows. Soft shadows appear only on things physically lifted off the sheet: the drag ghost, the confirmation toast, map popups and pin balloons.

### Shadow Vocabulary
- **Lifted slip** (`box-shadow: 0 16px 28px -14px rgb(14 14 13 / 0.45)`): the drag ghost while carried.
- **Toast** (`box-shadow: 0 14px 30px -12px rgb(14 14 13 / 0.6)`): the confirmation strip.
- **Popup** (`box-shadow: 0 14px 28px -16px rgb(14 14 13 / 0.45)`): map popups.

### Named Rules
**The Flat Sheet Rule.** Nothing resting on the sheet casts a shadow; only objects being moved or floating above it do.

## Shapes

Square by conviction: panels, tabs, tables, cell grids, alerts and map controls have no radius. Form controls and buttons take a barely-there 3px corner. The only round forms are balloons and status dots, and they are always perfect circles with a 1.5px outline.

## Components

### Buttons
- **Shape:** near-square (3px).
- **Primary:** Catalogue Cobalt fill, white label, 40px tall; one per section at most ("Add line").
- **Secondary:** white with a 1px ink outline that fills solid ink on hover ("Reset demo data", "Try a sample card", "Show all").
- **Feedback:** presses scale to 98%; a successful add turns the button Pass Green with a plus-to-check morph for a moment.

### Inputs / Fields
- **Style:** white, 1px Hairline-to-ink border, 3px corner, spec label above.
- **Inline table cells:** borderless-looking until hover/focus, right-aligned tabular figures; prices display with two decimals when not being typed.
- **Focus:** cobalt border with a 3px cobalt ring at 15%.
- **Error:** Fail Red border, a triangle warning icon and message that unfolds beneath; rejected submits shake only the invalid fields.

### Navigation — Register tabs
- Tabs sit on a 2px ink baseline like a catalogue's thumb index: a numbered balloon plus the tool name (short names below 1024px). The active tab is solid Printer's Ink with white text and slides to the new tab during page transitions; inactive tabs tint Paper on hover.

### Spec cells
- A bordered row of label-over-value cells divided by hairlines, used in every sheet header for counts, totals, engine and verdicts.

### Numbered balloon (signature)
- A 24px circle with a 1.5px outline and a tabular number, used wherever one thing refers to another: ID fields on the card image ↔ rows in the fields table; map pins ↔ trader register rows; register tabs. Hovering either end fills both in cobalt. Balloons never number things that reference nothing.

### Inspection stamp
- An outlined uppercase verdict (PASS / CHECK / FAIL) in its stamp colour that presses in when a verdict changes, beside the check's name and detail.

### Dimension bracket
- Inspecting a total draws a cobalt line down the subtotal column it sums; the ID number splits into dimensioned segments (century · YYMMDD · governorate · sequence · check) with ticks and captions.

## Do's and Don'ts

### Do:
- **Do** open every sheet with the title block: condensed sheet title, brief, spec cells.
- **Do** separate sections with a 2px Printer's Ink rule and rows with 1px Hairlines.
- **Do** use a numbered balloon whenever a value on one surface refers to a value on another, and make hover highlight both ends.
- **Do** set every number in tabular figures and right-align numeric columns.
- **Do** typeset Arabic names, addresses and professions right-to-left in IBM Plex Sans Arabic.
- **Do** keep motion to state changes: sheets slide in the direction of their tab, sections unfold by height, totals count to their new value, stamps press in; every one has a reduced-motion fallback.

### Don't:
- **Don't** put content in rounded, shadowed cards; use ruled sections on the sheet.
- **Don't** use cobalt on anything that isn't actionable, selected or focused.
- **Don't** number sections or items that nothing cross-references.
- **Don't** add colour fields, gradients or tinted backgrounds for emphasis; use rule weight, condensed titles and figures.
- **Don't** use Unicode glyphs or emoji as icons; icons are 2px-stroke SVGs.
