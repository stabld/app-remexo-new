import { useState, type FormEvent } from 'react'
import { ArrowLeft, Hammer, House } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ROLE_LABEL, type Role } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from './AuthProvider'
import { zkontrolujHeslo } from './heslo'

type Zalozka = 'login' | 'register' | 'forgot'
type Hlaska = { typ: 'chyba' | 'ok'; text: string } | null

/** Poptávka předaná z remexo.cz – zákazník jde rovnou na přihlášení. */
const prisloSPoptavkou = new URLSearchParams(location.search).has('poptavka')

export function AuthPage() {
  const { zapamatujRoli } = useAuth()
  const [role, setRole] = useState<Role | null>(prisloSPoptavkou ? 'customer' : null)
  const [zalozka, setZalozka] = useState<Zalozka>('login')
  const [hlaska, setHlaska] = useState<Hlaska>(null)
  const [pracuji, setPracuji] = useState(false)

  const vyberRoli = (r: Role) => {
    setRole(r)
    zapamatujRoli(r)
    setZalozka('login')
    setHlaska(null)
  }

  const prepni = (z: Zalozka) => {
    setZalozka(z)
    setHlaska(null)
  }

  const prihlasPres = async (provider: 'google' | 'facebook') => {
    if (role) zapamatujRoli(role)
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: location.origin + location.search } })
  }

  const prihlasit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setPracuji(true)
    if (role) zapamatujRoli(role)
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get('email')),
      password: String(f.get('heslo')),
    })
    setPracuji(false)
    if (error) {
      // Nepotvrzený účet vypadá jako špatné heslo, ale řeší se úplně jinak
      setHlaska({
        typ: 'chyba',
        text: error.message.toLowerCase().includes('not confirmed')
          ? 'Účet ještě není aktivovaný. Otevři e-mail, který jsme ti poslali, a klikni na odkaz. Kdyby nedorazil, mrkni do spamu.'
          : 'Špatný e-mail nebo heslo.',
      })
    }
  }

  const registrovat = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const heslo = String(f.get('heslo'))
    if (!f.get('souhlas'))
      return setHlaska({ typ: 'chyba', text: 'Pro vytvoření účtu musíš souhlasit s podmínkami použití a zpracováním osobních údajů.' })
    if (heslo !== f.get('heslo2')) return setHlaska({ typ: 'chyba', text: 'Hesla se neshodují. Zkontroluj je prosím.' })
    const chybaHesla = zkontrolujHeslo(heslo)
    if (chybaHesla) return setHlaska({ typ: 'chyba', text: chybaHesla })

    setPracuji(true)
    const email = String(f.get('email'))
    const { data, error } = await supabase.auth.signUp({
      email,
      password: heslo,
      options: { data: { full_name: String(f.get('jmeno')), role } },
    })
    setPracuji(false)
    if (error) return setHlaska({ typ: 'chyba', text: 'Chyba: ' + error.message })
    if (!data.session) {
      setHlaska({
        typ: 'ok',
        text: `Poslali jsme ti e-mail na ${email}. Otevři ho a klikni na odkaz, tím účet aktivuješ. Kdyby nedorazil, mrkni do spamu.`,
      })
    }
  }

  const obnovit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const email = String(new FormData(e.currentTarget).get('email')).trim()
    if (!email) return setHlaska({ typ: 'chyba', text: 'Zadej prosím svůj e-mail.' })
    setPracuji(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin })
    setPracuji(false)
    setHlaska(error ? { typ: 'chyba', text: 'Chyba: ' + error.message } : { typ: 'ok', text: 'Odkaz pro obnovu hesla byl odeslán.' })
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md">
        <img src="/logo.png" alt="Remexo" className="mb-10 h-8" />

        {!role ? (
          <div>
            <h2 className="text-center text-2xl font-semibold tracking-tight">Vítej v aplikaci</h2>
            <p className="mb-6 mt-1 text-center text-stone-500">Vyber, jak chceš Remexo používat</p>
            <div className="space-y-3">
              <KartaRole
                ikona={<House />}
                nadpis="Vstoupit jako poptávající"
                popis="Potřebuji opravit něco doma a hledám ověřeného profíka."
                onClick={() => vyberRoli('customer')}
              />
              <KartaRole
                ikona={<Hammer />}
                nadpis="Vstoupit jako řemeslník"
                popis="Jsem profík a chci získat přístup k novým zakázkám."
                onClick={() => vyberRoli('craftsman')}
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <button onClick={() => setRole(null)} className="flex items-center gap-1 text-sm font-semibold text-stone-500 hover:text-stone-800">
                <ArrowLeft className="size-4" /> Zpět
              </button>
              <span className="text-sm text-stone-500">Jako {ROLE_LABEL[role].toLowerCase()}</span>
            </div>

            {zalozka !== 'forgot' && (
              <div className="mb-6 grid grid-cols-2 rounded-lg bg-stone-100 p-1 dark:bg-stone-900">
                {(['login', 'register'] as const).map((z) => (
                  <button
                    key={z}
                    onClick={() => prepni(z)}
                    className={`rounded-md py-2 text-sm font-semibold transition-colors ${zalozka === z ? 'bg-white shadow-sm dark:bg-stone-800' : 'text-stone-500'}`}
                  >
                    {z === 'login' ? 'Přihlášení' : 'Registrace'}
                  </button>
                ))}
              </div>
            )}

            {hlaska && (
              <p className={`mb-4 rounded-lg p-3 text-sm ${hlaska.typ === 'chyba' ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'}`}>
                {hlaska.text}
              </p>
            )}

            {zalozka === 'login' && (
              <form onSubmit={prihlasit} className="space-y-4">
                <Input label="E-mail" name="email" type="email" autoComplete="email" required />
                <Input label="Heslo" name="heslo" type="password" autoComplete="current-password" required />
                <button type="button" onClick={() => prepni('forgot')} className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white">
                  Zapomenuté heslo?
                </button>
                <Button type="submit" loading={pracuji} className="w-full">Přihlásit se</Button>
                <div className="flex items-center gap-3 text-xs text-stone-400">
                  <span className="h-px flex-1 bg-stone-200 dark:bg-stone-700" /> nebo se přihlas přes <span className="h-px flex-1 bg-stone-200 dark:bg-stone-700" />
                </div>
                {/* Facebook zůstává skrytý, dokud Meta neověří firmu */}
                <Button type="button" variant="secondary" onClick={() => prihlasPres('google')} className="w-full">
                  Google
                </Button>
              </form>
            )}

            {zalozka === 'register' && (
              <form onSubmit={registrovat} className="space-y-4">
                <Input label="Jméno a příjmení" name="jmeno" autoComplete="name" required />
                <Input label="E-mail" name="email" type="email" autoComplete="email" required />
                <Input label="Heslo (min. 8 znaků, 1 velké, 1 číslo)" name="heslo" type="password" autoComplete="new-password" required />
                <Input label="Heslo znovu" name="heslo2" type="password" autoComplete="new-password" required />
                <label className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-400">
                  <input type="checkbox" name="souhlas" className="mt-1 accent-remexo-500" />
                  <span>
                    Souhlasím s <a href="/podminky" target="_blank" className="text-stone-900 underline dark:text-white">podmínkami použití</a> a{' '}
                    <a href="/soukromi.html" target="_blank" className="text-stone-900 underline dark:text-white">zpracováním osobních údajů</a>.
                  </span>
                </label>
                <Button type="submit" loading={pracuji} className="w-full">Vytvořit účet</Button>
              </form>
            )}

            {zalozka === 'forgot' && (
              <form onSubmit={obnovit} className="space-y-4">
                <p className="text-sm text-stone-500">Zadej svůj e-mail a my ti pošleme odkaz pro obnovení hesla.</p>
                <Input label="E-mail" name="email" type="email" autoComplete="email" required />
                <Button type="submit" loading={pracuji} className="w-full">Odeslat odkaz</Button>
                <Button type="button" variant="ghost" onClick={() => prepni('login')} className="w-full">Zpět na přihlášení</Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function KartaRole(props: { ikona: React.ReactNode; nadpis: string; popis: string; onClick: () => void }) {
  return (
    <button
      onClick={props.onClick}
      className="flex w-full items-center gap-4 rounded-xl border border-stone-200 p-4 text-left transition-colors hover:border-stone-400 dark:border-stone-800 dark:hover:border-stone-600"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-remexo-50 text-remexo-600 dark:bg-remexo-500/10">{props.ikona}</span>
      <span>
        <span className="block font-semibold">{props.nadpis}</span>
        <span className="block text-sm text-stone-500">{props.popis}</span>
      </span>
    </button>
  )
}
