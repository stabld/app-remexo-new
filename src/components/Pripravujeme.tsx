/** Zástupná stránka pro část, která se teprve přepisuje. */
export function Pripravujeme({ nazev }: { nazev: string }) {
  return (
    <p className="max-w-md py-10 text-stone-500">
      {nazev} se právě přepisuje do nové verze. Zatím ji najdeš ve stávající aplikaci.
    </p>
  )
}
