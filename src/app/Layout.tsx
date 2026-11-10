import { Outlet, Link } from 'react-router-dom'

export function Layout() {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="px-4 py-3 border-b border-white/10">
        <Link to="/" className="font-bold text-remexo-500">Remexo</Link>
      </header>
      <main className="flex-1 p-4"><Outlet /></main>
    </div>
  )
}
