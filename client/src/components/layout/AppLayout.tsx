import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Footer } from './Footer'
import { ImpersonationBanner } from '../ui/ImpersonationBanner'

export const AppLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-surface-100 text-slate-900 dark:text-white transition-colors duration-300 antialiased">
      <ImpersonationBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-6 overflow-y-auto font-sans">
            <Outlet />
            <Footer />
          </main>
        </div>
      </div>
    </div>
  )
}

