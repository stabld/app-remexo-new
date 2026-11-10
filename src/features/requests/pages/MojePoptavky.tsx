import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Stranka } from '@/layouts/Stranka'
import { ButtonLink } from '@/components/ui/Button'
import { SegmentTabs } from '@/components/ui/Tabs'
import { NacitaniStranky } from '@/components/NacitaniStranky'
import { useMojePoptavky } from '../api'
import { STAVY } from '../model'
import { KartaPoptavky } from '../components/KartaPoptavky'

type Filtr = 'aktivni' | 'dokoncene' | 'zrusene'

export function MojePoptavky() {
  const { data: poptavky = [], isLoading, isError } = useMojePoptavky()
  const [filtr, setFiltr] = useState<Filtr>('aktivni')
  const [hledat, setHledat] = useState('')

  const skupiny = useMemo(() => {
    const aktivni = poptavky
      .filter((p) => p.status === 'waiting' || p.status === 'active')
      // nahoru to, co čeká na zákazníka, pak nejnovější
      .sort((a, b) => Number(STAVY[b.stav].naTebe) - Number(STAVY[a.stav].naTebe) || b.created_at.localeCompare(a.created_at))
    return {
      aktivni,
      dokoncene: poptavky.filter((p) => p.status === 'done'),
      zrusene: poptavky.filter((p) => p.status === 'cancelled'),
    }
  }, [poptavky])

  const dotaz = hledat.trim().toLocaleLowerCase('cs')
  const zobrazene = skupiny[filtr].filter((p) => !dotaz || `${p.title} ${p.description} ${p.category}`.toLocaleLowerCase('cs').includes(dotaz))

  return (
    <Stranka
      nadpis="Moje poptávky"
      akce={<ButtonLink to="/nova"><Plus className="size-4" strokeWidth={2.4} /> Vytvořit poptávku</ButtonLink>}
    >
      {isLoading ? (
        <NacitaniStranky />
      ) : isError ? (
        <p className="text-muted">Poptávky se nepodařilo načíst. Zkontroluj připojení a obnov stránku.</p>
      ) : !poptavky.length ? (
        <div className="max-w-md py-8">
          <p className="text-lg font-semibold">Zatím tu nic není</p>
          <p className="mt-1 text-muted">Popiš, co potřebuješ opravit, přidej fotku a řemeslníci z okolí ti pošlou nabídky.</p>
          <ButtonLink to="/nova" className="mt-5">Vytvořit první poptávku</ButtonLink>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <SegmentTabs
              popis="Filtr poptávek"
              hodnota={filtr}
              zmenit={setFiltr}
              moznosti={[
                { id: 'aktivni', text: 'Aktivní', pocet: skupiny.aktivni.length },
                { id: 'dokoncene', text: 'Dokončené', pocet: skupiny.dokoncene.length },
                { id: 'zrusene', text: 'Zrušené', pocet: skupiny.zrusene.length },
              ]}
            />
            <label className="flex h-10 min-w-[240px] items-center gap-2 rounded-[10px] border border-line-strong bg-surface px-3 text-muted sm:ml-auto">
              <Search className="size-4" aria-hidden />
              <input
                type="search"
                value={hledat}
                onChange={(e) => setHledat(e.target.value)}
                placeholder="Hledat v poptávkách"
                aria-label="Hledat v poptávkách"
                className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
              />
            </label>
          </div>

          {zobrazene.length ? (
            <div className="flex flex-col gap-3">
              {zobrazene.map((p) => <KartaPoptavky key={p.id} poptavka={p} />)}
            </div>
          ) : (
            <p className="py-8 text-muted">
              {dotaz ? 'Nic takového jsme nenašli. Zkus jiné slovo.' : filtr === 'dokoncene' ? 'Zatím žádná dokončená zakázka.' : filtr === 'zrusene' ? 'Žádná zrušená poptávka.' : 'Teď nemáš žádnou aktivní poptávku.'}
            </p>
          )}
        </div>
      )}
    </Stranka>
  )
}
