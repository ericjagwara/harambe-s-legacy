import Reveal from '../components/Reveal'
import { CtaBand, PageHero, PageSection, SectionHeader } from '../components/PageLayout'
import { booths, partnerLogos, sectorPackages, sponsorTiers } from '../data'
import { pageHref } from '../routes'

export default function PartnersPage() {
  return (
    <>
      <PageHero
        eyebrow="Partners and sponsors"
        title="Put your brand behind Uganda's startup economy."
        copy="Sponsorship connects organisations to runners, universities, founders, investors, exhibition audiences and the public fundraising record."
      />

      <PageSection className="bg-white">
        <SectionHeader
          eyebrow="Current ecosystem"
          title="Partners already on the course."
          copy="Partner logos are presented in a restrained grid for clear recognition across the website."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {partnerLogos.map((logo) => (
            <div key={logo.name} className="logo-tile">
              <img src={logo.src} alt={`${logo.name} logo`} className="max-h-12 w-auto object-contain" />
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection>
        <SectionHeader
          eyebrow="Sponsorship tiers"
          title="Four clear levels of association."
          copy="Packages range from lead championship to early association across selected print, digital and event moments."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sponsorTiers.map((tier, index) => (
            <Reveal key={tier.name} delay={index * 70}>
              <article className="flex h-full flex-col bg-white p-6 sm:p-7">
                <p className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Tier 0{index + 1}</p>
                <h3 className="mt-4 font-display text-3xl uppercase leading-none">{tier.name}</h3>
                <p className="mt-5 font-display text-4xl uppercase leading-none text-primary">{tier.price}</p>
                <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">{tier.summary}</p>
                <a href={pageHref('register')} className="btn-outline mt-7 w-full">Start a conversation</a>
              </article>
            </Reveal>
          ))}
        </div>
      </PageSection>

      <PageSection className="bg-white">
        <div className="grid gap-10 lg:grid-cols-[0.42fr_0.58fr] lg:items-start">
          <Reveal>
            <div>
              <p className="eyebrow">Sector packages</p>
              <h2 className="section-title mt-4">Choose a focused lane.</h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground">
                Sector and event packages allow government, development, media, medical, academic and investment partners to support defined parts of the campaign.
              </p>
              <a href={pageHref('contact')} className="btn-primary mt-8">Discuss a package</a>
            </div>
          </Reveal>
          <div className="divide-y divide-border/60">
            {sectorPackages.map(([name, price]) => (
              <div key={name} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <p className="text-sm font-bold uppercase leading-6 tracking-[0.06em] text-foreground/78">{name}</p>
                <p className="font-display text-2xl uppercase leading-none text-primary">{price}</p>
              </div>
            ))}
          </div>
        </div>
      </PageSection>

      <PageSection>
        <SectionHeader
          eyebrow="Exhibition village"
          title="Book event-day space."
          copy="Booth packages provide direct access to runners, students, founders, investors and ecosystem partners at the finish-line village."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {booths.map((booth, index) => (
            <Reveal key={booth.name} delay={index * 80}>
              <article className="h-full bg-white">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img src={booth.image} alt={`${booth.name} exhibition layout`} className="h-full w-full object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-3xl uppercase leading-none">{booth.name}</h3>
                  <p className="mt-2 font-ui text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{booth.size}</p>
                  <p className="mt-5 font-display text-3xl uppercase leading-none text-primary">{booth.price}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120}>
          <p className="mt-6 max-w-4xl text-sm leading-6 text-muted-foreground">
            Early-stage startups can request the Bronze verification path with company registration dated 1 to 3 years before the event and evidence of annual revenue up to UGX 35,000,000.
          </p>
        </Reveal>
      </PageSection>

      <CtaBand
        title="Build the run with us."
        copy="Submit sponsorship interest or book an exhibition booth through the participation desk."
        primaryLabel="Become a partner"
        primaryPage="register"
        secondaryLabel="Contact the team"
        secondaryPage="contact"
      />
    </>
  )
}
