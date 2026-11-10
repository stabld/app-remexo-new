import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

export function Modal({ otevreno, zavrit, nadpis, children }: { otevreno: boolean; zavrit: () => void; nadpis: string; children: ReactNode }) {
  useEffect(() => {
    if (!otevreno) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && zavrit()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [otevreno, zavrit])

  if (!otevreno) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={zavrit}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={nadpis}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-surface p-6 shadow-raised sm:max-w-md sm:rounded-2xl"
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{nadpis}</h2>
          <button onClick={zavrit} className="-m-1 rounded-lg p-1 text-muted hover:text-ink" aria-label="Zavřít"><X className="size-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
