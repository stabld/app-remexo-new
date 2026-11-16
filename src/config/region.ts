/**
 * Kde Remexo funguje. Pro další město stačí přidat položku.
 * Kontrolu teď dělá prohlížeč (jako v pilotu); databáze ji zatím nevynucuje.
 */
export const OBLASTI = [{ nazev: 'Olomouc a okolí', lat: 49.5938, lon: 17.2509, polomerKm: 35 }]

/** Na kolik se zaokrouhlí poloha na mapě: 3 desetinná místa ≈ 100 m, pin ukáže čtvrť, ne dům. */
export const PRESNOST_POLOHY = 1000
