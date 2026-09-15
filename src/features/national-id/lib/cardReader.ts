import { extractCardData } from './extractCardData'
import { normalizeDigits } from './nationalId'
import { drawScaled, loadImage, prepareForTesseract, recognizeArabicText } from './ocr'
import { READ_ID_ENDPOINT } from './readerApi'
import type { ReadIdError, ReadIdRequest, ReadIdResponse, ReaderStatus } from './readerApi'

/**
 * Reads the name and national ID from a card image with the best engine available:
 *
 *   1. Claude (vision) through /api/read-id — used when the server has ANTHROPIC_API_KEY.
 *      Reliable on Arabic names and Arabic-Indic digits.
 *   2. Tesseract.js in the browser — fallback so the page works with no key and no backend.
 *      Weak on this card (see docs/task-2-national-id.md), so results must be checked.
 *
 * Both engines return the same shape, and the page validates the ID the same way afterwards.
 */

export type ReaderEngine = 'claude' | 'tesseract'

export interface CardReadResult {
  engine: ReaderEngine
  name: string | null
  nationalId: string | null
  /** Claude only: the image does not look like the front of an Egyptian ID. */
  notAnIdCard: boolean
  /** Tesseract only: the raw text, shown to help the user understand misreads. */
  rawText: string | null
}

export interface ReadProgress {
  step: string
  /** 0 → 1, or null when progress can't be measured (a single API call). */
  progress: number | null
}

export class CardReadError extends Error {}

/** Images sent to Claude are resized: larger ones cost more and don't read better. */
const UPLOAD_MAX_EDGE = 1600

let claudeAvailable: Promise<boolean> | null = null

/** Asked once per page load. Any failure (e.g. a static host with no API) means "use Tesseract". */
function isClaudeAvailable(): Promise<boolean> {
  claudeAvailable ??= fetch(READ_ID_ENDPOINT)
    .then((response) => (response.ok ? (response.json() as Promise<ReaderStatus>) : { available: false }))
    .then((status) => status.available === true)
    .catch(() => false)
  return claudeAvailable
}

async function readWithClaude(image: HTMLImageElement): Promise<CardReadResult> {
  const longEdge = Math.max(image.naturalWidth, image.naturalHeight)
  const width = image.naturalWidth * Math.min(1, UPLOAD_MAX_EDGE / longEdge)
  const dataUrl = drawScaled(image, width).toDataURL('image/jpeg', 0.9)

  const body: ReadIdRequest = { image: dataUrl.slice(dataUrl.indexOf(',') + 1), mediaType: 'image/jpeg' }
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

  const data = (await response.json()) as ReadIdResponse
  const digits = normalizeDigits(data.nationalId).replace(/\D/g, '')
  return {
    engine: 'claude',
    name: data.name || null,
    nationalId: digits || null,
    notAnIdCard: !data.isIdCardFront,
    rawText: null,
  }
}

async function readWithTesseract(
  image: HTMLImageElement,
  onProgress: (progress: ReadProgress) => void,
): Promise<CardReadResult> {
  onProgress({ step: 'Loading on-device OCR…', progress: null })
  let text: string
  try {
    text = await recognizeArabicText(prepareForTesseract(image), (progress) =>
      onProgress({ step: 'Reading text on this device…', progress }),
    )
  } catch {
    throw new CardReadError(
      'On-device OCR failed to start. It downloads its Arabic model on first use — check your internet connection and try again.',
    )
  }
  const data = extractCardData(text)
  return { engine: 'tesseract', ...data, notAnIdCard: false, rawText: text }
}

export async function readCard(
  imageUrl: string,
  onProgress: (progress: ReadProgress) => void,
): Promise<CardReadResult> {
  onProgress({ step: 'Preparing image…', progress: null })
  const image = await loadImage(imageUrl)

  if (await isClaudeAvailable()) {
    onProgress({ step: 'Reading the card with Claude…', progress: null })
    return readWithClaude(image)
  }
  return readWithTesseract(image, onProgress)
}
