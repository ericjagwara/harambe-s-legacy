import { useState, type FormEvent } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { asset, partnerLogos } from '../data'
import { pageHref, type PageKey } from '../routes'

const eventLinks: Array<[PageKey, string]> = [
  ['runners', 'Runners'],
  ['route', 'Route'],
  ['programs', 'Programs'],
  ['partners', 'Partners'],
  ['results', 'Results'],
]

const actionLinks: Array<[PageKey, string]> = [
  ['register', 'Register'],
  ['donate', 'Donate'],
  ['contact', 'Contact'],
]

export default function Footer() {
  const [joined, setJoined] = useState(false)

  const subscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setJoined(true)
    event.currentTarget.reset()
  }

  return (
    <footer className="bg-primary text-white">
      <div className="border-b border-white/12 bg-secondary text-secondary-foreground">
        <div className="container-site flex flex-col gap-3 py-4 font-ui text-[11px] font-bold uppercase tracking-[0.18em] sm:flex-row sm:items-center sm:justify-between">
          <p>Run the city. Fund Uganda's next investable startups.</p>
          <a href={pageHref('register')} className="inline-flex items-center transition-colors hover:text-primary">
            Register for 2026
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="container-site py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex bg-white px-4 py-3">
              <img src={asset('brand-logo.webp')} alt="Startup Harambe, run by SFV" className="h-10 w-auto object-contain" />
            </div>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/72">
              A multi-origin fundraising run connecting students, entrepreneurs, universities and investors into one public startup funding pipeline.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-secondary">
              <span>#StartupsHarambeRun</span>
              <span>#HarambeRun</span>
              <span>#HarambeInnovation</span>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <p className="font-ui text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">Event</p>
              <ul className="mt-4 space-y-3 text-sm font-bold uppercase tracking-[0.08em] text-white/72">
                {eventLinks.map(([page, label]) => (
                  <li key={page}>
                    <a href={pageHref(page)} className="transition-colors hover:text-secondary">{label}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-ui text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">Take part</p>
              <ul className="mt-4 space-y-3 text-sm font-bold uppercase tracking-[0.08em] text-white/72">
                {actionLinks.map(([page, label]) => (
                  <li key={page}>
                    <a href={pageHref(page)} className="transition-colors hover:text-secondary">{label}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-ui text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">Updates</p>
              <form onSubmit={subscribe} className="mt-4 flex border border-white/20">
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-white/45"
                />
                <button className="border-l border-white/20 bg-secondary px-3 text-secondary-foreground" type="submit" aria-label="Subscribe">
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </form>
              {joined ? <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-secondary">You are on the update list.</p> : null}
            </div>
          </div>
        </div>

        <div className="mt-12 border-y border-white/12 py-6">
          <div className="grid gap-px bg-white/10 sm:grid-cols-3 lg:grid-cols-6">
            {partnerLogos.map((logo) => (
              <div key={logo.name} className="flex h-20 items-center justify-center bg-white px-4 py-4">
                <img src={logo.src} alt={`${logo.name} logo`} className="max-h-9 w-auto object-contain" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-3 font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-white/45 sm:flex-row">
          <p>Startups Harambe Run 2026</p>
          <p>TechBuzz Hub and Startup Funding Vehicles</p>
          <p>Kampala, Uganda</p>
        </div>
      </div>
    </footer>
  )
}
