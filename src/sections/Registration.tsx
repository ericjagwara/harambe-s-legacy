import { useEffect, useState, type FormEvent } from 'react'
import Reveal from '../components/Reveal'
import { booths, neighborhoodStarts, sponsorTiers, universityStarts } from '../data'

export type RegistrationTab = 'run' | 'donate' | 'sponsor' | 'booth' | 'volunteer'

const tabs: Array<[RegistrationTab, string]> = [
  ['run', 'Run'],
  ['donate', 'Donate'],
  ['sponsor', 'Sponsor'],
  ['booth', 'Exhibit'],
  ['volunteer', 'Volunteer'],
]

const startPoints = [...universityStarts, ...neighborhoodStarts]

export default function Registration({ initialTab = 'run' }: { initialTab?: RegistrationTab }) {
  const [active, setActive] = useState<RegistrationTab>(initialTab)
  const [submitted, setSubmitted] = useState('')

  useEffect(() => {
    setActive(initialTab)
    setSubmitted('')
  }, [initialTab])

  const submit = (event: FormEvent<HTMLFormElement>, label: string) => {
    event.preventDefault()
    setSubmitted(`${label} captured for follow-up. Final payment gateway and confirmation workflow will be connected by TechBuzz Hub.`)
    event.currentTarget.reset()
  }

  return (
    <section id="register" className="relative border-b border-border bg-background py-14 lg:py-20">
      <div className="container-site">
        <div className="grid gap-4 lg:grid-cols-[0.3fr_0.7fr]">
          <Reveal>
            <div className="h-full bg-foreground p-4 text-white sm:p-5">
              <div className="grid gap-2">
                {tabs.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setActive(key)
                      setSubmitted('')
                    }}
                    className={`border px-4 py-4 text-left font-ui text-xs font-black uppercase tracking-[0.2em] transition-colors ${
                      active === key
                        ? 'border-secondary bg-secondary text-secondary-foreground'
                        : 'border-white/15 bg-white/5 text-white hover:border-secondary hover:text-secondary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-6 border-t border-white/15 p-4">
                <p className="font-ui text-[11px] font-black uppercase tracking-[0.22em] text-secondary">Payment note</p>
                <p className="mt-3 text-sm leading-6 text-white/66">
                  Ticket, donation, sponsorship and booth payments are designed for one gateway flow. Mobile Money and card channels remain subject to TechBuzz Hub confirmation.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="bg-white p-6 sm:p-9">
              {submitted ? (
                <div className="mb-7 border border-primary bg-primary p-6 text-primary-foreground">
                  <p className="font-ui text-[11px] font-black uppercase tracking-[0.22em] text-secondary">Request received</p>
                  <p className="mt-3 text-lg leading-8">{submitted}</p>
                </div>
              ) : null}

              {active === 'run' ? (
                <form onSubmit={(event) => submit(event, 'Runner registration')} className="grid gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="runner-name">Full name</label>
                      <input className="field" id="runner-name" name="name" required />
                    </div>
                    <div>
                      <label className="label" htmlFor="runner-email">Email</label>
                      <input className="field" id="runner-email" type="email" name="email" required />
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="category">Category</label>
                      <select className="field" id="category" name="category" required>
                        <option>Student runner, UGX 30,000</option>
                        <option>General public runner, UGX 50,000</option>
                      </select>
                    </div>
                    <div>
                      <label className="label" htmlFor="start">Starting point</label>
                      <select className="field" id="start" name="start" required>
                        {startPoints.map((point) => (
                          <option key={point}>{point}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="student-id">Student ID upload, required for student rate</label>
                    <input className="field bg-background" id="student-id" type="file" name="studentId" accept="image/*,.pdf" />
                  </div>
                  <button className="btn-primary w-full sm:w-auto" type="submit">Proceed to payment</button>
                </form>
              ) : null}

              {active === 'donate' ? (
                <form onSubmit={(event) => submit(event, 'Donation pledge')} className="grid gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="donor-name">Name or organisation</label>
                      <input className="field" id="donor-name" name="name" required />
                    </div>
                    <div>
                      <label className="label" htmlFor="donor-email">Email</label>
                      <input className="field" id="donor-email" type="email" name="email" required />
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="amount">Amount, UGX</label>
                      <input className="field" id="amount" name="amount" inputMode="numeric" placeholder="500000" required />
                    </div>
                    <div>
                      <label className="label" htmlFor="display">Public display</label>
                      <select className="field" id="display" name="display" required>
                        <option>Show my name</option>
                        <option>Display as anonymous</option>
                      </select>
                    </div>
                  </div>
                  <button className="btn-gold w-full sm:w-auto" type="submit">Pledge donation</button>
                </form>
              ) : null}

              {active === 'sponsor' ? (
                <form onSubmit={(event) => submit(event, 'Sponsorship interest')} className="grid gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="sponsor-org">Organisation</label>
                      <input className="field" id="sponsor-org" name="organisation" required />
                    </div>
                    <div>
                      <label className="label" htmlFor="sponsor-email">Email</label>
                      <input className="field" id="sponsor-email" type="email" name="email" required />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="tier">Preferred package</label>
                    <select className="field" id="tier" name="tier" required>
                      {sponsorTiers.map((tier) => (
                        <option key={tier.name}>{tier.name}, {tier.price}</option>
                      ))}
                      <option>Sector or event-specific package</option>
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="sponsor-message">Partnership note</label>
                    <textarea className="field min-h-32" id="sponsor-message" name="message" />
                  </div>
                  <button className="btn-primary w-full sm:w-auto" type="submit">Submit sponsor interest</button>
                </form>
              ) : null}

              {active === 'booth' ? (
                <form onSubmit={(event) => submit(event, 'Exhibition booth request')} className="grid gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="booth-org">Organisation</label>
                      <input className="field" id="booth-org" name="organisation" required />
                    </div>
                    <div>
                      <label className="label" htmlFor="booth-email">Email</label>
                      <input className="field" id="booth-email" type="email" name="email" required />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="booth">Booth package</label>
                    <select className="field" id="booth" name="booth" required>
                      {booths.map((booth) => (
                        <option key={booth.name}>{booth.name}, {booth.size}, {booth.price}</option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-start gap-3 border border-border bg-background p-4 text-sm leading-6 text-foreground">
                    <input className="mt-1 h-4 w-4 accent-[#007a45]" type="checkbox" name="earlyStage" />
                    <span>Request early-stage startup Bronze verification. Company registration must be dated 1 to 3 years before the event with annual revenue up to UGX 35,000,000.</span>
                  </label>
                  <button className="btn-primary w-full sm:w-auto" type="submit">Book booth</button>
                </form>
              ) : null}

              {active === 'volunteer' ? (
                <form onSubmit={(event) => submit(event, 'Volunteer sign-up')} className="grid gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="vol-name">Full name</label>
                      <input className="field" id="vol-name" name="name" required />
                    </div>
                    <div>
                      <label className="label" htmlFor="vol-email">Email</label>
                      <input className="field" id="vol-email" type="email" name="email" required />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="vol-role">Preferred support area</label>
                    <select className="field" id="vol-role" name="role" required>
                      <option>Route marshal support</option>
                      <option>Registration and kit collection</option>
                      <option>Media and content</option>
                      <option>Fundraising and donor care</option>
                      <option>Event-day operations</option>
                    </select>
                  </div>
                  <button className="btn-outline w-full sm:w-auto" type="submit">Join as volunteer</button>
                </form>
              ) : null}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
