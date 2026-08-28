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
  memo?: string
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

// タグはバイクログの分類・絞り込み用(期限あり/なしの判定には使わない。
// 期限管理の対象かどうかは intervalKm/intervalMonths が設定されているかで決まる)。
// 複数選択可。#消耗品交換・#メンテナンスを選ぶと登録画面で距離/期間間隔の入力欄が開く。
export const CUSTOM_TAGS = ['消耗品交換', 'メンテナンス', 'カスタム', '装備品'] as const
export type CustomTag = (typeof CUSTOM_TAGS)[number]
export const SCHEDULE_CUSTOM_TAGS: CustomTag[] = ['消耗品交換', 'メンテナンス']

// 1レコード = 1回の変更・作業。カテゴリごとの最新レコードが「現在の状態」になる
// (現在の状態と履歴を別々に管理しない: src/bikeLog.ts参照)。
// 整備記録・カスタム記録を統合した単一のレコード形式。
export interface BikeLogRecord {
  id: string
  vehicleId: string
  category: string
  content: string
  brand?: string
  cost?: number
  memo?: string
  tags?: string[]
  odometer?: number
  intervalKm?: number
  intervalMonths?: number
  date: string
  createdAt: string
}

// ユーザーが自由に追加・編集・削除できるカテゴリ一覧(「その他」のみ削除・改名不可)。
// 初回起動時にDEFAULT_CUSTOM_CATEGORIESの内容でシードする。
export interface CustomCategory {
  id: string
  name: string
  createdAt: string
}

export const OTHER_CUSTOM_CATEGORY = 'その他'

export const DEFAULT_CUSTOM_CATEGORIES = [
  'マフラー',
  'ミラー',
  'スクリーン',
  'レバー',
  'ステップ',
  'ハンドル',
  'グリップ',
  'シート',
  OTHER_CUSTOM_CATEGORY,
] as const
