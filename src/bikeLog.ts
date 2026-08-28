import type { BikeLogRecord, Vehicle } from './types'
import { daysBetween, addMonths } from './lib/dateUtils'

export interface CurrentBikeLogSpec {
  category: string
  content: string
  cost?: number
  isScheduled: boolean
  latestRecord: BikeLogRecord
}

// カテゴリごとに最新の1件を「現在の状態」として抽出する。
// 距離/期間間隔が設定されていれば「期限あり」に分類する
// (タグではなく、実際に間隔が設定されているかどうかで判定する)。
export function getCurrentBikeLogSpecs(records: BikeLogRecord[]): CurrentBikeLogSpec[] {
  const latestByCategory = new Map<string, BikeLogRecord>()

  for (const record of records) {
    const current = latestByCategory.get(record.category)
    const isNewer =
      !current ||
      record.date > current.date ||
      (record.date === current.date && record.createdAt > current.createdAt)
    if (isNewer) {
      latestByCategory.set(record.category, record)
    }
  }

  return Array.from(latestByCategory.values())
    .map((latestRecord) => ({
      category: latestRecord.category,
      content: latestRecord.content,
      cost: latestRecord.cost,
      isScheduled: Boolean(latestRecord.intervalKm || latestRecord.intervalMonths),
      latestRecord,
    }))
    .sort((a, b) => a.category.localeCompare(b.category, 'ja'))
}

// 同じカテゴリの記録を新しい順に並べる。
export function buildBikeLogHistory(records: BikeLogRecord[]): BikeLogRecord[] {
  return [...records].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return a.createdAt < b.createdAt ? 1 : -1
  })
}

export interface BikeLogReminder {
  kind: 'bikelog'
  vehicleId: string
  category: string
  lastRecord: BikeLogRecord
  nextDueOdometer?: number
  nextDueDate?: string
  remainingKm?: number
  remainingDays?: number
}

// 距離/期間間隔が設定されているバイクログ記録をリマインダー化する。
export function computeBikeLogReminders(
  vehicle: Vehicle,
  records: BikeLogRecord[],
): BikeLogReminder[] {
  const latestByCategory = new Map<string, BikeLogRecord>()
  for (const record of records) {
    if (!record.intervalKm && !record.intervalMonths) continue
    const current = latestByCategory.get(record.category)
    const isNewer =
      !current ||
      record.date > current.date ||
      (record.date === current.date && record.createdAt > current.createdAt)
    if (isNewer) {
      latestByCategory.set(record.category, record)
    }
  }

  const today = new Date().toISOString()

  return Array.from(latestByCategory.values()).map((lastRecord) => {
    const nextDueOdometer =
      lastRecord.intervalKm && lastRecord.odometer !== undefined
        ? lastRecord.odometer + lastRecord.intervalKm
        : undefined
    const nextDueDate = lastRecord.intervalMonths
      ? addMonths(lastRecord.date, lastRecord.intervalMonths)
      : undefined

    return {
      kind: 'bikelog',
      vehicleId: vehicle.id,
      category: lastRecord.category,
      lastRecord,
      nextDueOdometer,
      nextDueDate,
      remainingKm:
        nextDueOdometer !== undefined ? nextDueOdometer - vehicle.currentOdometer : undefined,
      remainingDays: nextDueDate ? daysBetween(today, nextDueDate) : undefined,
    }
  })
}
