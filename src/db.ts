import Dexie, { type EntityTable } from 'dexie'
import type { Vehicle, FuelRecord, Deadline, BikeLogRecord, CustomCategory } from './types'

// スキーマは将来のクラウド同期を見据え、全レコードにUUID(id)と
// createdAt(ISO文字列)を持たせる。移行時はこのままアップロードできる形にしておく。
class BikeAppDB extends Dexie {
  vehicles!: EntityTable<Vehicle, 'id'>
  fuelRecords!: EntityTable<FuelRecord, 'id'>
  deadlines!: EntityTable<Deadline, 'id'>
  bikeLogRecords!: EntityTable<BikeLogRecord, 'id'>
  customCategories!: EntityTable<CustomCategory, 'id'>

  constructor() {
    super('bike-app')
    this.version(1).stores({
      vehicles: 'id, createdAt',
      maintenanceRecords: 'id, vehicleId, date, createdAt',
      fuelRecords: 'id, vehicleId, date, createdAt',
      deadlines: 'id, vehicleId, dueDate, createdAt',
    })
    this.version(2).stores({
      vehicles: 'id, createdAt',
      maintenanceRecords: 'id, vehicleId, date, createdAt',
      fuelRecords: 'id, vehicleId, date, createdAt',
      deadlines: 'id, vehicleId, dueDate, createdAt',
      customRecords: 'id, vehicleId, category, date, createdAt',
    })
    this.version(3).stores({
      vehicles: 'id, createdAt',
      maintenanceRecords: 'id, vehicleId, date, createdAt',
      fuelRecords: 'id, vehicleId, date, createdAt',
      deadlines: 'id, vehicleId, dueDate, createdAt',
      customRecords: 'id, vehicleId, category, date, createdAt',
      customCategories: 'id, &name, createdAt',
    })
    // 整備記録(maintenanceRecords)とカスタム記録(customRecords)を
    // 単一のバイクログ(bikeLogRecords)に統合する。
    this.version(4)
      .stores({
        vehicles: 'id, createdAt',
        fuelRecords: 'id, vehicleId, date, createdAt',
        deadlines: 'id, vehicleId, dueDate, createdAt',
        customCategories: 'id, &name, createdAt',
        bikeLogRecords: 'id, vehicleId, category, date, createdAt',
        maintenanceRecords: null,
        customRecords: null,
      })
      .upgrade(async (tx) => {
        const maintenance = await tx.table('maintenanceRecords').toArray()
        const custom = await tx.table('customRecords').toArray()

        const fromMaintenance: BikeLogRecord[] = maintenance.map((r) => ({
          id: r.id,
          vehicleId: r.vehicleId,
          category: r.category,
          content: r.title,
          brand: r.brand,
          cost: r.cost,
          memo: r.memo,
          tags: ['メンテナンス'],
          odometer: r.odometer,
          intervalKm: r.intervalKm,
          intervalMonths: r.intervalMonths,
          date: r.date,
          createdAt: r.createdAt,
        }))
        const fromCustom: BikeLogRecord[] = custom.map((r) => ({
          id: r.id,
          vehicleId: r.vehicleId,
          category: r.category,
          content: r.content,
          cost: r.cost,
          tags: r.tags,
          odometer: r.odometer,
          intervalKm: r.intervalKm,
          intervalMonths: r.intervalMonths,
          date: r.date,
          createdAt: r.createdAt,
        }))

        await tx.table('bikeLogRecords').bulkAdd([...fromMaintenance, ...fromCustom])
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
