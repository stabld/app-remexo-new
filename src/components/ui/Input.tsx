import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string }

export function Input({ label, type, className = '', ...rest }: Props) {
  const [ukazHeslo, setUkazHeslo] = useState(false)
  const jeHeslo = type === 'password'
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="relative block">
        <input
          {...rest}
          type={jeHeslo && ukazHeslo ? 'text' : type}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-remexo-500 focus:ring-2 focus:ring-remexo-500/20 dark:border-slate-700 dark:bg-slate-900"
        />
        {jeHeslo && (
          <button
            type="button"
            onClick={() => setUkazHeslo((v) => !v)}
            className="absolute inset-y-0 right-3 text-slate-400 hover:text-slate-600"
            aria-label={ukazHeslo ? 'Skrýt heslo' : 'Zobrazit heslo'}
          >
            {ukazHeslo ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </span>
    </label>
  )
}
