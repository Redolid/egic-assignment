---
name: EGIC Operations Toolkit
description: Three daily tools laid out like a colour-coded plumbing run, soft, bright and exact.
colors:
  supply-green: "#0f7f56"
  supply-green-deep: "#0b6644"
  supply-green-wash: "#e3f4ec"
  cold-water-blue: "#2563d8"
  cold-water-blue-deep: "#1d4faf"
  cold-water-blue-wash: "#e6eefc"
  hot-water-orange: "#c4410d"
  hot-water-orange-deep: "#9e340a"
  hot-water-orange-wash: "#fdede5"
  pipe-steel: "#9fb2bd"
  water-white: "#f4f8f9"
  surface-white: "#ffffff"
  rinse-grey: "#eaf1f3"
  seam-line: "#dce6ea"
  seam-line-strong: "#b7c7ce"
  deep-ink: "#0f1c2b"
  muted-ink: "#4a5b6b"
  subtle-ink: "#5f6f7d"
  pass: "#0f7f56"
  warn: "#b45309"
  fail: "#c62828"
  duct-navy: "#0b1520"
  duct-surface: "#111e2b"
  duct-surface-2: "#172838"
  duct-line: "#22364a"
  duct-line-strong: "#34506a"
  duct-fg: "#e8f0f5"
  duct-fg-muted: "#a9bbcb"
  duct-fg-subtle: "#8499ac"
  glow-green: "#3ccb8f"
  glow-blue: "#6ea2ff"
  glow-orange: "#ff8a57"
  duct-steel: "#3b556c"
  on-glow: "#071522"
typography:
  page-title:
    fontFamily: "Alexandria Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  section-title:
    fontFamily: "Alexandria Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  brief:
    fontFamily: "Alexandria Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Alexandria Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  control:
    fontFamily: "Alexandria Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.25
  label:
    fontFamily: "Alexandria Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
  tag:
    fontFamily: "Alexandria Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "'tnum'"
  micro:
    fontFamily: "Alexandria Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1.2
  figures:
    fontFamily: "Alexandria Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    fontFeature: "'tnum', 'lnum'"
rounded:
  fitting: "10px"
  bend: "18px"
  pill: "9999px"
spacing:
  gutter-mobile: "16px"
  gutter: "24px"
  panel-mobile: "16px"
  panel: "20px"
  header: "28px"
  section-gap: "24px"
components:
  button-primary:
    backgroundColor: "{colors.supply-green}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.supply-green-deep}"
  button-secondary:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.rinse-grey}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "36px"
  field:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.deep-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.fitting}"
    padding: "0 14px"
    height: "44px"
  panel:
    backgroundColor: "{colors.surface-white}"
    rounded: "{rounded.bend}"
    padding: "20px"
  tag:
    backgroundColor: "{colors.supply-green-wash}"
    textColor: "{colors.supply-green-deep}"
    typography: "{typography.tag}"
    rounded: "{rounded.pill}"
    height: "24px"
  tag-active:
    backgroundColor: "{colors.supply-green}"
    textColor: "{colors.surface-white}"
  stat-chip:
    backgroundColor: "{colors.rinse-grey}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.pill}"
    padding: "6px 16px 6px 14px"
---

# Design System: EGIC Operations Toolkit

## Overview

**Creative North Star: "Pipe Colour Code"**

EGIC makes water supply and drainage systems, and every installer knows pipes by colour. The toolkit uses that code: each tool runs on its own pipe colour, the header is a pipeline with a valve per tool, and work flows along pipes from where it comes in to where the result lands. Pricing runs on supply green, the National ID reader on cold-water blue, the traders map on hot-water orange. Picking a tool sends water down the header pipe to its valve, and the whole page picks up that colour.

The feel is soft and modern: white panels with pipe-bend corners on a water-white canvas, pill-shaped controls like pipe segments, and flat drawings of each tool's pipe run. There is a light theme ("water-white") and a dark theme ("duct-navy") on one token set. The toggle floods the screen in the new theme from the button outward. Colour is warm and plentiful, but the data stays dense: tables keep tight rows, tabular figures and right-aligned money, because staff do exact, repetitive work.

This world replaced an earlier monochrome "DIN product data sheet" design. The user wanted more colour and warmth, a softer and more modern shape language, graphics, and both themes. From that design it kept the purposeful animations and the dense tables.

**Key Characteristics:**
- One accent per tool, from the pipe colour code, set on `<html data-tool>` and animated between tools.
- Soft pipe-bend panels (18px), fittings (10px) for inputs and tiles, pills for buttons, chips and tags.
- Flow as the recurring graphic: the pipeline nav, the ID page's connector, dashed water in the illustrations, progress bars that fill from the inlet.
- Light and dark themes of equal standing, stored per browser, defaulting to the OS setting.
- Dense, numeric-first tables inside the soft shell.

