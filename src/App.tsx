import { useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import WhatsAppFloatButton from './components/WhatsAppFloatButton'
import Home from './pages/Home'
import RunnersPage from './pages/RunnersPage'
import RoutePage from './pages/RoutePage'
import ProgramsPage from './pages/ProgramsPage'
import PartnersPage from './pages/PartnersPage'
import ResultsPage from './pages/ResultsPage'
import ContributorsPage from './pages/ContributorsPage'
import RegisterPage from './pages/RegisterPage'
import ContactPage from './pages/ContactPage'
import ReceiptPage from './pages/ReceiptPage'
import PickupPage from './pages/PickupPage'
import { isAppPath, legacyHashPath, pageFromPath, routes, type PageKey } from './routes'

function renderPage(page: PageKey) {
  switch (page) {
    case 'runners':
      return <RunnersPage />
    case 'route':
      return <RoutePage />
    case 'programs':
      return <ProgramsPage />
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
    case 'home':
    default:
      return <Home />
  }
}

export default function App() {
  const [page, setPage] = useState<PageKey>(() => {
    const legacy = legacyHashPath(window.location.hash)
    if (legacy) window.history.replaceState(null, '', legacy)
    return pageFromPath(window.location.pathname)
  })

  useEffect(() => {
    const syncRoute = () => {
      setPage(pageFromPath(window.location.pathname))
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
      if (url.pathname !== window.location.pathname) {
        window.history.pushState(null, '', url.pathname)
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

  useEffect(() => {
    document.title = page === 'home' ? 'Startups Harambe Run 2026' : `${routes[page].title} | Startups Harambe Run 2026`
  }, [page])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="print:hidden">
        <Header currentPage={page} />
      </div>
      <main className="pt-[6.5rem] sm:pt-[7.5rem] print:pt-0">{renderPage(page)}</main>
      <div className="print:hidden">
        <Footer />
        {/* Hidden on form pages, where it would cover fields and buttons on phones. */}
      {['register', 'donate', 'receipt', 'pickup'].includes(page) ? null : <WhatsAppFloatButton />}
      </div>
    </div>
  )
}
