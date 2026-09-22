import { ArrowRight, ArrowUpRight, Check, Mail } from 'lucide-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { BrandMark } from '../components/BrandMark'
import { Navbar } from '../components/Navbar'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <div className="min-h-screen overflow-hidden text-[#27352f] dark:text-[#edebe4] bg-[#f4f1e9] dark:bg-[#111a17] transition-colors duration-250">
      <Navbar variant="light" />

      <main>
        <section className="flex flex-col lg:grid lg:grid-cols-[minmax(0,0.82fr)_minmax(440px,1.18fr)] max-w-[1320px] min-h-auto lg:min-h-[690px] items-stretch lg:items-center mx-auto pt-14 lg:pt-[70px] pb-20 lg:pb-[100px] px-5.5 md:px-[5vw] gap-12 lg:gap-[clamp(50px,8vw,130px)]" aria-labelledby="about-title">
          <div className="max-w-[520px] pb-5">
            <h1 id="about-title" className="m-0 mb-7 text-[#203b32] dark:text-[#f2f4ee] font-serif text-[clamp(3.15rem,14vw,5.2rem)] lg:text-[clamp(3.5rem,6.4vw,6.7rem)] font-normal leading-[0.94]">
              We made Daymark for the days that don’t fit in a checklist.
            </h1>
            <p className="max-w-[390px] m-0 mb-7.5 text-[#6f7b72] dark:text-[#9eaba1] font-serif text-[1.05rem] lg:text-[1.18rem] leading-[1.45]">
              Because the best plans leave room for the people, pauses, and small joys that make a day yours.
            </p>
            <a className="inline-flex items-center gap-2.5 text-[#315844] dark:text-[#a4d9b2] hover:text-[#b36d58] dark:hover:text-[#e5efc4] text-[0.8rem] font-bold transition-colors" href="#why-daymark">
              Read our story <ArrowRight size={16} />
            </a>
          </div>
          <figure
            className="relative min-h-[430px] lg:min-h-[540px] m-0 overflow-hidden text-[#f4f1e9] dark:text-[#f2f4ee] bg-[#203b32] dark:bg-[#1b3027] isolate before:absolute before:inset-3.5 before:border before:border-[#f4f1e9]/25 dark:before:border-[#f2f4ee]/20 before:pointer-events-none after:absolute after:-right-[13%] after:-bottom-[18%] after:w-[76%] after:h-[76%] after:border after:border-[#e5efc4]/40 after:rounded-full after:rotate-[-18deg]"
            aria-label="A visual reminder to make room for what matters"
          >
            <div className="absolute z-10 flex justify-between w-[calc(100%-56px)] left-7 top-[30px] text-[#f4f1e9]/65 text-[0.65rem] font-bold tracking-[0.1em]">
              <span>DAYMARK / 2026</span>
              <span>MAKE ROOM</span>
            </div>
            <div className="absolute -z-10 w-[78%] aspect-square top-[13%] -left-[28%] border border-[#f4f1e9]/25 rounded-full" />
            <div className="absolute -z-10 w-[104%] aspect-square -top-[9%] -left-[22%] border border-[#f4f1e9]/12 rounded-full" />
            <div className="absolute top-[27%] right-[16%] lg:right-[18%] w-[145px] lg:w-[min(190px,28vw)] aspect-square rounded-full bg-[#d5dfac] shadow-[0_0_0_22px_rgba(213,223,172,0.1),0_0_0_44px_rgba(213,223,172,0.06)]" />
            <div className="absolute right-[12%] lg:right-[17%] bottom-[17%] lg:bottom-[19%] flex flex-col gap-3.5 w-[170px] p-[18px_19px_20px] text-[#203b32] bg-[#f4f1e9] dark:text-[#1b3027] dark:bg-[#edebe4] rotate-[-6deg] shadow-[0_18px_38px_rgba(8,26,21,0.22)] [&>span]:text-[#b36d58] [&>span]:text-[0.63rem] [&>span]:font-bold [&>span]:tracking-[0.1em] [&>span]:uppercase [&>strong]:font-serif [&>strong]:text-[1.65rem] [&>strong]:font-normal [&>strong]:tracking-[-0.05em] [&>strong]:leading-[0.95]">
              <span>Today</span>
              <strong>enough<br />is a plan</strong>
            </div>
            <div className="absolute z-10 flex justify-between items-end w-[calc(100%-56px)] left-7 bottom-7 text-[#f4f1e9]/65 text-[0.65rem] font-bold tracking-[0.1em] [&>span:last-child]:text-[#d5dfac] [&>span:last-child]:text-right [&>span:last-child]:leading-[1.35]">
              <span>01</span>
              <span>Less noise<br />more life</span>
            </div>
          </figure>
        </section>

        <section className="flex flex-col md:grid md:grid-cols-[0.8fr_1.2fr] max-w-[1080px] mx-auto py-[90px] md:py-[125px] pb-[100px] md:pb-[140px] px-6 md:px-[30px] gap-9 md:gap-[clamp(50px,11vw,170px)]" id="why-daymark" aria-labelledby="story-title">
          <div className="pt-2.5 text-[#b36d58] dark:text-[#e08a70] text-[0.71rem] font-bold tracking-[0.1em] uppercase">Our starting point</div>
          <div>
            <h2 id="story-title" className="max-w-[650px] m-0 mb-7 text-[#203b32] dark:text-[#f2f4ee] font-serif text-[clamp(2.65rem,12vw,4.8rem)] font-normal leading-[0.96]">
              Productivity had become another thing to keep up with.
            </h2>
            <p className="max-w-[540px] m-0 mb-4 text-[#6f7b72] dark:text-[#9eaba1] text-[0.94rem] leading-[1.7]">
              We wanted a daily tool that felt more like a steady hand than a scoreboard. Somewhere to catch the open loops, choose what matters now, and close the day without carrying every unfinished task into tomorrow.
            </p>
            <p className="max-w-[540px] m-0 mb-4 text-[#6f7b72] dark:text-[#9eaba1] text-[0.94rem] leading-[1.7]">
              Daymark is built around that quieter idea: a plan is useful when it helps you return to your life with more attention, not when it asks you to optimise every minute.
            </p>
          </div>
        </section>

        <section className="flex min-h-[250px] md:min-h-[310px] flex-col items-center justify-center p-[70px_24px] text-[#f4f1e9] text-center bg-[#b36d58] dark:bg-[#8e4230]" aria-label="Daymark statement">
          <p className="m-0 mb-3.5 font-serif text-[clamp(2.3rem,11vw,5.2rem)] font-normal tracking-[-0.055em] leading-[0.98]">“Make room for what matters.”</p>
          <span className="text-[#f4f1e9]/80 text-[0.76rem] tracking-[0.04em]">That is the whole brief.</span>
        </section>

        <section className="flex flex-col md:grid md:grid-cols-[0.85fr_1.15fr] max-w-[1120px] mx-auto py-[90px] md:py-[140px] pb-[100px] md:pb-[155px] px-6 md:px-[30px] gap-9 md:gap-[clamp(50px,10vw,150px)]" id="principles" aria-labelledby="principles-title">
          <div>
            <p className="mb-5 text-[#b36d58] dark:text-[#e08a70] text-[0.7rem] font-bold tracking-[0.08em] uppercase">01 — The way we work</p>
            <h2 id="principles-title" className="m-0 text-[#203b32] dark:text-[#f2f4ee] font-serif text-[clamp(2.65rem,12vw,4.7rem)] font-normal leading-[0.96] [&>em]:font-normal [&>em]:text-[#6e8b72] dark:[&>em]:text-[#a7d0ab] [&>em]:not-italic">
              Useful, kind, and<br /><em>quietly intentional.</em>
            </h2>
          </div>
          <div className="border-t border-[#c7cfc2] dark:border-[#253931]">
            <article className="grid grid-cols-[32px_1fr] gap-4.5 py-[25px] border-b border-[#c7cfc2] dark:border-[#253931]">
              <span className="grid w-[27px] h-[27px] place-items-center border border-[#b36d58] dark:border-[#e08a70] rounded-full text-[#b36d58] dark:text-[#e08a70] bg-transparent dark:bg-[#e08a70]/10">
                <Check size={15} />
              </span>
              <div>
                <h3 className="m-0 mb-2 text-[#203b32] dark:text-[#f2f4ee] font-serif text-[1.35rem] font-normal tracking-[-0.03em]">Clarity before complexity</h3>
                <p className="max-w-[410px] m-0 text-[#727b73] dark:text-[#9eaba1] text-[0.86rem] leading-[1.58]">We start by reducing mental noise. Every feature should make the next right thing easier to see.</p>
              </div>
            </article>
            <article className="grid grid-cols-[32px_1fr] gap-4.5 py-[25px] border-b border-[#c7cfc2] dark:border-[#253931]">
              <span className="grid w-[27px] h-[27px] place-items-center border border-[#b36d58] dark:border-[#e08a70] rounded-full text-[#b36d58] dark:text-[#e08a70] bg-transparent dark:bg-[#e08a70]/10">
                <Check size={15} />
              </span>
              <div>
                <h3 className="m-0 mb-2 text-[#203b32] dark:text-[#f2f4ee] font-serif text-[1.35rem] font-normal tracking-[-0.03em]">Life is part of the plan</h3>
                <p className="max-w-[410px] m-0 text-[#727b73] dark:text-[#9eaba1] text-[0.86rem] leading-[1.58]">Rest, relationships, and ordinary moments are not distractions from a productive day.</p>
              </div>
            </article>
            <article className="grid grid-cols-[32px_1fr] gap-4.5 py-[25px] border-b border-[#c7cfc2] dark:border-[#253931]">
              <span className="grid w-[27px] h-[27px] place-items-center border border-[#b36d58] dark:border-[#e08a70] rounded-full text-[#b36d58] dark:text-[#e08a70] bg-transparent dark:bg-[#e08a70]/10">
                <Check size={15} />
              </span>
              <div>
                <h3 className="m-0 mb-2 text-[#203b32] dark:text-[#f2f4ee] font-serif text-[1.35rem] font-normal tracking-[-0.03em]">Finish with less to carry</h3>
                <p className="max-w-[410px] m-0 text-[#727b73] dark:text-[#9eaba1] text-[0.86rem] leading-[1.58]">A good day can end unfinished. What matters is knowing what can wait, and letting it.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="flex flex-col md:grid md:grid-cols-[0.75fr_1.25fr] max-w-[1080px] mx-auto py-[90px] md:py-[120px] pb-[100px] md:pb-[150px] px-6 md:px-[30px] gap-9 md:gap-[clamp(50px,10vw,145px)]" aria-labelledby="ritual-title">
          <div className="pt-2.5 text-[#b36d58] dark:text-[#e08a70] text-[0.71rem] font-bold tracking-[0.1em] uppercase">The Daymark ritual</div>
          <div>
            <h2 id="ritual-title" className="max-w-[650px] m-0 mb-6 text-[#203b32] dark:text-[#f2f4ee] font-serif text-[clamp(2.65rem,12vw,4.7rem)] font-normal leading-[0.96] [&>em]:font-normal [&>em]:text-[#6e8b72] dark:[&>em]:text-[#a7d0ab] [&>em]:not-italic">
              Start with what’s real.<br /><em>End with what’s enough.</em>
            </h2>
            <p className="max-w-[470px] m-0 mb-6 text-[#6f7b72] dark:text-[#9eaba1] text-[0.94rem] leading-[1.65]">
              Capture the thoughts circling your head. Choose a few things that deserve your attention. Then leave a little space for the day to surprise you.
            </p>
            <Link className="inline-flex items-center gap-2 text-[#315844] dark:text-[#a4d9b2] hover:text-[#b36d58] dark:hover:text-[#e5efc4] text-[0.8rem] font-bold transition-colors" to="/register">
              Try a gentler way to plan <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="px-6 md:px-[5vw] text-[#eef1e8] bg-[#203b32] dark:bg-[#0d1513] dark:border-t dark:border-[#1a2923]">
        <div className="flex flex-col md:flex-row min-h-0 md:min-h-[285px] items-start md:items-end justify-between py-[68px] md:py-[72px] pb-11 md:pb-[58px] border-b border-[#eef1e8]/15 gap-7.5 md:gap-10">
          <div>
            <p className="m-0 mb-5 text-[#d5dfac] text-[0.7rem] font-bold tracking-[0.08em] uppercase">Make room for what matters</p>
            <h2 className="m-0 text-[#f4f1e9] font-serif text-[clamp(3.3rem,16vw,5rem)] md:text-[clamp(3.3rem,6vw,6.6rem)] font-normal leading-[0.82] [&>em]:font-normal [&>em]:text-[#6e8b72] dark:[&>em]:text-[#a7d0ab] [&>em]:not-italic">
              Begin with<br /><em>today.</em>
            </h2>
          </div>
          <Link className="inline-flex items-center gap-2.5 p-[15px_20px] mb-0 md:mb-1 border border-[#eef1e8]/35 rounded-full text-[#f4f1e9] text-[0.8rem] font-bold transition-all hover:border-[#e5efc4] hover:text-[#203b32] hover:bg-[#e5efc4]" to="/register">
            Start for free <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="flex flex-wrap md:grid md:grid-cols-[1fr_auto_1fr] items-center py-6 md:py-[23px] pb-7 text-[#eef1e8]/50 text-[0.66rem] gap-5 md:gap-0">
          <Link className="group inline-flex items-center gap-2.5 text-[#f4f1e9] text-[0.86rem] font-bold tracking-[0.1em]" to="/">
            <BrandMark />
            <span>DAYMARK</span>
          </Link>
          <a className="inline-flex items-center gap-2 text-[#d5dfac] font-bold hover:text-white transition-colors" href="mailto:hello@daymark.app">
            <Mail size={14} /> hello@daymark.app
          </a>
          <span className="w-full md:w-auto md:justify-self-end">© 2026 Daymark. Made for real life.</span>
        </div>
      </footer>
    </div>
  )
}
