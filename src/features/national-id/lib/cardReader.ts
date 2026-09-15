import { FIELD_META, FIELD_ORDER } from './cardFields'
import type { CardSide, CardSideName, FieldKey, ReadField } from './cardFields'
import { extractCardData } from './extractCardData'
import { normalizeDigits } from './nationalId'
import { drawScaled, isPdf, loadImage, prepareForTesseract, recognizeArabicText } from './ocr'
import { READ_ID_ENDPOINT } from './readerApi'
import type { ReadIdError, ReadIdRequest, ReadIdResponse, ReaderStatus } from './readerApi'

/**
 * Three interchangeable engines behind one result shape:
 *
 *   local-model  ml-service/ on this machine: CRAFT text detector + Arabic CRNN recognizer (EasyOCR),
 *                GPU-accelerated. Both card sides, text locations, confidences; nothing leaves the PC.
 *   claude       Claude vision through /api/read-id (needs ANTHROPIC_API_KEY on the dev server).
 *   tesseract    Tesseract.js in the browser. Front side only, photos only, weak on Arabic-Indic digits.
 */
export type ReaderEngine = 'local-model' | 'claude' | 'tesseract'

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

  const claude = fetch(READ_ID_ENDPOINT, { signal: withTimeout(2500) })
    .then(async (response): Promise<EngineStatus> => {
      const status = response.ok ? ((await response.json()) as ReaderStatus) : { available: false }
      return status.available
        ? { engine: 'claude', available: true, detail: 'API key configured · uploads to Anthropic' }
        : { engine: 'claude', available: false, detail: 'No API key on the server' }
    })
    .catch((): EngineStatus => ({ engine: 'claude', available: false, detail: 'Endpoint unavailable' }))

  const tesseract: EngineStatus = { engine: 'tesseract', available: true, detail: 'In this browser · front photos only' }
  return Promise.all([local, claude, Promise.resolve(tesseract)])
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
    throw new CardReadError('The local model service is not reachable. Start it (see README) or pick another engine.')
  }
  if (!response.ok) throw new CardReadError(await errorMessage(response, `The local model failed (HTTP ${response.status}).`))

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

const toBase64 = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).slice(String(reader.result).indexOf(',') + 1))
    reader.onerror = () => reject(new CardReadError('The file could not be read.'))
    reader.readAsDataURL(file)
  })

/** Images sent to Claude are resized: larger ones cost more and don't read better. */
const UPLOAD_MAX_EDGE = 1600

async function readWithClaude(file: File, previewUrl: string | null): Promise<Omit<CardReadResult, 'elapsedMs'>> {
  let body: ReadIdRequest
  if (isPdf(file)) {
    body = { data: await toBase64(file), mediaType: 'application/pdf' }
  } else {
    const image = await loadImage(previewUrl!)
    const longEdge = Math.max(image.naturalWidth, image.naturalHeight)
    const dataUrl = drawScaled(image, image.naturalWidth * Math.min(1, UPLOAD_MAX_EDGE / longEdge)).toDataURL('image/jpeg', 0.9)
    body = { data: dataUrl.slice(dataUrl.indexOf(',') + 1), mediaType: 'image/jpeg' }
  }

  let response: Response
  try {
    response = await fetch(READ_ID_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new CardReadError('Could not reach the server. Check your connection and try again.')
  }
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ReadIdError | null
    throw new CardReadError(error?.error ?? `Reading the card failed (HTTP ${response.status}).`)
  }

  const d = (await response.json()) as ReadIdResponse
  const digits = (value: string) => normalizeDigits(value).replace(/\D/g, '')
  const field = (key: FieldKey, value: string): ReadField[] =>
    value ? [{ key, value, confidence: null, side: FIELD_META[key].side, box: null }] : []

  const front: ReadField[] = [
    ...field('name', d.name),
    ...field('address', d.address),
    ...field('nationalId', digits(d.nationalIdFront)),
    ...field('cardNumber', d.cardNumber),
  ]
  const backId = digits(d.nationalIdBack)
  const back: ReadField[] = [
    ...(backId ? [{ key: 'nationalId' as const, value: backId, confidence: null, side: 'back' as const, box: null }] : []),
    ...field('job', d.job),
    ...field('gender', d.gender),
    ...field('religion', d.religion),
    ...field('maritalStatus', d.maritalStatus),
    ...field('issueDate', d.issueDate),
    ...field('expiryDate', d.expiryDate),
  ]

  const sides: CardSide[] = []
  if (d.frontFound || front.length) sides.push({ side: 'front', image: isPdf(file) ? null : previewUrl, fields: front })
  if (d.backFound || back.length) sides.push({ side: 'back', image: null, fields: back })
  const warnings = d.isEgyptianId ? [] : ['This document does not look like an Egyptian national ID card.']
  return { engine: 'claude', model: 'Claude Opus 5 · vision', device: 'Anthropic API', sides, warnings, rawText: null }
}

async function readWithTesseract(
  file: File,
  previewUrl: string | null,
  onProgress: (progress: ReadProgress) => void,
): Promise<Omit<CardReadResult, 'elapsedMs'>> {
  if (isPdf(file) || !previewUrl) {
    throw new CardReadError('Browser OCR reads photos only. Pick the local model or Claude for PDF scans.')
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
    'local-model': 'Detecting and reading text with the local model…',
    claude: 'Reading the card with Claude…',
    tesseract: 'Preparing the image…',
  }
  onProgress({ step: steps[engine], progress: null })
  const result =
    engine === 'local-model'
      ? await readWithLocalModel(file)
      : engine === 'claude'
        ? await readWithClaude(file, previewUrl)
        : await readWithTesseract(file, previewUrl, onProgress)
  return { ...result, elapsedMs: Math.round(performance.now() - started) }
}
