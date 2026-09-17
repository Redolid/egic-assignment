# EGIC Operations Toolkit — Web Developer Assignment

One React app with the three assignment tasks, each on its own page:

| Route          | Task                                          | Design & decisions                                               |
| -------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| `/cars`        | Task 1 — Cars & Products (quantity + price)   | [docs/task-1-cars-products.md](docs/task-1-cars-products.md)     |
| `/national-id` | Task 2 — Egyptian National ID Reader          | [docs/task-2-national-id.md](docs/task-2-national-id.md)         |
| `/map`         | Task 3 — Map of EGIC Traders                  | [docs/task-3-traders-map.md](docs/task-3-traders-map.md)         |

This README covers setup and the decisions shared by all three tasks. Each task doc explains that task's design, technical details and the reason behind every choice. The visual system is recorded in [DESIGN.md](DESIGN.md); product context in [PRODUCT.md](PRODUCT.md).

**UI/UX catalogue:** [docs/ui-catalogue.pdf](docs/ui-catalogue.pdf) shows every screen in the light and dark themes, on desktop and phone, with the design system and the reasoning behind each page (10 pages, A4 landscape).

## Stack

| Concern         | Choice                                          |
| --------------- | ----------------------------------------------- |
| UI              | React 19 + TypeScript                           |
| Build / dev     | Vite 8                                          |
| Styling         | Tailwind CSS v4 with a custom token set (no component library) |
| Type            | Alexandria (variable, Latin + Arabic), self-hosted |
| Themes          | Light and dark with a toggle (saved per browser, defaults to the OS setting) |
| Routing         | React Router 7                                  |
| Task 1          | @dnd-kit/core (drag & drop)                     |
| Task 2          | **Local ML Model** service (Python · FastAPI · EasyOCR/PyTorch) + **Browser OCR** fallback (Tesseract.js) |
| Task 3          | Leaflet + react-leaflet + OpenStreetMap tiles (re-toned for dark mode) |
| Tests / lint    | Vitest (web), pytest (service), Oxlint          |

## Getting started

Requires **Node.js 20+**.

```bash
npm install
npm run dev          # http://localhost:5173
```

Tasks 1 and 3 work immediately. Task 2 works immediately too (Browser OCR), but reads accurately only with the Local ML Model below.

### Task 2 engines

| Engine | What you need | Reads | Data leaves the PC? |
| --- | --- | --- | --- |
| **Local ML Model** (recommended) | Python 3.10–3.12; GPU optional. Start `ml-service` — see [ml-service/README.md](ml-service/README.md) | Photos and PDFs, front and back, with text locations and confidences | No |
| **Browser OCR** | nothing | Front photos only; weak on Arabic-Indic digits | No |

Neither engine sends the document anywhere. The page detects whether the Local ML Model service is running and preselects it; you can switch at any time. Quick start for the service:

```bash
cd ml-service
python -m venv .venv && .venv\Scripts\activate        # macOS/Linux: source .venv/bin/activate
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu128   # or …/whl/cpu
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8008
```

The service runs on `127.0.0.1:8008` by default; to change it, copy `.env.example` to `.env.local` (git-ignored) and set `ML_SERVICE_URL`.

### Scripts

```bash
npm run dev        # dev server (+ /api/ml proxy to the Local ML Model service)
npm test           # web unit tests (76)
npm run build      # type-check and production build to dist/
npm run preview    # serve the production build (same proxy)
npm run lint       # oxlint
# in ml-service/:  python -m pytest -q   (17 tests)
```

## Project structure

```
├── ml-service/                  # Task 2: local deep-learning ID reader (FastAPI, EasyOCR/PyTorch)
│   ├── app/                     # documents · ocr (models) · layout · fields · pipeline · national_id · main
│   └── tests/
├── src/
│   ├── App.tsx                  # routes
│   ├── routes.tsx               # tool order, pipe colour per tool, preloadable lazy pages
│   ├── lib/                     # motion (easing, reduced motion, shake) · theme (toggle + flood transition)
│   ├── components/
│   │   ├── layout/              # AppLayout (pipeline nav, theme toggle, page transitions), SheetHeader, SectionTitle
│   │   ├── graphics/            # EGIC mark + one flat pipe-run illustration per tool
│   │   └── ui/                  # Button, TextField, FieldMessage, AnimatedNumber, Icons
│   ├── pages/                   # one thin page per route
│   └── features/                # everything specific to a task lives in its folder
│       ├── cars/
│       ├── national-id/
│       └── traders-map/
├── docs/                        # design and decisions per task + ui-catalogue.pdf
├── DESIGN.md                    # visual system (tokens, rules, components)
└── PRODUCT.md                   # users, purpose, constraints
```

## Shared decisions

