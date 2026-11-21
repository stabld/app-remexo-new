import { useState } from 'react'
import { MessageSquare, Star } from 'lucide-react'
import { Badge, type Ton } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/Toast'
import {
  DNU_NA_POTVRZENI, dnuOd, useNahlasitDokonceni, usePotvrditDokonceni, useUzavritBezOdezvy, ZmenaStavu, type MojePrace,
} from './api'

export type StavPrace = 'realizace' | 'ceka-na-zakaznika' | 'zakaznik-hlasi-hotovo' | 'hotovo' | 'zruseno'

export function stavPrace(p: MojePrace): StavPrace {
  if (p.druh === 'hotovo') return 'hotovo'
  if (p.druh === 'zrusena') return 'zruseno'
  if (p.dokonceniNavrzeno) return 'ceka-na-zakaznika'
  if (p.dokonceniOdZakaznika) return 'zakaznik-hlasi-hotovo'
  return 'realizace'
}

const STAVY: Record<StavPrace, { text: string; ton: Ton }> = {
  realizace: { text: 'Probíhá realizace', ton: 'info' },
  'ceka-na-zakaznika': { text: 'Čeká na potvrzení zákazníkem', ton: 'accent' },
  'zakaznik-hlasi-hotovo': { text: 'Zákazník hlásí hotovo', ton: 'accent' },
  hotovo: { text: 'Dokončeno', ton: 'success' },
  zruseno: { text: 'Zrušeno zákazníkem', ton: 'muted' },
}

export function StavPraceBadge({ p }: { p: MojePrace }) {
  const s = STAVY[stavPrace(p)]
  return <Badge ton={s.ton}>{s.text}</Badge>
}

function dny(n: number) {
  return n === 1 ? '1 den' : n >= 2 && n <= 4 ? `${n} dny` : `${n} dní`
}

export function Hvezdy({ pocet }: { pocet: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${pocet} z 5 hvězd`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`size-4 ${i <= pocet ? 'fill-accent text-accent' : 'text-line-strong'}`} aria-hidden />
      ))}
    </span>
  )
}

/**
 * Co má řemeslník u zakázky udělat teď. Stejné kroky jako pilot:
 * nahlásit hotovo → zákazník potvrdí; když zákazník hlásí hotovo první, potvrdí řemeslník;
 * po týdnu bez reakce smí řemeslník uzavřít sám.
 */
export function DalsiKrok({ p, kompaktni = false, chat = true }: { p: MojePrace; kompaktni?: boolean; chat?: boolean }) {
  const toast = useToast()
  const nahlasit = useNahlasitDokonceni()
  const potvrdit = usePotvrditDokonceni()
  const uzavrit = useUzavritBezOdezvy()
  const [ptatSe, setPtatSe] = useState(false)
  const stav = stavPrace(p)
  const zarovnani = kompaktni ? 'items-end text-right' : 'items-start'

  const chyba = (nadpis: string) => (e: Error) =>
    toast(nadpis, e instanceof ZmenaStavu ? 'Stav zakázky se mezitím změnil. Seznam jsme obnovili.' : e.message, e instanceof ZmenaStavu ? 'info' : 'error')

  if (stav === 'hotovo')
    return p.hodnoceni ? (
      <span className={`flex flex-col gap-1 ${zarovnani}`}>
        <Hvezdy pocet={p.hodnoceni.hvezdicky} />
        {!kompaktni && p.hodnoceni.komentar && <span className="text-sm text-soft">„{p.hodnoceni.komentar}“</span>}
      </span>
    ) : (
      <span className="text-sm text-muted">Zákazník zatím nehodnotil</span>
    )

  if (stav === 'zruseno')
    return <span className="text-sm text-muted">{p.zrusenoDuvod ? `„${p.zrusenoDuvod}“` : 'Důvod neuvedl'}</span>

  const napsat = (
    <ButtonLink to={`/zpravy/${p.requestId}`} varianta="secondary" velikost="sm">
      <MessageSquare className="size-4" aria-hidden />Napsat zákazníkovi
    </ButtonLink>
  )

  if (stav === 'zakaznik-hlasi-hotovo')
    return (
      <span className={`flex flex-col gap-1.5 ${zarovnani}`}>
        <Button
          velikost="sm"
          loading={potvrdit.isPending}
          onClick={() => potvrdit.mutate(p.requestId, {
            onSuccess: () => toast('Zakázka dokončena', 'Obě strany potvrdily hotovo.', 'success'),
            onError: chyba('Nepodařilo se potvrdit'),
          })}
        >
          Potvrdit dokončení
        </Button>
        {!kompaktni && <span className="text-[13px] text-muted">Zákazník označil práci za hotovou. Po potvrzení se zakázka uzavře.</span>}
      </span>
    )

  if (stav === 'ceka-na-zakaznika') {
    const n = dnuOd(p.dokonceniNavrzeno)
    const muzeUzavrit = n >= DNU_NA_POTVRZENI
    return (
      <span className={`flex flex-col gap-1.5 ${zarovnani}`}>
        {muzeUzavrit ? (
          <Button
            varianta="secondary"
            velikost="sm"
            loading={uzavrit.isPending}
            onClick={() => uzavrit.mutate(p.requestId, {
              onSuccess: () => toast('Zakázka uzavřená', 'Zákazník nereagoval týden, zakázku jsme uzavřeli.', 'success'),
              onError: chyba('Zakázku se nepodařilo uzavřít'),
            })}
          >
            Zákazník nereaguje, uzavřít
          </Button>
        ) : chat ? (
          napsat
        ) : null}
        <span className="text-xs text-muted">
          {muzeUzavrit
            ? `Hotovo jsi nahlásil před ${dny(n)}.`
            : `Nahlášeno ${n === 0 ? 'dnes' : `před ${dny(n)}`}. Bez odezvy ${DNU_NA_POTVRZENI} dní? Můžeš uzavřít sám.`}
        </span>
      </span>
    )
  }

  return (
    <span className={`flex flex-col gap-1.5 ${zarovnani}`}>
      <Button velikost="sm" onClick={() => setPtatSe(true)}>Nahlásit dokončení</Button>
      {!kompaktni && <span className="text-[13px] text-muted">Zákazník dostane zprávu, potvrdí hotovo a ohodnotí tě.</span>}
      <Modal otevreno={ptatSe} zavrit={() => setPtatSe(false)} nadpis="Je práce hotová?">
        <p className="text-sm text-soft">
          Zákazník dostane zprávu, že je hotovo, a požádáme ho o potvrzení a hodnocení. Když do {DNU_NA_POTVRZENI} dní nezareaguje, můžeš zakázku uzavřít sám.
        </p>
        <div className="mt-6 flex gap-2">
          <Button varianta="secondary" onClick={() => setPtatSe(false)} className="flex-1">Ještě ne</Button>
          <Button
            className="flex-1"
            loading={nahlasit.isPending}
            onClick={() => nahlasit.mutate(p.requestId, {
              onSuccess: () => { setPtatSe(false); toast('Odesláno zákazníkovi', 'Až práci potvrdí, zakázka se uzavře.', 'success') },
              onError: chyba('Nepodařilo se odeslat'),
            })}
          >
            Ano, je hotovo
          </Button>
        </div>
      </Modal>
    </span>
  )
}
