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

// SNS投稿は文字数制限があるため、詳細説明を除いた短い1行サマリーを使う。
function buildShareSummary(vehicle: Vehicle): string {
  const parts = [`🏍️ ${vehicle.name}`]
  const modelPart = [vehicle.manufacturer, vehicle.model].filter(Boolean).join(' ')
  if (modelPart) parts.push(modelPart)
  parts.push(`走行距離 ${vehicle.currentOdometer.toLocaleString()}km`)
  return parts.join(' / ')
}

export function buildXShareUrl(vehicle: Vehicle): string {
  const text = `${buildShareSummary(vehicle)} #バイク管理`
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
}

export function buildLineShareUrl(vehicle: Vehicle): string {
  return `https://line.me/R/msg/text/?${encodeURIComponent(buildShareSummary(vehicle))}`
}

export type ShareResult = 'shared' | 'copied' | 'manual'

// Web Share APIがあればネイティブ共有シートを開き、無ければクリップボードにコピーする。
// どちらも使えない環境(Artifactのプレビューなど)では、手動コピー用に本文を返す。
export async function shareVehicle(vehicle: Vehicle): Promise<ShareResult> {
  const text = buildVehicleShareText(vehicle)

  if (navigator.share) {
    await navigator.share({ title: vehicle.name, text })
    return 'shared'
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return 'copied'
  }

  return 'manual'
}
