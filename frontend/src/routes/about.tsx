import { ArrowRight, ArrowUpRight, Check, Mail } from 'lucide-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { BrandMark } from '../components/BrandMark'
import { Navbar } from '../components/Navbar'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <div className="about-page">
      <Navbar className="about-site-nav" />

      <main>
        <section className="about-hero" aria-labelledby="about-title">
          <div className="about-hero-copy">
            <h1 id="about-title">We made Daymark for the days that don’t fit in a checklist.</h1>
            <p className="about-lede">Because the best plans leave room for the people, pauses, and small joys that make a day yours.</p>
            <a className="about-scroll-link" href="#why-daymark">Read our story <ArrowRight size={16} /></a>
          </div>
          <figure className="about-hero-visual" aria-label="A visual reminder to make room for what matters">
            <div className="about-hero-visual-topline"><span>DAYMARK / 2026</span><span>MAKE ROOM</span></div>
            <div className="about-hero-orbit about-hero-orbit-one" />
            <div className="about-hero-orbit about-hero-orbit-two" />
            <div className="about-hero-sun" />
            <div className="about-hero-note"><span>Today</span><strong>enough<br />is a plan</strong></div>
            <div className="about-hero-visual-footer"><span>01</span><span>Less noise<br />more life</span></div>
          </figure>
        </section>

        <section className="about-story" id="why-daymark" aria-labelledby="story-title">
          <div className="about-story-label">Our starting point</div>
          <div className="about-story-content">
            <h2 id="story-title">Productivity had become another thing to keep up with.</h2>
            <p>We wanted a daily tool that felt more like a steady hand than a scoreboard. Somewhere to catch the open loops, choose what matters now, and close the day without carrying every unfinished task into tomorrow.</p>
            <p>Daymark is built around that quieter idea: a plan is useful when it helps you return to your life with more attention, not when it asks you to optimise every minute.</p>
          </div>
        </section>

        <section className="about-manifesto" aria-label="Daymark statement">
          <p>“Make room for what matters.”</p>
          <span>That is the whole brief.</span>
        </section>

        <section className="about-principles" id="principles" aria-labelledby="principles-title">
          <div className="about-section-heading">
            <p className="about-section-number">01 — The way we work</p>
            <h2 id="principles-title">Useful, kind, and<br /><em>quietly intentional.</em></h2>
          </div>
          <div className="about-principle-list">
            <article>
              <span className="principle-check"><Check size={15} /></span>
              <div><h3>Clarity before complexity</h3><p>We start by reducing mental noise. Every feature should make the next right thing easier to see.</p></div>
            </article>
            <article>
              <span className="principle-check"><Check size={15} /></span>
              <div><h3>Life is part of the plan</h3><p>Rest, relationships, and ordinary moments are not distractions from a productive day.</p></div>
            </article>
            <article>
              <span className="principle-check"><Check size={15} /></span>
              <div><h3>Finish with less to carry</h3><p>A good day can end unfinished. What matters is knowing what can wait, and letting it.</p></div>
            </article>
          </div>
        </section>

        <section className="about-ritual" aria-labelledby="ritual-title">
          <div className="ritual-note">The Daymark ritual</div>
          <div>
            <h2 id="ritual-title">Start with what’s real.<br /><em>End with what’s enough.</em></h2>
            <p>Capture the thoughts circling your head. Choose a few things that deserve your attention. Then leave a little space for the day to surprise you.</p>
            <Link className="about-text-link" to="/register">Try a gentler way to plan <ArrowRight size={16} /></Link>
          </div>
        </section>
      </main>

      <footer className="about-footer">
        <div className="about-footer-lead">
          <div><p>Make room for what matters</p><h2>Begin with<br /><em>today.</em></h2></div>
          <Link className="about-footer-cta" to="/register">Start for free <ArrowUpRight size={17} /></Link>
        </div>
        <div className="about-footer-bottom">
          <Link className="about-brand" to="/"><BrandMark /><span>DAYMARK</span></Link>
          <a href="mailto:hello@daymark.app"><Mail size={14} /> hello@daymark.app</a>
          <span>© 2026 Daymark. Made for real life.</span>
        </div>
      </footer>
    </div>
  )
}
