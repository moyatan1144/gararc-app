import { vehicleTypeIcon, type Vehicle } from '../types'
import type { CurrentBikeLogSpec } from '../bikeLog'
import { buildSharePageUrl } from './shareLink'

export type ShareResult = 'shared' | 'copied' | 'manual'

// Claude Artifact(サンドボックス化されたiframe)上では、外枠ページのURLに付けた
// ハッシュ/クエリがiframeの中まで転送されない制約があり、リンク経由の共有が
// 機能しない(実機で確認済み)。この場合はリンクを共有内容に含めない。
function canUseShareLink(): boolean {
  return !location.hostname.endsWith('.claudeusercontent.com')
}

// 車両情報+現在の仕様一覧を、コピー&ペーストでそのまま送れるテキストにまとめる。
// リンクが機能しない環境でも確実に情報を伝えられるよう、リンクではなく
// テキスト本体を共有の主役にする。
export function buildShareText(vehicle: Vehicle, specs: CurrentBikeLogSpec[]): string {
  const specLine = [vehicle.manufacturer, vehicle.model].filter(Boolean).join(' ')
  const lines = [
    `${vehicleTypeIcon(vehicle.vehicleType)} ${vehicle.name}`,
    [
      specLine || null,
      vehicle.displacementCc ? `${vehicle.displacementCc}cc` : null,
      vehicle.modelYear ? `${vehicle.modelYear}年` : null,
    ]
      .filter(Boolean)
      .join(' ・ '),
    `走行距離: ${vehicle.currentOdometer.toLocaleString()}km`,
  ]

  if (specs.length > 0) {
    lines.push('', '【現在の仕様】')
    for (const spec of specs) {
      lines.push(`・${spec.category}: ${spec.content}`)
    }
  }

  if (canUseShareLink()) {
    const url = buildSharePageUrl({
      name: vehicle.name,
      manufacturer: vehicle.manufacturer,
      model: vehicle.model,
      displacementCc: vehicle.displacementCc,
      modelYear: vehicle.modelYear,
      currentOdometer: vehicle.currentOdometer,
      specs: specs.map((s) => ({ category: s.category, content: s.content, cost: s.cost })),
    })
    lines.push('', url)
  }

  return lines.join('\n')
}

export function buildXShareUrl(shareText: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
}

export function buildLineShareUrl(shareText: string): string {
  return `https://line.me/R/msg/text/?${encodeURIComponent(shareText)}`
}

// Web Share APIがあればネイティブ共有シートを開き、無ければクリップボードにコピーする。
// どちらも使えない環境(Artifactのプレビューなど)では、手動コピー用にテキストを返す。
export async function shareVehicleText(vehicle: Vehicle, shareText: string): Promise<ShareResult> {
  if (navigator.share) {
    await navigator.share({
      title: `${vehicle.name}の仕様`,
      text: shareText,
    })
    return 'shared'
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(shareText)
    return 'copied'
  }

  return 'manual'
}
