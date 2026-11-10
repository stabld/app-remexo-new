import type { ButtonHTMLAttributes } from 'react'
import { LoaderCircle } from 'lucide-react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  loading?: boolean
}

const styles = {
  primary: 'bg-remexo-500 hover:bg-remexo-600 text-white',
  secondary: 'border border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-900',
  ghost: 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
}

export function Button({ variant = 'primary', loading, disabled, className = '', children, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${styles[variant]} ${className}`}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </button>
  )
}
