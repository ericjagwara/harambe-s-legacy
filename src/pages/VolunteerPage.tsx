import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import Reveal from '../components/Reveal'
import { PageHero, PageSection } from '../components/PageLayout'
import { supabase } from '@/integrations/supabase/client'

// Volunteer sign-up. Saved in Supabase (Table Editor -> enquiries, type "Volunteer")
// and emailed to info@haramberun.com by the submit-enquiry function.

const benefits: Array<[string, string]> = [
  ['Monetary incentives on results', 'Earn based on your mobilisation and sales performance.'],
  ['Training and mobilisation skills', 'Hands-on coaching in community organising, sales and digital marketing.'],
  ['Recognition awards at the event', 'Public recognition on run day.'],
  ['Certificate of achievement', 'A credential for your CV or portfolio.'],
  ['Performance rewards and in-kind gifts', 'Branded merchandise and prizes for top performers.'],
  ['Job opportunities and brand ambassadorship', 'A pipeline into paid roles and ongoing brand partnerships with TechBuzz Hub.'],
]

const roles = [
  'Community mobiliser champion (organise run meetings)',
  'Social media campaign influencer',
  'Marketing and sales',
  'Workout trainer',
  'Run marshal',
  'Digital marketing',
]

const kitSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export default function VolunteerPage() {
  const [adult, setAdult] = useState('')
  const [experience, setExperience] = useState('')
  const [otherRole, setOtherRole] = useState(false)
  const [roleError, setRoleError] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const noticeRef = useRef<HTMLDivElement | null>(null)
  const roleRef = useRef<HTMLParagraphElement | null>(null)

  useEffect(() => {
    if (done || error) noticeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [done, error])

  useEffect(() => {
    if (roleError) roleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [roleError])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    const chosen = data.getAll('roles').map(String)
    const other = String(data.get('other_role') ?? '').trim()
    if (chosen.length === 0 && !other) {
      setRoleError('Please choose at least one volunteer role.')
      return
    }
    setRoleError('')

    const fields: Record<string, string> = {}
    data.forEach((value, key) => {
      if (key === 'roles' || key === 'other_role') return
      if (typeof value === 'string' && value.trim() !== '') fields[key] = value.trim()
    })
    fields.choice = [...chosen, ...(other ? [`Other: ${other}`] : [])].join('; ')

    setSending(true)
    setError('')
    const { error: fnError } = await supabase.functions.invoke('submit-enquiry', { body: { type: 'Volunteer', fields } })
    setSending(false)
    if (fnError) {
      const body = await (fnError as { context?: Response }).context?.json?.().catch(() => null)
      setError(body?.error ?? 'We could not send your application. Please try again, or email info@haramberun.com.')
      return
    }
    setDone(true)
    form.reset()
    setAdult('')
    setExperience('')
    setOtherRole(false)
  }

  return (
    <>
      <PageHero
        eyebrow="Volunteer"
        title={
          <>
            Why volunteer with{' '}
            {/* On phones the hashtag is wider than the screen, so it may break at its words; from tablet width up it stays whole. */}
            <span className="sm:hidden">
              #Startups<wbr />
              Harambe<wbr />
              Run?
            </span>
            <span className="hidden whitespace-nowrap sm:inline">#StartupsHarambeRun?</span>
          </>
        }
        copy="Join the team behind a UGX 3.75 billion fundraising run on Sunday, 29 November 2026, converging from 8+ university campuses, institutions and community starting points onto Makerere University Freedom Square, built to turn goodwill into investable local startups."
      />

      <PageSection className="bg-white">
        <p className="eyebrow">What volunteers gain</p>
        <ul className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {benefits.map(([title, text]) => (
            <li key={title} className="border-t border-border pt-4">
              <p className="font-display text-xl uppercase leading-tight sm:text-2xl">{title}</p>
              <p className="mt-2 text-base leading-7 text-foreground/75">{text}</p>
            </li>
          ))}
        </ul>
      </PageSection>

      <section id="volunteer-form" className="border-b border-border bg-background pb-8 pt-4 sm:py-12 lg:py-16">
        <div className="container-site">
          <Reveal>
            <div className="-mx-5 bg-white px-5 py-7 sm:mx-0 sm:p-10">
              <p className="eyebrow">Sign up</p>
              <h2 className="mt-3 font-display text-[2.1rem] uppercase leading-none sm:mt-4 sm:text-5xl">Volunteer sign-up form</h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-foreground/75">
                It takes about five minutes. The team reviews every application and contacts you about your role.
              </p>

              {done ? (
                <div ref={noticeRef} className="mt-8 scroll-mt-28 bg-primary p-6 text-primary-foreground" role="status">
                  <p className="font-ui text-[11px] font-black uppercase tracking-[0.22em] text-secondary">Application received</p>
                  <p className="mt-3 text-lg leading-8">
                    Thank you for volunteering. We will contact you about your role and next steps. A confirmation email is on its way.
                  </p>
                </div>
              ) : (
                <form onSubmit={submit} className="mt-8 grid grid-cols-1 gap-6 sm:gap-8">
                  <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                    <label htmlFor="vol-website">Website</label>
                    <input id="vol-website" name="website" tabIndex={-1} autoComplete="off" />
                  </div>

                  <Group title="1. Your details">
                    <Field label="Full name" id="v-name">
                      <input className="field" id="v-name" name="name" autoComplete="name" required />
                    </Field>
                    <Field label="Phone number" id="v-phone">
                      <input className="field" id="v-phone" name="phone" inputMode="tel" autoComplete="tel" placeholder="0781405551" required />
                    </Field>
                    <Field label="Email address" id="v-email">
                      <input className="field" id="v-email" name="email" type="email" autoComplete="email" required />
                    </Field>
                    <Field label="University, institution or organisation (if any)" id="v-org">
                      <input className="field" id="v-org" name="organisation" />
                    </Field>
                    <Field label="City or area of residence" id="v-city">
                      <input className="field" id="v-city" name="city_or_area" required />
                    </Field>
                    <Choices legend="Are you 18 or older?" name="age_18_or_older" options={['Yes', 'No']} required onChange={setAdult} />
                    {adult === 'No' ? (
                      <>
                        <p className="text-sm leading-6 text-foreground/70 sm:col-span-2">
                          Volunteers under 18 need a parent or guardian's details, in line with the Run's safeguarding policy.
                        </p>
                        <Field label="Parent or guardian name" id="v-guardian">
                          <input className="field" id="v-guardian" name="guardian_name" required />
                        </Field>
                        <Field label="Parent or guardian phone number" id="v-guardian-phone">
                          <input className="field" id="v-guardian-phone" name="guardian_phone" inputMode="tel" required />
                        </Field>
                      </>
                    ) : null}
                  </Group>

                  <Group title="2. How you'd like to help">
                    <fieldset className="min-w-0 sm:col-span-2">
                      <legend className="label">Which volunteer roles interest you? Select all that apply.</legend>
                      <div className="mt-1 space-y-3">
                        {roles.map((role) => (
                          <label key={role} className="flex cursor-pointer items-start gap-3">
                            <input
                              type="checkbox"
                              name="roles"
                              value={role}
                              onChange={() => setRoleError('')}
                              className="mt-1 h-[18px] w-[18px] shrink-0 accent-[hsl(var(--primary))]"
                            />
                            <span className="text-base leading-6">{role}</span>
                          </label>
                        ))}
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={otherRole}
                            onChange={(e) => {
                              setOtherRole(e.target.checked)
                              setRoleError('')
                            }}
                            className="mt-1 h-[18px] w-[18px] shrink-0 accent-[hsl(var(--primary))]"
                          />
                          <span className="text-base leading-6">Other</span>
                        </label>
                        {otherRole ? (
                          <input className="field sm:max-w-md" name="other_role" aria-label="Other role, please specify" placeholder="Please specify" required />
                        ) : null}
                      </div>
                      {roleError ? (
                        <p ref={roleRef} className="mt-3 scroll-mt-28 text-sm font-bold text-accent" role="alert">
                          {roleError}
                        </p>
                      ) : null}
                    </fieldset>
                    <Field label="Which university, community or area would you mobilise from?" id="v-from">
                      <input className="field" id="v-from" name="mobilise_from" required />
                    </Field>
                    <Choices
                      legend="Do you have prior volunteering, mobilisation or event experience?"
                      name="prior_experience"
                      options={['Yes', 'No']}
                      required
                      onChange={setExperience}
                    />
                    {experience === 'Yes' ? (
                      <Field label="Briefly describe it (optional)" id="v-exp" wide>
                        <input className="field" id="v-exp" name="experience_details" />
                      </Field>
                    ) : null}
                    <Field
                      label="Skills relevant to your chosen role, e.g. content creation, public speaking, fitness coaching, sales (optional)"
                      id="v-skills"
                      wide
                    >
                      <textarea className="field min-h-24" id="v-skills" name="skills" />
                    </Field>
                  </Group>

                  <Group title="3. Availability">
                    <Choices
                      legend="Can you commit to pre-run activities: weekly in October to early November, and daily in the final week?"
                      name="pre_run_commitment"
                      options={['Yes, fully', 'Partially', 'Not sure yet']}
                      required
                      wide
                    />
                    <Choices legend="Are you available on run day, Sunday 29 November 2026?" name="available_on_run_day" options={['Yes', 'No']} required wide />
                    <Field label="Days and times you are generally free to volunteer" id="v-times">
                      <input className="field" id="v-times" name="preferred_times" placeholder="e.g. weekends, weekday evenings" required />
                    </Field>
                  </Group>

                  <Group title="4. Motivation">
                    <Field label="Why do you want to volunteer for #StartupsHarambeRun?" id="v-why" wide>
                      <textarea className="field min-h-28" id="v-why" name="motivation" required />
                    </Field>
                    <Choices
                      legend="How did you hear about the Run?"
                      name="heard_about_us"
                      options={['Social media', 'A friend or colleague', 'My university', 'A TechBuzz Hub event', 'Other']}
                      required
                    />
                    <Field label="If a friend or mobiliser referred you, who? (optional)" id="v-ref">
                      <input className="field" id="v-ref" name="referred_by" />
                    </Field>
                  </Group>

                  <Group title="5. Logistics and safety">
                    <Field label="Run kit or T-shirt size" id="v-size">
                      <select className="field" id="v-size" name="kit_size" required defaultValue="">
                        <option value="" disabled>
                          Choose a size
                        </option>
                        {kitSizes.map((size) => (
                          <option key={size}>{size}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Emergency contact name and phone number" id="v-emergency">
                      <input className="field" id="v-emergency" name="emergency_contact" placeholder="e.g. Sarah Nakato, 0772000000" required />
                    </Field>
                    <Field label="Medical conditions or access needs the Safety and Welfare team should know about (optional)" id="v-medical" wide>
                      <textarea className="field min-h-20" id="v-medical" name="medical_or_access_needs" />
                    </Field>
                  </Group>

                  <Group title="6. Consent">
                    <label className="flex items-start gap-3 text-base leading-7 sm:col-span-2">
                      <input type="checkbox" name="consent_code_of_conduct" value="Agreed" required className="mt-1.5 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]" />
                      <span>I confirm the information above is accurate, and I agree to the Run's Code of Conduct and volunteer safeguarding guidelines.</span>
                    </label>
                    <label className="flex items-start gap-3 text-base leading-7 sm:col-span-2">
                      <input type="checkbox" name="consent_contact" value="Agreed" required className="mt-1.5 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]" />
                      <span>I consent to being contacted by TechBuzz Hub and #StartupsHarambeRun about this application.</span>
                    </label>
                  </Group>

                  {error ? (
                    <div ref={noticeRef} className="scroll-mt-28 bg-foreground p-6 text-lg leading-8 text-white" role="alert">
                      {error}
                    </div>
                  ) : null}

                  <div>
                    <button className="btn-primary w-full sm:w-auto" type="submit" disabled={sending}>
                      {sending ? 'Sending…' : 'Submit application'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="grid min-w-0 grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-2 sm:gap-5 sm:pt-6">
      <legend className="float-left mb-1 w-full font-ui text-xs font-black uppercase tracking-[0.2em] text-primary sm:col-span-2">{title}</legend>
      {children}
    </fieldset>
  )
}

function Field({ label, id, wide = false, children }: { label: string; id: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`min-w-0 ${wide ? 'sm:col-span-2' : ''}`}>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  )
}

// Plain radio buttons, one per line.
function Choices({
  legend,
  name,
  options,
  required = false,
  wide = false,
  onChange,
}: {
  legend: string
  name: string
  options: string[]
  required?: boolean
  wide?: boolean
  onChange?: (value: string) => void
}) {
  return (
    <fieldset className={`min-w-0 ${wide ? 'sm:col-span-2' : ''}`}>
      <legend className="label">{legend}</legend>
      <div className="mt-1 space-y-2.5">
        {options.map((option) => (
          <label key={option} className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name={name}
              value={option}
              required={required}
              onChange={() => onChange?.(option)}
              className="mt-1 h-[18px] w-[18px] shrink-0 accent-[hsl(var(--primary))]"
            />
            <span className="text-base leading-6">{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
