import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { SheetHeader } from '../components/layout/SheetHeader'
import { Button } from '../components/ui/Button'
import { ChecksTable } from '../features/national-id/components/ChecksTable'
import { DocumentView } from '../features/national-id/components/DocumentView'
import { EngineSelector } from '../features/national-id/components/EngineSelector'
import { ExtractedFields } from '../features/national-id/components/ExtractedFields'
import { IdStructure } from '../features/national-id/components/IdStructure'
import { deriveChecks, FIELD_META, FIELD_ORDER } from '../features/national-id/lib/cardFields'
import type { CardSideName, FieldKey, FieldValues } from '../features/national-id/lib/cardFields'
import { CardReadError, probeEngines, readCard } from '../features/national-id/lib/cardReader'
import { buildRows, engineName } from '../features/national-id/lib/fieldRows'
import type { CardReadResult, EngineStatus, ReaderEngine, ReadProgress } from '../features/national-id/lib/cardReader'
import { parseNationalId } from '../features/national-id/lib/nationalId'
import { ImageValidationError, isPdf, validateUpload } from '../features/national-id/lib/ocr'
import { createSampleCardFile } from '../features/national-id/lib/sampleCard'

type ScanState =
  | { status: 'idle' }
  | ({ status: 'processing' } & ReadProgress)
  | { status: 'done'; result: CardReadResult }
  | { status: 'error'; message: string }

function SectionTitle({ id, children, aside }: { id: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-ink-950 pb-2">
      <h2 id={id} className="sheet-title text-xl text-ink-950">
        {children}
      </h2>
      {aside}
    </div>
  )
}

const ENGINE_PREFERENCE: ReaderEngine[] = ['local-model', 'claude', 'tesseract']

