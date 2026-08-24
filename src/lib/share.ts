import type { Vehicle } from '../types'

export function buildVehicleShareText(vehicle: Vehicle): string {
  const lines = [`🏍️ ${vehicle.name}`]
  if (vehicle.manufacturer || vehicle.model) {
    lines.push([vehicle.manufacturer, vehicle.model].filter(Boolean).join(' '))
  }
  if (vehicle.displacementCc) lines.push(`排気量: ${vehicle.displacementCc}cc`)
  if (vehicle.modelYear) lines.push(`年式: ${vehicle.modelYear}年`)
  lines.push(`走行距離: ${vehicle.currentOdometer.toLocaleString()} km`)
  if (vehicle.specNotes) lines.push('', vehicle.specNotes)
  return lines.join('\n')
}

// Web Share APIがあればネイティブ共有シートを開き、無ければクリップボードにコピーする。
export async function shareVehicle(vehicle: Vehicle): Promise<'shared' | 'copied'> {
  const text = buildVehicleShareText(vehicle)

  if (navigator.share) {
    await navigator.share({ title: vehicle.name, text })
    return 'shared'
  }

  await navigator.clipboard.writeText(text)
  return 'copied'
}
