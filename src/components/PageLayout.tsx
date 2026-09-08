import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import Reveal from './Reveal'
import { pageHref, type PageKey } from '../routes'

type PageHeroProps = {
  eyebrow: string
  title: string
  copy: string
  image?: string
  imageAlt?: string
  imageCaption?: string
  portrait?: boolean
}

export function PageHero({ eyebrow, title, copy, image, imageAlt = '', imageCaption, portrait = false }: PageHeroProps) {
  return (
    <section className="border-b border-border bg-white py-14 sm:py-16 lg:py-20">
      <div className="container-site grid gap-10 lg:grid-cols-[0.92fr_0.68fr] lg:items-end">
        <Reveal>
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="page-title mt-4 max-w-4xl">{title}</h1>
            <p className="section-copy mt-6">{copy}</p>
          </div>
        </Reveal>
        {image ? (
          <Reveal delay={120}>
            <figure>
              <div className={`${portrait ? 'aspect-[4/5] max-w-md' : 'aspect-[16/10]'} corner-brackets relative overflow-visible`}>
                <div className="h-full w-full overflow-hidden bg-muted">
                  <img src={image} alt={imageAlt} className="h-full w-full object-cover object-top" />
                </div>
              </div>
              {imageCaption ? <figcaption className="image-caption">{imageCaption}</figcaption> : null}
            </figure>
          </Reveal>
        ) : null}
      </div>
    </section>
  )
}

type SectionHeaderProps = {
  eyebrow: string
  title: string
  copy?: string
  dark?: boolean
}

export function SectionHeader({ eyebrow, title, copy, dark = false }: SectionHeaderProps) {
  return (
    <Reveal>
      <div className="grid gap-6 lg:grid-cols-[0.62fr_0.38fr] lg:items-end">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className={`${dark ? 'section-title-dark' : 'section-title'} mt-4`}>{title}</h2>
        </div>
        {copy ? <p className={`${dark ? 'text-white/68' : 'text-muted-foreground'} max-w-xl text-base leading-7 lg:justify-self-end`}>{copy}</p> : null}
      </div>
    </Reveal>
  )
}

type CtaBandProps = {
  title: string
  copy: string
  primaryLabel: string
  primaryPage: PageKey
  secondaryLabel?: string
  secondaryPage?: PageKey
}

export function CtaBand({ title, copy, primaryLabel, primaryPage, secondaryLabel, secondaryPage }: CtaBandProps) {
  return (
    <section
      className="relative z-10 -mt-[2vw] bg-primary pb-14 pt-[calc(2vw+3.5rem)] text-white sm:pb-16 sm:pt-[calc(2vw+4rem)]"
      style={{ clipPath: 'polygon(0 2vw, 100% 0, 100% 100%, 0 100%)' }}
    >
      <div className="container-site grid gap-8 lg:grid-cols-[0.68fr_0.32fr] lg:items-center">
        <Reveal>
          <div>
            <h2 className="font-display text-4xl uppercase leading-[0.95] sm:text-5xl">{title}</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/72">{copy}</p>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <a href={pageHref(primaryPage)} className="btn-gold">
              {primaryLabel}
              <ArrowRight className="ml-3 h-4 w-4" />
            </a>
            {secondaryLabel && secondaryPage ? (
              <a href={pageHref(secondaryPage)} className="btn-outline-dark">
                {secondaryLabel}
              </a>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function MetricGrid({ items, dark = false }: { items: Array<{ value: string; label: string }>; dark?: boolean }) {
  return (
    <div className={`grid gap-px border ${dark ? 'border-white/15 bg-white/15' : 'border-border bg-border'} sm:grid-cols-2 lg:grid-cols-4`}>
      {items.map((item) => (
        <div key={item.label} className={`${dark ? 'bg-primary' : 'bg-white'} p-5`}>
          <p className={`font-display text-4xl uppercase leading-none ${dark ? 'text-secondary' : 'text-primary'}`}>{item.value}</p>
          <p className={`stat-label ${dark ? 'text-white/58' : 'text-muted-foreground'}`}>{item.label}</p>
        </div>
      ))}
    </div>
  )
}

export function TextList({ items }: { items: string[] }) {
  return (
    <ul className="divide-y divide-border/60">
      {items.map((item) => (
        <li key={item} className="py-4 text-sm font-bold uppercase leading-6 tracking-[0.06em] text-foreground/78">
          {item}
        </li>
      ))}
    </ul>
  )
}

export function PageSection({ children, dark = false, className = '' }: { children: ReactNode; dark?: boolean; className?: string }) {
  return (
    <section className={`${dark ? 'bg-primary text-white' : 'bg-background'} py-14 sm:py-16 lg:py-20 ${className}`}>
      <div className="container-site">{children}</div>
    </section>
  )
}
