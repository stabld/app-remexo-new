import { useRouteError } from 'react-router-dom'

/** Když se stránka nepovede vykreslit, ukáže srozumitelnou hlášku místo technického výpisu. */
export function ChybaStranky() {
  const chyba = useRouteError()
  console.error(chyba)
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-3 p-6">
      <img src="/logo.png" alt="Remexo" className="mb-4 h-7 self-start" />
      <h1 className="text-2xl font-semibold tracking-tight">Tahle stránka se nenačetla</h1>
      <p className="text-muted">Něco se pokazilo na naší straně. Zkus stránku obnovit. Když to nepomůže, napiš nám a pošli snímek obrazovky.</p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => location.reload()} className="rounded-[10px] bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover">Obnovit stránku</button>
        <a href="/" className="rounded-[10px] border border-line-strong px-4 py-2.5 text-sm font-semibold hover:bg-surface-2">Na přehled</a>
      </div>
    </div>
  )
}
