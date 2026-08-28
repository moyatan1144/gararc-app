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

export interface BikeLogHistoryEntry {
  record: BikeLogRecord
  // 最初の記録には前の記録が無い(=何だったかは分からない)ため null。
  // 「純正」等を勝手に補わず、登録された内容だけをそのまま表示する。
  before: string | null
}

// 同じカテゴリの記録を日付順に並べ、隣り合う記録同士で「変更前→変更後」を算出する。
// 変更前の値は保存せずここで導出するため、ユーザーの二重入力を避けられる。
export function buildBikeLogHistory(records: BikeLogRecord[]): BikeLogHistoryEntry[] {
  const sorted = [...records].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    return a.createdAt < b.createdAt ? -1 : 1
  })

  return sorted.map((record, i) => ({
    record,
    before: i === 0 ? null : sorted[i - 1].content,
  }))
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
