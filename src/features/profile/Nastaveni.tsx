import { Monitor, Moon, Sun } from 'lucide-react'
import { Stranka } from '@/layouts/Stranka'
import { Card } from '@/components/ui/Card'
import { useTema, type Tema } from '@/app/providers/ThemeProvider'

const MOZNOSTI: { id: Tema; text: string; ikona: typeof Sun }[] = [
  { id: 'light', text: 'Světlý', ikona: Sun },
  { id: 'dark', text: 'Tmavý', ikona: Moon },
  { id: 'system', text: 'Podle zařízení', ikona: Monitor },
]

export function Nastaveni() {
  const { tema, setTema } = useTema()
  return (
    <Stranka nadpis="Nastavení" sirka="uzka">
      <Card className="p-5">
        <fieldset>
          <legend className="text-[15px] font-semibold">Vzhled</legend>
          <p className="mb-4 mt-1 text-sm text-muted">Tmavý režim šetří oči večer a baterii u OLED displejů.</p>
          <div className="grid grid-cols-3 gap-2">
            {MOZNOSTI.map((m) => (
              <label
                key={m.id}
                className={`flex cursor-pointer flex-col items-center gap-2 rounded-[10px] border px-3 py-4 text-sm transition-colors ${tema === m.id ? 'border-accent bg-accent-soft font-semibold' : 'border-line-strong hover:bg-surface-2'}`}
              >
                <input type="radio" name="tema" className="sr-only" checked={tema === m.id} onChange={() => setTema(m.id)} />
                <m.ikona className="size-5" aria-hidden />
                {m.text}
              </label>
            ))}
          </div>
        </fieldset>
      </Card>
    </Stranka>
  )
}
