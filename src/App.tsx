import { useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import RunnersPage from './pages/RunnersPage'
import RoutePage from './pages/RoutePage'
import ProgramsPage from './pages/ProgramsPage'
import PartnersPage from './pages/PartnersPage'
import ResultsPage from './pages/ResultsPage'
import RegisterPage from './pages/RegisterPage'
import ContactPage from './pages/ContactPage'
import { pageFromHash, routes, type PageKey } from './routes'

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
    case 'register':
      return <RegisterPage initialTab="run" />
    case 'donate':
      return <RegisterPage initialTab="donate" donate />
    case 'contact':
      return <ContactPage />
    case 'home':
    default:
      return <Home />
  }
}

export default function App() {
  const [page, setPage] = useState<PageKey>(() => pageFromHash(window.location.hash))

  useEffect(() => {
    const syncRoute = () => {
      setPage(pageFromHash(window.location.hash))
      window.scrollTo({ top: 0, behavior: 'instant' })
    }

    syncRoute()
    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  useEffect(() => {
    document.title = page === 'home' ? 'Startups Harambe Run 2026' : `${routes[page].title} | Startups Harambe Run 2026`
  }, [page])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header currentPage={page} />
      <main className="pt-[6.5rem] sm:pt-[7.5rem]">{renderPage(page)}</main>
      <Ticker items={footerTicker} variant="green" reverse />
      <Footer />
    </div>
  )
}
