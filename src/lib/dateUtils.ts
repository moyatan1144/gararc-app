export function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso)
  const to = new Date(toIso)
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

export function addMonths(dateIso: string, months: number): string {
  const d = new Date(dateIso)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}
