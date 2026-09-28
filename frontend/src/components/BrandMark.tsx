import { useId } from 'react'

interface BrandMarkProps {
  className?: string
  /** `md` is the logo beside the wordmark; `lg` is the hero sunrise on the thank-you page. */
  size?: 'md' | 'lg'
  /**
   * Play the sunrise when the mark appears: the sun climbs over the horizon, then its
   * rays appear. On by default so every logo greets the day; skipped for reduced motion.
   */
  animated?: boolean
}

// The sunrise geometry, shared by every size: a sun half-risen over the horizon.
const CX = 52
const HORIZON_Y = 50
const SUN_R = 24
const RAYS = [-150, -120, -90, -60, -30]
const RAY_INNER = 31
const RAY_OUTER = 39
const RAYS_START_MS = 760

const SIZES = {
  // Heavier strokes so the mark holds up at logo size, cropped tight to the drawing.
  md: { viewBox: '0 7 104 47', width: 44, height: 20, ray: 6, horizon: 5 },
  lg: { viewBox: '0 0 104 60', width: 104, height: 60, ray: 3, horizon: 2 },
} as const

export function BrandMark({ className = '', size = 'md', animated = true }: BrandMarkProps) {
  const clipId = `daymark-horizon-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const s = SIZES[size]

  return (
    <svg
      width={s.width}
      height={s.height}
      viewBox={s.viewBox}
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={`block shrink-0 overflow-visible ${className}`}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width="104" height={HORIZON_Y} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {/* Hover lifts the wrapper, so it never fights the rise animation on the circle. */}
        <g className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] [transform-box:fill-box] group-hover:-translate-y-[6%] motion-reduce:transition-none">
          <circle
            cx={CX}
            cy={HORIZON_Y}
            r={SUN_R}
            className={`fill-orange-400 [transform-box:fill-box] ${animated ? 'animate-sun-rise' : ''}`}
          />
        </g>
      </g>
      {RAYS.map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        return (
          <line
            key={angle}
            x1={CX + Math.cos(rad) * RAY_INNER}
            y1={HORIZON_Y + Math.sin(rad) * RAY_INNER}
            x2={CX + Math.cos(rad) * RAY_OUTER}
            y2={HORIZON_Y + Math.sin(rad) * RAY_OUTER}
            strokeWidth={s.ray}
            strokeLinecap="round"
            style={animated ? { animationDelay: `${RAYS_START_MS + i * 60}ms` } : undefined}
            className={`stroke-orange-600 [transform-box:fill-box] [transform-origin:center] dark:stroke-orange-400 ${
              animated ? 'animate-ray-in' : ''
            }`}
          />
        )
      })}
      {/* The horizon takes the surrounding text color, so the mark sits on light or dark. */}
      <line
        x1="4"
        y1={HORIZON_Y}
        x2="100"
        y2={HORIZON_Y}
        stroke="currentColor"
        strokeWidth={s.horizon}
        strokeLinecap="round"
      />
    </svg>
  )
}
