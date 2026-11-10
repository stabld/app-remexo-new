import { Link } from 'react-router-dom'
import { NacitaniStranky } from '@/components/NacitaniStranky'
import { useMojePoptavky } from './api'
import { RadekPoptavky } from './RadekPoptavky'

export function MojePoptavkyPage() {
  const { data: poptavky, isLoading, isError } = useMojePoptavky()

  if (isLoading) return <NacitaniStranky />

  if (isError)
    return <p className="text-stone-500">Poptávky se nepodařilo načíst. Zkontroluj připojení a obnov stránku.</p>

  if (!poptavky?.length)
    return (
      <div className="max-w-md py-10">
        <p className="text-lg font-semibold">Co potřebuješ opravit?</p>
        <p className="mt-1 text-stone-500">Popiš závadu, přidej fotku a řemeslníci z okolí ti pošlou nabídky.</p>
        <Link to="/nova" className="mt-5 inline-flex rounded-lg bg-remexo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-remexo-600">
          Zadat poptávku
        </Link>
      </div>
    )

  return (
    <div className="-mx-4 divide-y divide-stone-200 border-y border-stone-200 sm:mx-0 sm:overflow-hidden sm:rounded-xl sm:border dark:divide-stone-800 dark:border-stone-800">
      {poptavky.map((p) => <RadekPoptavky key={p.id} poptavka={p} />)}
    </div>
  )
}
