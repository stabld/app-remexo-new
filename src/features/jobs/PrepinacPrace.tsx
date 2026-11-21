import { NavLink } from 'react-router-dom'

/** Na mobilu jsou Zakázky, Nabídky a Výdělky pod jednou položkou spodní navigace. */
export function PrepinacPrace() {
  return (
    <nav aria-label="Moje práce" className="-mt-1 mb-5 flex gap-1 rounded-[10px] bg-surface-2 p-1 lg:hidden">
      {[['/zakazky', 'Zakázky'], ['/nabidky', 'Nabídky'], ['/vydelky', 'Výdělky']].map(([cesta, text]) => (
        <NavLink
          key={cesta}
          to={cesta}
          className={({ isActive }) => `flex-1 rounded-[7px] py-1.5 text-center text-sm transition-colors ${isActive ? 'bg-surface font-semibold text-ink shadow-sm' : 'font-medium text-soft'}`}
        >
          {text}
        </NavLink>
      ))}
    </nav>
  )
}
