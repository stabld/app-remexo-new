import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthProvider'
import { MojePoptavkyPage } from '@/features/poptavky/MojePoptavkyPage'
import { Pripravujeme } from '@/components/Pripravujeme'
import type { Role } from '@/lib/types'
import { Layout } from './Layout'
import { DOMOVSKA_STRANKA } from './navigace'

function Domu() {
  const { role } = useAuth()
  return <Navigate to={DOMOVSKA_STRANKA[role]} replace />
}

/** Stránka jen pro jednu roli – druhou pošle na její domovskou stránku. */
function ProRoli({ role, children }: { role: Role; children: React.ReactNode }) {
  const auth = useAuth()
  return auth.role === role ? children : <Navigate to={DOMOVSKA_STRANKA[auth.role]} replace />
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Domu /> },
      // Zákazník
      { path: '/poptavky', element: <ProRoli role="customer"><MojePoptavkyPage /></ProRoli> },
      { path: '/poptavky/:id', element: <ProRoli role="customer"><Pripravujeme nazev="Detail poptávky a nabídky" /></ProRoli> },
      { path: '/nova', element: <ProRoli role="customer"><Pripravujeme nazev="Nová poptávka" /></ProRoli> },
      { path: '/platby', element: <ProRoli role="customer"><Pripravujeme nazev="Platby" /></ProRoli> },
      // Řemeslník
      { path: '/trziste', element: <ProRoli role="craftsman"><Pripravujeme nazev="Tržiště zakázek" /></ProRoli> },
      { path: '/prace', element: <ProRoli role="craftsman"><Pripravujeme nazev="Moje práce" /></ProRoli> },
      { path: '/vydelky', element: <ProRoli role="craftsman"><Pripravujeme nazev="Výdělky" /></ProRoli> },
      // Obě role
      { path: '/zpravy', element: <Pripravujeme nazev="Zprávy" /> },
      { path: '/profil', element: <Pripravujeme nazev="Profil" /> },
      { path: '*', element: <Domu /> },
    ],
  },
])
