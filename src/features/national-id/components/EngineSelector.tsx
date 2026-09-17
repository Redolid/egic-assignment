import type { EngineStatus, ReaderEngine } from '../lib/cardReader'
import { ENGINE_NAMES } from '../lib/fieldRows'

interface EngineSelectorProps {
  statuses: EngineStatus[] | null
  value: ReaderEngine
  disabled: boolean
  onChange: (engine: ReaderEngine) => void
}

/** Reading engine as option tiles: availability is shown, not hidden behind a menu. */
export function EngineSelector({ statuses, value, disabled, onChange }: EngineSelectorProps) {
  const engines: ReaderEngine[] = ['local-model', 'tesseract']

  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="label mb-2">Reading engine</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {engines.map((engine) => {
          const status = statuses?.find((s) => s.engine === engine)
          const available = status?.available ?? false
          const checked = value === engine
          return (
            <label
              key={engine}
              className={`relative flex cursor-pointer flex-col gap-0.5 rounded-[var(--radius-fitting)] border px-3.5 py-3 transition-[background-color,border-color,box-shadow] duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                checked
                  ? 'border-accent bg-accent-soft ring-1 ring-accent'
                  : available
                    ? 'border-line bg-surface hover:border-line-strong'
                    : 'cursor-not-allowed border-line bg-surface-2/60 text-fg-subtle'
              }`}
            >
              <input type="radio" name="engine" className="sr-only" checked={checked} disabled={!available} onChange={() => onChange(engine)} />
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    status === undefined ? 'animate-pulse bg-line-strong' : available ? 'bg-pass shadow-[0_0_0_3px_var(--pass-soft)]' : 'bg-line-strong'
                  }`}
                />
                <span className={checked ? 'text-accent-strong' : available ? 'text-fg' : ''}>{ENGINE_NAMES[engine].name}</span>
              </span>
              <span className="text-[0.6875rem] text-fg-muted">{ENGINE_NAMES[engine].kind}</span>
              <span className={`text-[0.6875rem] ${available ? 'text-fg-muted' : 'text-fg-subtle'}`}>{status?.detail ?? 'Checking…'}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
