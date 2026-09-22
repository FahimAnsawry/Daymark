import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../lib/theme-context'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
  variant?: 'default' | 'light'
}

export function ThemeToggle({
  className = '',
  showLabel = false,
  variant = 'default',
}: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const variantClasses =
    variant === 'light'
      ? 'border-[#27352f]/28 bg-white/90 text-[#203b32] shadow-[0_2px_8px_rgba(32,59,50,0.08)] hover:border-[#315844] hover:bg-white hover:text-[#172b24] hover:shadow-[0_4px_14px_rgba(32,59,50,0.16)] dark:border-[#e5efc4]/45 dark:bg-[#192c25] dark:text-[#e5efc4] dark:shadow-[0_0_14px_rgba(229,239,196,0.16),0_2px_8px_rgba(0,0,0,0.35)] dark:hover:border-[#e5efc4] dark:hover:bg-[#243d34] dark:hover:text-white dark:hover:shadow-[0_0_20px_rgba(229,239,196,0.35),0_4px_14px_rgba(0,0,0,0.45)]'
      : 'border-white/30 bg-white/10 text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:bg-white/22 hover:border-[#e5efc4]/80 hover:text-white hover:shadow-[0_4px_14px_rgba(0,0,0,0.2),0_0_12px_rgba(229,239,196,0.35)] dark:border-[#e5efc4]/45 dark:bg-[#192c25] dark:text-[#e5efc4] dark:shadow-[0_0_14px_rgba(229,239,196,0.16),0_2px_8px_rgba(0,0,0,0.35)] dark:hover:border-[#e5efc4] dark:hover:bg-[#243d34] dark:hover:text-white dark:hover:shadow-[0_0_20px_rgba(229,239,196,0.35),0_4px_14px_rgba(0,0,0,0.45)]'

  const sizeClasses = showLabel
    ? 'w-auto min-h-[38px] px-4 py-1.5'
    : 'w-[38px] h-[38px] p-0'

  return (
    <button
      type="button"
      className={`relative inline-flex items-center justify-center gap-2 rounded-full border backdrop-blur-[10px] cursor-pointer transition-all duration-250 ease-out hover:-translate-y-0.5 hover:scale-105 active:translate-y-0 active:scale-95 focus-visible:outline-2 focus-visible:outline-[#e5efc4] focus-visible:outline-offset-3 ${sizeClasses} ${variantClasses} ${className}`}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
    >
      <span className="relative inline-flex items-center justify-center w-5 h-5 shrink-0" aria-hidden="true">
        <Sun
          className={`absolute inset-0 m-auto origin-center transition-all duration-450 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] ${
            isDark
              ? 'rotate-0 scale-100 opacity-100 drop-shadow-[0_0_5px_rgba(229,239,196,0.75)]'
              : '-rotate-90 scale-0 opacity-0 pointer-events-none'
          }`}
          size={17}
          strokeWidth={2.2}
        />
        <Moon
          className={`absolute inset-0 m-auto origin-center transition-all duration-450 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] ${
            isDark
              ? 'rotate-90 scale-0 opacity-0 pointer-events-none'
              : 'rotate-0 scale-100 opacity-100'
          }`}
          size={17}
          strokeWidth={2.2}
        />
      </span>
      {showLabel && (
        <span className="text-[0.82rem] font-semibold tracking-[0.01em]">
          {isDark ? 'Dark mode' : 'Light mode'}
        </span>
      )}
    </button>
  )
}
