import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { DUVODY_ODMITNUTI } from '@/lib/types'

/** Zákazník vybere důvod, řemeslník ho pak uvidí u své nabídky. */
export function OdmitnutiModal({ otevreno, zavrit, potvrdit, pracuji }: { otevreno: boolean; zavrit: () => void; potvrdit: (duvod: string) => void; pracuji: boolean }) {
  const [duvod, setDuvod] = useState<string | null>(null)
  return (
    <Modal otevreno={otevreno} zavrit={zavrit} nadpis="Proč nabídku odmítáš?">
      <p className="mb-4 text-sm text-muted">Řemeslník uvidí důvod a může poslat upravenou nabídku.</p>
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Důvod odmítnutí</legend>
        {DUVODY_ODMITNUTI.map((d) => (
          <label
            key={d.kod}
            className={`flex cursor-pointer items-center gap-3 rounded-[10px] border px-3.5 py-3 text-sm transition-colors ${duvod === d.kod ? 'border-accent bg-accent-soft font-semibold' : 'border-line-strong hover:bg-surface-2'}`}
          >
            <input type="radio" name="duvod" value={d.kod} checked={duvod === d.kod} onChange={() => setDuvod(d.kod)} className="accent-[var(--accent)]" />
            {d.text}
          </label>
        ))}
      </fieldset>
      <div className="mt-6 flex gap-2">
        <Button varianta="secondary" onClick={zavrit} className="flex-1">Zpět</Button>
        <Button onClick={() => duvod && potvrdit(duvod)} disabled={!duvod} loading={pracuji} className="flex-1">Odmítnout</Button>
      </div>
    </Modal>
  )
}
