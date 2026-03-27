import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Footer } from './Footer'
import { ImpersonationBanner } from '../ui/ImpersonationBanner'

export const AppLayout = () => {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  // Force scroll to top on route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0)
    }
  }, [pathname])

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 transition-colors duration-300 antialiased font-sans">
      <ImpersonationBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main ref={mainRef} className="flex-1 p-6 overflow-y-auto font-sans scroll-smooth">
            <Outlet />
            <Footer />
          </main>
        </div>
      </div>
    </div>
  )
}

