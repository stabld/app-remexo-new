# Remexo – aplikace (nová verze)

React + TypeScript + Vite, hosting Vercel, backend Supabase (stejná databáze jako pilot `stabld/app-remexo`).
Pilot a tahle appka můžou běžet vedle sebe: zapisují do databáze totéž a stejným způsobem.

## Spuštění

```bash
npm install
npm run dev        # vývoj
npm run build      # produkční build do dist/
```

`.env` obsahuje jen veřejné údaje Supabase (URL a publishable klíč). Bezpečnost hlídá databáze (RLS a RPC funkce), ne frontend.

## Nasazení na Vercel

1. Nový projekt z repozitáře `stabld/app-remexo-new`, framework Vite (nastaví se samo).
2. Proměnné prostředí:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` – stejné jako v `.env`
   - pro Bořka (`api/borek-ai.js`): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `AI_MODEL_TOKEN` – stejné jako u pilota
3. V Supabase → Authentication → URL Configuration přidat adresu nové appky do Redirect URLs (kvůli přihlášení přes Google/Facebook a obnově hesla).

## Struktura

```
src/
  app/            router, navigace, providery (téma)
  layouts/        AppShell, boční a spodní navigace, obal stránky
  components/     sdílené UI (tlačítka, karty, modaly, fotky, toasty)
  config/         oblast působnosti (Olomouc + 35 km)
  lib/            Supabase klient, typy, práce s popisem poptávky, datum
  services/       geokódování, fotky, Bořek, měření
  features/
    auth/         přihlášení, registrace, role
    requests/     zákazník: přehled, poptávky, detail, nová poptávka s Bořkem
    market/       řemeslník: tržiště (seznam + mapa), detail zakázky, odeslání nabídky
    jobs/         řemeslník: přehled, moje nabídky, moje zakázky, výdělky
    chat/         zprávy
    profile/      profil, nastavení vzhledu
    podpora/      Bořek poradce, nahlášení problému
    admin/        správa (jen pro adminy, práva hlídají admin_* funkce v DB)
```

## Co je jinak než v pilotu

- Výdělky ukazují součet cen z nabídek u dokončených zakázek. Remexo platby zatím neeviduje a stránka to říká.
- Řemeslník u nabídky může vyplnit „Kdy můžu přijít“ – připojí se na konec zprávy (DB na to nemá sloupec).
- Přepnutí role jde i z profilu (stejná RPC `zmen_roli`).
