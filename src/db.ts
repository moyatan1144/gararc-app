import Dexie, { type EntityTable } from 'dexie'
import type { Vehicle, MaintenanceRecord, FuelRecord, Deadline } from './types'

// スキーマは将来のクラウド同期を見据え、全レコードにUUID(id)と
// createdAt(ISO文字列)を持たせる。移行時はこのままアップロードできる形にしておく。
class BikeAppDB extends Dexie {
  vehicles!: EntityTable<Vehicle, 'id'>
  maintenanceRecords!: EntityTable<MaintenanceRecord, 'id'>
  fuelRecords!: EntityTable<FuelRecord, 'id'>
  deadlines!: EntityTable<Deadline, 'id'>

  constructor() {
    super('bike-app')
    this.version(1).stores({
      vehicles: 'id, createdAt',
      maintenanceRecords: 'id, vehicleId, date, createdAt',
      fuelRecords: 'id, vehicleId, date, createdAt',
      deadlines: 'id, vehicleId, dueDate, createdAt',
    })
  }
}

export const db = new BikeAppDB()

export function newId(): string {
  return crypto.randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}
