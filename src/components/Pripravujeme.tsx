import { Hammer } from 'lucide-react'

/** Zástupná stránka pro část, která se teprve přepisuje. */
export function Pripravujeme({ nazev }: { nazev: string }) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
      <Hammer className="mx-auto size-10 text-remexo-500" />
      <p className="mt-3 font-bold">{nazev}</p>
      <p className="mt-1 text-sm text-slate-500">Tahle část se právě přepisuje do nové verze.</p>
    </div>
  )
}
