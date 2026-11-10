/** Průběh zakázky – poznávací prvek Remexa. aktualni = index kroku (0–3), hotovo = vše hotové. */
export const KROKY = ['Zadáno', 'Nabídky', 'Realizace', 'Hotovo'] as const

export function ProgressSteps({ aktualni, popisky = true, velke = false }: { aktualni: number; popisky?: boolean; velke?: boolean }) {
  return (
    <div role="img" aria-label={`Průběh zakázky: ${KROKY[aktualni]}`} className="flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-1">
        {KROKY.map((k, i) => (
          <span
            key={k}
            className={`${velke ? 'h-1.5' : 'h-1'} rounded-full ${i < aktualni ? 'bg-ink' : i === aktualni ? 'bg-accent' : 'bg-line'}`}
          />
        ))}
      </div>
      {popisky && (
        <div className={`grid grid-cols-4 gap-1 ${velke ? 'text-[13px]' : 'text-xs'}`} aria-hidden>
          {KROKY.map((k, i) => (
            <span key={k} className={i === aktualni ? 'font-semibold text-ink' : i < aktualni ? 'text-muted' : 'text-faint'}>{k}</span>
          ))}
        </div>
      )}
    </div>
  )
}
