import { useEffect, useState } from 'react'
import { AppNavigation } from '../components/blocks/AppNavigation'
import {
  clearAdminToken,
  clearPortalToken,
  getStoredAdminToken,
  getStoredPortalToken,
  logoutAdmin,
  logoutPortal,
  validateAdminSession,
  validatePortalSession,
} from '../lib/api'
import type { AdminSession, AppView, PortalSession } from '../lib/types'
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
  const [portalSession, setPortalSession] = useState<PortalSession | null>(null)
  const [authChecking, setAuthChecking] = useState(Boolean(getStoredAdminToken()))
  const [portalAuthChecking, setPortalAuthChecking] = useState(Boolean(getStoredPortalToken()))

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
    let cancelled = false

    async function restorePortalSession() {
      if (!getStoredPortalToken()) {
        setPortalAuthChecking(false)
        return
      }

      try {
        const session = await validatePortalSession()
        if (!cancelled) {
          setPortalSession(session)
        }
      } catch {
        clearPortalToken()
        if (!cancelled) {
          setPortalSession(null)
        }
      } finally {
        if (!cancelled) {
          setPortalAuthChecking(false)
        }
      }
    }

    void restorePortalSession()

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

  async function handlePortalLogout() {
    await logoutPortal()
    setPortalSession(null)
    window.history.pushState(null, '', '/portal')
    setActiveView('portal')
  }

  const activePage =
    activeView === 'public' ? (
      <TrustPlatformPage />
    ) : activeView === 'portal' ? (
      <CustomerPortalPage
        session={portalSession}
        authChecking={portalAuthChecking}
        onLogin={setPortalSession}
        onLogout={() => void handlePortalLogout()}
      />
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
        portalSession={portalSession}
        authChecking={authChecking}
        onChangeView={navigateToView}
        onLogout={() => void handleLogout()}
        onPortalLogout={() => void handlePortalLogout()}
      />
      {activePage}
    </div>
  )
}
