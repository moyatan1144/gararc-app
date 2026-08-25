import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import {
  computeDeadlineReminders,
  computeMaintenanceReminders,
  isUrgent,
  type Reminder,
} from '../reminders'

export function useReminders() {
  const vehicles = useLiveQuery(() => db.vehicles.toArray(), [])
  const maintenanceRecords = useLiveQuery(() => db.maintenanceRecords.toArray(), [])
  const deadlines = useLiveQuery(() => db.deadlines.toArray(), [])

  const loading = !vehicles || !maintenanceRecords || !deadlines

  const reminders: Reminder[] = []
  if (vehicles && maintenanceRecords && deadlines) {
    for (const vehicle of vehicles) {
      const records = maintenanceRecords.filter((r) => r.vehicleId === vehicle.id)
      reminders.push(...computeMaintenanceReminders(vehicle, records))
    }
    reminders.push(...computeDeadlineReminders(deadlines))
  }

  const urgentCount = reminders.filter(isUrgent).length

  return { loading, reminders, vehicles: vehicles ?? [], urgentCount }
}
