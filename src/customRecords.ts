import type { CustomRecord } from './types'

export interface CurrentCustomSpec {
  category: string
  content: string
  cost?: number
  latestRecord: CustomRecord
}

// カテゴリごとに最新の1件を「現在の仕様」として抽出する。
// (整備記録のリマインダー計算と同じ考え方: 作業日→同日ならcreatedAtで比較)
export function getCurrentCustomSpecs(records: CustomRecord[]): CurrentCustomSpec[] {
  const latestByCategory = new Map<string, CustomRecord>()

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
      latestRecord,
    }))
    .sort((a, b) => a.category.localeCompare(b.category, 'ja'))
}

export interface CustomHistoryEntry {
  record: CustomRecord
  // 最初の記録には前の記録が無い(=何だったかは分からない)ため null。
  // 「純正」等を勝手に補わず、登録された内容だけをそのまま表示する。
  before: string | null
}

// 同じカテゴリの記録を日付順に並べ、隣り合う記録同士で「変更前→変更後」を算出する。
// 変更前の値は保存せずここで導出するため、ユーザーの二重入力を避けられる。
export function buildCustomHistory(records: CustomRecord[]): CustomHistoryEntry[] {
  const sorted = [...records].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    return a.createdAt < b.createdAt ? -1 : 1
  })

  return sorted.map((record, i) => ({
    record,
    before: i === 0 ? null : sorted[i - 1].content,
  }))
}
