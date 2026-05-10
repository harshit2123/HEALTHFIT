import { usePwaInstall } from '../hooks/usePwaInstall'

export function PwaInstallBanner() {
  const { canInstall, install } = usePwaInstall()

  if (!canInstall) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-zinc-900/95 px-4 py-3 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <img src="/pwa-192x192.png" alt="Spacefit" className="h-8 w-8 rounded-lg" />
        <div>
          <p className="text-sm font-medium text-white">Add to Home Screen</p>
          <p className="text-xs text-zinc-400">Install for a faster experience</p>
        </div>
      </div>
      <button
        onClick={install}
        className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-100 active:scale-95 transition-transform"
      >
        Install
      </button>
    </div>
  )
}
