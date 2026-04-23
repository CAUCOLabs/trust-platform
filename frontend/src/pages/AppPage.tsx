import { useState } from 'react'
import { AppNavigation } from '../components/blocks/AppNavigation'
import type { AppView } from '../lib/types'
import AdminDashboardPage from './AdminDashboardPage'
import TrustPlatformPage from './TrustPlatformPage'

export default function AppPage() {
  const [activeView, setActiveView] = useState<AppView>('lookup')

  return (
    <div className="min-h-screen bg-slate-950">
      <AppNavigation activeView={activeView} onChangeView={setActiveView} />
      {activeView === 'lookup' ? <TrustPlatformPage /> : <AdminDashboardPage />}
    </div>
  )
}
