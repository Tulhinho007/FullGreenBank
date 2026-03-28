import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Footer } from './Footer'
import { ImpersonationBanner } from '../ui/ImpersonationBanner'
import { WelcomeModal } from '../modals/WelcomeModal'
import { useAuth } from '../../contexts/AuthContext'
import { usersService } from '../../services/users.service'

export const AppLayout = () => {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const { user, updateUser } = useAuth()
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    // Show welcome modal if user is logged in and hasn't seen it yet
    if (user && user.welcomeSeen === false) {
      setShowWelcome(true)
    }
  }, [user])

  const handleConfirmWelcome = async () => {
    try {
      await usersService.updateProfile({ welcomeSeen: true })
      if (user) {
        updateUser({ ...user, welcomeSeen: true })
      }
      setShowWelcome(false)
    } catch (error) {
      console.error('Failed to update welcome status', error)
      setShowWelcome(false) // Close anyway to not block user
    }
  }

  // Force scroll to top on route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0)
    }
  }, [pathname])

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 transition-colors duration-300 antialiased font-sans">
      <ImpersonationBanner />
      <WelcomeModal isOpen={showWelcome} onConfirm={handleConfirmWelcome} />
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

