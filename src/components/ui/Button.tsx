import type { ButtonHTMLAttributes } from 'react'
import { LoaderCircle } from 'lucide-react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
}

const styles = {
  primary: 'bg-remexo-500 hover:bg-remexo-600 text-white shadow-sm',
  secondary:
    'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700',
  ghost: 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
}

export function Button({ variant = 'primary', loading, disabled, className = '', children, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition disabled:opacity-60 ${styles[variant]} ${className}`}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </button>
  )
}
