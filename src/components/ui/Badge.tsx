import type { ReactNode } from 'react'

export type Ton = 'accent' | 'info' | 'success' | 'neutral' | 'muted'

const TONY: Record<Ton, { obal: string; tecka: string }> = {
  accent: { obal: 'bg-accent-soft text-accent-soft-text', tecka: 'bg-accent' },
  info: { obal: 'bg-info-soft text-info-text', tecka: 'bg-info-dot' },
  success: { obal: 'bg-success-soft text-success-text', tecka: 'bg-success-dot' },
  neutral: { obal: 'bg-surface-2 text-soft', tecka: 'bg-faint' },
  muted: { obal: 'bg-surface-2 text-muted', tecka: 'bg-line-strong' },
}

/** Stav vždy slovy, barva jen pomáhá. */
export function Badge({ ton = 'neutral', tecka = true, children }: { ton?: Ton; tecka?: boolean; children: ReactNode }) {
  const t = TONY[ton]
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.obal}`}>
      {tecka && <span className={`size-1.5 rounded-full ${t.tecka}`} aria-hidden />}
      {children}
    </span>
  )
}
