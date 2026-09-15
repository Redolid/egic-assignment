import Anthropic from '@anthropic-ai/sdk'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'
import type {
  ReadIdError,
  ReadIdRequest,
  ReadIdResponse,
  ReaderStatus,
} from '../src/features/national-id/lib/readerApi.ts'

const ENDPOINT = '/api/read-id'
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
/** Images are resized in the browser first; PDFs (≤10 MB) are sent as-is, base64 adds a third. */
const MAX_BODY_BYTES = 16 * 1024 * 1024

const SYSTEM_PROMPT = `You read Egyptian national ID cards (بطاقة تحقيق الشخصية) from photos or scans. A document may show the front, the back, or both sides.

Front side: the holder's full name in Arabic on two lines right of the photo (first name, then father's and family names; join them with one space), the address on the next one or two lines (join with " — "), the 14-digit national number at the bottom in Arabic-Indic digits, and a Latin card number such as "AB1234567" bottom-left.
Back side: the national number again at the top with the issue date (YYYY/MM), the profession/education lines, then gender (ذكر/أنثى), religion and marital status on one line, and "البطاقة سارية حتى" followed by the expiry date (YYYY/MM/DD).

Rules:
- Keep Arabic text exactly as printed. Convert every number and date to Western digits.
- National numbers: 14 digits, no spaces. The Arabic-Indic zero (٠) is a small dot - count it.
- Dates: issue_date as YYYY-MM, expiry_date as YYYY-MM-DD.
- gender is "male" or "female". religion and marital_status in English (e.g. "Muslim", "Christian", "Single", "Married", "Divorced", "Widowed").
- Return an empty string for anything not present or unreadable. Never guess digits.`

const str = { type: 'string' }
/** JSON schema for structured output — the API guarantees the reply matches it. */
const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    is_egyptian_id: { type: 'boolean' },
    front_found: { type: 'boolean' },
    back_found: { type: 'boolean' },
    name: str,
    address: str,
    national_id_front: str,
    card_number: str,
    national_id_back: str,
    job: str,
    gender: { type: 'string', enum: ['male', 'female', ''] },
    religion: str,
    marital_status: str,
    issue_date: str,
    expiry_date: str,
  },
  required: [
    'is_egyptian_id', 'front_found', 'back_found', 'name', 'address', 'national_id_front', 'card_number',
    'national_id_back', 'job', 'gender', 'religion', 'marital_status', 'issue_date', 'expiry_date',
  ],
  additionalProperties: false,
}

type ClaudeFields = Record<(typeof OUTPUT_SCHEMA.required)[number], string | boolean>

async function readIdCard(client: Anthropic, request: ReadIdRequest): Promise<ReadIdResponse> {
  const source =
    request.mediaType === 'application/pdf'
      ? ({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: request.data } } as const)
      : ({ type: 'image', source: { type: 'base64', media_type: request.mediaType, data: request.data } } as const)

  const response = await client.beta.messages.create({
    model: 'claude-opus-5',
    max_tokens: 16000,
    // Perception task: medium effort keeps the read fast without skipping verification.
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
    // If the model declines a request, the API retries it on Anthropic's recommended fallback model.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: [source, { type: 'text', text: 'Read every field present on this ID document.' }] }],
  })

  if (response.stop_reason === 'refusal') throw new Error('The model declined to read this document.')
  const text = response.content.find((block) => block.type === 'text')
  if (!text || text.type !== 'text') throw new Error('The model returned no data.')

  const d = JSON.parse(text.text) as ClaudeFields
  const s = (key: keyof ClaudeFields) => String(d[key] ?? '').trim()
  return {
    isEgyptianId: Boolean(d.is_egyptian_id),
    frontFound: Boolean(d.front_found),
    backFound: Boolean(d.back_found),
    name: s('name'),
    address: s('address'),
    nationalIdFront: s('national_id_front'),
    cardNumber: s('card_number'),
    nationalIdBack: s('national_id_back'),
    job: s('job'),
    gender: (s('gender') as ReadIdResponse['gender']) || '',
    religion: s('religion'),
    maritalStatus: s('marital_status'),
    issueDate: s('issue_date'),
    expiryDate: s('expiry_date'),
  }
}

function sendJson(res: ServerResponse, status: number, body: ReaderStatus | ReadIdResponse | ReadIdError) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    size += (chunk as Buffer).length
    if (size > MAX_BODY_BYTES) throw new RangeError('Body too large')
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks).toString('utf8')
}

function parseRequest(raw: string): ReadIdRequest | null {
  try {
    const body = JSON.parse(raw) as Partial<ReadIdRequest>
    if (typeof body.data !== 'string' || !body.data) return null
    const allowed: string[] = [...IMAGE_TYPES, 'application/pdf']
    if (!body.mediaType || !allowed.includes(body.mediaType)) return null
    return { data: body.data, mediaType: body.mediaType }
  } catch {
    return null
  }
}

function createHandler(apiKey: string | undefined): Connect.NextHandleFunction {
  const client = apiKey ? new Anthropic({ apiKey }) : null

  return async (req, res) => {
    if (req.method === 'GET') return sendJson(res, 200, { available: client !== null })
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })
    if (!client) return sendJson(res, 503, { error: 'ANTHROPIC_API_KEY is not configured on the server' })

    let request: ReadIdRequest | null
    try {
      request = parseRequest(await readBody(req))
    } catch {
      return sendJson(res, 413, { error: 'The file is too large.' })
    }
    if (!request) return sendJson(res, 400, { error: 'Expected { data: base64, mediaType: jpeg|png|webp|pdf }' })

    try {
      sendJson(res, 200, await readIdCard(client, request))
    } catch (error) {
      // Most specific first; the message shown to users never includes the API key or raw details.
      if (error instanceof Anthropic.AuthenticationError) {
        return sendJson(res, 500, { error: 'The server API key is invalid.' })
      }
      if (error instanceof Anthropic.RateLimitError) {
        return sendJson(res, 429, { error: 'Too many requests — please try again in a moment.' })
      }
      if (error instanceof Anthropic.BadRequestError) {
        return sendJson(res, 400, { error: 'The document could not be processed. Try a different photo or scan.' })
      }
      console.error('[read-id]', error)
      sendJson(res, 502, { error: 'Reading the card failed. Please try again.' })
    }
  }
}

/**
 * Adds `/api/read-id` to both `vite` (dev) and `vite preview`, so the project needs no separate
 * Node backend for Claude. The API key stays on the server and is never sent to the browser.
 */
export function idReaderPlugin(apiKey: string | undefined): Plugin {
  const handler = createHandler(apiKey)
  return {
    name: 'id-reader-api',
    configureServer(server) {
      server.middlewares.use(ENDPOINT, handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(ENDPOINT, handler)
    },
  }
}
