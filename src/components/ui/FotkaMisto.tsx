import { ImageIcon } from 'lucide-react'

/** Šedé místo, když poptávka fotku nemá. */
export function FotkaMisto({ className = '' }: { className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-[10px] bg-placeholder text-faint ${className}`} aria-hidden>
      <ImageIcon className="size-5" strokeWidth={1.8} />
    </span>
  )
}
