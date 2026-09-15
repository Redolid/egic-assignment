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
const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp']
/** The browser resizes images to ≤1600px JPEG first, so real requests are far below this. */
const MAX_BODY_BYTES = 8 * 1024 * 1024

const SYSTEM_PROMPT = `You read photos of the FRONT side of Egyptian national ID cards (بطاقة تحقيق الشخصية).

Return:
- is_id_card_front: whether the image shows the front of an Egyptian national ID card.
- name: the holder's full name exactly as printed in Arabic. It is printed on two lines to the right of the photo: the first name, then the father's and family names below it. Join both lines with a single space. Do not include the address lines under the name.
- national_id: the 14-digit national number printed at the bottom of the card in Arabic-Indic digits. Convert it to Western digits 0-9, with no spaces. The Arabic-Indic zero (٠) is a small dot - count it as a digit.

If a field is unreadable or not present, return an empty string for it. Never guess digits.`

/** JSON schema for structured output — the API guarantees the reply matches it. */
const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    is_id_card_front: { type: 'boolean' },
    name: { type: 'string' },
    national_id: { type: 'string' },
  },
  required: ['is_id_card_front', 'name', 'national_id'],
  additionalProperties: false,
}

async function readIdCard(client: Anthropic, request: ReadIdRequest): Promise<ReadIdResponse> {
  const response = await client.beta.messages.create({
    model: 'claude-opus-5',
    max_tokens: 16000,
    // Simple perception task: medium effort keeps the scan fast without skipping verification.
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
    // If the model declines a request, the API retries it on Anthropic's recommended fallback model.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: request.mediaType, data: request.image } },
          { type: 'text', text: 'Extract the name and national ID from this card.' },
        ],
      },
    ],
  })

  if (response.stop_reason === 'refusal') throw new Error('The model declined to read this image.')

  const text = response.content.find((block) => block.type === 'text')
  if (!text || text.type !== 'text') throw new Error('The model returned no data.')

  const data = JSON.parse(text.text) as { is_id_card_front: boolean; name: string; national_id: string }
  return { isIdCardFront: data.is_id_card_front, name: data.name.trim(), nationalId: data.national_id.trim() }
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
    if (size > MAX_BODY_BYTES) throw new RangeError('Image is too large')
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks).toString('utf8')
}

function parseRequest(raw: string): ReadIdRequest | null {
  try {
    const body = JSON.parse(raw) as Partial<ReadIdRequest>
    if (typeof body.image !== 'string' || !body.image) return null
    if (!body.mediaType || !ALLOWED_MEDIA_TYPES.includes(body.mediaType)) return null
    return { image: body.image, mediaType: body.mediaType }
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
      return sendJson(res, 413, { error: 'The image is too large.' })
    }
    if (!request) return sendJson(res, 400, { error: 'Expected { image: base64, mediaType: jpeg|png|webp }' })

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
        return sendJson(res, 400, { error: 'The image could not be processed. Try a different photo.' })
      }
      console.error('[read-id]', error)
      sendJson(res, 502, { error: 'Reading the card failed. Please try again.' })
    }
  }
}

/**
 * Adds `/api/read-id` to both `vite` (dev) and `vite preview`, so the project needs no separate
 * backend. The API key stays on the server and is never sent to the browser.
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
