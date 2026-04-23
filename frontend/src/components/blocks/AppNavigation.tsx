import type { AppView } from '../../lib/types'
import { Panel } from '../ui/Panel'
import { ViewSwitch } from '../ui/ViewSwitch'

interface AppNavigationProps {
  activeView: AppView
  onChangeView: (view: AppView) => void
}

export function AppNavigation({ activeView, onChangeView }: AppNavigationProps) {
  return (
    <div className="px-4 pt-6 sm:px-6 lg:px-10">
      <Panel className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Trust Platform</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Lookup and internal operations workspace</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            The public lookup experience remains intact. The admin view adds live internal visibility for backend records.
          </p>
        </div>
        <ViewSwitch value={activeView} onChange={onChangeView} />
      </Panel>
    </div>
  )
}
