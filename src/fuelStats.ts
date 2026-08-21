import type { FuelRecord } from './types'

export interface FuelStat {
  record: FuelRecord
  kmSinceLast?: number
  kmPerLiter?: number
}

// 満タン法: 直前の満タン記録からの走行距離と、今回の給油量から燃費を算出する。
export function computeFuelStats(records: FuelRecord[]): FuelStat[] {
  const sorted = [...records].sort((a, b) => a.odometer - b.odometer)
  const stats: FuelStat[] = []
  let lastFullOdometer: number | null = null

  for (const record of sorted) {
    let kmSinceLast: number | undefined
    let kmPerLiter: number | undefined

    if (lastFullOdometer !== null) {
      kmSinceLast = record.odometer - lastFullOdometer
      if (record.isFull && kmSinceLast > 0) {
        kmPerLiter = kmSinceLast / record.liters
      }
    }

    stats.push({ record, kmSinceLast, kmPerLiter })

    if (record.isFull) {
      lastFullOdometer = record.odometer
    }
  }

  return stats.reverse()
}

export function averageKmPerLiter(stats: FuelStat[]): number | undefined {
  const values = stats.map((s) => s.kmPerLiter).filter((v): v is number => v !== undefined)
  if (values.length === 0) return undefined
  return values.reduce((sum, v) => sum + v, 0) / values.length
}
