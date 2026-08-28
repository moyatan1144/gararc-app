import type { MaintenanceRecord } from './types'

export interface CurrentMaintenanceState {
  category: string
  latestRecord: MaintenanceRecord
  isScheduled: boolean
}

// カテゴリごとに最新の1件を「現在の状態」として抽出する。
// 最新レコードに距離/期間間隔が設定されていれば「期限付き」に分類する
// (カスタムのタグ判定と同じ「最新レコードで現在の分類が決まる」ルール)。
export function getCurrentMaintenanceStates(records: MaintenanceRecord[]): CurrentMaintenanceState[] {
  const latestByCategory = new Map<string, MaintenanceRecord>()

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
      latestRecord,
      isScheduled: Boolean(latestRecord.intervalKm || latestRecord.intervalMonths),
    }))
    .sort((a, b) => a.category.localeCompare(b.category, 'ja'))
}

// カテゴリ内の全記録を新しい順に並べる(整備記録は「変更前→変更後」の概念が無いため、
// カスタムのようなbefore算出はせず、各記録をそのまま時系列で見せる)。
export function buildMaintenanceHistory(records: MaintenanceRecord[]): MaintenanceRecord[] {
  return [...records].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return a.createdAt < b.createdAt ? 1 : -1
  })
}