| Decision | Choice | Why | Alternatives considered |
| --- | --- | --- | --- |
| Project shape | **One app, three routes** | One install, one `npm run dev` and one README for the reviewer; header, controls and tokens are shared so the three tools read as one product. | Three separate projects: triple the setup and duplicated layout code. |
| Framework | **React + TypeScript** | Types make the data models and API contracts explicit (`Car`, `Product`, `Trader`, the ID reader's field schema) and catch mistakes at build time. Mature libraries exist for all three tasks. | Vue or Angular would work too. Plain JS loses type safety on the calculations and contracts. |
| Build tool | **Vite** | Instant dev server; Task 2's Local ML Model service is one proxy entry away (`/api/ml`), so the page talks to it same-origin and reviewers run one command. | CRA is deprecated. Next.js is more framework than three pages need. |
| Visual world | **"Pipe Colour Code"**: each tool runs on its own pipe colour (pricing = supply green, ID reader = cold-water blue, traders = hot-water orange), the header is a pipeline with a valve per tool, and work flows along pipes ([DESIGN.md](DESIGN.md)) | EGIC makes water supply and drainage systems, and colour-coded pipes are a language its staff and installers already read. The colour tells you which tool you are in at a glance, and the flow graphics show where data comes from and where it lands. The brief asked for more colour and warmth, a softer and more modern look, graphics and a dark mode, while keeping the animations and the dense tables. Chosen in a structured direction round. | The previous monochrome "product data sheet" (too austere); one brand colour for every tool (loses the at-a-glance wayfinding). |
| Styling | **Tailwind CSS v4 + CSS-variable tokens** (surfaces, lines, three pipe colours, one `--accent`) | Components only reference `accent`. `<html data-tool>` points it at the current tool's pipe colour and `data-theme` swaps the whole palette, so one class list serves three tools and two themes. `--accent` is a registered `@property`, so it glides between colours on navigation. | MUI: its theme would fight the per-tool accent and the pipe shapes. A separate stylesheet per theme: duplicated rules that drift. |
| Themes | **Light ("water-white") and dark ("duct-navy") on one token set**, with a toggle in the header | Staff use the tools all day, some in dim workshops. The choice is saved in `localStorage` and defaults to the OS preference. It is applied before React renders, so the page never flashes the wrong theme. Every text pair was checked at ≥ 4.5:1 in both themes. | Light only (the brief asked for both); a separate dark stylesheet (drifts). |
| Typeface | **Alexandria** (variable) | A soft geometric sans that covers Latin **and** Arabic (including Arabic-Indic digits) and has tabular figures. English UI, Arabic names and money columns share one voice from one family. | Readex Pro (no tabular figures); Inter (no Arabic); a Latin + Arabic pair (heavier, and the two never quite match). |
| Folder structure | **Feature folders** + thin `pages/` | Everything for one task sits together: types, pure logic, state, components, tests. | Grouping by type scatters each task across the tree. |
| Pure logic outside components | Pricing, merging, validation, ID parsing, checks, OCR parsing, normalisation are plain functions | These are the parts graded for correctness; pure functions are unit-tested without rendering. | Logic inside components, testable only through the UI. |
| Code splitting | **Preloadable lazy pages** for Task 2 and 3 | Leaflet and the OCR client only load when needed; preloading on valve hover lets the page transition show the real page. | One bundle everywhere. |
| Tests | **Vitest + pytest on logic** (76 + 17) | Covers money rounding, the merge rule, the printed summary, validation, the reducer, ID structure, cross-checks, both OCR parsers and data normalisation. Flows verified in a browser at desktop and 375 px. | Component/E2E tests: more setup than this scale needs. |
| Motion | **Motion explains state.** CSS, Web Animations API and View Transitions; no animation library | Every state animation is 150–600 ms with ease-out arrivals and faster exits, has a reduced-motion alternative, and never gates correctness (animated totals always settle on the exact value). The only loops are water flowing through pipes, which marks the active path or work in progress. | Framer Motion: a sizeable dependency for effects the platform handles. |

### Motion map

| Where | What moves | Why |
| --- | --- | --- |
| Tool change | **Water runs along the header pipe** to the chosen valve, the valve fills with its pipe colour, the page accent glides to the new colour, and the page leaves and enters **from the side of the chosen valve**. | Keeps your bearings between the three tools. |
| Theme toggle | The sun and moon swap with a turn, and the new theme **floods the screen outward from the button** (a crossfade under reduced motion). | Makes a whole-page change feel caused by the click. |
| Vehicle panel | The body **unfolds** by animating its grid row (0fr → 1fr); collapsing is quicker; folded controls are `inert`. | Shows the lines belong to that vehicle. |
| Totals | Subtotals, vehicle totals and the grand total **count to their new value** with a flash of the tool colour; inspecting a total draws a bracket down the column it sums. | Makes live recalculation — and what it adds up — visible. |
| Lines | Added, moved or merged lines wash in the tool colour; deleted lines slide out and the rest glide up (FLIP). | Shows what changed and where it went. |
| Drag & drop | The part tilts and lifts; the target panel outlines and says "Release to add"; the receiving panel ripples; a toast states the result (including merged quantities). | Physical feedback for a physical gesture. |
| Forms | Errors unfold under their field; a rejected submit shakes the invalid fields and focuses the first; the Add button turns into a green check with a receipt line. | Names the problem and confirms success without blocking. |
| ID reader | A scan line sweeps the document while it is read and **water flows through the connector** from the source panel to the results; numbered tags land on the fields the model located; confidence bars fill from their inlet; check badges press in when a verdict changes; a valid number splits into its dimensioned parts. | Waiting is honest, and every extracted value points to its source. |
| Map | Hovering a list row lifts its water-drop marker; selection enlarges the drop and pings a ring; popups open from their tip; one selection band slides through the list. | Keeps the list and map visibly in sync. |

## Assumptions (global)

- Evaluated on a recent Chromium, Firefox or Safari. No legacy browser support.
- No database. The only server code is Task 2's local Python service. For production hosting, it would move to a GPU host behind authentication.
- Task-specific assumptions are listed in each task doc.
