import { NacitaniStranky } from '@/components/NacitaniStranky'
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthProvider'
import { AppShell } from '@/layouts/AppShell'
import { ChybaStranky } from '@/components/ChybaStranky'
import { Stranka } from '@/layouts/Stranka'
import { Pripravujeme } from '@/components/Pripravujeme'
import { PrehledZakaznika } from '@/features/requests/pages/PrehledZakaznika'
import { MojePoptavky } from '@/features/requests/pages/MojePoptavky'
import { DetailPoptavky } from '@/features/requests/pages/DetailPoptavky'
import { Nastaveni } from '@/features/profile/Nastaveni'
import { Profil } from '@/features/profile/Profil'
import { Zpravy } from '@/features/chat/Zpravy'
import { NovaPoptavka } from '@/features/requests/nova/NovaPoptavka'
import type { Role } from '@/lib/types'

const Trziste = lazy(() => import('@/features/market/Trziste').then((m) => ({ default: m.Trziste })))
const DetailZakazky = lazy(() => import('@/features/market/DetailZakazky').then((m) => ({ default: m.DetailZakazky })))

/** Stránka jen pro jednu roli – druhou pošle na přehled. O přístupu k datům rozhoduje stejně databáze. */
function ProRoli({ role, children }: { role: Role; children: React.ReactNode }) {
  return useAuth().role === role ? children : <Navigate to="/" replace />
}

function Domu() {
  const { role } = useAuth()
  return role === 'customer' ? <PrehledZakaznika /> : <Cast nazev="Přehled" />
}

/** Část, která se teprve přepisuje. */
function Cast({ nazev }: { nazev: string }) {
  return <Stranka nadpis={nazev}><Pripravujeme nazev={nazev} /></Stranka>
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <ChybaStranky />,
    children: [
      { path: '/', element: <Domu /> },
      // Zákazník
      { path: '/poptavky', element: <ProRoli role="customer"><MojePoptavky /></ProRoli> },
      { path: '/poptavky/:id', element: <ProRoli role="customer"><DetailPoptavky /></ProRoli> },
      { path: '/nova', element: <ProRoli role="customer"><NovaPoptavka /></ProRoli> },
      // Řemeslník
      // Tržiště tahá knihovnu map, načte se až ve chvíli, kdy ho řemeslník otevře.
      { path: '/trziste', element: <ProRoli role="craftsman"><Suspense fallback={<NacitaniStranky />}><Trziste /></Suspense></ProRoli> },
      { path: '/trziste/:id', element: <ProRoli role="craftsman"><Suspense fallback={<NacitaniStranky />}><DetailZakazky /></Suspense></ProRoli> },
      { path: '/nabidky', element: <ProRoli role="craftsman"><Cast nazev="Moje nabídky" /></ProRoli> },
      { path: '/zakazky', element: <ProRoli role="craftsman"><Cast nazev="Moje zakázky" /></ProRoli> },
      { path: '/vydelky', element: <ProRoli role="craftsman"><Cast nazev="Výdělky" /></ProRoli> },
      // Obě role
      { path: '/zpravy', element: <Zpravy /> },
      { path: '/zpravy/:id', element: <Zpravy /> },
      { path: '/profil', element: <Profil /> },
      { path: '/nastaveni', element: <Nastaveni /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
