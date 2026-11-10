import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from './AuthProvider'
import { zkontrolujHeslo } from './heslo'

/** Otevře se po kliknutí na odkaz pro obnovu hesla z e-mailu. */
export function NoveHesloModal() {
  const { obnovaHesla, setObnovaHesla } = useAuth()
  const [chyba, setChyba] = useState<string | null>(null)
  const [pracuji, setPracuji] = useState(false)
  if (!obnovaHesla) return null

  const ulozit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const heslo = String(new FormData(e.currentTarget).get('heslo'))
    const slabe = zkontrolujHeslo(heslo)
    if (slabe) return setChyba(slabe)
    setPracuji(true)
    const { error } = await supabase.auth.updateUser({ password: heslo })
    setPracuji(false)
    if (error) return setChyba('Nepodařilo se změnit heslo: ' + error.message)
    setObnovaHesla(false)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <form onSubmit={ulozit} className="w-full max-w-sm space-y-4 rounded-2xl bg-surface p-6">
        <h2 className="text-lg font-semibold">Nastav si nové heslo</h2>
        {chyba && <p className="rounded-xl bg-[#FEF3F2] p-3 text-sm text-danger-text dark:bg-danger/15">{chyba}</p>}
        <Input label="Nové heslo" name="heslo" type="password" autoComplete="new-password" required />
        <Button type="submit" loading={pracuji} className="w-full">Uložit heslo</Button>
      </form>
    </div>
  )
}
