# EGIC Operations Toolkit — Web Developer Assignment

One React app with the three assignment tasks, each on its own sheet:

| Route          | Task                                          | Design & decisions                                               |
| -------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| `/cars`        | Task 1 — Cars & Products (quantity + price)   | [docs/task-1-cars-products.md](docs/task-1-cars-products.md)     |
| `/national-id` | Task 2 — Egyptian National ID Reader          | [docs/task-2-national-id.md](docs/task-2-national-id.md)         |
| `/map`         | Task 3 — Map of EGIC Traders                  | [docs/task-3-traders-map.md](docs/task-3-traders-map.md)         |

This README covers setup and the decisions shared by all three tasks. Each task doc explains that task's design, technical details and the reason behind every choice. The visual system is recorded in [DESIGN.md](DESIGN.md); product context in [PRODUCT.md](PRODUCT.md).

## Stack

| Concern         | Choice                                          |
| --------------- | ----------------------------------------------- |
| UI              | React 19 + TypeScript                           |
| Build / dev     | Vite 8                                          |
| Styling         | Tailwind CSS v4 with a custom token set (no component library) |
| Type            | Archivo (variable, width axis) + IBM Plex Sans Arabic, self-hosted |
| Routing         | React Router 7                                  |
| Task 1          | @dnd-kit/core (drag & drop)                     |
| Task 2          | **Local deep-learning service** (Python · FastAPI · EasyOCR/PyTorch), optional Claude API, Tesseract.js fallback |
| Task 3          | Leaflet + react-leaflet + OpenStreetMap tiles   |
| Tests / lint    | Vitest (web), pytest (service), Oxlint          |

## Getting started

Requires **Node.js 20+**.

```bash
npm install
npm run dev          # http://localhost:5173
```

Tasks 1 and 3 work immediately. Task 2 works immediately too (browser OCR), but reads accurately with one of the two optional engines below.

### Task 2 engines (optional)

| Engine | What you need | Reads | Data leaves the PC? |
| --- | --- | --- | --- |
| **Local model** (recommended) | Python 3.10–3.12; GPU optional. Start `ml-service` — see [ml-service/README.md](ml-service/README.md) | Photos and PDFs, front and back, with text locations and confidences | No |
| **Claude** | `ANTHROPIC_API_KEY` in `.env.local` (copy `.env.example`), then restart `npm run dev` | Photos and PDFs, front and back | Yes, to Anthropic's API |
| **Browser OCR** | nothing | Front photos only; weak on Arabic-Indic digits | No |

The page detects which engines are available and preselects the best one; you can switch at any time. Quick start for the local model:

```bash
cd ml-service
python -m venv .venv && .venv\Scripts\activate        # macOS/Linux: source .venv/bin/activate
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu128   # or …/whl/cpu
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8008
```

API keys stay on the server side (the Vite dev/preview server) and are never sent to the browser. `.env.local` is git-ignored.

### Scripts

```bash
npm run dev        # dev server (+ /api/read-id for Claude, + /api/ml proxy to the local model)
npm test           # web unit tests (72)
npm run build      # type-check (app + server) and production build to dist/
npm run preview    # serve the production build (same endpoints)
npm run lint       # oxlint
# in ml-service/:  python -m pytest -q   (17 tests)
```

## Project structure

```
├── ml-service/                  # Task 2: local deep-learning ID reader (FastAPI, EasyOCR/PyTorch)
│   ├── app/                     # documents · ocr (models) · layout · fields · pipeline · national_id · main
│   └── tests/
├── server/
│   └── idReaderPlugin.ts        # Task 2: /api/read-id Claude endpoint (Vite dev + preview middleware)
├── src/
│   ├── App.tsx                  # routes
│   ├── routes.tsx               # register-tab order + preloadable lazy pages
│   ├── lib/motion.ts            # shared easing, reduced-motion check, shake
│   ├── components/
│   │   ├── layout/              # AppLayout (title block, register tabs, sheet transitions), SheetHeader
│   │   └── ui/                  # Button, TextField, FieldMessage, AnimatedNumber, Icons
│   ├── pages/                   # one thin page per route
│   └── features/                # everything specific to a task lives in its folder
│       ├── cars/
│       ├── national-id/
│       └── traders-map/
├── docs/                        # design and decisions per task
├── DESIGN.md                    # visual system (tokens, rules, components)
└── PRODUCT.md                   # users, purpose, constraints
```

## Shared decisions

