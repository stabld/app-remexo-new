import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string }

export function Input({ label, type, className = '', ...rest }: Props) {
  const [ukazHeslo, setUkazHeslo] = useState(false)
  const jeHeslo = type === 'password'
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">{label}</span>
      <span className="relative block">
        <input
          {...rest}
          type={jeHeslo && ukazHeslo ? 'text' : type}
          className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 outline-none transition-colors focus:border-remexo-500 focus:ring-3 focus:ring-remexo-500/15 dark:border-stone-700 dark:bg-stone-900"
        />
        {jeHeslo && (
          <button
            type="button"
            onClick={() => setUkazHeslo((v) => !v)}
            className="absolute inset-y-0 right-3 text-stone-400 hover:text-stone-600"
            aria-label={ukazHeslo ? 'Skrýt heslo' : 'Zobrazit heslo'}
          >
            {ukazHeslo ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </span>
    </label>
  )
}
