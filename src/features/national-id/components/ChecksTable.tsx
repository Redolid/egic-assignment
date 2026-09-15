import type { ReadCheck } from '../lib/cardFields'

const STAMP: Record<ReadCheck['status'], { label: string; className: string }> = {
  pass: { label: 'Pass', className: 'border-pass-600 text-pass-700' },
  warn: { label: 'Check', className: 'border-caution-600 text-caution-700' },
  fail: { label: 'Fail', className: 'border-fail-600 text-fail-700' },
}

/** Inspection record: each cross-check with a stamped verdict, recomputed as values are corrected. */
export function ChecksTable({ checks }: { checks: ReadCheck[] }) {
  return (
    <ul aria-live="polite" className="border-t border-ink-950">
      {checks.map((check) => {
        const stamp = STAMP[check.status]
        return (
          <li key={check.key} className="grid grid-cols-[4.25rem_minmax(0,1fr)] items-start gap-3 border-b border-ink-200 py-2.5">
            <span
              key={check.status}
              className={`inline-flex h-6 items-center justify-center border-[1.5px] text-[0.6875rem] font-bold uppercase tracking-[0.08em] motion-safe:animate-[stamp_260ms_var(--ease-out)] ${stamp.className}`}
            >
              {stamp.label}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink-950">{check.label}</span>
              <span className="figures block text-xs text-ink-600">{check.detail}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
