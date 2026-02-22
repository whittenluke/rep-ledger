import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { useUserStore } from '@/store/user'
import { supabase } from '@/lib/supabase'
import { exportUserData } from '@/lib/exportData'
import { cn } from '@/lib/utils'
import { Download, LogOut } from 'lucide-react'

const REST_PRESETS = [0, 30, 60, 90, 120, 180] as const

export function Settings() {
  const navigate = useNavigate()
  const weightUnit = useUserStore((s) => s.weightUnit)
  const setWeightUnit = useUserStore((s) => s.setWeightUnit)
  const defaultRestSeconds = useUserStore((s) => s.defaultRestSeconds)
  const setDefaultRestSeconds = useUserStore((s) => s.setDefaultRestSeconds)

  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null)
    })
  }, [])

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }, [navigate])

  const handleExport = useCallback(async () => {
    setExportStatus('loading')
    try {
      const data = await exportUserData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rep-ledger-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setExportStatus('done')
    } catch {
      setExportStatus('error')
    }
  }, [])

  return (
    <div className="p-4 pb-24 space-y-8">
      <PageHeader title="Settings" />

      <section>
        <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Units
        </h2>
        <div className="flex rounded-lg border border-border bg-card p-1">
          {(['kg', 'lbs'] as const).map((unit) => (
            <button
              key={unit}
              type="button"
              onClick={() => setWeightUnit(unit)}
              className={cn(
                'flex-1 py-3 rounded-md font-medium min-h-[44px] transition-colors',
                weightUnit === unit
                  ? 'bg-accent text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {unit}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Default rest timer
        </h2>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {REST_PRESETS.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setDefaultRestSeconds(sec)}
                className={cn(
                  'px-4 py-2.5 rounded-lg border font-medium min-h-[44px] transition-colors',
                  defaultRestSeconds === sec
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-accent/50'
                )}
              >
                {sec === 0 ? 'Off' : `${sec}s`}
              </button>
            ))}
          </div>
          <div>
            <label htmlFor="rest-seconds" className="block text-sm text-muted-foreground mb-1">
              Custom (0-600 seconds)
            </label>
            <input
              id="rest-seconds"
              type="number"
              min={0}
              max={600}
              value={defaultRestSeconds}
              onChange={(e) => setDefaultRestSeconds(Number(e.target.value) || 0)}
              className="w-full max-w-[120px] px-3 py-2.5 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Account
        </h2>
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          {userEmail && (
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="text-foreground font-medium">{userEmail}</span>
            </p>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-border font-medium text-muted-foreground hover:text-foreground hover:border-red-500/50 min-h-[44px] transition-colors"
          >
            <LogOut className="w-5 h-5" aria-hidden />
            Sign out
          </button>
        </div>
      </section>

      <section>
        <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Data export
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          Download all your exercises, templates, sessions, and history as a JSON file.
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={exportStatus === 'loading'}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-lg border font-medium min-h-[44px] transition-colors',
            'border-border bg-card text-foreground hover:border-accent/50 disabled:opacity-50'
          )}
        >
          <Download className="w-5 h-5" aria-hidden />
          {exportStatus === 'loading'
            ? 'Exporting…'
            : exportStatus === 'done'
              ? 'Downloaded'
              : exportStatus === 'error'
                ? 'Export failed'
                : 'Export my data (JSON)'}
        </button>
      </section>
    </div>
  )
}
