import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import {
  computeDeadlineReminders,
  computeMaintenanceReminders,
  isUrgent,
  type Reminder,
} from '../reminders'
import { computeCustomReminders } from '../customRecords'

export function useReminders() {
  const vehicles = useLiveQuery(() => db.vehicles.toArray(), [])
  const maintenanceRecords = useLiveQuery(() => db.maintenanceRecords.toArray(), [])
  const customRecords = useLiveQuery(() => db.customRecords.toArray(), [])
  const deadlines = useLiveQuery(() => db.deadlines.toArray(), [])

  const loading = !vehicles || !maintenanceRecords || !customRecords || !deadlines

  const reminders: Reminder[] = []
  if (vehicles && maintenanceRecords && customRecords && deadlines) {
    for (const vehicle of vehicles) {
      const records = maintenanceRecords.filter((r) => r.vehicleId === vehicle.id)
      reminders.push(...computeMaintenanceReminders(vehicle, records))
      const customForVehicle = customRecords.filter((r) => r.vehicleId === vehicle.id)
      reminders.push(...computeCustomReminders(vehicle, customForVehicle))
    }
    reminders.push(...computeDeadlineReminders(deadlines))
  }

  const urgentCount = reminders.filter(isUrgent).length

  return { loading, reminders, deadlines: deadlines ?? [], vehicles: vehicles ?? [], urgentCount }
}
