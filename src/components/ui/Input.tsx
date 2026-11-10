import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const POLE =
  'w-full rounded-[10px] border border-line-strong bg-surface px-3 py-2.5 text-[15px] text-ink placeholder:text-faint outline-none transition-colors focus:border-accent focus:ring-3 focus:ring-accent/20 aria-[invalid=true]:border-danger'

type Obal = { label: string; napoveda?: ReactNode; chyba?: string; className?: string }

function Pole({ label, napoveda, chyba, className = '', id, children }: Obal & { id: string; children: ReactNode }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {children}
      {chyba ? (
        <p id={`${id}-chyba`} className="text-[13px] text-danger-text">{chyba}</p>
      ) : napoveda ? (
        <p className="text-[13px] text-muted">{napoveda}</p>
      ) : null}
    </div>
  )
}

export function Input({ label, napoveda, chyba, className, type, ...rest }: Obal & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  const [ukaz, setUkaz] = useState(false)
  const heslo = type === 'password'
  return (
    <Pole id={id} label={label} napoveda={napoveda} chyba={chyba} className={className}>
      <div className="relative">
        <input
          {...rest}
          id={id}
          type={heslo && ukaz ? 'text' : type}
          aria-invalid={chyba ? true : undefined}
          aria-describedby={chyba ? `${id}-chyba` : undefined}
          className={`${POLE} ${heslo ? 'pr-11' : ''}`}
        />
        {heslo && (
          <button
            type="button"
            onClick={() => setUkaz((v) => !v)}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-faint hover:text-ink"
            aria-label={ukaz ? 'Skrýt heslo' : 'Zobrazit heslo'}
          >
            {ukaz ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    </Pole>
  )
}

export function Textarea({ label, napoveda, chyba, className, ...rest }: Obal & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <Pole id={id} label={label} napoveda={napoveda} chyba={chyba} className={className}>
      <textarea {...rest} id={id} aria-invalid={chyba ? true : undefined} className={`${POLE} resize-y`} />
    </Pole>
  )
}

export function Select({ label, napoveda, chyba, className, children, ...rest }: Obal & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <Pole id={id} label={label} napoveda={napoveda} chyba={chyba} className={className}>
      <select {...rest} id={id} className={POLE}>{children}</select>
    </Pole>
  )
}
