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
    quote:
      'Most tools make you feel guilty for not finishing twenty things. Daymark makes you proud of the three that actually mattered.',
    name: 'Julian Vance',
    role: 'Architect & Studio Lead',
    location: 'Melbourne',
  },
  {
    id: 'elena',
    quote:
      'It’s the first planner that doesn’t treat rest as lost time. When the day is done, my evenings feel like mine again.',
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
    <div className="overflow-hidden bg-app-background text-[#1f2937] dark:text-[#f3f4f6] transition-colors duration-250">
      <Navbar brandHref="#top" />

      <main id="top">
        <section
          className="relative grid min-h-[750px] md:min-h-[815px] place-items-start md:place-items-center isolate overflow-hidden text-white bg-[#183b37] after:absolute after:-z-10 after:inset-0 after:content-[''] after:bg-[linear-gradient(180deg,rgba(8,27,28,0.38),transparent_45%,rgba(8,27,28,0.45))]"
          aria-labelledby="hero-title"
        >
          <img
            className="absolute -z-20 inset-0 w-full h-full object-cover object-[63%_center] md:object-[54%_center] scale-[1.08] md:scale-[1.015]"
            src="https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=2200&q=85"
            alt="A sunlit desk with an open notebook and a cup of tea"
            width={2200}
            height={1467}
            fetchPriority="high"
          />
          <div className="absolute -z-10 inset-0 bg-[linear-gradient(102deg,rgba(14,49,45,0.9)_0%,rgba(14,49,45,0.62)_36%,rgba(11,36,36,0.08)_74%),linear-gradient(transparent_55%,rgba(11,36,36,0.74))]" />
          <div className="w-[min(730px,90vw)] pt-[145px] md:pt-[75px] text-center mx-auto">
            <h1
              id="hero-title"
              className="mb-[23px] font-display text-[clamp(2.75rem,10vw,4.25rem)] md:text-[clamp(4.1rem,6vw,5.6rem)] font-semibold tracking-[-0.04em] leading-[1.05] md:leading-[1.04] [&>em]:font-semibold [&>em]:text-[#e0ebbd] dark:[&>em]:text-[#94a3b8] [&>em]:not-italic"
            >
              Plan your day.
              <br />
              <em>Keep your life.</em>
            </h1>
            <p className="w-[min(390px,85vw)] mx-auto mb-[30px] text-[0.95rem] md:text-[1.05rem] leading-[1.55] text-white/85">
              Daymark turns the small things on your mind into a clear, kind plan you can actually
              follow.
            </p>
            <div
              className="flex flex-col md:flex-row justify-center items-center gap-[15px] md:gap-5"
              id="start"
            >
              <Link
                className="inline-flex items-center gap-2.5 rounded-full text-[0.85rem] font-bold px-[21px] py-[15px] text-[#1f2937] bg-[#fed7aa] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ffedd5] focus-visible:outline-2 focus-visible:outline-[#fed7aa] focus-visible:outline-offset-4"
                to="/register"
              >
                Start for free <ArrowRight size={17} />
              </Link>
              <a
                className="inline-flex items-center gap-2.5 rounded-full text-[0.85rem] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-[#fed7aa] focus-visible:outline-offset-4"
                href="#how-it-works"
              >
                <span className="grid place-items-center w-[27px] h-[27px] pl-[2px] border border-white/65 rounded-full">
                  <Play size={11} fill="currentColor" />
                </span>{' '}
                See how it works
              </a>
            </div>
            <p className="mt-[17px] text-[0.68rem] text-white/60">
              Free forever for personal use · No credit card
            </p>
          </div>
        </section>

        <section
          className="max-w-[750px] mx-auto pt-[100px] md:pt-[150px] pb-20 md:pb-[115px] px-6 text-center"
          id="how-it-works"
        >
          <p className="mb-[22px] text-[#ea580c] dark:text-[#fb923c] text-[0.72rem] font-bold tracking-[0.08em] uppercase">
            For the beautifully busy
          </p>
          <h2 className="m-0 font-display text-[clamp(2.7rem,5vw,4.8rem)] font-semibold tracking-[-0.04em] leading-[1.08] text-[#1f2937] dark:text-[#f2f4ee] [&>em]:font-semibold [&>em]:text-[#48664a] dark:[&>em]:text-[#94a3b8] [&>em]:not-italic">
            Your day is more than
            <br />
            <em>a list of things to do.</em>
          </h2>
          <p className="max-w-[410px] mx-auto mt-[30px] text-[#667085] dark:text-[#a7b0bf] text-[1rem] leading-[1.6]">
            Capture what matters, make room for what doesn’t, and move through your day with a
            little more intention.
          </p>
        </section>

        <section
          className="grid grid-cols-1 md:grid-cols-3 max-w-[1100px] mx-auto px-6 md:px-[30px] pb-[90px] md:pb-[145px] gap-11 md:gap-[34px]"
          id="principles"
        >
          <article className="pt-[18px] border-t border-[#c7cfc2] dark:border-[#383838]">
            <span className="text-[#ea580c] dark:text-[#fb923c] text-[0.7rem] font-bold">01</span>
            <h3 className="my-7 mb-3 font-display text-[1.55rem] font-semibold tracking-[-0.04em] text-[#1f2937] dark:text-[#f2f4ee]">
              Catch it all
            </h3>
            <p className="max-w-[310px] md:max-w-[240px] m-0 text-[#727b73] dark:text-[#a7b0bf] text-[0.88rem] leading-[1.55]">
              Get every open loop out of your head and somewhere you can trust.
            </p>
          </article>
          <article className="pt-[18px] border-t border-[#c7cfc2] dark:border-[#383838]">
            <span className="text-[#ea580c] dark:text-[#fb923c] text-[0.7rem] font-bold">02</span>
            <h3 className="my-7 mb-3 font-display text-[1.55rem] font-semibold tracking-[-0.04em] text-[#1f2937] dark:text-[#f2f4ee]">
              Choose what matters
            </h3>
            <p className="max-w-[310px] md:max-w-[240px] m-0 text-[#727b73] dark:text-[#a7b0bf] text-[0.88rem] leading-[1.55]">
              A quiet daily view helps you focus on the next right thing.
            </p>
          </article>
          <article className="pt-[18px] border-t border-[#c7cfc2] dark:border-[#383838]">
            <span className="text-[#ea580c] dark:text-[#fb923c] text-[0.7rem] font-bold">03</span>
            <h3 className="my-7 mb-3 font-display text-[1.55rem] font-semibold tracking-[-0.04em] text-[#1f2937] dark:text-[#f2f4ee]">
              Leave room to live
            </h3>
            <p className="max-w-[310px] md:max-w-[240px] m-0 text-[#727b73] dark:text-[#a7b0bf] text-[0.88rem] leading-[1.55]">
              Plans should support your life, not become another thing to maintain.
            </p>
          </article>
        </section>

        <section
          className="grid grid-cols-1 md:grid-cols-[minmax(260px,0.78fr)_minmax(0,1.22fr)] max-w-[1100px] mx-auto py-[90px] md:py-[120px] pb-[100px] md:pb-[145px] px-6 md:px-[30px] gap-[55px] md:gap-[clamp(50px,9vw,125px)]"
          aria-labelledby="rhythm-title"
        >
          <div className="self-center">
            <p className="mb-[22px] text-[#ea580c] dark:text-[#fb923c] text-[0.72rem] font-bold tracking-[0.08em] uppercase">
              A gentler way to get things done
            </p>
            <h2
              id="rhythm-title"
              className="max-w-[400px] md:max-w-[440px] mb-[25px] font-display text-[clamp(2.55rem,4vw,4rem)] font-semibold tracking-[-0.04em] leading-[0.96] text-[#1f2937] dark:text-[#f2f4ee]"
            >
              A plan that meets you where you are.
            </h2>
            <p className="max-w-[340px] text-[#727b73] dark:text-[#a7b0bf] text-[0.94rem] leading-[1.65]">
              Daymark turns a noisy morning into a few clear moments, so you can spend less energy
              organising and more on the day itself.
            </p>
            <Link
              className="inline-flex items-center gap-2 mt-[18px] text-[#ea580c] dark:text-[#94a3b8] hover:text-[#ea580c] dark:hover:text-[#fed7aa] text-[0.82rem] font-bold transition-colors"
              to="/register"
            >
              Build your first day <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-[15px]">
            <article className="border border-[#ea580c] bg-[#fed7aa] p-[22px_20px_24px] text-[#1f2937] dark:border-[#9a3412] dark:bg-[#fed7aa] dark:text-[#1f2937] md:p-[25px_28px_27px]">
              <span className="mb-5 block text-[0.68rem] font-bold tracking-[0.04em] text-[#c2410c] dark:text-[#9a3412]">
                08:30 · Start
              </span>
              <h3 className="mb-[9px] font-display text-[1.4rem] font-semibold tracking-[-0.035em] text-[#1f2937] dark:text-[#1f2937]">
                See the shape of today
              </h3>
              <p className="m-0 max-w-[410px] text-[0.86rem] leading-[1.55] text-[#1f2937]/80 dark:text-[#1f2937]/82">
                Bring tasks, notes, and the one thing you want to make space for into one calm view.
              </p>
              <div className="mt-6 grid gap-2.5 border-t border-[#c2410c]/25 pt-[18px] text-[0.74rem] text-[#1f2937] dark:border-[#c2410c]/25 dark:text-[#1f2937]">
                <span className="inline-flex items-center gap-2 [&>svg]:text-[#c2410c] dark:[&>svg]:text-[#c2410c]">
                  <Check size={14} /> Review project notes
                </span>
                <span className="inline-flex items-center gap-2 [&>svg]:text-[#c2410c] dark:[&>svg]:text-[#c2410c]">
                  <Check size={14} /> Call Mum after lunch
                </span>
                <span className="text-[#1f2937]/60 dark:text-[#1f2937]/65">
                  Take a proper break
                </span>
              </div>
            </article>
            <article className="p-[22px_20px_24px] md:p-[25px_28px_27px] border border-[#ccd4c8] dark:border-[#383838] bg-white/28 dark:bg-[#111a17]">
              <span className="block mb-5 text-[#ea580c] dark:text-[#fb923c] text-[0.68rem] font-bold tracking-[0.04em]">
                13:10 · Reset
              </span>
              <h3 className="mb-[9px] font-display text-[1.4rem] font-semibold tracking-[-0.035em] text-[#1f2937] dark:text-[#f2f4ee]">
                Adjust without starting over
              </h3>
              <p className="max-w-[410px] m-0 text-[#727b73] dark:text-[#a7b0bf] text-[0.86rem] leading-[1.55]">
                Plans change. Move what can wait, keep what matters, and carry on with a clear head.
              </p>
            </article>
            <article className="p-[22px_20px_24px] md:p-[25px_28px_27px] border border-[#ccd4c8] dark:border-[#383838] bg-white/28 dark:bg-[#111a17]">
              <span className="block mb-5 text-[#ea580c] dark:text-[#fb923c] text-[0.68rem] font-bold tracking-[0.04em]">
                18:40 · Close
              </span>
              <h3 className="mb-[9px] font-display text-[1.4rem] font-semibold tracking-[-0.035em] text-[#1f2937] dark:text-[#f2f4ee]">
                Finish with less on your mind
              </h3>
              <p className="max-w-[410px] m-0 text-[#727b73] dark:text-[#a7b0bf] text-[0.86rem] leading-[1.55]">
                Mark the small wins, leave a note for tomorrow, and let the day be done.
              </p>
            </article>
          </div>
        </section>

        <section
          className="grid grid-cols-1 md:grid-cols-[0.75fr_1.25fr] max-w-[1100px] mx-auto px-6 md:px-[30px] pb-[100px] md:pb-[145px] gap-[55px] md:gap-[clamp(45px,8vw,120px)]"
          aria-labelledby="use-cases-title"
        >
          <div className="max-w-[400px] md:max-w-[340px]">
            <p className="mb-[22px] text-[#ea580c] dark:text-[#fb923c] text-[0.72rem] font-bold tracking-[0.08em] uppercase">
              Made for real life
            </p>
            <h2
              id="use-cases-title"
              className="font-display text-[clamp(2.55rem,4.5vw,4.2rem)] font-semibold tracking-[-0.04em] leading-[0.96] text-[#1f2937] dark:text-[#f2f4ee]"
            >
              Useful when life gets full.
            </h2>
          </div>
          <div className="border-t border-[#c7cfc2] dark:border-[#383838]">
            <article className="grid grid-cols-[34px_1fr] md:grid-cols-[40px_1fr] py-[25px] border-b border-[#c7cfc2] dark:border-[#383838] gap-3.5 md:gap-[18px]">
              <span className="grid w-[34px] h-[34px] place-items-center border border-[#ea580c] dark:border-[#fb923c] rounded-full text-[#ea580c] dark:text-[#fb923c] bg-transparent dark:bg-[#fb923c]/10 text-[0.66rem] font-bold">
                <Sparkles size={17} />
              </span>
              <div>
                <h3 className="m-0 mb-2 font-display text-[1.27rem] font-semibold tracking-[-0.03em] text-[#1f2937] dark:text-[#f2f4ee]">
                  When work follows you home
                </h3>
                <p className="max-w-[440px] m-0 text-[#727b73] dark:text-[#a7b0bf] text-[0.84rem] leading-[1.55]">
                  Separate the urgent from the important, then close the laptop with a next step
                  ready.
                </p>
              </div>
            </article>
            <article className="grid grid-cols-[34px_1fr] md:grid-cols-[40px_1fr] py-[25px] border-b border-[#c7cfc2] dark:border-[#383838] gap-3.5 md:gap-[18px]">
              <span className="grid w-[34px] h-[34px] place-items-center border border-[#ea580c] dark:border-[#fb923c] rounded-full text-[#ea580c] dark:text-[#fb923c] bg-transparent dark:bg-[#fb923c]/10 text-[0.66rem] font-bold">
                <span>02</span>
              </span>
              <div>
                <h3 className="m-0 mb-2 font-display text-[1.27rem] font-semibold tracking-[-0.03em] text-[#1f2937] dark:text-[#f2f4ee]">
                  When your brain has too many tabs open
                </h3>
                <p className="max-w-[440px] m-0 text-[#727b73] dark:text-[#a7b0bf] text-[0.84rem] leading-[1.55]">
                  Capture the loose thoughts before they become tomorrow’s background noise.
                </p>
              </div>
            </article>
            <article className="grid grid-cols-[34px_1fr] md:grid-cols-[40px_1fr] py-[25px] border-b border-[#c7cfc2] dark:border-[#383838] gap-3.5 md:gap-[18px]">
              <span className="grid w-[34px] h-[34px] place-items-center border border-[#ea580c] dark:border-[#fb923c] rounded-full text-[#ea580c] dark:text-[#fb923c] bg-transparent dark:bg-[#fb923c]/10 text-[0.66rem] font-bold">
                <span>03</span>
              </span>
              <div>
                <h3 className="m-0 mb-2 font-display text-[1.27rem] font-semibold tracking-[-0.03em] text-[#1f2937] dark:text-[#f2f4ee]">
                  When you want more than productivity
                </h3>
                <p className="max-w-[440px] m-0 text-[#727b73] dark:text-[#a7b0bf] text-[0.84rem] leading-[1.55]">
                  Keep room for people, rest, and the things you would miss if they were never
                  scheduled.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section
          className="relative py-[88px] md:py-[112px] pb-24 md:pb-[120px] px-6 text-center text-[#1f2937] dark:text-[#1f2937] bg-[#fed7aa] dark:bg-[#fed7aa]"
          id="stories"
          aria-label="Member stories"
          aria-roledescription="carousel"
        >
          <p
            className="h-12 m-0 text-[#c2410c] dark:text-[#9a3412] font-display text-[6rem] leading-[0.8] select-none"
            aria-hidden="true"
          >
            “
          </p>
          <div
            className="grid max-w-[760px] mx-auto items-center [grid-template-areas:'slide']"
            aria-live="polite"
          >
            {MEMBER_STORIES.map((story, index) => {
              const isActive = index === activeStory
              return (
                <div
                  key={story.id}
                  className={`[grid-area:slide] flex flex-col justify-center items-center transition-all duration-300 ${
                    isActive
                      ? 'opacity-100 visible pointer-events-auto translate-y-0'
                      : 'opacity-0 invisible pointer-events-none translate-y-1.5'
                  }`}
                  aria-hidden={!isActive}
                >
                  <blockquote className="max-w-[760px] mx-auto my-6 md:my-[25px] mb-5 font-display text-[clamp(2rem,4.2vw,4rem)] font-semibold tracking-[-0.04em] leading-[1.05]">
                    {story.quote}
                  </blockquote>
                  <p className="m-0 text-[#1f2937]/80 dark:text-[#1f2937]/80 text-[0.78rem] font-medium tracking-[0.02em]">
                    {story.name} · {story.role}, {story.location}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="inline-flex items-center justify-center gap-[18px] mt-[26px] md:mt-9">
            <button
              type="button"
              className="grid place-items-center w-[38px] h-[38px] p-0 border border-[#1f2937]/35 dark:border-[#1f2937]/35 rounded-full text-[#1f2937] dark:text-[#1f2937] bg-transparent cursor-pointer transition-all duration-200 hover:border-[#c2410c] dark:hover:border-[#9a3412] hover:bg-[#1f2937]/10 dark:hover:bg-[#1f2937]/10 hover:scale-105 focus-visible:outline-2 focus-visible:outline-[#c2410c] dark:focus-visible:outline-[#9a3412] focus-visible:outline-offset-2"
              onClick={handlePrevStory}
              aria-label="Previous story"
            >
              <ChevronLeft size={18} />
            </button>
            <div
              className="flex items-center gap-2"
              role="tablist"
              aria-label="Member stories navigation"
            >
              {MEMBER_STORIES.map((story, index) => (
                <button
                  key={story.id}
                  type="button"
                  role="tab"
                  className={`p-0 border-0 rounded-full cursor-pointer transition-all duration-250 ${
                    index === activeStory
                      ? 'w-6 h-2 bg-[#c2410c] dark:bg-[#c2410c]'
                      : 'w-2 h-2 bg-[#1f2937]/40 hover:bg-[#1f2937]/75 dark:bg-[#1f2937]/40 dark:hover:bg-[#1f2937]/75'
                  }`}
                  onClick={() => setActiveStory(index)}
                  aria-label={`Go to story ${index + 1}: ${story.name}`}
                  aria-selected={index === activeStory}
                />
              ))}
            </div>
            <button
              type="button"
              className="grid place-items-center w-[38px] h-[38px] p-0 border border-[#1f2937]/35 dark:border-[#1f2937]/35 rounded-full text-[#1f2937] dark:text-[#1f2937] bg-transparent cursor-pointer transition-all duration-200 hover:border-[#c2410c] dark:hover:border-[#9a3412] hover:bg-[#1f2937]/10 dark:hover:bg-[#1f2937]/10 hover:scale-105 focus-visible:outline-2 focus-visible:outline-[#c2410c] dark:focus-visible:outline-[#9a3412] focus-visible:outline-offset-2"
              onClick={handleNextStory}
              aria-label="Next story"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </section>

        <section
          className="py-[100px] md:py-[145px] pb-[110px] md:pb-[150px] px-6 text-center"
          aria-labelledby="closing-title"
        >
          <p className="mb-[22px] text-[#ea580c] dark:text-[#fb923c] text-[0.72rem] font-bold tracking-[0.08em] uppercase">
            Start with today
          </p>
          <h2
            id="closing-title"
            className="mb-7 font-display text-[clamp(3rem,6vw,5.7rem)] font-semibold tracking-[-0.04em] leading-[0.96] text-[#1f2937] dark:text-[#f2f4ee] [&>em]:font-semibold [&>em]:text-[#48664a] dark:[&>em]:text-[#94a3b8] [&>em]:not-italic"
          >
            Make a little room
            <br />
            <em>for your life.</em>
          </h2>
          <Link
            className="inline-flex items-center gap-2.5 rounded-full text-[0.85rem] font-bold px-[21px] py-[15px] text-[#f7f6f2] bg-[#ea580c] hover:bg-[#c2410c] dark:text-[#1f2937] dark:bg-[#fed7aa] dark:hover:bg-[#ffedd5] dark:border dark:border-[#fed7aa] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-[#fed7aa] focus-visible:outline-offset-4"
            to="/register"
          >
            Start for free <ArrowRight size={17} />
          </Link>
          <p className="mt-4 text-[#8b958c] dark:text-[#8a988d] text-[0.7rem]">
            Free forever for personal use · No credit card
          </p>
        </section>
      </main>

      <footer className="px-6 md:px-[5vw] text-[#f3f4f6] bg-[#1f2937] dark:bg-app-background dark:border-t dark:border-[#2f2f2f]">
        <div className="flex flex-col md:flex-row min-h-0 md:min-h-[285px] items-start md:items-end justify-between py-[68px] md:py-[72px] pb-11 md:pb-[58px] border-b border-[#f3f4f6]/15 gap-7.5 md:gap-10">
          <div>
            <p className="mb-5 text-[#fdba74] text-[0.7rem] font-bold tracking-[0.08em] uppercase">
              Make room for what matters
            </p>
            <h2 className="m-0 text-[#f7f6f2] font-display text-[clamp(3.3rem,16vw,5rem)] md:text-[clamp(3.3rem,6vw,6.6rem)] font-semibold tracking-[-0.04em] leading-[1.08] [&>em]:text-[#fdba74] [&>em]:font-semibold [&>em]:not-italic">
              Less noise.
              <br />
              <em>More day.</em>
            </h2>
          </div>
          <Link
            className="inline-flex shrink-0 items-center gap-2.5 p-[15px_20px] mb-0 md:mb-1 border border-[#f3f4f6]/35 rounded-full text-[#f7f6f2] text-[0.8rem] font-bold transition-all duration-200 hover:border-[#fed7aa] hover:text-[#1f2937] hover:bg-[#fed7aa]"
            to="/register"
          >
            Start for free <ArrowUpRight size={17} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-[minmax(240px,2fr)_repeat(2,minmax(130px,0.8fr))_minmax(230px,1.35fr)] py-[45px] md:py-[62px] pb-[52px] md:pb-[70px] gap-x-6 md:gap-[clamp(35px,6vw,90px)] gap-y-11">
          <div className="col-span-2 md:col-span-1 max-w-[320px] md:max-w-[285px]">
            <a
              className="group inline-flex items-center gap-[9px] text-[#f7f6f2] text-[0.95rem] font-bold tracking-[0.06em] uppercase"
              href="#top"
              aria-label="Daymark home"
            >
              <BrandMark />
              <span>DAYMARK</span>
            </a>
            <p className="my-6 mb-5 text-[#f3f4f6]/60 font-sans text-[1.12rem] leading-[1.48]">
              A calmer way to plan the days that matter to you.
            </p>
            <a
              className="inline-flex items-center gap-2 text-[#fdba74] text-[0.73rem] font-bold hover:text-white transition-colors"
              href="mailto:hello@daymark.app"
            >
              <Mail size={15} /> hello@daymark.app
            </a>
          </div>

          <nav
            className="pt-1.5 [&>h3]:m-0 [&>h3]:mb-6 [&>h3]:text-[#f7f6f2] [&>h3]:text-[0.75rem] [&>h3]:font-bold [&>h3]:tracking-[0.02em] [&>a]:flex [&>a]:w-fit [&>a]:items-center [&>a]:gap-1.5 [&>a]:mb-3.5 [&>a]:text-[#f3f4f6]/60 [&>a]:text-[0.76rem] hover:[&>a]:text-[#f7f6f2] transition-colors [&>a>svg]:opacity-0 [&>a>svg]:-translate-x-1 [&>a>svg]:translate-y-1 hover:[&>a>svg]:opacity-100 hover:[&>a>svg]:translate-none [&>a>svg]:transition-all"
            aria-label="Product links"
          >
            <h3>Explore</h3>
            <a href="#how-it-works">
              How it works <ArrowUpRight size={13} />
            </a>
            <a href="#principles">
              Our approach <ArrowUpRight size={13} />
            </a>
            <a href="#stories">
              Member stories <ArrowUpRight size={13} />
            </a>
            <Link to="/pricing">
              Pricing <ArrowUpRight size={13} />
            </Link>
          </nav>

          <nav
            className="pt-1.5 [&>h3]:m-0 [&>h3]:mb-6 [&>h3]:text-[#f7f6f2] [&>h3]:text-[0.75rem] [&>h3]:font-bold [&>h3]:tracking-[0.02em] [&>a]:flex [&>a]:w-fit [&>a]:items-center [&>a]:gap-1.5 [&>a]:mb-3.5 [&>a]:text-[#f3f4f6]/60 [&>a]:text-[0.76rem] hover:[&>a]:text-[#f7f6f2] transition-colors [&>a>svg]:opacity-0 [&>a>svg]:-translate-x-1 [&>a>svg]:translate-y-1 hover:[&>a>svg]:opacity-100 hover:[&>a>svg]:translate-none [&>a>svg]:transition-all"
            aria-label="Company links"
          >
            <h3>Daymark</h3>
            <a href="#start">
              Get started <ArrowUpRight size={13} />
            </a>
            <Link to="/login">
              Log in <ArrowUpRight size={13} />
            </Link>
            <a href="mailto:hello@daymark.app">
              Contact us <ArrowUpRight size={13} />
            </a>
          </nav>

          <div className="col-span-2 md:col-span-1 pt-[30px] md:pt-1.5 pl-0 md:pl-[clamp(20px,3vw,48px)] border-t md:border-t-0 md:border-l border-[#f3f4f6]/15">
            <h3 className="m-0 mb-6 text-[#f7f6f2] font-display text-[1.15rem] font-semibold tracking-[-0.02em] leading-[1.25]">
              A better rhythm, occasionally.
            </h3>
            <p className="max-w-[250px] -mt-2 mb-5 text-[#f3f4f6]/60 text-[0.75rem] leading-[1.55]">
              Thoughtful notes on planning, focus, and leaving room to live.
            </p>
            <a
              className="inline-flex items-center gap-2 pb-1 border-b border-[#fdba74]/45 text-[#fdba74] text-[0.73rem] font-bold hover:border-[#fdba74] transition-colors"
              href="mailto:hello@daymark.app?subject=Daymark%20notes"
            >
              Ask for the notes <ArrowRight size={15} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center py-6 md:py-[23px] pb-7 border-t border-[#f3f4f6]/15 text-[#f3f4f6]/50 text-[0.66rem] gap-4 md:gap-0">
          <span>© 2026 Daymark. Made for real life.</span>
          <span className="hidden md:inline-flex items-center gap-2 [&>span]:w-1.5 [&>span]:h-1.5 [&>span]:rounded-full [&>span]:bg-[#fdba74] [&>span]:shadow-[0_0_0_3px_rgba(213,223,172,0.1)]">
            <span aria-hidden="true" /> All systems calm
          </span>
          <a
            className="justify-self-end text-[#fdba74] font-bold hover:text-white transition-colors"
            href="#top"
          >
            Back to top ↑
          </a>
        </div>
      </footer>
    </div>
  )
}
