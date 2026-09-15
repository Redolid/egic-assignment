import { createWorker } from 'tesseract.js'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const MIN_WIDTH = 400
/** Tesseract reads best when text is ~30px+ high; a card scaled to this width gets there. */
const OCR_WIDTH = 1800

export class ImageValidationError extends Error {}

/** Cheap checks before decoding the file. */
export function validateImageFile(file: File): void {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new ImageValidationError('Please upload a JPG, PNG or WebP image.')
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new ImageValidationError('The image is larger than 10 MB. Please upload a smaller photo.')
  }
}

/** Decodes the image and rejects ones too small to read. */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      if (image.naturalWidth < MIN_WIDTH) {
        reject(
          new ImageValidationError(
            `The image is too small (${image.naturalWidth}px wide). Use a photo at least ${MIN_WIDTH}px wide.`,
          ),
        )
      } else {
        resolve(image)
      }
    }
    image.onerror = () => reject(new ImageValidationError('The file could not be read as an image.'))
    image.src = url
  })
}

/** Draws the image scaled to `width`, optionally through a CSS filter. */
export function drawScaled(image: HTMLImageElement, width: number, filter = 'none'): HTMLCanvasElement {
  const scale = width / image.naturalWidth
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width)
  canvas.height = Math.round(image.naturalHeight * scale)

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is not supported in this browser.')
  context.filter = filter
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas
}

/**
 * Prepares a canvas for Tesseract: a consistent width and high-contrast grayscale
 * (colour backgrounds and the card's security pattern hurt recognition).
 */
export const prepareForTesseract = (image: HTMLImageElement) =>
  drawScaled(image, OCR_WIDTH, 'grayscale(1) contrast(1.4)')

/**
 * Runs Tesseract with the Arabic model entirely in the browser (fallback engine).
 * The worker, WASM core and Arabic language data (a few MB) download from jsDelivr on first use
 * and are cached by the browser afterwards. A worker is created per scan and terminated
 * afterwards: scans are rare, so keeping a worker alive isn't worth the memory.
 */
export async function recognizeArabicText(
  image: HTMLCanvasElement,
  onProgress: (progress: number) => void,
): Promise<string> {
  const worker = await createWorker('ara', undefined, {
    logger: ({ status, progress }) => {
      if (status === 'recognizing text') onProgress(progress)
    },
  })
  try {
    const { data } = await worker.recognize(image)
    return data.text
  } finally {
    await worker.terminate()
  }
}
