import { useId } from 'react'

interface LoadingPageProps {
  /** Whether to occupy full screen or fit container */
  fullScreen?: boolean
  className?: string
}

export function LoadingPage({ fullScreen = true, className = '' }: LoadingPageProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={`flex flex-col items-center justify-center bg-app-background select-none transition-colors duration-250 ${
        fullScreen ? 'fixed inset-0 z-50 min-h-screen w-screen' : 'min-h-[240px] w-full p-8'
      } ${className}`}
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Soft warm ambient glow behind the sunrise */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-8 left-1/2 h-36 w-36 -translate-x-1/2 animate-pulse rounded-full bg-orange-400/20 blur-3xl dark:bg-orange-500/15"
        />

        {/* Animated App Logo (Daymark Sunrise) */}
        <BrandLoadingMark />
      </div>
    </div>
  )
}

/**
 * Animated Daymark sunrise mark tailored for continuous loading.
 * Features breathing sun elevation and glowing, sweeping ray pulse.
 */
export function BrandLoadingMark({ className = '' }: { className?: string }) {
  const clipId = `daymark-loading-horizon-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const CX = 52
  const HORIZON_Y = 50
  const SUN_R = 24
  const RAYS = [-150, -120, -90, -60, -30]
  const RAY_INNER = 31
  const RAY_OUTER = 39

  return (
    <svg
      width="96"
      height="56"
      viewBox="0 0 104 60"
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

      {/* Sun rising & breathing behind the horizon */}
      <g clipPath={`url(#${clipId})`}>
        <circle
          cx={CX}
          cy={HORIZON_Y}
          r={SUN_R}
          className="fill-orange-400 [transform-box:fill-box] animate-sun-breathe"
        />
      </g>

      {/* Sun rays pulsing in a staggered wave from left to right */}
      {RAYS.map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        return (
          <line
            key={angle}
            x1={CX + Math.cos(rad) * RAY_INNER}
            y1={HORIZON_Y + Math.sin(rad) * RAY_INNER}
            x2={CX + Math.cos(rad) * RAY_OUTER}
            y2={HORIZON_Y + Math.sin(rad) * RAY_OUTER}
            strokeWidth="3.5"
            strokeLinecap="round"
            style={{ animationDelay: `${i * 180}ms` }}
            className="stroke-orange-600 [transform-box:fill-box] [transform-origin:center] animate-ray-pulse dark:stroke-orange-400"
          />
        )
      })}

      {/* Grounded horizon line */}
      <line
        x1="4"
        y1={HORIZON_Y}
        x2="100"
        y2={HORIZON_Y}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="text-[#1c2a24] dark:text-[#f3f4f6]"
      />
    </svg>
  )
}
