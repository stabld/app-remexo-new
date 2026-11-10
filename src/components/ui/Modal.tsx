import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function Modal({ otevreno, zavrit, nadpis, children }: { otevreno: boolean; zavrit: () => void; nadpis: string; children: ReactNode }) {
  if (!otevreno) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={zavrit}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 sm:max-w-lg sm:rounded-2xl dark:bg-stone-900"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{nadpis}</h2>
          <button onClick={zavrit} className="text-stone-400 hover:text-stone-700" aria-label="Zavřít"><X className="size-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
