import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/Toast'
import { NacitaniStranky } from '@/components/NacitaniStranky'
import { useMojePoptavky, useSmazatPoptavku, type MojePoptavka } from './api'
import { KartaPoptavky } from './KartaPoptavky'

export function MojePoptavkyPage() {
  const { data: poptavky, isLoading } = useMojePoptavky()
  const smazat = useSmazatPoptavku()
  const toast = useToast()
  const [keSmazani, setKeSmazani] = useState<MojePoptavka | null>(null)

  const potvrditSmazani = () => {
    if (!keSmazani) return
    smazat.mutate(keSmazani, {
      onSuccess: () => toast('Smazáno', 'Poptávka byla smazána.', 'info'),
      onError: (e) => toast('Tuto poptávku nelze smazat', e.message, 'error'),
      onSettled: () => setKeSmazani(null),
    })
  }

  if (isLoading) return <NacitaniStranky />

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {!poptavky?.length ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
          <ClipboardList className="mx-auto size-10 text-slate-300" />
          <p className="mt-3 font-bold">Zatím žádné poptávky</p>
          <p className="mt-1 text-sm text-slate-500">Popiš, co potřebuješ opravit, a řemeslníci z okolí ti pošlou nabídky.</p>
          <Link to="/nova" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-remexo-500 px-5 py-3 text-sm font-bold text-white hover:bg-remexo-600">
            <Plus className="size-4" /> Nová poptávka
          </Link>
        </div>
      ) : (
        poptavky.map((p) => <KartaPoptavky key={p.id} poptavka={p} onSmazat={() => setKeSmazani(p)} />)
      )}

      <Modal otevreno={!!keSmazani} zavrit={() => setKeSmazani(null)} nadpis="Smazat poptávku?">
        <p className="text-sm text-slate-500">„{keSmazani?.title}“ zmizí z tržiště i s fotkami. Tohle nejde vrátit.</p>
        <div className="mt-6 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setKeSmazani(null)}>Nechat</Button>
          <Button className="flex-1 !bg-red-500 hover:!bg-red-600" loading={smazat.isPending} onClick={potvrditSmazani}>Smazat</Button>
        </div>
      </Modal>
    </div>
  )
}
