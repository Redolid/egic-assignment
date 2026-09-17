# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

EGIC staff using the tool daily: operations and customer-service people who price product lines against vehicles, verify customers' Egyptian national IDs, and find the nearest EGIC trader / service location. The work is repetitive and accuracy-sensitive (money totals, ID numbers), done on office desktops and on phones in the field. Interview reviewers evaluate it as if it were that real internal tool.

## Product Purpose

One internal web app with three tools:

1. **Cars & Products** — manage product lines per vehicle with exact quantity × price subtotals and live totals.
2. **National ID Reader** — read the front and back of an Egyptian national ID (photo or PDF), extract the holder's details and validate/decode the 14-digit national number.
3. **Traders Map** — locate EGIC customer-service traders on a map with a synchronized list.

Success: staff trust the numbers and the extracted data at a glance, and finish each task in seconds on desktop or phone.

## Positioning

Built for EGIC specifically: its trader network data, Egyptian ID structure (Arabic-Indic digits, governorate codes), EGP money, and Arabic names rendered correctly alongside an English UI.

## Operating Context

- Bilingual content: English interface; Arabic personal names, addresses and trader names (right-to-left) inside it.
- Money in EGP with 2 decimals; quantities in whole units.
- ID documents arrive as phone photos or scanned PDFs, sometimes both card sides on one page.
- The ID reader runs on a local deep-learning OCR service (the Local ML Model, GPU when available) or in-browser Tesseract (Browser OCR); documents never leave the machine, and engine availability varies per machine.
- Used on desktop browsers and mobile (responsive is required by the brief).

## Capabilities and Constraints

- Stack: React 19 + TypeScript + Vite + Tailwind CSS v4 (existing codebase); Python FastAPI service for the local model.
- All existing functionality must be preserved (drag & drop, inline editing, validation, merge-by-name-and-price, persistence, list ↔ map sync, engine fallbacks).
- The assignment requires responsive mobile views and a README explaining how to run it.
- Personal ID documents are sensitive: never committed, never sent anywhere without the user's choice of engine.

## Brand Commitments

- Company: EGIC — "Leading manufacturer of water supply and drainage solutions. Superior German quality products for residential and industrial projects." (user-provided description).
- No official logo, colours, or brand assets were provided: an identity may be created, but must not imitate a real EGIC logo or claim official branding.

## Evidence on Hand

- Traders dataset provided by the assignment (`src/features/traders-map/data/traders.json`, 14 real locations).
- A real sample ID (PDF, both sides) for local testing only — git-ignored, never published or quoted.
- No customer counts, product catalog, prices, certifications, or quality claims beyond the sentence above; do not fabricate them. Car/product sample data in Task 1 is synthetic demo data.

## Product Principles

1. Exactness is visible: totals, IDs and extracted fields show how they were derived and are easy to verify and correct.
2. Staff speed over spectacle: every screen serves a repeated task; expression lives in precise details.
3. Arabic and English as equals: Arabic data is typeset with the same care as the English UI.
4. Sensitive data stays under the user's control: engines and data flow are explicit.
