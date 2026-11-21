import { NacitaniStranky } from '@/components/NacitaniStranky'
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthProvider'
import { AppShell } from '@/layouts/AppShell'
import { MojeNabidky } from '@/features/jobs/MojeNabidky'
import { MojeZakazky } from '@/features/jobs/MojeZakazky'
import { DetailPrace } from '@/features/jobs/DetailPrace'
import { PrehledRemeslnika } from '@/features/jobs/PrehledRemeslnika'
import { Vydelky } from '@/features/jobs/Vydelky'
import { ChybaStranky } from '@/components/ChybaStranky'
import { PrehledZakaznika } from '@/features/requests/pages/PrehledZakaznika'
import { MojePoptavky } from '@/features/requests/pages/MojePoptavky'
import { DetailPoptavky } from '@/features/requests/pages/DetailPoptavky'
import { Nastaveni } from '@/features/profile/Nastaveni'
import { Profil } from '@/features/profile/Profil'
import { Zpravy } from '@/features/chat/Zpravy'
import { NovaPoptavka } from '@/features/requests/nova/NovaPoptavka'
import type { Role } from '@/lib/types'

const Trziste = lazy(() => import('@/features/market/Trziste').then((m) => ({ default: m.Trziste })))
const Sprava = lazy(() => import('@/features/admin/Sprava').then((m) => ({ default: m.Sprava })))
const DetailZakazky = lazy(() => import('@/features/market/DetailZakazky').then((m) => ({ default: m.DetailZakazky })))

/** Stránka jen pro jednu roli – druhou pošle na přehled. O přístupu k datům rozhoduje stejně databáze. */
function ProRoli({ role, children }: { role: Role; children: React.ReactNode }) {
  return useAuth().role === role ? children : <Navigate to="/" replace />
}

function Domu() {
  const { role } = useAuth()
  return role === 'customer' ? <PrehledZakaznika /> : <PrehledRemeslnika />
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
      { path: '/nabidky', element: <ProRoli role="craftsman"><MojeNabidky /></ProRoli> },
      { path: '/zakazky', element: <ProRoli role="craftsman"><MojeZakazky /></ProRoli> },
      { path: '/zakazky/:id', element: <ProRoli role="craftsman"><DetailPrace /></ProRoli> },
      { path: '/vydelky', element: <ProRoli role="craftsman"><Vydelky /></ProRoli> },
      // Obě role
      { path: '/zpravy', element: <Zpravy /> },
      { path: '/zpravy/:id', element: <Zpravy /> },
      { path: '/profil', element: <Profil /> },
      { path: '/sprava', element: <Suspense fallback={<NacitaniStranky />}><Sprava /></Suspense> },
      { path: '/nastaveni', element: <Nastaveni /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
