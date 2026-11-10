import { LoaderCircle } from 'lucide-react'

export function NacitaniStranky() {
  return (
    <div className="grid place-items-center py-20" role="status" aria-label="Načítám">
      <LoaderCircle className="size-7 animate-spin text-accent" />
    </div>
  )
}
