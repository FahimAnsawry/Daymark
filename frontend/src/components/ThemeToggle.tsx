import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../lib/theme-context'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      className={`theme-toggle ${isDark ? 'is-dark' : 'is-light'} ${className}`}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
    >
      <span className="theme-toggle-icon-wrap" aria-hidden="true">
        <Sun className="theme-icon-sun" size={17} strokeWidth={2.2} />
        <Moon className="theme-icon-moon" size={17} strokeWidth={2.2} />
      </span>
      {showLabel && (
        <span className="theme-toggle-label">
          {isDark ? 'Dark mode' : 'Light mode'}
        </span>
      )}
    </button>
  )
}
