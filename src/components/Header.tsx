import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { asset } from '../data'
import { pageHref, type PageKey } from '../routes'

const navItems: Array<[PageKey, string]> = [
  ['runners', 'Runners'],
  ['route', 'Route'],
  ['programs', 'Programs'],
  ['partners', 'Partners'],
  ['results', 'Results'],
  ['contact', 'Contact'],
]

type HeaderProps = {
  currentPage: PageKey
}

export default function Header({ currentPage }: HeaderProps) {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setHidden(y > lastY && y > 260)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [currentPage])

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-transform duration-300 ${hidden && !open ? 'header-hidden' : 'header-visible'}`}>
      <div className="bg-primary text-white">
        <div className="container-site flex h-10 items-center justify-between gap-5 font-ui text-[10px] font-bold uppercase tracking-[0.18em]">
          <p className="truncate">Sunday 6 December 2026</p>
          <div className="flex shrink-0 items-center gap-5">
            <span className="hidden sm:inline">Makerere University</span>
            <a href={pageHref('donate')} className="text-secondary transition-colors hover:text-white">Donate</a>
          </div>
        </div>
      </div>

      <div className="border-b border-border bg-white">
        <div className="container-site flex h-16 items-center justify-between gap-5 sm:h-20">
          <a href={pageHref('home')} className="flex min-w-0 items-center" aria-label="Startups Harambe Run home">
            <img
              src={asset('brand-logo.webp')}
              alt="Startup Harambe, run by SFV"
              className="h-9 w-auto object-contain sm:h-12"
            />
          </a>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
            {navItems.map(([page, label]) => (
              <a
                key={page}
                href={pageHref(page)}
                className={`border-b-2 py-2 font-ui text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
                  currentPage === page
                    ? 'border-secondary text-primary'
                    : 'border-transparent text-foreground/72 hover:border-secondary hover:text-primary'
                }`}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <a href={pageHref('register')} className="btn-primary px-4 py-2.5">
              Register
            </a>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center border border-border bg-white lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-b border-border bg-white lg:hidden">
          <nav className="container-site grid gap-1 py-4" aria-label="Mobile navigation">
            {navItems.map(([page, label]) => (
              <a
                key={page}
                href={pageHref(page)}
                className={`border px-3 py-3 font-ui text-xs font-bold uppercase tracking-[0.18em] ${
                  currentPage === page ? 'border-secondary bg-secondary/15 text-primary' : 'border-transparent text-foreground hover:bg-background'
                }`}
              >
                {label}
              </a>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a href={pageHref('donate')} className="btn-outline px-3 py-3">Donate</a>
              <a href={pageHref('register')} className="btn-primary px-3 py-3">Register</a>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
