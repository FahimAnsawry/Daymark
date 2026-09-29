import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { BrandMark } from './BrandMark'

function scrollToTop() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
}

/** The shared marketing footer (landing, about, pricing): a dark ledger of ruled link columns. */
export function SiteFooter() {
  return (
    <footer className="site-footer px-6 md:px-[5vw] text-[#f7f6f2] bg-[#111a17] dark:border-t dark:border-[#2f2f2f]">
      <div className="pt-16 md:pt-[76px]">
        <Link
          className="group inline-flex items-center gap-2.5 font-logo text-[0.9rem] font-bold tracking-[0.08em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fed7aa]"
          to="/"
          aria-label="Daymark home"
        >
          <BrandMark animated={false} />
          <span>DAYMARK</span>
        </Link>
        <p className="m-0 mt-10 md:mt-9 font-display text-[clamp(2.75rem,8vw,5.75rem)] font-semibold tracking-[-0.045em] leading-[0.95] [&>em]:not-italic [&>em]:text-[#fdba74]">
          Less noise. <br className="md:hidden" />
          <em>More day.</em>
        </p>
      </div>

      <div className="footer-grid grid grid-cols-2 md:grid-cols-4 mt-16 gap-x-6 md:gap-x-12 gap-y-12">
        <nav className="footer-column" aria-label="Explore">
          <h3>Explore</h3>
          <Link to="/">How it works</Link>
          <Link to="/about">Our approach</Link>
          <Link to="/pricing">Pricing</Link>
        </nav>

        <nav className="footer-column" aria-label="Daymark">
          <h3>Daymark</h3>
          <Link to="/about">About</Link>
          <Link to="/register">Get started</Link>
          <Link to="/login">Log in</Link>
        </nav>

        <div className="footer-column">
          <h3>Say hello</h3>
          <a href="mailto:hello@daymark.app">hello@daymark.app</a>
          <a href="mailto:hello@daymark.app">Contact us</a>
        </div>

        <div className="footer-column footer-newsletter">
          <h3>A better rhythm, occasionally.</h3>
          <p className="m-0 mb-5 max-w-[280px] text-[#a3aca5] text-[0.9rem] leading-[1.55]">
            Thoughtful notes on planning, focus, and leaving room to live.
          </p>
          <a
            className="footer-cta inline-flex items-center gap-2 rounded-full px-5 py-3 btn-primary-inverse text-[0.82rem] font-bold transition-colors"
            href="mailto:hello@daymark.app?subject=Daymark%20notes"
          >
            Ask for the notes <ArrowRight size={15} aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="footer-bottom grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center mt-16 py-7 md:py-5 border-t border-white/15 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-[#8d9992] gap-4 md:gap-0">
        <span>© 2026 Daymark. Made for real life.</span>
        <span className="hidden md:inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-[#fdba74]" />
          All systems calm
        </span>
        <button
          type="button"
          onClick={scrollToTop}
          className="justify-self-end cursor-pointer uppercase tracking-[0.08em] text-[#fdba74] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fed7aa]"
        >
          Back to top ↑
        </button>
      </div>
    </footer>
  )
}
