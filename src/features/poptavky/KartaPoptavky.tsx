import { Link } from 'react-router-dom'
import { CircleAlert, Clock, Tag, Trash2 } from 'lucide-react'
import { rozlozPopis } from '@/lib/popis'
import { formatDatumCas, stariPoptavky } from '@/lib/cas'
import { STAV_POPTAVKY } from '@/lib/types'
import { Fotky } from '@/components/Fotky'
import type { MojePoptavka } from './api'

/** Co má zákazník udělat teď – jedno hlavní tlačítko podle stavu zakázky. */
function hlavniAkce(p: MojePoptavka): { text: string; zvyraznit: boolean } {
  if (p.status === 'active' && p.dokonceni_navrzeno) return { text: 'Řemeslník hlásí hotovo – potvrdit a ohodnotit', zvyraznit: true }
  if (p.status === 'active' || p.status === 'done') return { text: p.craftsman_name ? `Řemeslník: ${p.craftsman_name}` : 'Zobrazit zakázku', zvyraznit: false }
  if (p.cekajiciNabidky === 1) return { text: 'Máš novou nabídku!', zvyraznit: true }
  if (p.cekajiciNabidky > 1) return { text: `Máš ${p.cekajiciNabidky} ${p.cekajiciNabidky < 5 ? 'nabídky' : 'nabídek'} – vyber si`, zvyraznit: true }
  return { text: 'Zobrazit detail', zvyraznit: false }
}

/** Poptávka bez nabídek – zákazník musí vědět, jestli čekat, nebo něco udělat. */
function PanelBezNabidek({ vytvoreno }: { vytvoreno: string }) {
  const hodin = (stariPoptavky(vytvoreno)?.minut ?? 0) / 60
  const [nadpis, text] =
    hodin < 24
      ? ['Poptávka je vypsaná', 'Řemeslníci ve tvém okolí ji vidí na tržišti. Jakmile někdo pošle nabídku, dáme ti vědět e-mailem.']
      : hodin < 72
        ? ['Zatím se nikdo neozval', 'Někdy to chvíli trvá. Pomůže, když do popisu doplníš fotku závady a kdy se ti hodí termín.']
        : ['Na tuhle poptávku zatím nemáme řemeslníka', 'Remexo v Olomouci teprve začíná a v některých oborech nám řemeslníci chybí. Napiš nám a zkusíme někoho oslovit napřímo.']
  return (
    <div className="rounded-2xl bg-remexo-50 p-4 text-sm text-remexo-600 dark:bg-remexo-500/10 dark:text-remexo-500">
      <p className="font-bold">{nadpis}</p>
      <p className="mt-1 opacity-90">{text}</p>
    </div>
  )
}

export function KartaPoptavky({ poptavka: p, onSmazat }: { poptavka: MojePoptavka; onSmazat: () => void }) {
  const popis = rozlozPopis(p.description)
  const stav = STAV_POPTAVKY[p.status] ?? STAV_POPTAVKY.waiting
  const akce = hlavniAkce(p)

  return (
    <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className={`absolute inset-y-0 left-0 w-1.5 ${p.status === 'done' || p.status === 'cancelled' ? 'bg-slate-300 dark:bg-slate-700' : 'bg-remexo-500'}`} />

      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-400">
        <span className="flex items-center gap-1"><Tag className="size-3.5" />{p.category || 'Ostatní'}</span>
        <span className="flex items-center gap-1"><Clock className="size-3.5" />{formatDatumCas(p.created_at)}</span>
        <span className={`ml-auto rounded-full px-2.5 py-1 text-xs font-bold ${stav.trida}`}>{stav.text}</span>
      </div>

      <h3 className="text-xl font-extrabold leading-tight">{p.title || 'Poptávka'}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{popis.hlavni}</p>

      {(popis.soubory.length > 0 || popis.stareFotky.length > 0) && (
        <div className="mt-4"><Fotky soubory={popis.soubory} stare={popis.stareFotky} velikost="size-20" /></div>
      )}

      <div className="mt-4 space-y-3">
        {p.odstoupeni && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
            <p className="flex items-center gap-2 font-bold"><CircleAlert className="size-4" />{p.odstoupeni.craftsman_name || 'Řemeslník'} ze zakázky odstoupil</p>
            <p className="mt-1">{p.odstoupeni.duvod ? `„${p.odstoupeni.duvod}“` : 'Důvod neuvedl.'}</p>
            {p.status === 'waiting' && <p className="mt-1 text-xs font-bold">Poptávka je zpět na tržišti, můžeš vybrat jiného řemeslníka.</p>}
          </div>
        )}
        {p.status === 'waiting' && p.cekajiciNabidky === 0 && <PanelBezNabidek vytvoreno={p.created_at} />}
        {p.status === 'cancelled' && p.zruseno_duvod && (
          <p className="text-sm text-slate-500">Důvod zrušení: {p.zruseno_duvod}</p>
        )}
      </div>

      <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <Link
          to={`/poptavky/${p.id}`}
          className={`flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-center text-sm font-bold transition ${
            akce.zvyraznit ? 'bg-remexo-500 text-white hover:bg-remexo-600' : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900'
          }`}
        >
          {akce.text}
        </Link>
        {/* Smazat jde jen poptávka, na které nikdo nepracuje (stejně to hlídá i DB) */}
        {p.status === 'waiting' && (
          <button onClick={onSmazat} aria-label="Smazat poptávku" className="grid size-12 shrink-0 place-items-center rounded-xl border-2 border-slate-200 text-slate-400 transition hover:border-red-200 hover:text-red-500 dark:border-slate-700">
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </article>
  )
}
