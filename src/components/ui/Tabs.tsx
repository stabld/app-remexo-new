/** Přepínač v „pilulce“ (filtr seznamu). */
export function SegmentTabs<T extends string>({
  hodnota, zmenit, moznosti, popis,
}: { hodnota: T; zmenit: (v: T) => void; moznosti: { id: T; text: string; pocet?: number }[]; popis: string }) {
  return (
    <div role="tablist" aria-label={popis} className="inline-flex gap-1 rounded-[10px] bg-surface-2 p-1">
      {moznosti.map((m) => {
        const aktivni = m.id === hodnota
        return (
          <button
            key={m.id}
            role="tab"
            aria-selected={aktivni}
            onClick={() => zmenit(m.id)}
            className={`rounded-[7px] px-3.5 py-1.5 text-sm transition-colors ${aktivni ? 'bg-surface font-semibold text-ink shadow-sm' : 'font-medium text-soft hover:text-ink'}`}
          >
            {m.text}
            {m.pocet !== undefined && <span className={`ml-1.5 ${aktivni ? 'font-medium text-muted' : 'text-faint'}`}>{m.pocet}</span>}
          </button>
        )
      })}
    </div>
  )
}
