import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type Typ = 'success' | 'error' | 'info'
type Toast = { id: number; nadpis: string; text?: string; typ: Typ }

const Ctx = createContext<(nadpis: string, text?: string, typ?: Typ) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasty, setToasty] = useState<Toast[]>([])
  const ukaz = useCallback((nadpis: string, text?: string, typ: Typ = 'info') => {
    const id = Date.now() + Math.random()
    setToasty((t) => [...t, { id, nadpis, text, typ }])
    setTimeout(() => setToasty((t) => t.filter((x) => x.id !== id)), 4500)
  }, [])

  return (
    <Ctx.Provider value={ukaz}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
        {toasty.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto w-full max-w-sm rounded-xl border bg-white p-4 shadow-md dark:bg-stone-900 ${
              t.typ === 'error' ? 'border-red-200' : t.typ === 'success' ? 'border-green-200' : 'border-stone-200 dark:border-stone-700'
            }`}
          >
            <p className="text-sm font-semibold">{t.nadpis}</p>
            {t.text && <p className="mt-0.5 text-sm text-stone-500">{t.text}</p>}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(Ctx)
