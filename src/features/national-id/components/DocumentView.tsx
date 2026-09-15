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

/** A light band sweeping over the document while it is being read. */
function ScanBeam() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="absolute inset-0 bg-cobalt-600/8" />
      <span className="absolute inset-x-0 -inset-y-1/2 motion-safe:animate-scan motion-reduce:animate-pulse">
        <span className="absolute inset-x-0 top-1/2 h-16 -translate-y-1/2 bg-gradient-to-b from-transparent via-cobalt-500/25 to-transparent" />
        <span className="absolute inset-x-0 top-1/2 h-px bg-white shadow-[0_0_10px_2px_rgb(29_91_198/0.8)]" />
      </span>
    </span>
  )
}

/**
 * The source document. Empty: a drop target. Reading: the upload under a scan beam. Read: each detected
 * card side with numbered balloons on the text the model located, cross-referenced to the fields table.
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
        className={`group flex min-h-80 cursor-pointer flex-col items-center justify-center border-2 border-dashed px-6 py-10 text-center transition-colors duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-cobalt-600 ${
          isDragOver ? 'border-cobalt-600 bg-cobalt-50' : 'border-ink-300 bg-white hover:border-ink-950'
        }`}
      >
        {picker}
        <span
          className={`grid h-12 w-12 place-items-center border-[1.5px] border-ink-950 text-ink-950 transition-transform duration-300 ease-[var(--ease-out)] ${
            isDragOver ? '-translate-y-1.5 bg-cobalt-600 text-white' : 'group-hover:-translate-y-0.5'
          }`}
        >
          <UploadIcon />
        </span>
        <span className="mt-4 text-base font-semibold text-ink-950">
          {isDragOver ? 'Drop to read the card' : 'Drop a photo or PDF scan of the ID card'}
        </span>
        <span className="mt-1 text-sm text-ink-600">or click to choose a file · front, back, or both sides on one page</span>
        <span className="mt-1 text-xs text-ink-500">JPG, PNG, WebP or PDF · up to 10 MB</span>
      </label>
    )
  }

  // Before a result: the upload itself (PDFs can't preview as an image, so they show as a sheet).
  if (!sides) {
    return (
      <label {...dragHandlers} className={`relative block cursor-pointer border-[1.5px] border-ink-950 bg-ink-50 ${disabled ? 'pointer-events-none' : ''}`}>
        {picker}
        {previewUrl ? (
          <span className="relative block">
            <img src={previewUrl} alt="Uploaded document" className={`block max-h-[34rem] w-full object-contain transition-[filter] duration-500 ${scanning ? 'saturate-50' : ''}`} />
            {scanning && <ScanBeam />}
          </span>
        ) : (
          <span className="relative flex min-h-80 flex-col items-center justify-center gap-2 overflow-hidden">
            <span className="grid h-20 w-16 place-items-end border-[1.5px] border-ink-950 bg-white p-1.5 text-[0.625rem] font-bold text-ink-950">PDF</span>
            <span className="max-w-[80%] truncate text-sm font-semibold text-ink-950">{file.name}</span>
            <span className="figures text-xs text-ink-600">{(file.size / 1024).toFixed(0)} KB</span>
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
          <figcaption className="mb-1.5 flex items-baseline justify-between">
            <span className="spec-label !text-ink-950">{SIDE_TITLE[side.side]}</span>
            <span className="figures text-xs text-ink-600">
              {side.fields.length} {side.fields.length === 1 ? 'field' : 'fields'} located
            </span>
          </figcaption>
          {side.image ? (
            <div className="relative border-[1.5px] border-ink-950 bg-ink-50" onMouseLeave={() => onActivate(null)}>
              <img src={side.image} alt={`${SIDE_TITLE[side.side]} as read`} className="block w-full" />
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
                      className={`absolute transition-[box-shadow,background-color] duration-200 focus-visible:outline-none ${
                        active ? 'bg-cobalt-600/12 shadow-[0_0_0_2px_var(--color-cobalt-600)]' : 'shadow-[0_0_0_1px_rgb(14_14_13/0.55)]'
                      }`}
                      style={{ left: `${x0 * 100}%`, top: `${y0 * 100}%`, width: `${(x1 - x0) * 100}%`, height: `${(y1 - y0) * 100}%` }}
                    >
                      <span
                        className={`balloon absolute -left-3 -top-3 !h-6 !w-6 text-[0.625rem] transition-colors duration-200 ${
                          active ? '!border-cobalt-600 !bg-cobalt-600 text-white' : 'text-ink-950'
                        }`}
                      >
                        {number}
                      </span>
                    </button>
                  )
                })}
            </div>
          ) : (
            <div className="border border-dashed border-ink-300 px-4 py-6 text-sm text-ink-600">
              Read from the uploaded {file.type === 'application/pdf' ? 'PDF' : 'image'}; this engine does not locate text on the card.
            </div>
          )}
        </figure>
      ))}
      <label className="self-start">
        {picker}
        <span className="cursor-pointer text-sm font-semibold text-cobalt-600 underline-offset-4 hover:underline">Read another document…</span>
      </label>
    </div>
  )
}
