import { useState, type FormEvent } from 'react'
import { Mail, MapPin, Send } from 'lucide-react'
import Reveal from '../components/Reveal'
import { PageHero, PageSection } from '../components/PageLayout'

export default function ContactPage() {
  const [sent, setSent] = useState(false)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSent(true)
    event.currentTarget.reset()
  }

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Speak with the run secretariat."
        copy="For registration support, sponsorship, exhibition space, media and route information, send a message to the organising team."
      />

      <PageSection className="bg-white">
        <div className="grid gap-4 lg:grid-cols-[0.38fr_0.62fr]">
          <Reveal>
            <div className="h-full bg-primary p-6 text-white sm:p-8">
              <p className="eyebrow">Event office</p>
              <h2 className="mt-4 font-display text-4xl uppercase leading-[0.95]">Kampala, Uganda.</h2>
              <div className="mt-10 space-y-3">
                <div className="flex gap-4 bg-white/[0.07] p-5">
                  <Mail className="mt-1 h-5 w-5 shrink-0 text-secondary" />
                  <div>
                    <p className="font-ui text-[11px] font-bold uppercase tracking-[0.18em]">Official channel</p>
                    <p className="mt-2 text-sm leading-6 text-white/68">www.haramberun.com. Official email and phone numbers are being confirmed by TechBuzz Hub.</p>
                  </div>
                </div>
                <div className="flex gap-4 bg-white/[0.07] p-5">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-secondary" />
                  <div>
                    <p className="font-ui text-[11px] font-bold uppercase tracking-[0.18em]">Finish line</p>
                    <p className="mt-2 text-sm leading-6 text-white/68">Makerere University Freedom Square Pitch, Kampala, Uganda.</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <form onSubmit={submit} className="bg-background p-6 sm:p-8">
              {sent ? (
                <div className="mb-6 border border-primary bg-primary p-5 text-primary-foreground">
                  <p className="font-ui text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Message noted</p>
                  <p className="mt-2 text-sm leading-6">Your message has been captured for follow-up by the organising team.</p>
                </div>
              ) : null}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="contact-name">Name</label>
                  <input className="field" id="contact-name" name="name" required />
                </div>
                <div>
                  <label className="label" htmlFor="contact-email">Email</label>
                  <input className="field" id="contact-email" type="email" name="email" required />
                </div>
              </div>
              <div className="mt-5">
                <label className="label" htmlFor="topic">Topic</label>
                <select className="field" id="topic" name="topic" required>
                  <option>Runner registration</option>
                  <option>Donation or pledge</option>
                  <option>Sponsorship</option>
                  <option>Exhibition booth</option>
                  <option>Volunteer support</option>
                  <option>Media and route information</option>
                </select>
              </div>
              <div className="mt-5">
                <label className="label" htmlFor="message">Message</label>
                <textarea className="field min-h-40" id="message" name="message" required />
              </div>
              <button className="btn-primary mt-7 w-full sm:w-auto" type="submit">
                Send message
                <Send className="ml-3 h-4 w-4" />
              </button>
            </form>
          </Reveal>
        </div>
      </PageSection>
    </>
  )
}
