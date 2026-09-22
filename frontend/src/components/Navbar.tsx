import { useEffect, useState, type KeyboardEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Menu, X } from 'lucide-react'
import { BrandMark } from './BrandMark'
import { ThemeToggle } from './ThemeToggle'

interface NavbarProps {
  className?: string
  brandHref?: string
}

export function Navbar({ className = '', brandHref }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('keydown', closeOnEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab' && event.shiftKey) return
    if (event.key === 'Escape') setMenuOpen(false)
  }

  return (
    <header className={`site-nav ${className}`.trim()} /* className="site-nav" */>
      <Link
        className="brand"
        to={brandHref || '/'}
        aria-label="Daymark home"
        onClick={() => setMenuOpen(false)}
      >
        <BrandMark />
        <span>DAYMARK</span>
      </Link>

      <nav className="desktop-nav" aria-label="Main navigation">
        <Link to="/" className='uppercase'>Home</Link>
        <Link to="/about" className='uppercase'>About</Link>
        <Link to="/pricing" className='uppercase'>Pricing</Link>
      </nav>

      <ThemeToggle className="desktop-theme-toggle" />

      <Link className="nav-login" to="/login">
        <span>LOG IN</span>
        <ArrowRight size={15} />
      </Link>

      <Link className="desktop-nav-cta" to="/register">START FOR FREE <ArrowRight size={15} /></Link>

      <button
        className="menu-button"
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        aria-controls="mobile-store-navigation"
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {menuOpen && (
        <>
          <div
            className="mobile-menu-backdrop"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            className="mobile-menu"
            id="mobile-store-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            onKeyDown={handleMenuKeyDown}
          >
            <nav className="mobile-nav" aria-label="Mobile navigation">
              <Link to="/" onClick={() => setMenuOpen(false)}>
                Home
              </Link>
              <Link to="/about" onClick={() => setMenuOpen(false)}>
                About
              </Link>
              <Link to="/pricing" onClick={() => setMenuOpen(false)}>
                Pricing
              </Link>
              <div className="mobile-nav-divider" />
              <div className="mobile-theme-row">
                <span className="mobile-theme-label">Appearance</span>
                <ThemeToggle showLabel />
              </div>
              <div className="mobile-nav-divider" />
              <Link
                className="mobile-nav-login"
                to="/login"
                onClick={() => setMenuOpen(false)}
              >
                <span>Log in</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                className="mobile-nav-cta"
                to="/register"
                onClick={() => setMenuOpen(false)}
              >
                <span>START FOR FREE</span>
                <ArrowRight size={15} />
              </Link>
            </nav>
          </div>
        </>
      )}
    </header>
  )
}

export type { NavbarProps }
