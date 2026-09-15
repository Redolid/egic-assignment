# EGIC Web Developer Assignment

One React app with the three assignment tasks, each on its own page:

| Route          | Task                                          | Design & decisions                                               |
| -------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| `/cars`        | Task 1 — Cars & Products (quantity + price)   | [docs/task-1-cars-products.md](docs/task-1-cars-products.md)     |
| `/national-id` | Task 2 — Egyptian National ID Reader          | [docs/task-2-national-id.md](docs/task-2-national-id.md)         |
| `/map`         | Task 3 — Map of EGIC Traders                  | [docs/task-3-traders-map.md](docs/task-3-traders-map.md)         |

This README covers setup and the decisions shared by all three tasks. Each task doc explains that task's design, technical details and the reason behind every choice.

## Stack

| Concern         | Choice                                          |
| --------------- | ----------------------------------------------- |
| UI              | React 19 + TypeScript                           |
| Build / dev     | Vite 8                                          |
| Styling         | Tailwind CSS v4 (no component library)          |
| Routing         | React Router 7                                  |
| Task 1          | @dnd-kit/core (drag & drop)                     |
| Task 2          | Claude API (`@anthropic-ai/sdk`) with Tesseract.js fallback |
| Task 3          | Leaflet + react-leaflet + OpenStreetMap tiles   |
| Tests / lint    | Vitest, Oxlint                                  |

## Getting started

Requires **Node.js 20+**.

```bash
npm install
npm run dev          # http://localhost:5173
```

### API keys

| Task | Key needed? |
| ---- | ----------- |
| 1 — Cars | No |
| 2 — National ID | **Optional.** With `ANTHROPIC_API_KEY`, cards are read by Claude, which is accurate. Without it, the page still works using on-device Tesseract OCR, but results are much less reliable (see the Task 2 doc). |
| 3 — Map | No. Leaflet and OpenStreetMap need no key. |

To enable Claude for Task 2:

```bash
cp .env.example .env.local   # then set ANTHROPIC_API_KEY=...
npm run dev                  # restart so the server picks up the key
```

The key is read only by the dev/preview server and never sent to the browser. `.env.local` is git-ignored.

### Scripts

```bash
npm run dev        # dev server (includes the /api/read-id endpoint)
npm test           # unit tests (59)
npm run build      # type-check (app + server) and production build to dist/
npm run preview    # serve the production build (also includes /api/read-id)
npm run lint       # oxlint
```

## Project structure

```
├── server/
│   └── idReaderPlugin.ts        # Task 2: /api/read-id endpoint (Vite dev + preview middleware)
├── src/
│   ├── App.tsx                  # routes
│   ├── routes.tsx               # nav order + preloadable lazy pages (Task 2 and 3)
│   ├── lib/motion.ts            # shared easing, reduced-motion check, shake
│   ├── components/
│   │   ├── layout/AppLayout.tsx # header, navigation, view-transition page changes
│   │   └── ui/                  # shared primitives: Button, TextField, FieldMessage, AnimatedNumber, Icons
│   ├── pages/                   # one thin page per route
│   │   ├── CarsPage.tsx
│   │   ├── NationalIdPage.tsx
│   │   └── TradersMapPage.tsx
│   └── features/                # everything specific to a task lives in its folder
│       ├── cars/
│       ├── national-id/
│       └── traders-map/
└── docs/                        # design documentation per task
```

## Shared decisions

