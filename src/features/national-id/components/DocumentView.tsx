import { useState } from 'react'
import type { DragEvent } from 'react'
import { UploadIcon } from '../../../components/ui/Icons'
import type { CardSide, FieldKey } from '../lib/cardFields'

interface DocumentViewProps {
  file: File | null
  previewUrl: string | null
  /** Sides returned by the engine (with images and located fields), once read. */
  sides: CardSide[] | null
  scanning: boolean
  disabled: boolean
  numberOf: (key: FieldKey) => number | undefined
  activeKey: FieldKey | null
  onActivate: (key: FieldKey | null) => void
  onFile: (file: File) => void
}

const SIDE_TITLE = { front: 'Front side', back: 'Back side' } as const

/** A band of the tool's colour sweeping over the document while it is being read. */
function ScanBeam() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <span className="absolute inset-0 bg-accent-soft" />
      <span className="absolute inset-x-0 -inset-y-1/2 motion-safe:animate-scan motion-reduce:animate-pulse">
        <span className="absolute inset-x-0 top-1/2 h-20 -translate-y-1/2 bg-gradient-to-b from-transparent via-accent/30 to-transparent" />
        <span className="absolute inset-x-0 top-1/2 h-0.5 rounded-full bg-accent" />
      </span>
    </span>
  )
}

/**
 * The source document. Empty: a drop target. Reading: the upload under a scan beam. Read: each detected
 * card side with numbered tags on the text the model located, cross-referenced to the fields table.
 */
export function DocumentView({ file, previewUrl, sides, scanning, disabled, numberOf, activeKey, onActivate, onFile }: DocumentViewProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    const dropped = event.dataTransfer.files[0]
    if (dropped && !disabled) onFile(dropped)
  }

  const picker = (
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp,application/pdf"
      className="sr-only"
      disabled={disabled}
      onChange={(event) => {
        const picked = event.target.files?.[0]
        if (picked) onFile(picked)
        event.target.value = '' // allow picking the same file again
      }}
    />
  )

  const dragHandlers = {
    onDragOver: (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      if (!disabled) setIsDragOver(true)
    },
    onDragLeave: () => setIsDragOver(false),
    onDrop: handleDrop,
  }

  if (!file) {
    return (
      <label
        {...dragHandlers}
        className={`group flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-[var(--radius-bend)] border-2 border-dashed px-6 py-10 text-center transition-colors duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
          isDragOver ? 'border-accent bg-accent-soft' : 'border-line-strong bg-surface-2/50 hover:border-accent hover:bg-accent-soft'
        }`}
      >
        {picker}
        <span
          className={`grid h-14 w-14 place-items-center rounded-full transition-[translate,background-color,color] duration-300 ease-[var(--ease-out)] ${
            isDragOver ? '-translate-y-1.5 bg-accent text-on-accent' : 'bg-accent-soft text-accent-strong group-hover:-translate-y-0.5'
          }`}
        >
          <UploadIcon />
        </span>
        <span className="mt-4 text-base font-semibold text-fg">
          {isDragOver ? 'Drop to read the card' : 'Drop a photo or PDF scan of the ID card'}
        </span>
        <span className="mt-1 text-sm text-fg-muted">or click to choose a file · front, back, or both sides on one page</span>
        <span className="mt-1 text-xs text-fg-subtle">JPG, PNG, WebP or PDF · up to 10 MB</span>
      </label>
    )
  }

  // Before a result: the upload itself (PDFs can't preview as an image, so they show as a document chip).
  if (!sides) {
    return (
      <label
        {...dragHandlers}
        className={`relative block cursor-pointer overflow-hidden rounded-[var(--radius-bend)] border border-line bg-surface-2 ${disabled ? 'pointer-events-none' : ''}`}
      >
        {picker}
        {previewUrl ? (
          <span className="relative block">
            <img
              src={previewUrl}
              alt="Uploaded document"
              className={`block max-h-[34rem] w-full object-contain transition-[filter] duration-500 ${scanning ? 'saturate-50' : ''}`}
            />
            {scanning && <ScanBeam />}
          </span>
        ) : (
          <span className="relative flex min-h-72 flex-col items-center justify-center gap-2">
            <span className="grid h-20 w-16 place-items-end rounded-[var(--radius-fitting)] border border-line bg-surface p-1.5 text-[0.625rem] font-semibold text-accent-strong shadow-panel">
              PDF
            </span>
            <span className="max-w-[80%] truncate text-sm font-semibold text-fg">{file.name}</span>
            <span className="figures text-xs text-fg-muted">{(file.size / 1024).toFixed(0)} KB</span>
            {scanning && <ScanBeam />}
          </span>
        )}
      </label>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {sides.map((side) => (
        <figure key={side.side} className="motion-safe:animate-reveal-down">
          <figcaption className="mb-2 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-fg">{SIDE_TITLE[side.side]}</span>
            <span className="figures text-xs text-fg-muted">
              {side.fields.length} {side.fields.length === 1 ? 'field' : 'fields'} located
            </span>
          </figcaption>
          {side.image ? (
            <div className="relative rounded-[var(--radius-bend)] border border-line bg-surface-2 p-1.5" onMouseLeave={() => onActivate(null)}>
              <div className="relative">
                <img src={side.image} alt={`${SIDE_TITLE[side.side]} as read`} className="block w-full rounded-[var(--radius-fitting)]" />
                {side.fields
                  .filter((field) => field.box)
                  .map((field, index) => {
                    const [x0, y0, x1, y1] = field.box!
                    const number = numberOf(field.key)
                    const active = activeKey === field.key
                    return (
                      <button
                        key={`${field.key}-${index}`}
                        type="button"
                        aria-label={`Field ${number}: ${field.key}`}
                        onMouseEnter={() => onActivate(field.key)}
                        onFocus={() => onActivate(field.key)}
                        onBlur={() => onActivate(null)}
                        className={`absolute rounded-md transition-[box-shadow,background-color] duration-200 focus-visible:outline-none ${
                          active ? 'bg-accent/15 shadow-[0_0_0_2px_var(--accent)]' : 'shadow-[0_0_0_1.5px_var(--accent)]'
                        }`}
                        style={{ left: `${x0 * 100}%`, top: `${y0 * 100}%`, width: `${(x1 - x0) * 100}%`, height: `${(y1 - y0) * 100}%` }}
                      >
                        {/* Solid tag so it stays legible on the photo in both themes. */}
                        <span
                          data-active={active}
                          className={`tag absolute -left-3 -top-3 shadow-panel ${active ? '' : '!bg-surface !text-accent-strong'}`}
                        >
                          {number}
                        </span>
                      </button>
                    )
                  })}
              </div>
            </div>
          ) : (
            <div className="rounded-[var(--radius-fitting)] border border-dashed border-line-strong px-4 py-5 text-sm text-fg-muted">
              Read from the uploaded {file.type === 'application/pdf' ? 'PDF' : 'image'}; this engine does not locate text on the card.
            </div>
          )}
        </figure>
      ))}
      <label className="self-start">
        {picker}
        <span className="cursor-pointer text-sm font-medium text-accent-strong underline-offset-4 hover:underline">Read another document…</span>
      </label>
    </div>
  )
}
