import { useState } from 'react'
import type { DragEvent } from 'react'
import { UploadIcon } from '../../../components/ui/Icons'

interface ImageDropzoneProps {
  previewUrl: string | null
  disabled: boolean
  /** The card is being read: sweeps a scan line over the preview. */
  scanning: boolean
  onFile: (file: File) => void
}

/** Click to pick, or drag & drop, an image. Shows the selected image as a preview. */
export function ImageDropzone({ previewUrl, disabled, scanning, onFile }: ImageDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    const file = event.dataTransfer.files[0]
    if (file && !disabled) onFile(file)
  }

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`group relative flex min-h-64 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed p-4 text-center transition-[border-color,background-color,box-shadow] duration-200 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-100 ${
        isDragOver
          ? 'border-brand-500 bg-brand-50 shadow-[inset_0_0_0_6px_rgb(217_234_255/0.8)]'
          : 'border-slate-300 bg-white hover:border-brand-500'
      } ${disabled ? 'pointer-events-none' : ''}`}
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onFile(file)
          event.target.value = '' // allow picking the same file again
        }}
      />
      {previewUrl ? (
        <>
          <span className="relative inline-block overflow-hidden rounded-lg shadow-[0_10px_24px_-14px_rgb(15_23_42/0.5)]">
            <img
              src={previewUrl}
              alt="Selected ID card"
              className={`block max-h-80 object-contain transition-[filter] duration-500 ${scanning ? 'saturate-50' : ''}`}
            />
            {scanning && (
              <span aria-hidden="true" className="pointer-events-none absolute inset-0">
                {/* Tint + a luminous band travelling over the card: the image is being read right now. */}
                <span className="absolute inset-0 bg-brand-600/10" />
                <span className="absolute inset-x-0 -inset-y-1/2 motion-safe:animate-scan motion-reduce:animate-pulse">
                  <span className="absolute inset-x-0 top-1/2 h-20 -translate-y-1/2 bg-gradient-to-b from-transparent via-brand-500/25 to-transparent" />
                  <span className="absolute inset-x-0 top-1/2 h-px bg-white/90 shadow-[0_0_12px_2px_rgb(47_124_246/0.8)]" />
                </span>
              </span>
            )}
          </span>
          <span className="mt-3 text-xs text-slate-500">
            {scanning ? 'Reading the card…' : 'Click or drop another image to replace'}
          </span>
        </>
      ) : (
        <>
          <span
            className={`grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-transform duration-300 ease-[var(--ease-out)] group-hover:-translate-y-0.5 ${
              isDragOver ? '-translate-y-1.5 scale-110' : ''
            }`}
          >
            <UploadIcon />
          </span>
          <span className="mt-3 font-medium text-slate-800">
            {isDragOver ? 'Drop the image to read it' : 'Upload the front of the ID card'}
          </span>
          <span className="mt-1 text-sm text-slate-500">Click to choose, or drag an image here</span>
          <span className="mt-1 text-xs text-slate-400">JPG, PNG or WebP · up to 10 MB</span>
        </>
      )}
    </label>
  )
}
