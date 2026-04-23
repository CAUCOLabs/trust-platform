import { FormEvent, useState } from 'react'
import { loginAdmin } from '../lib/api'
import type { AdminSession } from '../lib/types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Panel } from '../components/ui/Panel'

interface AdminLoginPageProps {
  onLogin: (session: AdminSession) => void
}

export default function AdminLoginPage({ onLogin }: AdminLoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const session = await loginAdmin(username.trim(), password)
      onLogin(session)
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="px-4 pb-10 pt-8 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
        <Panel glow className="relative overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sky-500/12 via-transparent to-transparent" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Internal Ops Console</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Sign in to internal operations.</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                This protected surface is separate from the public website and customer portal. It is used for deep operational control.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-slate-400 sm:grid-cols-3">
              <div className="rounded-[24px] border border-slate-700/70 bg-slate-900/70 p-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Public</p>
                <p className="mt-2 font-medium text-slate-100">Lookup stays open</p>
              </div>
              <div className="rounded-[24px] border border-slate-700/70 bg-slate-900/70 p-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Internal</p>
                <p className="mt-2 font-medium text-slate-100">Bearer session</p>
              </div>
              <div className="rounded-[24px] border border-slate-700/70 bg-slate-900/70 p-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Role</p>
                <p className="mt-2 font-medium text-slate-100">Administrator</p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="p-6 sm:p-8">
          <form className="flex h-full flex-col justify-between gap-8" onSubmit={handleSubmit}>
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Sign in</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white">Operations credentials</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Use the configured v1 internal account to unlock the protected operations console.
              </p>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Email or username</span>
                <Input
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="admin@trust.local"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Password</span>
                <Input
                  autoComplete="current-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>

              {error ? (
                <div className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Logged out</p>
              <Button type="submit" loading={loading} loadingLabel="Signing in..." className="w-full sm:w-auto">
                Sign in to ops
              </Button>
            </div>
          </form>
        </Panel>
      </div>
    </main>
  )
}
