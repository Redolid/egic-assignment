import { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import { IdResult } from '../features/national-id/components/IdResult'
import { ImageDropzone } from '../features/national-id/components/ImageDropzone'
import { CardReadError, readCard } from '../features/national-id/lib/cardReader'
import type { ReaderEngine, ReadProgress } from '../features/national-id/lib/cardReader'
import { ImageValidationError, validateImageFile } from '../features/national-id/lib/ocr'
import { createSampleCardFile } from '../features/national-id/lib/sampleCard'

type ScanState =
  | { status: 'idle' }
  | ({ status: 'processing' } & ReadProgress)
  | { status: 'done'; engine: ReaderEngine; rawText: string | null; warnings: string[] }
  | { status: 'error'; message: string }

const ENGINE_LABEL: Record<ReaderEngine, string> = {
  claude: 'Read by Claude (vision)',
  tesseract: 'Read on this device (Tesseract OCR)',
}

export function NationalIdPage() {
  const [scan, setScan] = useState<ScanState>({ status: 'idle' })
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [nationalId, setNationalId] = useState('')

  // Release the previous preview image from memory.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const processFile = async (file: File) => {
    try {
      validateImageFile(file)
    } catch (error) {
      setScan({ status: 'error', message: (error as Error).message })
      return
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setName('')
    setNationalId('')

    try {
      const result = await readCard(url, (progress) => setScan({ status: 'processing', ...progress }))

      const warnings: string[] = []
      if (result.notAnIdCard) warnings.push('This image does not look like the front of an Egyptian ID card.')
      if (!result.name) warnings.push('The name could not be found — please type it in.')
      if (!result.nationalId) warnings.push('The national ID could not be found — please type it in.')

      setName(result.name ?? '')
      setNationalId(result.nationalId ?? '')
      setScan({ status: 'done', engine: result.engine, rawText: result.rawText, warnings })
    } catch (error) {
      const isKnown = error instanceof ImageValidationError || error instanceof CardReadError
      setScan({
        status: 'error',
        message: isKnown ? (error as Error).message : 'Something went wrong while reading the image. Please try again.',
      })
    }
  }

  const trySample = async () => processFile(await createSampleCardFile())

  const isProcessing = scan.status === 'processing'

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Egyptian National ID Reader</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Upload a photo of the front of an ID card to extract the name and national ID, and decode the information
          embedded in the ID number.
        </p>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2 lg:items-start">
        <section className="flex flex-col gap-3" aria-label="Image">
          <ImageDropzone previewUrl={previewUrl} disabled={isProcessing} scanning={isProcessing} onFile={processFile} />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>Tip: a flat, well-lit, straight photo of the card gives the best results.</span>
            <Button variant="secondary" size="sm" onClick={trySample} disabled={isProcessing}>
              Try a sample card
            </Button>
          </div>
        </section>

        <section
          aria-label="Result"
          aria-busy={isProcessing}
          className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-slate-900">Extracted data</h2>
            {scan.status === 'done' && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {ENGINE_LABEL[scan.engine]}
              </span>
            )}
          </div>

          {scan.status === 'idle' && <p className="text-sm text-slate-500">Upload an image to get started.</p>}

          {scan.status === 'processing' && (
            <div role="status" className="flex flex-col gap-2">
              <p className="text-sm font-medium text-slate-700">{scan.step}</p>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-100">
                {scan.progress === null ? (
                  // Unknown duration (a single API call): an honest indeterminate sweep, not fake percentages.
                  <div className="absolute inset-y-0 w-1/3 rounded-full bg-brand-500 motion-safe:animate-indeterminate motion-reduce:w-full motion-reduce:animate-pulse" />
                ) : (
                  <div
                    className="h-full origin-left rounded-full bg-brand-500 transition-transform duration-300 ease-[var(--ease-out)]"
                    style={{ transform: `scaleX(${scan.progress})` }}
                  />
                )}
              </div>
            </div>
          )}

          {scan.status === 'error' && (
            <p key={scan.message} role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-100 motion-safe:animate-reveal-down">
              {scan.message}
            </p>
          )}

          {scan.status === 'done' && (
            <div className="flex flex-col gap-4">
              {scan.warnings.length > 0 ? (
                <div role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-100 motion-safe:animate-reveal-down">
                  {scan.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                  <p className="mt-1 text-xs">Make sure the photo shows the front of the card, is in focus and not rotated.</p>
                </div>
              ) : (
                <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 ring-1 ring-emerald-100 motion-safe:animate-reveal-down">
                  Data extracted. Please double-check it — you can correct any field below.
                </p>
              )}
              {scan.engine === 'tesseract' && (
                <p className="text-xs text-slate-500">
                  On-device OCR is used because no Claude API key is configured, and it often misreads Arabic-Indic
                  digits. Add <code className="rounded bg-slate-100 px-1">ANTHROPIC_API_KEY</code> for accurate
                  results (see README).
                </p>
              )}
              <IdResult
                name={name}
                nationalId={nationalId}
                onNameChange={setName}
                onNationalIdChange={setNationalId}
              />
              {scan.rawText !== null && (
                <details className="text-xs text-slate-500">
                  <summary className="cursor-pointer select-none">Show raw OCR text</summary>
                  <pre dir="rtl" className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-sans">
                    {scan.rawText.trim() || '(empty)'}
                  </pre>
                </details>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
