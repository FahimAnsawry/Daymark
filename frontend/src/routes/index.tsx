import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Mail,
  Play,
  Sparkles,
} from 'lucide-react'
import { BrandMark } from '../components/BrandMark'
import { Navbar } from '../components/Navbar'

interface MemberStory {
  id: string
  quote: string
  name: string
  role: string
  location: string
}

const MEMBER_STORIES: MemberStory[] = [
  {
    id: 'nadim',
    quote: 'Daymark gives me a place to put everything down without making me feel behind.',
    name: 'Nadim Khan',
    role: 'Product Designer',
    location: 'Dhaka',
  },
  {
    id: 'julian',
    quote: 'Most tools make you feel guilty for not finishing twenty things. Daymark makes you proud of the three that actually mattered.',
    name: 'Julian Vance',
    role: 'Architect & Studio Lead',
    location: 'Melbourne',
  },
  {
    id: 'elena',
    quote: 'It’s the first planner that doesn’t treat rest as lost time. When the day is done, my evenings feel like mine again.',
    name: 'Elena Rostova',
    role: 'Writer & Researcher',
    location: 'Edinburgh',
  },
]

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  const [activeStory, setActiveStory] = useState(0)

  const handlePrevStory = () => {
    setActiveStory((prev) => (prev === 0 ? MEMBER_STORIES.length - 1 : prev - 1))
  }

  const handleNextStory = () => {
    setActiveStory((prev) => (prev === MEMBER_STORIES.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="landing-shell">
      <Navbar brandHref="#top" />

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <img
            className="hero-image"
            src="https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=2200&q=85"
            alt="A sunlit desk with an open notebook and a cup of tea"
            width={2200}
            height={1467}
            fetchPriority="high"
          />
          <div className="hero-wash" />
          <div className="hero-content">
            <h1 id="hero-title">Plan your day.<br /><em>Keep your life.</em></h1>
            <p className="hero-copy">Daymark turns the small things on your mind into a clear, kind plan you can actually follow.</p>
            <div className="hero-actions" id="start">
              <Link className="primary-button" to="/register">Start for free <ArrowRight size={17} /></Link>
              <a className="quiet-button" href="#how-it-works"><span className="play-icon"><Play size={11} fill="currentColor" /></span> See how it works</a>
            </div>
            <p className="microcopy">Free forever for personal use · No credit card</p>
          </div>

          {/* <span className="hero-caption">A little structure<br />for a fuller life.</span> */}
        </section>

        <section className="intro-section" id="how-it-works">
          <p className="section-kicker">For the beautifully busy</p>
          <h2>Your day is more than<br /><em>a list of things to do.</em></h2>
          <p>Capture what matters, make room for what doesn’t, and move through your day with a little more intention.</p>
        </section>

        <section className="principles" id="principles">
          <article><span>01</span><h3>Catch it all</h3><p>Get every open loop out of your head and somewhere you can trust.</p></article>
          <article><span>02</span><h3>Choose what matters</h3><p>A quiet daily view helps you focus on the next right thing.</p></article>
          <article><span>03</span><h3>Leave room to live</h3><p>Plans should support your life, not become another thing to maintain.</p></article>
        </section>

        <section className="rhythm-section" aria-labelledby="rhythm-title">
          <div className="rhythm-intro">
            <p className="section-kicker">A gentler way to get things done</p>
            <h2 id="rhythm-title">A plan that meets you where you are.</h2>
            <p>Daymark turns a noisy morning into a few clear moments, so you can spend less energy organising and more on the day itself.</p>
            <Link className="text-link" to="/register">Build your first day <ArrowRight size={16} /></Link>
          </div>
          <div className="rhythm-steps">
            <article className="rhythm-step rhythm-step-primary">
              <span className="step-time">08:30 · Start</span>
              <h3>See the shape of today</h3>
              <p>Bring tasks, notes, and the one thing you want to make space for into one calm view.</p>
              <div className="mini-checklist"><span><Check size={14} /> Review project notes</span><span><Check size={14} /> Call Mum after lunch</span><span className="unchecked">Take a proper break</span></div>
            </article>
            <article className="rhythm-step">
              <span className="step-time">13:10 · Reset</span>
              <h3>Adjust without starting over</h3>
              <p>Plans change. Move what can wait, keep what matters, and carry on with a clear head.</p>
            </article>
            <article className="rhythm-step">
              <span className="step-time">18:40 · Close</span>
              <h3>Finish with less on your mind</h3>
              <p>Mark the small wins, leave a note for tomorrow, and let the day be done.</p>
            </article>
          </div>
        </section>

        <section className="use-cases" aria-labelledby="use-cases-title">
          <div className="use-cases-heading">
            <p className="section-kicker">Made for real life</p>
            <h2 id="use-cases-title">Useful when life gets full.</h2>
          </div>
          <div className="use-case-list">
            <article><span className="use-case-icon"><Sparkles size={17} /></span><div><h3>When work follows you home</h3><p>Separate the urgent from the important, then close the laptop with a next step ready.</p></div></article>
            <article><span className="use-case-icon"><span>02</span></span><div><h3>When your brain has too many tabs open</h3><p>Capture the loose thoughts before they become tomorrow’s background noise.</p></div></article>
            <article><span className="use-case-icon"><span>03</span></span><div><h3>When you want more than productivity</h3><p>Keep room for people, rest, and the things you would miss if they were never scheduled.</p></div></article>
          </div>
        </section>

        <section
          className="quote-section"
          id="stories"
          aria-label="Member stories"
          aria-roledescription="carousel"
        >
          <p className="quote-mark" aria-hidden="true">“</p>
          <div className="quote-slider" aria-live="polite">
            {MEMBER_STORIES.map((story, index) => {
              const isActive = index === activeStory
              return (
                <div
                  key={story.id}
                  className={`quote-slide ${isActive ? 'active' : ''}`}
                  aria-hidden={!isActive}
                >
                  <blockquote>{story.quote}</blockquote>
                  <p className="quote-byline">
                    {story.name} · {story.role}, {story.location}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="quote-controls">
            <button
              type="button"
              className="quote-nav-btn"
              onClick={handlePrevStory}
              aria-label="Previous story"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="quote-dots" role="tablist" aria-label="Member stories navigation">
              {MEMBER_STORIES.map((story, index) => (
                <button
                  key={story.id}
                  type="button"
                  role="tab"
                  className={`quote-dot ${index === activeStory ? 'active' : ''}`}
                  onClick={() => setActiveStory(index)}
                  aria-label={`Go to story ${index + 1}: ${story.name}`}
                  aria-selected={index === activeStory}
                />
              ))}
            </div>
            <button
              type="button"
              className="quote-nav-btn"
              onClick={handleNextStory}
              aria-label="Next story"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </section>

        <section className="closing-cta" aria-labelledby="closing-title">
          <p className="section-kicker">Start with today</p>
          <h2 id="closing-title">Make a little room<br /><em>for your life.</em></h2>
          <Link className="primary-button dark-button" to="/register">Start for free <ArrowRight size={17} /></Link>
          <p>Free forever for personal use · No credit card</p>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-lead">
          <div>
            <p className="footer-kicker">Make room for what matters</p>
            <h2>Less noise.<br /><em>More day.</em></h2>
          </div>
          <Link className="footer-cta" to="/register">Start for free <ArrowUpRight size={17} /></Link>
        </div>

        <div className="footer-grid">
          <div className="footer-brand-block">
            <a className="brand footer-brand" href="#top" aria-label="Daymark home">
              <BrandMark />
              <span>DAYMARK</span>
            </a>
            <p>A calmer way to plan the days that matter to you.</p>
            <a className="footer-email" href="mailto:hello@daymark.app"><Mail size={15} /> hello@daymark.app</a>
          </div>

          <nav className="footer-column" aria-label="Product links">
            <h3>Explore</h3>
            <a href="#how-it-works">How it works <ArrowUpRight size={13} /></a>
            <a href="#principles">Our approach <ArrowUpRight size={13} /></a>
            <a href="#stories">Member stories <ArrowUpRight size={13} /></a>
            <Link to="/pricing">Pricing <ArrowUpRight size={13} /></Link>
          </nav>

          <nav className="footer-column" aria-label="Company links">
            <h3>Daymark</h3>
            <a href="#start">Get started <ArrowUpRight size={13} /></a>
            <Link to="/login">Log in <ArrowUpRight size={13} /></Link>
            <a href="mailto:hello@daymark.app">Contact us <ArrowUpRight size={13} /></a>
          </nav>

          <div className="footer-newsletter">
            <h3>A better rhythm, occasionally.</h3>
            <p>Thoughtful notes on planning, focus, and leaving room to live.</p>
            <a className="footer-note-link" href="mailto:hello@daymark.app?subject=Daymark%20notes">Ask for the notes <ArrowRight size={15} /></a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Daymark. Made for real life.</span>
          <span className="footer-status"><span aria-hidden="true" /> All systems calm</span>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </div>
  )
}
