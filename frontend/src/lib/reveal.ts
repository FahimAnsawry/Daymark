import { useCallback, type CSSProperties } from 'react'

/**
 * Scroll-in entrances. Attach the returned callback ref to a container; every element
 * inside it (or the container itself) marked data-reveal="pending" flips to "in" the
 * first time it scrolls into view, and the reveal-* classes in index.css play the
 * entrance. It's a callback ref so it still works when the container mounts late
 * (e.g. behind GuestOnly's loading state).
 */
export function useReveal<T extends HTMLElement>() {
  return useCallback((node: T | null) => {
    if (!node) return

    const targets = [
      ...(node.matches('[data-reveal]') ? [node] : []),
      ...node.querySelectorAll<HTMLElement>('[data-reveal]'),
    ]
    if (!targets.length) return

    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach((target) => (target.dataset.reveal = 'in'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          ;(entry.target as HTMLElement).dataset.reveal = 'in'
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' },
    )
    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [])
}

/** Offsets a reveal animation from the start of its target's (or card's) entrance. */
export function revealDelay(ms: number): CSSProperties {
  return { '--reveal-delay': `${ms}ms` } as CSSProperties
}

/** Smoothly scrolls to a section by id without adding a #hash to the URL. */
export function scrollToSection(id: string) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
}
