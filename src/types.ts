export interface Vehicle {
  id: string
  name: string
  model?: string
  manufacturer?: string
  displacementCc?: number
  modelYear?: number
  plateNumber?: string
  currentOdometer: number
  purchaseOdometer?: number
  specNotes?: string
  photoDataUrl?: string
  createdAt: string
  updatedAt: string
}

export interface MaintenanceRecord {
  id: string
  vehicleId: string
  category: string
  title: string
  brand?: string
  date: string
  odometer: number
  cost?: number
  memo?: string
  intervalKm?: number
  intervalMonths?: number
  createdAt: string
}

export type MeterType = 'odometer' | 'trip'

export interface FuelRecord {
  id: string
  vehicleId: string
  date: string
  meterType: MeterType
  odometer: number
  tripDistance?: number
  liters: number
  pricePerLiter: number
  isFull: boolean
  memo?: string
  createdAt: string
}

export type DeadlineType = '車検' | '任意保険' | '自賠責保険' | 'その他'

export interface Deadline {
  id: string
  vehicleId: string
  type: DeadlineType
  label: string
  dueDate: string
  notifyBeforeDays: number
  createdAt: string
}

export const MAINTENANCE_CATEGORIES = [
  'エンジンオイル',
  'オイルフィルター',
  'タイヤ',
  'チェーン',
  'バッテリー',
  'ブレーキパッド',
  'プラグ',
  'その他',
] as const

// 1レコード = 1回の変更。カテゴリごとの最新レコードが「現在の仕様」になる
// (現在仕様と履歴を別々に管理しない: src/customRecords.ts参照)
export interface CustomRecord {
  id: string
  vehicleId: string
  category: string
  content: string
  date: string
  createdAt: string
}

export const CUSTOM_CATEGORY_SUGGESTIONS = [
  'マフラー',
  'ミラー',
  'スクリーン',
  'レバー',
  'ステップ',
  'ハンドル',
  'グリップ',
  'シート',
  'その他',
] as const
