import { useState } from 'react'
import { Star } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'

const SLOVNE = ['', 'Špatné', 'Nic moc', 'Dobré', 'Velmi dobré', 'Výborné']

export function HodnoceniModal({
  otevreno, zavrit, potvrdit, pracuji, remeslnik,
}: { otevreno: boolean; zavrit: () => void; potvrdit: (hvezdicky: number, komentar: string) => void; pracuji: boolean; remeslnik: string }) {
  const [hvezdicky, setHvezdicky] = useState(5)
  const [komentar, setKomentar] = useState('')
  return (
    <Modal otevreno={otevreno} zavrit={zavrit} nadpis="Potvrdit dokončení">
      <p className="mb-5 text-sm text-muted">Jak jsi byl spokojený s prací ({remeslnik})? Hodnocení uvidí další zákazníci.</p>
      <fieldset className="mb-5">
        <legend className="mb-2 text-sm font-medium">Hodnocení</legend>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((h) => (
            <button key={h} type="button" onClick={() => setHvezdicky(h)} aria-label={`${h} z 5`} aria-pressed={h === hvezdicky} className="rounded-md p-1">
              <Star className={`size-8 ${h <= hvezdicky ? 'fill-accent text-accent' : 'text-line-strong'}`} />
            </button>
          ))}
          <span className="ml-2 text-sm font-medium text-soft">{SLOVNE[hvezdicky]}</span>
        </div>
      </fieldset>
      <Textarea label="Komentář (nepovinný)" rows={3} value={komentar} onChange={(e) => setKomentar(e.target.value)} placeholder="Co se povedlo, co ne" />
      <div className="mt-6 flex gap-2">
        <Button varianta="secondary" onClick={zavrit} className="flex-1">Zpět</Button>
        <Button onClick={() => potvrdit(hvezdicky, komentar)} loading={pracuji} className="flex-1">Potvrdit a ohodnotit</Button>
      </div>
    </Modal>
  )
}
