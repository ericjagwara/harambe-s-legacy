import { useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import WhatsAppFloatButton from './components/WhatsAppFloatButton'
import Home from './pages/Home'
import RunnersPage from './pages/RunnersPage'
import RoutePage from './pages/RoutePage'
import VolunteerPage from './pages/VolunteerPage'
import PartnersPage from './pages/PartnersPage'
import ResultsPage from './pages/ResultsPage'
import ContributorsPage from './pages/ContributorsPage'
import RegisterPage from './pages/RegisterPage'
import ContactPage from './pages/ContactPage'
import ReceiptPage from './pages/ReceiptPage'
import PickupPage from './pages/PickupPage'
import VolunteerAgreementPage from './pages/VolunteerAgreementPage'
import PartnerMouPage from './pages/PartnerMouPage'
import HubPage from './pages/HubPage'
import DashboardPage from './pages/DashboardPage'
import { trackEvent } from './lib/analytics'
import { hubBySlug } from './data/hubs'
import { hubSlugFromPath, isAppPath, legacyHashPath, pageFromPath, routes, type PageKey } from './routes'

function renderPage(page: PageKey, path: string) {
  switch (page) {
    case 'runners':
      return <RunnersPage />
    case 'route':
      return <RoutePage />
    case 'volunteer':
      return <VolunteerPage />
    case 'partners':
      return <PartnersPage />
    case 'results':
      return <ResultsPage />
    case 'contributors':
      return <ContributorsPage />
    case 'register':
      return <RegisterPage />
    case 'donate':
      return <RegisterPage donate />
    case 'contact':
      return <ContactPage />
    case 'receipt':
      return <ReceiptPage />
    case 'pickup':
      return <PickupPage />
    case 'agreement':
      return <VolunteerAgreementPage />
    case 'mou':
      return <PartnerMouPage />
    case 'hub':
      return <HubPage slug={hubSlugFromPath(path)} />
    case 'dashboard':
      return <DashboardPage />
    case 'home':
    default:
      return <Home />
  }
}

export default function App() {
  const [path, setPath] = useState<string>(() => {
    const legacy = legacyHashPath(window.location.hash)
    if (legacy) window.history.replaceState(null, '', legacy)
    return window.location.pathname
  })
  const page = pageFromPath(path)

  useEffect(() => {
    const syncRoute = () => {
      setPath(window.location.pathname)
      window.scrollTo({ top: 0, behavior: 'instant' })
    }

    // Handle internal link clicks in place, without a full page reload.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as HTMLElement | null)?.closest('a')
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (!isAppPath(url.pathname)) return
      event.preventDefault()
      if (url.pathname + url.search !== window.location.pathname + window.location.search) {
        window.history.pushState(null, '', url.pathname + url.search)
      }
      syncRoute()
    }

    window.addEventListener('popstate', syncRoute)
    document.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('popstate', syncRoute)
      document.removeEventListener('click', onClick)
    }
  }, [])

  // One visit event per page shown.
  useEffect(() => {
    trackEvent('pageview')
  }, [path])

  useEffect(() => {
    const hubName = page === 'hub' ? hubBySlug(hubSlugFromPath(path))?.name : undefined
    document.title =
      page === 'home'
        ? 'Startups Harambe Run 2026'
        : `${hubName ? `${hubName} x TechBuzz Hub` : routes[page].title} | Startups Harambe Run 2026`
  }, [page, path])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="print:hidden">
        <Header currentPage={page} />
      </div>
      <main className="pt-[6.5rem] sm:pt-[7.5rem] print:pt-0">{renderPage(page, path)}</main>
      <div className="print:hidden">
        <Footer />
        {/* Hidden on form pages, where it would cover fields and buttons on phones. */}
      {['register', 'donate', 'volunteer', 'receipt', 'pickup', 'agreement', 'mou', 'dashboard', 'hub'].includes(page) ? null : <WhatsAppFloatButton />}
      </div>
    </div>
  )
}
