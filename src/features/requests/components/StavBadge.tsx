import { Badge } from '@/components/ui/Badge'
import { STAVY, type ZobrazenyStav } from '../model'

export function StavBadge({ stav }: { stav: ZobrazenyStav }) {
  return <Badge ton={STAVY[stav].ton}>{STAVY[stav].text}</Badge>
}
