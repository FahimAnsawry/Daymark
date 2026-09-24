import { useEffect, useState, type KeyboardEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Menu, X } from 'lucide-react'
import { BrandMark } from './BrandMark'
import { ThemeToggle } from './ThemeToggle'

import { useAuth } from '../lib/auth-context'

interface NavbarProps {
  className?: string
  brandHref?: string
  variant?: 'landing' | 'light'
}

export function Navbar({ className = '', brandHref, variant }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const isLight =
    variant === 'light' || className.includes('about') || className.includes('pricing')

  useEffect(() => {
    if (!menuOpen) return

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('keydown', closeOnEscape)
    const hadOverflowLock = document.body.classList.contains('overflow-hidden')
    document.body.classList.add('overflow-hidden')

    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      if (!hadOverflowLock) document.body.classList.remove('overflow-hidden')
    }
  }, [menuOpen])

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab' && event.shiftKey) return
    if (event.key === 'Escape') setMenuOpen(false)
  }

  const navContainerClasses = isLight
    ? 'relative z-10 mx-auto flex items-center justify-between w-full max-w-[1320px] px-5.5 md:px-[5vw] py-[26px] text-[#1f2937] dark:text-[#f3f4f6]'
    : 'absolute top-0 left-0 right-0 z-10 mx-auto flex items-center justify-between w-full max-w-[1320px] px-5.5 md:px-[5vw] py-7 text-white'

  const desktopLinkClasses = isLight
    ? 'text-[#66736a] dark:text-[#a7b0bf] hover:text-[#ea580c] dark:hover:text-[#fb923c] uppercase transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[#fed7aa] focus-visible:outline-offset-4'
    : 'hover:opacity-70 uppercase transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-[#fed7aa] focus-visible:outline-offset-4'

  return (
    <header className={`${navContainerClasses} ${className}`.trim()}>
      <Link
        className="group inline-flex items-center gap-[9px] text-[0.95rem] font-bold tracking-[0.06em] uppercase z-10 focus-visible:outline-2 focus-visible:outline-[#fed7aa] focus-visible:outline-offset-4"
        to={brandHref || (isAuthenticated ? '/dashboard' : '/')}
        aria-label="Daymark home"
        onClick={() => setMenuOpen(false)}
      >
        <BrandMark />
        <span>DAYMARK</span>
      </Link>

      <nav
        className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 text-[0.82rem] font-medium opacity-95 z-10"
        aria-label="Main navigation"
      >
        <Link to="/" className={desktopLinkClasses}>
          Home
        </Link>
        <Link to="/about" className={desktopLinkClasses}>
          About
        </Link>
        <Link to="/pricing" className={desktopLinkClasses}>
          Pricing
        </Link>
      </nav>

      <div className="ml-auto mr-5 hidden md:inline-flex">
        <ThemeToggle variant={isLight ? 'light' : 'default'} />
      </div>

      {isAuthenticated && user ? (
        <>
          <Link
            className={`hidden md:inline-flex items-center gap-2 text-[0.76rem] font-semibold transition-opacity duration-200 hover:opacity-75 focus-visible:outline-2 focus-visible:outline-[#fed7aa] focus-visible:outline-offset-4 ${
              isLight ? 'text-[#1f2937] dark:text-[#f3f4f6]' : 'text-white'
            }`}
            to="/dashboard"
          >
            <span>DASHBOARD</span>
            <ArrowRight size={15} />
          </Link>

          <Link
            className="hidden md:inline-flex items-center gap-2 ml-5 px-[15px] py-[9px] border border-[#fed7aa]/60 rounded-full text-[#1f2937] bg-[#fed7aa] text-[0.74rem] font-bold transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ffedd5] focus-visible:outline-2 focus-visible:outline-[#fed7aa] focus-visible:outline-offset-4 shadow-sm"
            to="/profile"
          >
            <div className="w-4 h-4 rounded-full bg-[#1f2937] text-[#fed7aa] flex items-center justify-center text-[0.6rem] font-bold">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <span>{user.name?.split(' ')[0] || 'PROFILE'}</span>
          </Link>
        </>
      ) : (
        <>
          <Link
            className={`hidden md:inline-flex items-center gap-2 text-[0.76rem] font-semibold transition-opacity duration-200 hover:opacity-75 focus-visible:outline-2 focus-visible:outline-[#fed7aa] focus-visible:outline-offset-4 ${
              isLight ? 'text-[#1f2937] dark:text-[#f3f4f6]' : 'text-white'
            }`}
            to="/login"
          >
            <span>LOG IN</span>
            <ArrowRight size={15} />
          </Link>

          <Link
            className="hidden md:inline-flex items-center gap-2 ml-5 px-[15px] py-[11px] border border-[#fed7aa]/60 rounded-full text-[#1f2937] bg-[#fed7aa] text-[0.74rem] font-bold transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ffedd5] focus-visible:outline-2 focus-visible:outline-[#fed7aa] focus-visible:outline-offset-4"
            to="/register"
          >
            START FOR FREE <ArrowRight size={15} />
          </Link>
        </>
      )}

      <button
        className="flex md:hidden ml-auto border-0 text-inherit bg-transparent cursor-pointer p-1.5 rounded-lg z-[101] hover:opacity-80 transition-opacity"
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
            className="fixed inset-0 bg-[#111827]/45 backdrop-blur-[4px] z-[99]"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed left-[18px] right-[18px] top-[68px] z-[100] rounded-[20px] border border-[#fed7aa]/25 bg-[#262626]/97 p-[22px_20px] shadow-[0_20px_48px_rgba(8,27,28,0.6)] backdrop-blur-[20px] animate-mobile-menu-in dark:border-[#fed7aa]/20 dark:bg-app-background/98 dark:shadow-[0_20px_48px_rgba(0,0,0,0.7)] motion-reduce:animate-none"
            id="mobile-store-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            onKeyDown={handleMenuKeyDown}
          >
            <nav className="flex flex-col gap-3.5" aria-label="Mobile navigation">
              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between text-[0.95rem] font-medium text-white px-1.5 py-2 rounded-lg hover:bg-white/10 hover:opacity-85 transition-all"
              >
                Home
              </Link>
              <Link
                to="/about"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between text-[0.95rem] font-medium text-white px-1.5 py-2 rounded-lg hover:bg-white/10 hover:opacity-85 transition-all"
              >
                About
              </Link>
              <Link
                to="/pricing"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between text-[0.95rem] font-medium text-white px-1.5 py-2 rounded-lg hover:bg-white/10 hover:opacity-85 transition-all"
              >
                Pricing
              </Link>
              <div className="h-px bg-white/15 my-1" />
              <div className="flex items-center justify-between px-1.5 py-2 text-white text-[0.95rem] font-medium">
                <span>Appearance</span>
                <ThemeToggle showLabel />
              </div>
              <div className="h-px bg-white/15 my-1" />
              {isAuthenticated && user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between text-[0.95rem] font-semibold text-[#fed7aa] px-1.5 py-2 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <span>Dashboard</span>
                    <ArrowRight size={15} />
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 px-5 py-[12px] rounded-full bg-[#fed7aa] text-[#1f2937] font-bold text-[0.88rem] mt-1 shadow-[0_4px_14px_rgba(0,0,0,0.2)] hover:bg-[#ffedd5] transition-colors"
                  >
                    <span>Profile ({user.name?.split(' ')[0]})</span>
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      setMenuOpen(false)
                      await logout()
                    }}
                    className="flex items-center justify-center gap-2 text-[#fed7aa] hover:text-[#fb923c] font-semibold text-[0.85rem] py-2 mt-1 cursor-pointer transition-colors"
                  >
                    <span>Sign out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    className="flex items-center justify-center gap-2 text-[#fed7aa] font-semibold text-[0.95rem] py-2"
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>Log in</span>
                    <ArrowRight size={15} />
                  </Link>
                  <Link
                    className="flex items-center justify-center gap-2 px-5 py-[13px] rounded-full bg-[#fed7aa] text-[#1f2937] font-bold text-[0.88rem] mt-1 shadow-[0_4px_14px_rgba(0,0,0,0.2)] hover:bg-[#ffedd5] transition-colors"
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>START FOR FREE</span>
                    <ArrowRight size={15} />
                  </Link>
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  )
}

export type { NavbarProps }
