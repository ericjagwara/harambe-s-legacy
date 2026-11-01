import { PageHero, PageSection } from '../components/PageLayout'
import { policies, policyList, POLICIES_UPDATED, type Policy } from '../data/policies'
import { pageHref } from '../routes'

export default function PolicyPage({ slug }: { slug: Policy['slug'] }) {
  const policy = policies[slug]
  return (
    <>
      <PageHero eyebrow={`Last updated ${POLICIES_UPDATED}`} title={policy.title} copy={policy.summary} />
      <PageSection>
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Policies" className="mb-10 flex flex-wrap gap-2">
            {policyList.map((p) => (
              <a
                key={p.slug}
                href={pageHref(p.slug)}
                aria-current={p.slug === slug ? 'page' : undefined}
                className={`border px-3 py-2 font-ui text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
                  p.slug === slug ? 'border-primary bg-primary text-white' : 'border-border bg-white text-foreground hover:border-primary'
                }`}
              >
                {p.title.replace(' and Cancellation Policy', '').replace(' Policy', '')}
              </a>
            ))}
          </nav>
          <div className="space-y-9">
            {policy.sections.map((section, i) => (
              <section key={section.heading}>
                <h2 className="font-display text-2xl uppercase leading-tight text-primary sm:text-3xl">
                  {i + 1}. {section.heading}
                </h2>
                {section.paragraphs?.map((t) => (
                  <p key={t} className="mt-3 text-base leading-7 text-foreground/80">{t}</p>
                ))}
                {section.bullets ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-7 text-foreground/80 marker:text-primary">
                    {section.bullets.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                ) : null}
                {section.after?.map((t) => (
                  <p key={t} className="mt-3 text-base leading-7 text-foreground/80">{t}</p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </PageSection>
    </>
  )
}
