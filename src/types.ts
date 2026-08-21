export interface Vehicle {
  id: string
  name: string
  model?: string
  plateNumber?: string
  currentOdometer: number
  photoDataUrl?: string
  createdAt: string
  updatedAt: string
}

export interface MaintenanceRecord {
  id: string
  vehicleId: string
  category: string
  title: string
  date: string
  odometer: number
  cost?: number
  memo?: string
  intervalKm?: number
  intervalMonths?: number
  createdAt: string
}

export interface FuelRecord {
  id: string
  vehicleId: string
  date: string
  odometer: number
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
