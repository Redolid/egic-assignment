import { AlertIcon, CheckIcon, CrossIcon } from '../../../components/ui/Icons'
import type { ReadCheck } from '../lib/cardFields'

const BADGE: Record<ReadCheck['status'], { label: string; className: string; Icon: typeof CheckIcon }> = {
  pass: { label: 'Pass', className: 'bg-pass-soft text-pass', Icon: CheckIcon },
  warn: { label: 'Check', className: 'bg-warn-soft text-warn', Icon: AlertIcon },
  fail: { label: 'Fail', className: 'bg-fail-soft text-fail', Icon: CrossIcon },
}

/** Each cross-check with its verdict, recomputed as values are corrected; a changed verdict presses in. */
export function ChecksTable({ checks }: { checks: ReadCheck[] }) {
  return (
    <ul aria-live="polite" className="divide-y divide-line rounded-[var(--radius-bend)] border border-line">
      {checks.map((check) => {
        const badge = BADGE[check.status]
        return (
          <li key={check.key} className="grid grid-cols-[5.25rem_minmax(0,1fr)] items-start gap-3 px-3.5 py-3">
            <span
              key={check.status}
              className={`inline-flex h-7 items-center justify-center gap-1 rounded-full text-xs font-semibold motion-safe:animate-[stamp_260ms_var(--ease-out)] ${badge.className}`}
            >
              <badge.Icon width={13} height={13} strokeWidth={2.6} />
              {badge.label}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-fg">{check.label}</span>
              <span className="figures block text-xs text-fg-muted">{check.detail}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
