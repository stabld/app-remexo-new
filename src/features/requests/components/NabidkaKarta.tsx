import { ShieldCheck, Star } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { kratkeDatum } from '@/lib/cas'
import type { NabidkaVDetailu } from '../api'

/** Jedna nabídka; karty stojí vedle sebe, aby se daly porovnat. */
export function NabidkaKarta({
  nabidka: n, lzeRozhodnout, onPrijmout, onOdmitnout, pracuji,
}: { nabidka: NabidkaVDetailu; lzeRozhodnout: boolean; onPrijmout: () => void; onOdmitnout: () => void; pracuji: boolean }) {
  const jmeno = n.craftsman_name || 'Řemeslník'
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-3">
        <Avatar jmeno={jmeno} url={n.avatarUrl} velikost={44} />
        <div className="flex min-w-0 flex-col leading-snug">
          <span className="flex items-center gap-1.5 font-semibold">
            {jmeno}
            {n.overeny && <ShieldCheck className="size-4 text-success-text" aria-label="Ověřený řemeslník" />}
          </span>
          {n.hodnoceni ? (
            <span className="flex items-center gap-1 text-[13px] text-muted">
              <Star className="size-3.5 fill-accent text-accent" aria-hidden />
              <b className="font-semibold text-ink">{n.hodnoceni.prumer.toLocaleString('cs', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}</b>
              z {n.hodnoceni.pocet} hodnocení
            </span>
          ) : (
            <span className="text-[13px] text-muted">Nový na Remexu</span>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-[10px] bg-bg px-3.5 py-3">
        <div>
          <dt className="text-xs text-muted">Cena</dt>
          <dd className="text-xl font-semibold tabular-nums">{n.price || 'Dohodou'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Nabídka z</dt>
          <dd className="pt-1 text-[15px] font-semibold">{kratkeDatum(n.created_at)}</dd>
        </div>
      </dl>

      {n.message && <p className="whitespace-pre-line text-sm text-soft">{n.message}</p>}

      <div className="mt-auto">
        {n.status === 'accepted' ? (
          <p className="rounded-[10px] bg-success-soft px-3 py-2 text-sm font-semibold text-success-text">Tuto nabídku jsi přijal</p>
        ) : lzeRozhodnout ? (
          <div className="flex flex-wrap gap-2">
            <Button onClick={onPrijmout} loading={pracuji} className="flex-1">Přijmout nabídku</Button>
            <Button onClick={onOdmitnout} varianta="secondary" disabled={pracuji}>Odmítnout</Button>
          </div>
        ) : null}
      </div>
    </Card>
  )
}