export function NationalIdPage() {
  const [statuses, setStatuses] = useState<EngineStatus[] | null>(null)
  const [engine, setEngine] = useState<ReaderEngine>('local-model')
  // Once the user picks an engine, availability refreshes stop preselecting one for them.
  const engineChosen = useRef(false)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [scan, setScan] = useState<ScanState>({ status: 'idle' })
  const [values, setValues] = useState<FieldValues>({})
  const [activeKey, setActiveKey] = useState<FieldKey | null>(null)

  // Which engines can run here; the best available one is preselected until the user picks.
  useEffect(() => {
    let cancelled = false
    const refresh = () =>
      probeEngines().then((next) => {
        if (cancelled) return
        setStatuses(next)
        if (!engineChosen.current) {
          setEngine(ENGINE_PREFERENCE.find((e) => next.find((s) => s.engine === e)?.available) ?? 'tesseract')
        }
      })
    refresh()
    window.addEventListener('focus', refresh)
    return () => {
      cancelled = true
      window.removeEventListener('focus', refresh)
    }
  }, [])

  // Release the previous preview image from memory.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const run = async (target: File, url: string | null, withEngine: ReaderEngine) => {
    setScan({ status: 'processing', step: 'Preparing…', progress: null })
    try {
      const result = await readCard(withEngine, target, url, (progress) => setScan({ status: 'processing', ...progress }))
      const next: FieldValues = {}
      for (const side of [...result.sides].sort((a) => (a.side === 'front' ? -1 : 1))) {
        for (const field of side.fields) next[field.key] ??= field.value
      }
      setValues(next)
      setScan({ status: 'done', result })
    } catch (error) {
      const isKnown = error instanceof ImageValidationError || error instanceof CardReadError
      setScan({
        status: 'error',
        message: isKnown ? (error as Error).message : 'Something went wrong while reading the document. Please try again.',
      })
    }
  }

  const processFile = (next: File) => {
    try {
      validateUpload(next)
    } catch (error) {
      setScan({ status: 'error', message: (error as Error).message })
      return
    }
    const url = isPdf(next) ? null : URL.createObjectURL(next)
    setFile(next)
    setPreviewUrl(url)
    setValues({})
    setActiveKey(null)
    // Browser OCR can't read PDFs: fall back to the best engine that can, without overriding a usable choice.
    const usable = engine === 'tesseract' && isPdf(next) ? ENGINE_PREFERENCE.find((e) => e !== 'tesseract' && statuses?.find((s) => s.engine === e)?.available) : engine
    if (!usable) {
      setScan({ status: 'error', message: 'Browser OCR reads photos only. Start the local model service or add a Claude API key to read PDFs.' })
      return
    }
    if (usable !== engine) setEngine(usable)
    void run(next, url, usable)
  }

  const result = scan.status === 'done' ? scan.result : null
  const isProcessing = scan.status === 'processing'

  const rows = useMemo(() => {
    const fields = result ? result.sides.flatMap((side) => side.fields) : []
    return buildRows(fields, result ? ['name', 'nationalId'] : [...FIELD_ORDER])
  }, [result])
  const numberOf = (key: FieldKey) => rows.find((row) => row.key === key)?.number

  const idsBySide = useMemo(() => {
    const ids: Partial<Record<CardSideName, string>> = {}
    for (const side of result?.sides ?? []) {
      const id = side.fields.find((field) => field.key === 'nationalId')
      if (id) ids[side.side] = id.value
    }
    return ids
  }, [result])

  const checks = result ? deriveChecks(values, idsBySide) : []
  const parsedId = values.nationalId ? parseNationalId(values.nationalId) : null
  const passed = checks.filter((check) => check.status === 'pass').length

  return (
    <div>
      <SheetHeader
        title="National ID Reader"
        description="Read an Egyptian national ID from a photo or PDF scan — front, back, or both on one page. Every value stays editable, and the cross-checks re-run as you correct it."
        cells={[
          { label: 'Engine', value: engineName(result?.engine ?? engine) },
          {
            label: 'Sides read',
            value: result ? result.sides.map((side) => (side.side === 'front' ? 'Front' : 'Back')).join(' · ') || '—' : '—',
          },
          { label: 'Checks', value: result ? `${passed} / ${checks.length} pass` : '—' },
        ]}
      />

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-labelledby="source-heading" className="flex min-w-0 flex-col gap-5">
          <SectionTitle id="source-heading">Source document</SectionTitle>
          <EngineSelector
            statuses={statuses}
            value={engine}
            disabled={isProcessing}
            onChange={(next) => {
              setEngine(next)
              engineChosen.current = true
            }}
          />
          <DocumentView
            file={file}
            previewUrl={previewUrl}
            sides={result ? result.sides : null}
            scanning={isProcessing}
            disabled={isProcessing}
            numberOf={numberOf}
            activeKey={activeKey}
            onActivate={setActiveKey}
            onFile={processFile}
          />
          <div className="flex flex-wrap items-center gap-2">
            {file && result && result.engine !== engine && (
              <Button size="sm" onClick={() => void run(file, previewUrl, engine)} disabled={isProcessing}>
                Read again with {engineName(engine)}
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={async () => processFile(await createSampleCardFile())} disabled={isProcessing}>
              Try a sample card
            </Button>
            <span className="text-xs text-ink-600">The sample is fictional. Flat, well-lit, upright photos read best.</span>
          </div>
        </section>

        <section aria-labelledby="data-heading" aria-busy={isProcessing} className="flex min-w-0 flex-col gap-5">
          <SectionTitle
            id="data-heading"
            aside={
              result && (
                <span className="figures text-xs text-ink-600">
                  {result.model} · {result.device} · {(result.elapsedMs / 1000).toFixed(1)} s
                </span>
              )
            }
          >
            Extracted data
          </SectionTitle>

          {scan.status === 'processing' && (
            <div role="status" className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-ink-950">{scan.step}</p>
              <div className="relative h-1 overflow-hidden bg-ink-200">
                {scan.progress === null ? (
                  // Unknown duration (a single request): an honest indeterminate sweep, not fake percentages.
                  <div className="absolute inset-y-0 w-1/3 bg-cobalt-600 motion-safe:animate-indeterminate motion-reduce:w-full motion-reduce:animate-pulse" />
                ) : (
                  <div
                    className="h-full origin-left bg-cobalt-600 transition-transform duration-300 ease-[var(--ease-out)]"
                    style={{ transform: `scaleX(${scan.progress})` }}
                  />
                )}
              </div>
            </div>
          )}

          {scan.status === 'error' && (
            <p key={scan.message} role="alert" className="border-[1.5px] border-fail-600 bg-fail-50 px-3 py-2.5 text-sm text-fail-700 motion-safe:animate-reveal-down">
              {scan.message}
            </p>
          )}

          {result && result.warnings.length > 0 && (
            <div role="alert" className="border-[1.5px] border-caution-600 bg-caution-50 px-3 py-2.5 text-sm text-caution-700 motion-safe:animate-reveal-down">
              {result.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          )}

          {(scan.status === 'idle' || scan.status === 'processing' || scan.status === 'error') && !result ? (
            // Designed absence: the register of what will be extracted, before anything is read.
            <div className={isProcessing ? 'opacity-60' : ''}>
              <p className="mb-2 text-sm text-ink-600">
                These fields are read from the card, numbered as they will be marked on it:
              </p>
              <ol className="grid grid-cols-1 border-t border-ink-950 sm:grid-cols-2 sm:gap-x-6">
                {FIELD_ORDER.map((key, index) => (
                  <li key={key} className="flex items-center gap-3 border-b border-ink-200 py-2">
                    <span className="balloon text-ink-400">{index + 1}</span>
                    <span className="text-sm font-medium text-ink-900">{FIELD_META[key].label}</span>
                    <span className="ml-auto text-[0.6875rem] text-ink-500">{FIELD_META[key].side === 'front' ? 'Front' : 'Back'}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {result && (
            <>
              <ExtractedFields
                rows={rows}
                values={values}
                activeKey={activeKey}
                onActivate={setActiveKey}
                onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
              />

              <div>
                <h3 className="spec-label mb-2 !text-ink-950">Cross-checks</h3>
                <ChecksTable checks={checks} />
              </div>

              {parsedId?.ok && (
                <div>
                  <h3 className="spec-label mb-3 !text-ink-950">National number, decoded</h3>
                  {/* Keyed by the number: a newly valid ID replays the split so the change is noticed. */}
                  <IdStructure key={parsedId.info.id} info={parsedId.info} />
                </div>
              )}

              {result.rawText !== null && (
                <details className="text-xs text-ink-600">
                  <summary className="cursor-pointer select-none font-semibold">Raw OCR text</summary>
                  <pre dir="rtl" className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap border border-ink-200 bg-ink-50 p-3 font-sans">
                    {result.rawText.trim() || '(empty)'}
                  </pre>
                </details>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
