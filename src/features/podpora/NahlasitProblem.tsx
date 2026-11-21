import { useState, type ReactNode } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { useToast } from '@/components/Toast'
import { supabase } from '@/lib/supabase'
import { mer } from '@/services/mereni'
import { useAuth } from '@/features/auth/AuthProvider'

/**
 * Nahlášení problému (tabulka hlaseni, stejně jako pilot). Spouštěč si volající vykreslí sám:
 * <NahlasitProblem>{(otevrit) => <button onClick={otevrit}>…</button>}</NahlasitProblem>
 */
export function NahlasitProblem({ children }: { children: (otevrit: () => void) => ReactNode }) {
  const { user } = useAuth()
  const toast = useToast()
  const [otevreno, setOtevreno] = useState(false)
  const [text, setText] = useState('')
  const [email, setEmail] = useState(user?.email ?? '')
  const [chyba, setChyba] = useState('')
  const [odesilam, setOdesilam] = useState(false)

  const odeslat = async () => {
    const obsah = text.trim()
    if (obsah.length < 5) return setChyba('Napiš prosím aspoň pár slov.')
    setOdesilam(true)
    const { error } = await supabase.from('hlaseni').insert({
      text: obsah.slice(0, 4000),
      user_id: user?.id ?? null,
      email: email.trim() || null,
      url: location.href,
      prohlizec: navigator.userAgent,
    })
    setOdesilam(false)
    if (error) return toast('Nepovedlo se odeslat', 'Zkus to prosím znovu.', 'error')
    void mer('hlaseni_odeslano')
    toast('Díky, odesláno', 'Podíváme se na to.', 'success')
    setText('')
    setOtevreno(false)
  }

  return (
    <>
      {children(() => setOtevreno(true))}
      <Modal otevreno={otevreno} zavrit={() => setOtevreno(false)} nadpis="Nahlásit problém">
        <p className="mb-4 text-sm text-muted">Co nefunguje nebo je matoucí? Pošleme to rovnou tomu, kdo appku dělá.</p>
        <div className="flex flex-col gap-4">
          <Textarea label="Co se stalo" rows={4} value={text} onChange={(e) => { setText(e.target.value); setChyba('') }} chyba={chyba} />
          <Input label="E-mail pro odpověď" type="email" value={email} onChange={(e) => setEmail(e.target.value)} napoveda="Nepovinné." />
        </div>
        <div className="mt-6 flex gap-2">
          <Button varianta="secondary" onClick={() => setOtevreno(false)} className="flex-1">Zrušit</Button>
          <Button onClick={odeslat} loading={odesilam} className="flex-1">Odeslat</Button>
        </div>
      </Modal>
    </>
  )
}
