import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

export const ChevronDownIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const GripIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="9" cy="6" r="1" fill="currentColor" />
    <circle cx="15" cy="6" r="1" fill="currentColor" />
    <circle cx="9" cy="12" r="1" fill="currentColor" />
    <circle cx="15" cy="12" r="1" fill="currentColor" />
    <circle cx="9" cy="18" r="1" fill="currentColor" />
    <circle cx="15" cy="18" r="1" fill="currentColor" />
  </svg>
)

export const TrashIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
)

export const PlusIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const CarIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M5 17h14v-5l-2-5H7l-2 5v5Z" />
    <path d="M5 12h14" />
    <circle cx="8" cy="17" r="2" />
    <circle cx="16" cy="17" r="2" />
  </svg>
)

export const CheckIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
)

export const UploadIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 15V4" />
    <path d="m7 8.5 5-4.5 5 4.5" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </svg>
)

export const MapPinIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 21s7-5.6 7-11.5A7 7 0 0 0 5 9.5C5 15.4 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
)

export const FitBoundsIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4" />
  </svg>
)

export const IdCardIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="8.5" cy="11" r="2" />
    <path d="M6 16c.6-1.3 1.5-2 2.5-2s1.9.7 2.5 2M14 10h4M14 13.5h3" />
  </svg>
)

export const PackageIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="m21 8-9-5-9 5 9 5 9-5Z" />
    <path d="M3 8v8l9 5 9-5V8" />
    <path d="M12 13v8" />
  </svg>
)
