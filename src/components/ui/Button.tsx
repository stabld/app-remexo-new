import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'

type Varianta = 'primary' | 'secondary' | 'ghost' | 'danger'
type Velikost = 'sm' | 'md' | 'lg'

const VARIANTY: Record<Varianta, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  secondary: 'border border-line-strong bg-surface text-ink hover:bg-surface-2',
  ghost: 'text-soft hover:bg-surface-2 hover:text-ink',
  danger: 'bg-danger text-white hover:opacity-90',
}
const VELIKOSTI: Record<Velikost, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-3.5 py-2 text-sm',
  lg: 'px-[18px] py-3 text-[15px]',
}

export function tridyTlacitka(varianta: Varianta = 'primary', velikost: Velikost = 'md', navic = '') {
  return `inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTY[varianta]} ${VELIKOSTI[velikost]} ${navic}`
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { varianta?: Varianta; velikost?: Velikost; loading?: boolean }

export function Button({ varianta, velikost, loading, disabled, className = '', children, type = 'button', ...rest }: Props) {
  return (
    <button {...rest} type={type} disabled={disabled || loading} className={tridyTlacitka(varianta, velikost, className)}>
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

/** Odkaz, který vypadá jako tlačítko (navigace v aplikaci). */
export function ButtonLink({
  to, varianta, velikost, className = '', children, ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; varianta?: Varianta; velikost?: Velikost }) {
  return (
    <Link to={to} {...rest} className={tridyTlacitka(varianta, velikost, className)}>
      {children}
    </Link>
  )
}
