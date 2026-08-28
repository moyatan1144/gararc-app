import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { computeDeadlineReminders, isUrgent, type Reminder } from '../reminders'
import { computeBikeLogReminders } from '../bikeLog'

export function useReminders() {
  const vehicles = useLiveQuery(() => db.vehicles.toArray(), [])
  const bikeLogRecords = useLiveQuery(() => db.bikeLogRecords.toArray(), [])
  const deadlines = useLiveQuery(() => db.deadlines.toArray(), [])

  const loading = !vehicles || !bikeLogRecords || !deadlines

  const reminders: Reminder[] = []
  if (vehicles && bikeLogRecords && deadlines) {
    for (const vehicle of vehicles) {
      const records = bikeLogRecords.filter((r) => r.vehicleId === vehicle.id)
      reminders.push(...computeBikeLogReminders(vehicle, records))
    }
    reminders.push(...computeDeadlineReminders(deadlines))
  }

  const urgentCount = reminders.filter(isUrgent).length

  return { loading, reminders, deadlines: deadlines ?? [], vehicles: vehicles ?? [], urgentCount }
}
