/** Contract between the browser and the `/api/read-id` endpoint (server/idReaderPlugin.ts). */

export const READ_ID_ENDPOINT = '/api/read-id'

/** GET /api/read-id */
export interface ReaderStatus {
  /** false when the server has no ANTHROPIC_API_KEY — the browser then uses Tesseract. */
  available: boolean
}

/** POST /api/read-id — body */
export interface ReadIdRequest {
  /** Base64 image data without the `data:` prefix. */
  image: string
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp'
}

/** POST /api/read-id — 200 response */
export interface ReadIdResponse {
  isIdCardFront: boolean
  /** Full name in Arabic as printed, or "" if unreadable. */
  name: string
  /** The 14 digits converted to 0-9, or "" if unreadable. */
  nationalId: string
}

/** POST /api/read-id — error response */
export interface ReadIdError {
  error: string
}