| Decision | Choice | Why | Alternatives considered |
| --- | --- | --- | --- |
| Project shape | **One app, three routes** | One install, one `npm run dev` and one README for the reviewer. The header, buttons and inputs are shared, so all three pages look consistent. | Three separate projects: triple the setup and duplicated layout code, with nothing gained. |
| Framework | **React + TypeScript** | TypeScript makes the data models explicit (`Car`, `Product`, `Trader`, the API contract in Task 2) and catches mistakes at build time. React has mature libraries for all three tasks (dnd-kit, react-leaflet). | Vue or Angular would work too. Plain JS loses type safety on the calculations and the API contract. |
| Build tool | **Vite** | Instant dev server, a simple config, and a plugin API. The plugin API let Task 2's small server endpoint live inside the same dev server, so no separate backend was needed. | CRA is deprecated. Next.js would work but is more framework than three pages need. |
| Styling | **Tailwind CSS, no component library** | Responsive layouts come from utility classes (`sm:`/`lg:`), and each page keeps its markup and styling together. Three pages don't justify the size or visual lock-in of MUI. | MUI or another component library. Hand-written CSS modules. |
| Folder structure | **Feature folders** (`features/<task>/…`) + thin `pages/` | Everything for one task sits in one place: types, pure logic, state, components and tests. Truly shared code lives in `components/ui`. | Grouping by type (`components/`, `hooks/`, `utils/` for all tasks) scatters each task across the tree. |
| Pure logic outside components | Pricing, validation, ID parsing and data normalisation are plain functions in `lib/` | These are the parts graded for correctness. As pure functions they can be unit-tested without rendering anything. | Logic inside components, which can only be tested through the UI. |
| Code splitting | **Lazy-load the Task 2 and Task 3 pages** | Leaflet (~165 KB) and the OCR code only download when those pages are opened. It takes two `lazy()` calls, with a `Suspense` fallback inside the layout so the header stays visible. | Loading one bundle everywhere slows down the Cars page for no reason. |
| Tests | **Vitest on the pure logic** (59 tests) | Covers the risky parts: money rounding, validation rules, the reducer, ID structure and decoding, OCR text parsing, and data normalisation. It runs in under a second. | Component or E2E tests. The flows were checked manually in a browser at desktop and 375px widths instead, which is proportionate for this scale. |
| Responsive design | Mobile-first Tailwind breakpoints | The assignment requires mobile support. Every page was checked at 375px for horizontal overflow. | — |
| Typeface | **IBM Plex Sans + IBM Plex Sans Arabic**, self-hosted via Fontsource | Two of the three tools show Arabic names. Plex was designed with a matching Arabic companion, so Latin labels and Arabic data share one voice. Only the Latin and Arabic subsets download, and only when that text is on screen. | Inter: has no Arabic, so Arabic would fall back to a mismatched system font. System fonts: inconsistent across OSes. |
| Motion | **Motion explains state; nothing decorates.** CSS for declarative states, Web Animations API for interruptible or measured effects, View Transitions for page changes. No animation library. | See the list below. Every animation is 150–400 ms with ease-out arrivals and faster exits, has a `prefers-reduced-motion` alternative (crossfades and colour changes instead of movement), and never gates correctness (e.g. animated totals always settle on the exact value). | Framer Motion: a sizeable dependency for effects the platform APIs handle. |

### Motion map

| Where | What moves | Why |
| --- | --- | --- |
| Page change | The old page leaves and the new one enters **in the direction of the chosen tab** (nav order = spatial order). The active-tab pill glides to the new tab. Pages are preloaded on hover so the transition shows the real page. | Keeps your bearings between the three tools. |
| Car card | The body **unfolds** by animating its grid row (0fr → 1fr, so no height measuring), with the content drifting into place. Collapsing is quicker. Folded controls are `inert`. | Shows the table belongs to that car. |
| Totals | Subtotals, car totals and the grand total **count to their new value** and flash the brand colour. | Makes the live recalculation visible as you type. |
| Product rows | Added or moved rows arrive with a brand-colour wash. Deleted rows slide out, and the rows below glide up (FLIP). | Shows what changed and where it went. |
| Drag & drop | The ghost tilts and lifts when picked up. The target card grows and says "Release to add". The receiving card ripples. A toast confirms. | Physical feedback for a physical gesture. |
| Forms | Errors unfold under their field. A rejected submit shakes the invalid fields and focuses the first one. The Add button's plus turns into a check. An invalid inline edit flashes as it reverts. | Names the problem and confirms success without blocking. |
| ID reader | A scan line sweeps the card while it's read. A valid number **splits into its parts** (century · birth date · governorate · sequence · check), and each decoded row lights up the digits it came from. | Waiting feels honest, and the ID structure is shown, not just stated. |
| Map | List hover lifts the pin. Selection grows the pin and pings a ring. Popups open from their tip. One highlight slides through the list. | Keeps the list and map visibly in sync. |

## Assumptions (global)

- Evaluated on a recent Chromium, Firefox or Safari. No legacy browser support.
- No backend or database is required. The only server code is Task 2's endpoint, which runs inside Vite's dev/preview server. For production hosting, that function would move to a serverless function (see the Task 2 doc).
- Task-specific assumptions are listed in each task doc.
