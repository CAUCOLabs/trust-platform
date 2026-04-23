import { useEffect, useState } from 'react'
import { AppNavigation } from '../components/blocks/AppNavigation'
import { clearAdminToken, getStoredAdminToken, logoutAdmin, validateAdminSession } from '../lib/api'
import type { AdminSession, AppView } from '../lib/types'
import AdminDashboardPage from './AdminDashboardPage'
import AdminLoginPage from './AdminLoginPage'
import CustomerPortalPage from './CustomerPortalPage'
import TrustPlatformPage from './TrustPlatformPage'

function viewFromLocation(): AppView {
  if (window.location.pathname.startsWith('/portal') || window.location.pathname.startsWith('/workspace')) {
    return 'portal'
  }

  if (
    window.location.pathname.startsWith('/internal') ||
    window.location.pathname.startsWith('/ops') ||
    window.location.pathname.startsWith('/master-admin') ||
    window.location.pathname.startsWith('/admin')
  ) {
    return 'internal'
  }

  return 'public'
}

export default function AppPage() {
  const [activeView, setActiveView] = useState<AppView>(viewFromLocation)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [authChecking, setAuthChecking] = useState(Boolean(getStoredAdminToken()))

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      if (!getStoredAdminToken()) {
        setAuthChecking(false)
        return
      }

      try {
        const session = await validateAdminSession()
        if (!cancelled) {
          setAdminSession(session)
        }
      } catch {
        clearAdminToken()
        if (!cancelled) {
          setAdminSession(null)
        }
      } finally {
        if (!cancelled) {
          setAuthChecking(false)
        }
      }
    }

    void restoreSession()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function handlePopState() {
      setActiveView(viewFromLocation())
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigateToView(view: AppView) {
    const nextPath = view === 'internal' ? '/internal' : view === 'portal' ? '/portal' : '/'
    window.history.pushState(null, '', nextPath)
    setActiveView(view)
  }

  async function handleLogout() {
    await logoutAdmin()
    setAdminSession(null)
    navigateToView('public')
  }

  const activePage =
    activeView === 'public' ? (
      <TrustPlatformPage />
    ) : activeView === 'portal' ? (
      <CustomerPortalPage />
    ) : adminSession ? (
      <AdminDashboardPage />
    ) : (
      <AdminLoginPage onLogin={setAdminSession} />
    )

  return (
    <div className="min-h-screen bg-slate-950">
      <AppNavigation
        activeView={activeView}
        adminSession={adminSession}
        authChecking={authChecking}
        onChangeView={navigateToView}
        onLogout={() => void handleLogout()}
      />
      {activePage}
    </div>
  )
}
