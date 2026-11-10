import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { Nahled } from '@/components/Fotky'
import { rozlozPopis } from '@/lib/popis'
import type { MojePoptavka } from '../api'
import { nejnizsiCena, sklonujNabidky } from '../model'

/** Karta „Čeká na tebe“ na přehledu: co se stalo a jedno hlavní tlačítko. */
export function KartaNaTebe({ poptavka: p }: { poptavka: MojePoptavka }) {
  const popis = rozlozPopis(p.description)
  const detail = `/poptavky/${p.id}`
  const potvrzeni = p.stav === 'ceka-na-potvrzeni'
  const cena = nejnizsiCena(p.nabidky.filter((n) => n.status === 'pending').map((n) => n.price))

  return (
    <Card className="flex gap-4 p-5">
      <Nahled soubory={popis.soubory} stare={popis.stareFotky} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="self-start">
          <Badge ton="accent">
            {potvrzeni ? 'Čeká na potvrzení dokončení' : `${p.cekajiciNabidky} ${p.cekajiciNabidky === 1 ? 'nová nabídka' : p.cekajiciNabidky < 5 ? 'nové nabídky' : 'nových nabídek'}`}
          </Badge>
        </span>
        <p className="text-base font-semibold">{p.title || 'Poptávka'}</p>
        <p className="text-sm text-muted">
          {potvrzeni
            ? `${p.craftsman_name ?? 'Řemeslník'} hlásí, že je hotovo.`
            : cena
              ? `Nejnižší ${cena}, celkem ${p.cekajiciNabidky} ${sklonujNabidky(p.cekajiciNabidky)}.`
              : 'Podívej se na ně a vyber si.'}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <ButtonLink to={detail}>{potvrzeni ? 'Potvrdit a ohodnotit' : 'Porovnat nabídky'}</ButtonLink>
          {potvrzeni && (
            <ButtonLink to="/zpravy" varianta="secondary">Napsat řemeslníkovi</ButtonLink>
          )}
        </div>
      </div>
    </Card>
  )
}
