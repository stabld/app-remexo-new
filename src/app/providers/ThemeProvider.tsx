import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Tema = 'light' | 'dark' | 'system'
const KLIC = 'remexo-tema'

const Ctx = createContext<{ tema: Tema; setTema: (t: Tema) => void }>({ tema: 'light', setTema: () => {} })

function nacti(): Tema {
  try {
    const t = localStorage.getItem(KLIC)
    if (t === 'dark' || t === 'system') return t
  } catch { /* soukromé okno */ }
  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(nacti)

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const pouzij = () => document.documentElement.classList.toggle('dark', tema === 'dark' || (tema === 'system' && mq.matches))
    pouzij()
    try { localStorage.setItem(KLIC, tema) } catch { /* nic */ }
    if (tema !== 'system') return
    mq.addEventListener('change', pouzij)
    return () => mq.removeEventListener('change', pouzij)
  }, [tema])

  return <Ctx.Provider value={{ tema, setTema }}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTema = () => useContext(Ctx)
