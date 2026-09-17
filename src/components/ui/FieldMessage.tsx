import { useState } from 'react'

interface FieldMessageProps {
  id: string
  message: string | null | undefined
  align?: 'start' | 'end'
  /** Announce changes immediately (inline editors); forms announce via aria-describedby on focus. */
  live?: boolean
}

/**
 * Validation message that opens beneath its field (grid-row height reveal) and folds away when
 * resolved, keeping the last text during the exit so it doesn't blink empty.
 */
export function FieldMessage({ id, message, align = 'start', live = false }: FieldMessageProps) {
  const [lastMessage, setLastMessage] = useState(message)
  if (message && message !== lastMessage) setLastMessage(message)
  const open = Boolean(message)

  return (
    <div
      aria-hidden={!open}
      className={`grid transition-[grid-template-rows] ${
        open ? 'grid-rows-[1fr] duration-200 ease-[var(--ease-out)]' : 'grid-rows-[0fr] duration-150 ease-[var(--ease-in)]'
      }`}
    >
      <div className="min-h-0 overflow-hidden">
        <p
          id={id}
          role={live ? 'alert' : undefined}
          className={`flex items-start gap-1.5 pt-1 text-xs font-medium text-fail transition-[translate,opacity] duration-200 ease-[var(--ease-out)] ${
            align === 'end' ? 'justify-end text-right' : ''
          } ${open ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'}`}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0">
            <circle cx="8" cy="8" r="7" fill="currentColor" />
            <path d="M8 4.6v4" stroke="var(--surface)" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="8" cy="11.2" r=".95" fill="var(--surface)" />
          </svg>
          {lastMessage}
        </p>
      </div>
    </div>
  )
}
