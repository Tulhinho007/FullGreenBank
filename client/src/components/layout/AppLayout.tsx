import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ImpersonationBanner } from '../ui/ImpersonationBanner'

export const AppLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-surface-100">
      <ImpersonationBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-6 overflow-y-auto font-sans">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
