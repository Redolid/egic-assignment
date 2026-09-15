import type { EngineStatus, ReaderEngine } from '../lib/cardReader'
import { ENGINE_NAMES } from '../lib/fieldRows'

interface EngineSelectorProps {
  statuses: EngineStatus[] | null
  value: ReaderEngine
  disabled: boolean
  onChange: (engine: ReaderEngine) => void
}

/** Reading engine as a row of register cells: availability is shown, not hidden behind a menu. */
export function EngineSelector({ statuses, value, disabled, onChange }: EngineSelectorProps) {
  const engines: ReaderEngine[] = ['local-model', 'claude', 'tesseract']

  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="spec-label mb-2">Reading engine</legend>
      <div className="grid grid-cols-1 border border-ink-950 sm:grid-cols-3">
        {engines.map((engine) => {
          const status = statuses?.find((s) => s.engine === engine)
          const available = status?.available ?? false
          const checked = value === engine
          return (
            <label
              key={engine}
              className={`relative flex cursor-pointer flex-col gap-0.5 border-ink-200 px-3 py-2.5 transition-colors duration-150 not-first:border-t has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-cobalt-600 sm:not-first:border-l sm:not-first:border-t-0 ${
                checked ? 'bg-ink-950 text-white' : available ? 'hover:bg-ink-50' : 'cursor-not-allowed text-ink-400'
              }`}
            >
              <input
                type="radio"
                name="engine"
                className="sr-only"
                checked={checked}
                disabled={!available}
                onChange={() => onChange(engine)}
              />
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    status === undefined ? 'animate-pulse bg-ink-300' : available ? 'bg-pass-600' : checked ? 'bg-ink-500' : 'bg-ink-300'
                  }`}
                />
                {ENGINE_NAMES[engine].name}
              </span>
              <span className={`text-[0.6875rem] ${checked ? 'text-ink-300' : 'text-ink-600'}`}>{ENGINE_NAMES[engine].kind}</span>
              <span className={`text-[0.6875rem] ${checked ? 'text-ink-300' : available ? 'text-ink-600' : 'text-ink-400'}`}>
                {status?.detail ?? 'Checking…'}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
