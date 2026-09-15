import { toArabicDigits } from './nationalId'

/** Fictional data — lets the page be tried without uploading a real (personal) ID card. */
export const SAMPLE_CARD = {
  firstName: 'محمد',
  restOfName: 'أحمد علي حسن',
  addressLine1: '١٢ شارع التحرير',
  addressLine2: 'الدقي - الجيزة',
  nationalId: '29001010123456',
}

const ARABIC_FONT = '"Segoe UI", Tahoma, "Noto Naskh Arabic", "Geeza Pro", Arial, sans-serif'

/** Draws a simplified front side of an Egyptian ID card and returns it as a PNG file. */
export async function createSampleCardFile(): Promise<File> {
  const width = 1000
  const height = 630
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not supported in this browser.')

  // Card background with a soft gradient, like the real card.
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#eef3f8')
  gradient.addColorStop(1, '#f7efe3')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Photo placeholder.
  ctx.fillStyle = '#c9d3de'
  ctx.fillRect(50, 150, 230, 290)
  ctx.fillStyle = '#9aa8b7'
  ctx.beginPath()
  ctx.arc(165, 250, 60, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(85, 330, 160, 110)

  ctx.direction = 'rtl'
  ctx.textAlign = 'right'
  ctx.fillStyle = '#1f2937'
  const right = width - 60

  ctx.font = `600 34px ${ARABIC_FONT}`
  ctx.fillText('جمهورية مصر العربية', right, 70)
  ctx.fillText('بطاقة تحقيق الشخصية', right, 118)

  ctx.font = `700 48px ${ARABIC_FONT}`
  ctx.fillText(SAMPLE_CARD.firstName, right, 215)
  ctx.fillText(SAMPLE_CARD.restOfName, right, 285)

  ctx.font = `500 38px ${ARABIC_FONT}`
  ctx.fillText(SAMPLE_CARD.addressLine1, right, 365)
  ctx.fillText(SAMPLE_CARD.addressLine2, right, 425)

  ctx.font = `700 58px ${ARABIC_FONT}`
  ctx.fillText(toArabicDigits(SAMPLE_CARD.nationalId), right, 540)

  ctx.direction = 'ltr'
  ctx.textAlign = 'left'
  ctx.font = `500 18px ${ARABIC_FONT}`
  ctx.fillStyle = '#b91c1c'
  ctx.fillText('SAMPLE', 50, 600)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not create the sample image.')
  return new File([blob], 'sample-egyptian-id.png', { type: 'image/png' })
}
