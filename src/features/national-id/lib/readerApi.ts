/** Contract between the browser and the `/api/read-id` Claude endpoint (server/idReaderPlugin.ts). */

export const READ_ID_ENDPOINT = '/api/read-id'

/** GET /api/read-id */
export interface ReaderStatus {
  /** false when the server has no ANTHROPIC_API_KEY. */
  available: boolean
}

export type UploadMediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf'

/** POST /api/read-id — body */
export interface ReadIdRequest {
  /** Base64 file data without the `data:` prefix. */
  data: string
  mediaType: UploadMediaType
}

/** POST /api/read-id — 200 response. Empty strings mean "not present or unreadable". */
export interface ReadIdResponse {
  isEgyptianId: boolean
  frontFound: boolean
  backFound: boolean
  name: string
  address: string
  nationalIdFront: string
  cardNumber: string
  nationalIdBack: string
  job: string
  gender: 'male' | 'female' | ''
  religion: string
  maritalStatus: string
  /** YYYY-MM */
  issueDate: string
  /** YYYY-MM-DD */
  expiryDate: string
}

/** POST /api/read-id — error response */
export interface ReadIdError {
  error: string
}
