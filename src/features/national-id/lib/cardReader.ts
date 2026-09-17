import { FIELD_ORDER } from './cardFields'
import type { CardSide, CardSideName, FieldKey, ReadField } from './cardFields'
import { extractCardData } from './extractCardData'
import { isPdf, loadImage, prepareForTesseract, recognizeArabicText } from './ocr'

/**
 * Two interchangeable engines behind one result shape. Neither sends the document off the machine.
 *
 *   local-model  ml-service/ on this machine: CRAFT text detector + Arabic CRNN recognizer (EasyOCR),
 *                GPU-accelerated. Both card sides, text locations, confidences.
 *   tesseract    Tesseract.js in the browser. Front side only, photos only, weak on Arabic-Indic digits.
 */
export type ReaderEngine = 'local-model' | 'tesseract'

export const ML_ENDPOINT = '/api/ml'

export interface EngineStatus {
  engine: ReaderEngine
  available: boolean
  /** Short state line shown under the engine name. */
  detail: string
}

export interface CardReadResult {
  engine: ReaderEngine
  model: string
  device: string | null
  elapsedMs: number
  sides: CardSide[]
  warnings: string[]
  /** Tesseract only: the raw text, to explain misreads. */
  rawText: string | null
}

export interface ReadProgress {
  step: string
  /** 0 → 1, or null when progress can't be measured (a single request). */
  progress: number | null
}

export class CardReadError extends Error {}

const withTimeout = (ms: number) => AbortSignal.timeout(ms)

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

export async function probeEngines(): Promise<EngineStatus[]> {
  const local = fetch(`${ML_ENDPOINT}/health`, { signal: withTimeout(2500) })
    .then(async (response): Promise<EngineStatus> => {
      if (!response.ok) throw new Error()
      const health = (await response.json()) as { ready: boolean; device: string }
      const device = health.device.startsWith('cuda') ? 'GPU' : health.device === 'cpu' ? 'CPU' : 'starting'
      return {
        engine: 'local-model',
        available: true,
        detail: health.ready ? `Running on this PC · ${device}` : 'Service up · loading models…',
      }
    })
    .catch((): EngineStatus => ({ engine: 'local-model', available: false, detail: 'Service not running (see README)' }))

  const tesseract: EngineStatus = { engine: 'tesseract', available: true, detail: 'In this browser · front photos only' }
  return Promise.all([local, Promise.resolve(tesseract)])
}

// ---------------------------------------------------------------------------
// Engines
// ---------------------------------------------------------------------------

interface ServiceField {
  key: FieldKey
  value: string
  confidence: number
  side: CardSideName
  box: [number, number, number, number] | null
  note: string | null
}

interface ServiceResponse {
  model: string
  device: string
  sides: { side: CardSideName; image: string; fields: ServiceField[] }[]
  warnings: string[]
}

async function errorMessage(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as { detail?: string; error?: string } | null
  return body?.detail ?? body?.error ?? fallback
}

async function readWithLocalModel(file: File): Promise<Omit<CardReadResult, 'elapsedMs'>> {
  const form = new FormData()
  form.append('file', file)
  let response: Response
  try {
    response = await fetch(`${ML_ENDPOINT}/read`, { method: 'POST', body: form, signal: withTimeout(120_000) })
  } catch {
    throw new CardReadError('The Local ML Model service is not reachable. Start it (see README) or use Browser OCR for a photo.')
  }
  if (!response.ok) throw new CardReadError(await errorMessage(response, `The Local ML Model failed (HTTP ${response.status}).`))

  const data = (await response.json()) as ServiceResponse
  return {
    engine: 'local-model',
    model: data.model,
    device: data.device,
    sides: data.sides.map((side) => ({
      side: side.side,
      image: side.image,
      fields: side.fields
        .filter((field) => FIELD_ORDER.includes(field.key))
        .map((field): ReadField => ({ ...field, box: field.box, note: field.note })),
    })),
    warnings: data.warnings,
    rawText: null,
  }
}

async function readWithTesseract(
  file: File,
  previewUrl: string | null,
  onProgress: (progress: ReadProgress) => void,
): Promise<Omit<CardReadResult, 'elapsedMs'>> {
  if (isPdf(file) || !previewUrl) {
    throw new CardReadError('Browser OCR reads photos only. Use the Local ML Model for PDF scans.')
  }
  const image = await loadImage(previewUrl)
  onProgress({ step: 'Loading browser OCR…', progress: null })
  let text: string
  try {
    text = await recognizeArabicText(prepareForTesseract(image), (progress) => onProgress({ step: 'Reading text in the browser…', progress }))
  } catch {
    throw new CardReadError('Browser OCR failed to start. It downloads its Arabic model on first use — check your connection.')
  }
  const data = extractCardData(text)
  const fields: ReadField[] = []
  if (data.name) fields.push({ key: 'name', value: data.name, confidence: null, side: 'front', box: null })
  if (data.nationalId) fields.push({ key: 'nationalId', value: data.nationalId, confidence: null, side: 'front', box: null })
  return {
    engine: 'tesseract',
    model: 'Tesseract.js · Arabic',
    device: 'This browser',
    sides: [{ side: 'front', image: previewUrl, fields }],
    warnings: ['Browser OCR reads the front only and often misreads Arabic-Indic digits — check every value.'],
    rawText: text,
  }
}

export async function readCard(
  engine: ReaderEngine,
  file: File,
  previewUrl: string | null,
  onProgress: (progress: ReadProgress) => void,
): Promise<CardReadResult> {
  const started = performance.now()
  const steps: Record<ReaderEngine, string> = {
    'local-model': 'Detecting and reading text with the Local ML Model…',
    tesseract: 'Preparing the image…',
  }
  onProgress({ step: steps[engine], progress: null })
  const result =
    engine === 'local-model' ? await readWithLocalModel(file) : await readWithTesseract(file, previewUrl, onProgress)
  return { ...result, elapsedMs: Math.round(performance.now() - started) }
}
