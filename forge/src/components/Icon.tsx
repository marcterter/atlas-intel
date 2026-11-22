import type { CSSProperties } from 'react'

const P: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  dumbbell: 'M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11',
  food: 'M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3c-2 1.5-3 4-3 7h3v11M17 3v18',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M5 12.5 10 17 19 7',
  x: 'M6 6l12 12M18 6 6 18',
  'chevron-left': 'M15 5l-7 7 7 7',
  'chevron-right': 'M9 5l7 7-7 7',
  'chevron-down': 'M5 9l7 7 7-7',
  'chevron-up': 'M5 15l7-7 7 7',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  play: 'M8 5.5v13l11-6.5z',
  pencil: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  barcode: 'M4 5v14M7 5v14M11 5v14M14 5v14M17 5v14M20 5v14',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9-4.3-4.1 5.9-.8z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  flame: 'M12 21c4 0 7-2.8 7-6.8 0-3.4-2.3-5.7-4-7.7-.3 2-1.3 3.3-2.6 3.9C12.9 7.5 11.4 4.6 9 3c.3 3.2-1.6 5.3-3 7-1 1.2-1 2.6-1 4 0 4 3 7 7 7z',
  scale: 'M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM7.5 11h9a4.5 4.5 0 0 0-9 0zM12 11l1.6-2.6',
  steps: 'M8 3c1.7 0 2.6 2 2.6 4.4 0 2.1-.7 3.6-1 5.1H6.3C6 11 5.4 9.6 5.4 7.4 5.4 5 6.3 3 8 3zM6.3 15h3.3v1.6a1.7 1.7 0 0 1-3.3 0zM16 7c1.7 0 2.6 2 2.6 4.4 0 2.1-.6 3.6-1 5.1h-3.3c-.3-1.5-.9-2.9-.9-5.1C13.4 9 14.3 7 16 7zM14.3 19h3.3v.3a1.7 1.7 0 0 1-3.3 0z',
  camera: 'M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  sync: 'M20 11a8 8 0 0 0-14.6-4.5M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5M20 20v-4h-4',
  cloud: 'M7 18h10a4 4 0 0 0 .6-8A6 6 0 0 0 6.1 9.5 4.3 4.3 0 0 0 7 18z',
  'cloud-off': 'M3 3l18 18M8.5 6.5A6 6 0 0 1 17.6 10a4 4 0 0 1 2.4 6.6M17 18H7a4.3 4.3 0 0 1-1.6-8.3',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  'arrow-up': 'M12 19V5M6 11l6-6 6 6',
  'arrow-down': 'M12 5v14M6 13l6 6 6-6',
  swap: 'M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
  note: 'M5 4h14v12l-4 4H5zM15 20v-4h4M8 9h8M8 13h5',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.01',
  calendar: 'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM4 10h16M8 3v4M16 3v4',
  copy: 'M9 9h10v11H9zM5 15V4h10',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7 7 0 0 1-1.9 1.1L15 20.5h-4l-.3-2a7 7 0 0 1-1.9-1.1l-1.9.7-2-3.4 1.6-1.2a7 7 0 0 1 0-2.9L4.9 9.3l2-3.4 1.9.7a7 7 0 0 1 1.9-1.1L11 3.5h4l.3 2a7 7 0 0 1 1.9 1.1l1.9-.7 2 3.4-1.6 1.2a7 7 0 0 1 0 3z',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  image: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9h.01',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
  bolt: 'M13 3 5 14h6l-1 7 8-11h-6z',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  zap: 'M4 12h4l3-8 2 16 3-8h4',
  book: 'M12 6.5C10 5 7 4.5 4 5v13.5c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5zM12 6.5V20',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
  shortcut: 'M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3zM9 12l3-3 3 3-3 3z',
}

export type IconName = keyof typeof P

export function Icon({
  name,
  size = 22,
  stroke = 2,
  fill,
  style,
  className,
}: {
  name: IconName | string
  size?: number
  stroke?: number
  fill?: boolean
  style?: CSSProperties
  className?: string
}) {
  const d = P[name] ?? P.info
  const isDot = name === 'more'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={isDot ? 3.2 : stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
      className={className}
    >
      <path d={d} />
    </svg>
  )
}
