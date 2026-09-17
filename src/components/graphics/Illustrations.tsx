import type { SVGProps } from 'react'

/*
 * Flat pipe-run illustrations, drawn for this toolkit (no external assets).
 * Colours come from theme tokens, so every drawing follows light/dark and the active tool's pipe colour.
 * Pipes are steel with the tool's water inside; decorative, so hidden from assistive tech.
 */

type Props = SVGProps<SVGSVGElement>

const steel = 'var(--pipe-steel)'
const water = 'var(--accent)'
const soft = 'var(--accent-soft)'
const surface = 'var(--surface)'
const line = 'var(--line-strong)'
const ink = 'var(--fg)'

/** The toolkit mark: a pipe elbow with a drop at its outlet. */
export function EgicMark(props: Props) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path d="M8 9h7a6 6 0 0 1 6 6v3" fill="none" stroke="var(--on-accent)" strokeWidth="4" strokeLinecap="round" />
      <path d="M21 21.5c0 0-2.6 3-2.6 4.6a2.6 2.6 0 0 0 5.2 0c0-1.6-2.6-4.6-2.6-4.6Z" fill="var(--on-accent)" />
    </svg>
  )
}

/** Pricing: parts flow down a supply line into a vehicle. */
export function PricingIllustration(props: Props) {
  return (
    <svg viewBox="0 0 260 150" aria-hidden="true" {...props}>
      <ellipse cx="170" cy="132" rx="82" ry="9" fill={soft} />
      {/* supply pipe with a valve */}
      <path d="M14 36h70a20 20 0 0 1 20 20v26" fill="none" stroke={steel} strokeWidth="14" strokeLinecap="round" />
      <path d="M14 36h70a20 20 0 0 1 20 20v26" fill="none" stroke={water} strokeWidth="6" strokeLinecap="round" strokeDasharray="10 8" className="motion-safe:animate-[dash_1.4s_linear_infinite]" />
      <rect x="40" y="22" width="18" height="28" rx="5" fill={surface} stroke={line} strokeWidth="2" />
      <path d="M49 22v-8M42 14h14" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      {/* parts falling */}
      <rect x="95" y="90" width="18" height="18" rx="4" fill={water} opacity="0.9" transform="rotate(-12 104 99)" />
      <rect x="112" y="72" width="14" height="14" rx="3.5" fill={soft} stroke={water} strokeWidth="2" transform="rotate(10 119 79)" />
      {/* vehicle */}
      <path
        d="M128 116v-18l16-22h58l20 22h12a8 8 0 0 1 8 8v10a4 4 0 0 1-4 4H132a4 4 0 0 1-4-4Z"
        fill={surface}
        stroke={ink}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M150 80h22v18h-34Zm30 0h20l14 18h-34Z" fill={soft} />
      <circle cx="152" cy="120" r="12" fill={ink} />
      <circle cx="152" cy="120" r="4.5" fill={surface} />
      <circle cx="214" cy="120" r="12" fill={ink} />
      <circle cx="214" cy="120" r="4.5" fill={surface} />
      {/* price tag */}
      <g transform="rotate(-14 224 52)">
        <path d="M200 40h34l10 12-10 12h-34a4 4 0 0 1-4-4V44a4 4 0 0 1 4-4Z" fill={water} />
        <circle cx="234" cy="52" r="3" fill={surface} />
        <path d="M205 49h18M205 56h12" stroke="var(--on-accent)" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  )
}

/** ID check: the card is scanned and its data flows down a line into a checked list. */
export function IdIllustration(props: Props) {
  return (
    <svg viewBox="0 0 260 150" aria-hidden="true" {...props}>
      <ellipse cx="130" cy="136" rx="110" ry="8" fill={soft} />
      {/* card */}
      <g transform="rotate(-6 70 72)">
        <rect x="14" y="30" width="112" height="72" rx="10" fill={surface} stroke={ink} strokeWidth="3" />
        <circle cx="42" cy="62" r="13" fill={soft} stroke={water} strokeWidth="2.5" />
        <path d="M32 80c3-6 17-6 20 0" fill="none" stroke={water} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M66 52h46M66 62h38M66 72h42M26 92h86" stroke={line} strokeWidth="4" strokeLinecap="round" />
        <rect x="14" y="54" width="112" height="3" fill={water} opacity="0.85" />
      </g>
      {/* flow pipe */}
      <path d="M128 70h24a14 14 0 0 1 14 14v6" fill="none" stroke={steel} strokeWidth="12" strokeLinecap="round" />
      <path d="M128 70h24a14 14 0 0 1 14 14v6" fill="none" stroke={water} strokeWidth="5" strokeLinecap="round" strokeDasharray="9 7" className="motion-safe:animate-[dash_1.4s_linear_infinite]" />
      {/* checked list */}
      <rect x="150" y="92" width="96" height="40" rx="10" fill={surface} stroke={ink} strokeWidth="3" />
      <rect x="176" y="18" width="70" height="62" rx="10" fill={surface} stroke={line} strokeWidth="2.5" />
      {[32, 48, 64].map((y) => (
        <g key={y}>
          <circle cx="190" cy={y} r="6" fill={water} />
          <path d={`M187 ${y}l2 2 4-4`} fill="none" stroke="var(--on-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M202 ${y}h34`} stroke={line} strokeWidth="4" strokeLinecap="round" />
        </g>
      ))}
      <path d="M164 106h30M164 118h66" stroke={line} strokeWidth="4" strokeLinecap="round" />
      <circle cx="226" cy="106" r="7" fill={water} />
    </svg>
  )
}

/** Traders: a pipe network with drop markers at its outlets. */
export function TradersIllustration(props: Props) {
  return (
    <svg viewBox="0 0 260 150" aria-hidden="true" {...props}>
      <rect x="10" y="18" width="240" height="118" rx="16" fill={soft} />
      <path d="M10 64h240M10 104h240M84 18v118M176 18v118" stroke={surface} strokeWidth="6" />
      <path d="M30 118h54a14 14 0 0 0 14-14V70a12 12 0 0 1 12-12h66a12 12 0 0 0 12-12V34" fill="none" stroke={steel} strokeWidth="10" strokeLinecap="round" />
      <path d="M30 118h54a14 14 0 0 0 14-14V70a12 12 0 0 1 12-12h66a12 12 0 0 0 12-12V34" fill="none" stroke={water} strokeWidth="4" strokeLinecap="round" strokeDasharray="8 7" className="motion-safe:animate-[dash_1.6s_linear_infinite]" />
      <path d="M98 88h110" fill="none" stroke={steel} strokeWidth="10" strokeLinecap="round" />
      {[
        { x: 188, y: 30, n: 1 },
        { x: 208, y: 84, n: 2 },
        { x: 30, y: 114, n: 3 },
      ].map((pin) => (
        <g key={pin.n} transform={`translate(${pin.x - 12} ${pin.y - 30})`}>
          <path d="M12 0C5.4 0 0 5.2 0 11.8 0 20.6 12 32 12 32s12-11.4 12-20.2C24 5.2 18.6 0 12 0Z" fill={water} />
          <circle cx="12" cy="12" r="7" fill={surface} />
          <text x="12" y="15.5" textAnchor="middle" fontSize="10" fontWeight="600" fill={water} fontFamily="inherit">
            {pin.n}
          </text>
        </g>
      ))}
    </svg>
  )
}