## Colors

Three saturated pipe colours on cool, water-tinted neutrals. Every pipe colour has a deep variant for text and a wash for backgrounds.

### Primary
- **Supply Green** (#0f7f56): the Cars & Products accent (primary buttons, the active valve, selection, flashes on changed totals). Deep variant (#0b6644) for text on washes and hover; wash (#e3f4ec) for icon circles and selected backgrounds.

### Secondary
- **Cold-Water Blue** (#2563d8): the National ID Reader accent: selected engine, located-field outlines, lit ID digits, the flowing connector and progress. Deep (#1d4faf), wash (#e6eefc).

### Tertiary
- **Hot-Water Orange** (#c4410d): the Traders Map accent: water-drop markers, the list's selection band, the popup's number tag. Deep (#9e340a), wash (#fdede5).

### Neutral
- **Water White** (#f4f8f9): the page canvas.
- **Surface White** (#ffffff): panels, inputs, popups.
- **Rinse Grey** (#eaf1f3): hover rows, the add-line tray, stat chips, empty pipe interiors.
- **Seam Line** (#dce6ea) / **Seam Line Strong** (#b7c7ce): panel borders and table rules; stronger for totals rows and hovered borders.
- **Deep Ink** (#0f1c2b): text. **Muted Ink** (#4a5b6b): briefs and labels. **Subtle Ink** (#5f6f7d): placeholders, hints, grips.
- **Pipe Steel** (#9fb2bd): unfilled pipe in the nav and connectors.
- **Status**: pass (#0f7f56), warn (#b45309), fail (#c62828), each with a soft wash for pill badges.

### Dark theme (duct navy)
The same roles, mirrored: canvas #0b1520, surfaces #111e2b / #172838, lines #22364a / #34506a, text #e8f0f5 / #a9bbcb / #8499ac. The pipe colours are brightened to glow on navy (green #3ccb8f, blue #6ea2ff, orange #ff8a57); their washes become 14–16% alpha tints; text on a solid pipe colour switches to #071522.

### Named Rules
**The One Pipe Rule.** A page uses only its own tool's pipe colour as accent. The other two pipe colours appear only in the header valves.

**The Contrast Floor Rule.** Every text pair clears 4.5:1 in both themes. Deep variants exist to put pipe-coloured text on washes, not for decoration.

## Typography

**Display, body and figures:** Alexandria (variable, self-hosted), with system sans as fallback.

**Character:** Alexandria is one geometric family that covers Latin and Arabic, including Arabic-Indic digits, and has tabular figures. Trader names, ID fields and English UI therefore share one voice without a second font file.

### Hierarchy
- **Page title** (600, 1.75rem → 2.125rem from `sm`, 1.25, −0.02em): the one h1 per tool, in the page header.
- **Section title** (600, 1rem): panel headings, paired with an icon in an accent-wash circle.
- **Brief** (400, 0.9375rem, 1.625, max 62ch): the page description.
- **Body** (400, 0.875rem): table cells, inputs, list rows. Arabic names use 0.9375rem semibold, right-to-left.
- **Control** (500, 0.8125rem): small buttons and nav labels.
- **Label** (500, 0.75rem, muted): field labels, column heads, stat-chip labels. Sentence case, no tracking.
- **Tag** (600, 0.6875rem, tabular): numbered tags.
- **Micro** (500, 0.625rem): captions under the dimensioned ID digits only. The map attribution uses 10px.

### Named Rules
**The Tabular Money Rule.** Money, quantities, IDs and coordinates always use tabular lining figures and right alignment, so columns can be compared by eye.

## Layout

- **Container:** a centred 84rem container. Side gutters are 16px, and 24px from `sm`.
- **Header:** sticky and blurred over the canvas. On desktop it is a three-column grid (brand · pipeline, max 34rem · theme toggle). Below `lg` the pipeline drops to a full-width second row, and below `md` it shows the short tool names (Pricing, ID check, Traders).
- **Page header:** every tool opens with the same panel. Title, brief and stat chips sit on the left, the tool's illustration on the right over an accent wash. On mobile the illustration moves above the title.
- **Cars & Products:** a 17rem sticky parts list beside the vehicle stack (from `lg`). On mobile the parts list becomes a horizontal snap strip.
- **National ID Reader:** source and result panels side by side from `xl`, joined by a 3.5rem flow connector. Below `xl` they stack and the connector turns vertical.
- **Traders Map:** a 23rem trader list beside the map, both filling the viewport height from `lg`. On mobile the map comes first at 58vh and the list follows.
- **Rhythm:** 24px between page sections and 12px between vehicle panels. Panel padding is 16px, or 20px from `sm`; the page header uses 20px, or 28px from `sm`.

## Elevation & Depth

The design is layered but soft. Panels sit a hair above the canvas on a border plus a two-part ambient shadow. Only moving or floating elements get the lifted shadow. The shadow colour is a token (`--shadow-color`), so dark mode gets deeper, bluer shadows rather than grey haze.

### Shadow Vocabulary
- **Panel** (`box-shadow: 0 1px 2px hsl(212 40% 12% / 0.06), 0 10px 28px -14px hsl(212 40% 12% / 0.18)`): panels, primary and secondary buttons, the theme toggle, the active valve.
- **Lifted** (`box-shadow: 0 18px 36px -16px hsl(212 40% 12% / 0.35)`): drag previews, map popups, the floating "Show all" control, toasts.

### Named Rules
**The Lift Means Movement Rule.** The lifted shadow marks only things that float or move (a dragged part, a popup, a toast). Static content never gets it.

## Shapes

- **Pipe bend** (18px): panels, the page header, the dropzone, popups.
- **Fitting** (10px): inputs, engine tiles, list rows, the selection band, ID digit segments.
- **Pill** (9999px): buttons, stat chips, tags, status badges, pipes, progress bars and the toast.
- **Icon circles:** the section icon, vehicle icon, empty-state icon and theme toggle are all full circles.
- **Illustrations:** flat SVG with 3–4px round-capped strokes in theme tokens, and dashed "water" moving along the pipes (static under reduced motion).

## Components

### Buttons
- **Shape:** pill (9999px), 36px (small) or 44px (default) tall.
- **Primary:** solid tool accent with on-accent text and the panel shadow. Hover deepens to the accent's deep variant; press scales to 0.97.
- **Secondary:** a white surface with a seam-line border; hover strengthens the border and fills rinse grey.
- **Ghost / Danger:** text only. Danger hovers to a fail wash with fail-red text (row delete).
- **Focus:** a 2px accent outline, offset 2px.

### Inputs / Fields
- **Style:** a 44px fitting (10px radius) on a white surface with a seam-line border and a muted label above.
- **Focus:** the border turns accent, with a 4px accent-wash ring.
- **Error:** a fail-red border and wash ring; the message reveals downward with a circled "!" icon. Inline number cells revert on blur if invalid.

### Stat chips
Pills on rinse grey: a muted label followed by a tabular figure. They are the page header's summary (vehicles, lines, grand total; engine, sides, checks; locations, selected).

### Cards / Containers (panels)
- **Corner style:** pipe bend (18px), a white surface, a seam-line border, the panel shadow.
- **Headers:** a section title with an icon circle and optional metadata on the right. A hairline separates the header from the body in list-style panels.
- **Drop target:** a dashed accent border while a drag is active; on hover it scales to 1.01 with an accent border and a 4px wash ring.

### Navigation (signature): the pipeline
Three valves (40px circles) sit on one steel pipe. Water, the accent colour with a moving highlight, fills the pipe from the first valve to the active one. The active valve fills with its own pipe colour and scales to 1.1. Inactive valves take their pipe colour on hover. Changing tools runs a View Transition: the page leaves and enters from the chosen valve's side while the water runs.

### Numbered tag
A 24px pill carrying a number that links one value to the same value elsewhere (ID field ↔ located text, trader row ↔ map marker). At rest it is an accent wash with deep text. When active it is solid accent with on-accent text and a 3px wash halo.

### Water-drop marker
A 30×40 map pin shaped like a drop in hot-water orange, with a surface-coloured inner circle carrying the trader number. Hover lifts it 3px and scales it to 1.1. Selection scales it to 1.25, deepens its colour and pings a ground ring twice.

### Flow connector
A pipe between the ID page's source and result panels. It is empty while idle, fills with flowing water while the model reads, and stays full once a result exists.

## Do's and Don'ts

### Do:
- **Do** take the accent from `--accent` (set by `data-tool`), never a hard-coded pipe colour, inside a tool page.
- **Do** read colours in scripts (WAAPI flashes, outlines) from computed CSS variables, so both themes animate correctly.
- **Do** use tabular figures and right alignment for every number column.
- **Do** keep panel radius 18px, field radius 10px and controls pill-shaped.
- **Do** give every animation a reduced-motion path (instant or a short crossfade).
- **Do** scope Leaflet overrides under `.leaflet-container`, because Leaflet's stylesheet loads after the app's.

### Don't:
- **Don't** return to the monochrome, square, ruled "data sheet" look the user moved away from.
- **Don't** use a second tool's pipe colour as an accent on another tool's page.
- **Don't** loosen table density (row height, figure size) for softness; the softness lives in the shell.
- **Don't** put the lifted shadow on static content.
- **Don't** add a second typeface; Alexandria covers Latin, Arabic and figures.
