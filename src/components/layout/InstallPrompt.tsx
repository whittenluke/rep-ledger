import { useState, useEffect } from 'react'

const DISMISS_KEY = 'rep-ledger-install-dismissed'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(true)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(DISMISS_KEY)
    if (stored === 'true') return
    setDismissed(false)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    const standalone = window.matchMedia('(display-mode: standalone)').matches
    const relatedApps = (navigator as Navigator & { getInstalledRelatedApps?: () => Promise<unknown[]> }).getInstalledRelatedApps
    if (standalone) setInstalled(true)
    else if (relatedApps) {
      relatedApps().then((apps) => {
        if (apps && apps.length > 0) setInstalled(true)
      })
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem(DISMISS_KEY, 'true')
  }

  if (installed || dismissed || !deferredPrompt) return null

  return (
    <div className="fixed bottom-14 left-0 right-0 z-40 px-4 pb-2 safe-area-pb">
      <div className="max-w-md mx-auto p-3 rounded-xl border border-accent/50 bg-card shadow-lg flex items-center justify-between gap-3">
        <p className="text-sm text-foreground flex-1 min-w-0">
          Install <span className="font-semibold">Rep Ledger</span> for quick access
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleInstall}
            className="px-3 py-2 rounded-lg bg-accent text-primary-foreground text-sm font-medium min-h-[44px]"
          >
            Install
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
