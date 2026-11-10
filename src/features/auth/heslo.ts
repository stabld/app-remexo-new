/** Vrací chybovou hlášku, nebo null, když heslo projde. Stejná pravidla jako stará appka. */
export function zkontrolujHeslo(heslo: string): string | null {
  if (heslo.length < 8) return 'Heslo musí mít alespoň 8 znaků.'
  if (!/[A-Z]/.test(heslo)) return 'Heslo musí obsahovat alespoň jedno velké písmeno.'
  if (!/[0-9]/.test(heslo)) return 'Heslo musí obsahovat alespoň jednu číslici.'
  return null
}
