import type { Vehicle } from '../types'
import type { CurrentBikeLogSpec } from '../bikeLog'
import { buildSharePageUrl } from './shareLink'

export type ShareResult = 'shared' | 'copied' | 'manual'

function buildShareCaption(vehicle: Vehicle): string {
  return `🏍️ ${vehicle.name}の現在の仕様`
}

// 車両情報+現在のカスタム仕様一覧を、アプリ・ローカルデータを持たない相手でも
// 開けるページのURLにまとめる(文字数制限のあるSNS投稿にはこのURLだけを載せる)。
export function buildVehicleShareUrl(vehicle: Vehicle, specs: CurrentBikeLogSpec[]): string {
  return buildSharePageUrl({
    name: vehicle.name,
    manufacturer: vehicle.manufacturer,
    model: vehicle.model,
    displacementCc: vehicle.displacementCc,
    modelYear: vehicle.modelYear,
    currentOdometer: vehicle.currentOdometer,
    specs: specs.map((s) => ({ category: s.category, content: s.content, cost: s.cost })),
  })
}

export function buildXShareUrl(vehicle: Vehicle, shareUrl: string): string {
  const text = buildShareCaption(vehicle)
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
}

export function buildLineShareUrl(shareUrl: string): string {
  return `https://line.me/R/msg/text/?${encodeURIComponent(shareUrl)}`
}

// Web Share APIがあればネイティブ共有シートを開き、無ければクリップボードにURLをコピーする。
// どちらも使えない環境(Artifactのプレビューなど)では、手動コピー用にURLを返す。
export async function shareVehicleLink(vehicle: Vehicle, shareUrl: string): Promise<ShareResult> {
  if (navigator.share) {
    await navigator.share({
      title: `${vehicle.name}の仕様`,
      text: buildShareCaption(vehicle),
      url: shareUrl,
    })
    return 'shared'
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(shareUrl)
    return 'copied'
  }

  return 'manual'
}