| Decision | Choice | Why | Alternatives considered |
| --- | --- | --- | --- |
| Project shape | **One app, three routes** | One install, one `npm run dev` and one README for the reviewer; header, controls and tokens are shared so the three tools read as one product. | Three separate projects: triple the setup and duplicated layout code. |
| Framework | **React + TypeScript** | Types make the data models and API contracts explicit (`Car`, `Product`, `Trader`, the ID reader's field schema) and catch mistakes at build time. Mature libraries exist for all three tasks. | Vue or Angular would work too. Plain JS loses type safety on the calculations and contracts. |
| Build tool | **Vite** | Instant dev server and a plugin API: Task 2's Claude endpoint lives inside the dev server and the local model is one proxy entry away, so reviewers run one command. | CRA is deprecated. Next.js is more framework than three sheets need. |
| Visual world | **"The Product Data Sheet"** — ruled spec tables, register tabs, numbered balloons, condensed catalogue titles ([DESIGN.md](DESIGN.md)) | EGIC manufactures water supply and drainage products with a German-quality position; staff do exact, repetitive work. A catalogue data sheet is a world they know, and its devices (dimension lines, balloons that cross-reference) make derivation visible — the product's core need. Chosen from a structured direction round over a site-signage and an industrial-plate alternative. | The previous generic card dashboard (the anti-reference); a construction-signage system (louder, better at warnings than at dense data). |
| Styling | **Tailwind CSS v4 + custom tokens** (ink, cobalt, stamps) | Responsive layout from utilities, tokens enforce the palette (cobalt only for action), no component library to fight the world's square forms. | MUI: rounded cards and elevation are exactly what the world rejects. |
| Typeface | **Archivo** (width axis) **+ IBM Plex Sans Arabic** | One grotesk file gives condensed catalogue titles and readable table text; tabular figures for money and IDs. Arabic names and trader names get a designed Arabic face instead of a system fallback. | Inter (no Arabic, no width axis); system fonts (inconsistent across OSes). |
| Folder structure | **Feature folders** + thin `pages/` | Everything for one task sits together: types, pure logic, state, components, tests. | Grouping by type scatters each task across the tree. |
| Pure logic outside components | Pricing, merging, validation, ID parsing, checks, OCR parsing, normalisation are plain functions | These are the parts graded for correctness; pure functions are unit-tested without rendering. | Logic inside components, testable only through the UI. |
| Code splitting | **Preloadable lazy pages** for Task 2 and 3 | Leaflet and the OCR client only load when needed; preloading on tab hover lets the sheet transition show the real page. | One bundle everywhere. |
| Tests | **Vitest + pytest on logic** (72 + 17) | Covers money rounding, the merge rule, validation, the reducer, ID structure, cross-checks, both OCR parsers and data normalisation. Flows verified in a browser at desktop and 375 px. | Component/E2E tests: more setup than this scale needs. |
| Motion | **Motion explains state; nothing decorates.** CSS, Web Animations API and View Transitions; no animation library | Every animation is 150–400 ms with ease-out arrivals and faster exits, has a reduced-motion alternative, and never gates correctness (animated totals always settle on the exact value). | Framer Motion: a sizeable dependency for effects the platform handles. |

### Motion map

| Where | What moves | Why |
| --- | --- | --- |
| Sheet change | The old sheet leaves and the new one enters **in the direction of the chosen register tab**; the black active tab slides across. | Keeps your bearings between the three tools. |
| Vehicle section | The body **unfolds** by animating its grid row (0fr → 1fr); collapsing is quicker; folded controls are `inert`. | Shows the lines belong to that vehicle. |
| Totals | Subtotals, vehicle totals and the grand total **count to their new value** with a cobalt flash; inspecting a total draws a bracket down the column it sums. | Makes live recalculation — and what it adds up — visible. |
| Lines | Added, moved or merged lines wash cobalt; deleted lines slide out and the rest glide up (FLIP). | Shows what changed and where it went. |
| Drag & drop | The part slip tilts and lifts; the target section outlines and says "Release to add"; the receiving section ripples; a toast states the result (including merged quantities). | Physical feedback for a physical gesture. |
| Forms | Errors unfold under their field; a rejected submit shakes the invalid fields and focuses the first; the Add button turns into a green check with a receipt line. | Names the problem and confirms success without blocking. |
| ID reader | A scan line sweeps the document while it is read; numbered balloons land on the fields the model located; verdict stamps press in when a check changes; a valid number splits into its dimensioned parts. | Waiting is honest, and every extracted value points to its source. |
| Map | Register hover lifts the balloon; selection enlarges it in cobalt and pings a ring; popups open from their tip; one selection band slides through the register. | Keeps the list and map visibly in sync. |

## Assumptions (global)

- Evaluated on a recent Chromium, Firefox or Safari. No legacy browser support.
- No database. Server code is limited to Task 2: the Claude endpoint inside Vite's dev/preview server and the optional local Python service. For production hosting, the Claude handler would move to a serverless function and the model service to a GPU host behind authentication.
- Task-specific assumptions are listed in each task doc.
