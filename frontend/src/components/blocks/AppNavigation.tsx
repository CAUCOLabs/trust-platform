import type { AdminSession, AppView } from '../../lib/types'
import { Button } from '../ui/Button'

interface AppNavigationProps {
  activeView: AppView
  adminSession: AdminSession | null
  authChecking: boolean
  onChangeView: (view: AppView) => void
  onLogout: () => void
}

export function AppNavigation({ activeView, adminSession, authChecking, onChangeView, onLogout }: AppNavigationProps) {
  const isInternal = activeView === 'internal'
  const isPortal = activeView === 'portal'

  if (!isInternal) {
    return (
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/95 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
          <button type="button" onClick={() => onChangeView('public')} className="text-left">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Trust Platform</p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-white">
              {isPortal ? 'Customer Portal' : 'Verified business calling'}
            </p>
          </button>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 lg:flex" aria-label="Public website">
            {isPortal ? (
              <>
                <button type="button" onClick={() => onChangeView('public')} className="transition hover:text-white">
                  Public website
                </button>
                <span className="text-slate-500">Private beta</span>
              </>
            ) : (
              <>
                <a href="#how-it-works" className="transition hover:text-white">
                  How it works
                </a>
                <a href="#business" className="transition hover:text-white">
                  For business
                </a>
                <a href="#demo" className="transition hover:text-white">
                  Live demo
                </a>
                <a href="#support" className="transition hover:text-white">
                  Support
                </a>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {!isPortal ? (
              <a
                href="#download"
                className="hidden rounded-full border border-slate-700/70 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800 sm:inline-flex"
              >
                Get the app
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => onChangeView('portal')}
              className="rounded-full border border-slate-700/70 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-sky-400/40 hover:text-white"
            >
              {isPortal ? 'Request access' : 'Portal sign in'}
            </button>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/95 px-4 py-5 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Internal Ops Console</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Trust Platform operations</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Internal control for trusted data, sessions, audit history, and operational analytics.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => onChangeView('public')}
            className="rounded-full border border-slate-700/70 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:text-white"
          >
            Public site
          </button>
          <div className="rounded-full border border-slate-700/70 bg-slate-900/80 px-4 py-2 text-sm text-slate-300">
            {authChecking ? (
              <span className="text-slate-400">Checking admin session</span>
            ) : adminSession ? (
              <span>
                Signed in as <span className="font-semibold text-slate-100">{adminSession.username}</span>
              </span>
            ) : (
              <span>Ops signed out</span>
            )}
          </div>
          {adminSession ? (
            <Button type="button" variant="danger" onClick={onLogout} className="px-4 py-2.5">
              Sign out
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
