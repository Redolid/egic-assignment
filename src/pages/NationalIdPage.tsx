import { useEffect, useMemo, useRef, useState } from 'react'
import { IdIllustration } from '../components/graphics/Illustrations'
import { SectionTitle } from '../components/layout/SectionTitle'
import { SheetHeader } from '../components/layout/SheetHeader'
import { Button } from '../components/ui/Button'
import { IdCardIcon, PackageIcon } from '../components/ui/Icons'
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

/**
 * The pipe between the document and the data: empty before a read, water flowing while the engine
 * works, full once the fields have arrived. Horizontal between the columns, vertical when stacked.
 */
function FlowConnector({ state }: { state: 'idle' | 'flowing' | 'full' }) {
  const water = state === 'idle' ? 'scale-0' : 'scale-100'
  return (
    <div aria-hidden="true" className="flex items-center justify-center xl:items-start xl:pt-28">
      <div className="pipe relative h-10 w-3 overflow-hidden xl:h-3 xl:w-full">
        <span
          className={`pipe-water absolute inset-0 origin-top transition-transform duration-700 ease-[var(--ease-out)] xl:origin-left ${water} ${
            state === 'flowing' ? 'motion-safe:animate-flow' : ''
          }`}
        />
      </div>
    </div>
  )
}

const ENGINE_PREFERENCE: ReaderEngine[] = ['local-model', 'tesseract']

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
      setScan({ status: 'error', message: 'Browser OCR reads photos only. Start the Local ML Model service (see README) to read PDFs.' })
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
        illustration={<IdIllustration className="h-auto w-full" />}
        cells={[
          { label: 'Engine', value: engineName(result?.engine ?? engine) },
          {
            label: 'Sides read',
            value: result ? result.sides.map((side) => (side.side === 'front' ? 'Front' : 'Back')).join(' · ') || '—' : '—',
          },
          { label: 'Checks', value: result ? `${passed} / ${checks.length} pass` : '—' },
        ]}
      />

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-2 xl:grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)] xl:gap-0">
        <section aria-labelledby="source-heading" className="panel flex min-w-0 flex-col gap-5 p-4 sm:p-5">
          <SectionTitle id="source-heading" icon={<IdCardIcon width={16} height={16} />}>
            Source document
          </SectionTitle>
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
            <span className="text-xs text-fg-muted">The sample is fictional. Flat, well-lit, upright photos read best.</span>
          </div>
        </section>

        <FlowConnector state={isProcessing ? 'flowing' : result ? 'full' : 'idle'} />

        <section aria-labelledby="data-heading" aria-busy={isProcessing} className="panel flex min-w-0 flex-col gap-5 p-4 sm:p-5">
          <SectionTitle
            id="data-heading"
            icon={<PackageIcon width={16} height={16} />}
            aside={
              result && (
                <span className="figures text-xs text-fg-muted">
                  {result.model} · {result.device} · <span className="whitespace-nowrap">{(result.elapsedMs / 1000).toFixed(1)} s</span>
                </span>
              )
            }
          >
            Extracted data
          </SectionTitle>

          {scan.status === 'processing' && (
            <div role="status" className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-fg">{scan.step}</p>
              <div className="pipe relative h-2.5 overflow-hidden">
                {scan.progress === null ? (
                  // Unknown duration (a single request): an honest indeterminate sweep, not fake percentages.
                  <div className="pipe-water absolute inset-y-0 w-1/3 motion-safe:animate-indeterminate motion-reduce:w-full motion-reduce:animate-pulse" />
                ) : (
                  <div
                    className="pipe-water h-full origin-left transition-transform duration-300 ease-[var(--ease-out)]"
                    style={{ transform: `scaleX(${scan.progress})` }}
                  />
                )}
              </div>
            </div>
          )}

          {scan.status === 'error' && (
            <p key={scan.message} role="alert" className="rounded-[var(--radius-fitting)] bg-fail-soft px-3.5 py-3 text-sm text-fail motion-safe:animate-reveal-down">
              {scan.message}
            </p>
          )}

          {result && result.warnings.length > 0 && (
            <div role="alert" className="rounded-[var(--radius-fitting)] bg-warn-soft px-3.5 py-3 text-sm text-warn motion-safe:animate-reveal-down">
              {result.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          )}

          {(scan.status === 'idle' || scan.status === 'processing' || scan.status === 'error') && !result ? (
            // Designed absence: the register of what will be extracted, before anything is read.
            <div className={isProcessing ? 'opacity-60' : ''}>
              <p className="mb-2 text-sm text-fg-muted">
                These fields are read from the card, numbered as they will be marked on it:
              </p>
              <ol className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {FIELD_ORDER.map((key, index) => (
                  <li key={key} className="flex items-center gap-3 rounded-[var(--radius-fitting)] bg-surface-2/70 px-3 py-2">
                    <span className="tag">{index + 1}</span>
                    <span className="text-sm font-medium text-fg">{FIELD_META[key].label}</span>
                    <span className="ml-auto text-[0.6875rem] text-fg-subtle">{FIELD_META[key].side === 'front' ? 'Front' : 'Back'}</span>
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
                <h3 className="mb-2 text-sm font-semibold text-fg">Cross-checks</h3>
                <ChecksTable checks={checks} />
              </div>

              {parsedId?.ok && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-fg">National number, decoded</h3>
                  {/* Keyed by the number: a newly valid ID replays the split so the change is noticed. */}
                  <IdStructure key={parsedId.info.id} info={parsedId.info} />
                </div>
              )}

              {result.rawText !== null && (
                <details className="text-xs text-fg-muted">
                  <summary className="cursor-pointer select-none font-semibold">Raw OCR text</summary>
                  <pre dir="rtl" className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded-[var(--radius-fitting)] bg-surface-2 p-3 font-sans">
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
