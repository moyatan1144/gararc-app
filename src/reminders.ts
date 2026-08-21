import type { Deadline, MaintenanceRecord, Vehicle } from './types'

export interface MaintenanceReminder {
  kind: 'maintenance'
  vehicleId: string
  category: string
  lastRecord: MaintenanceRecord
  nextDueOdometer?: number
  nextDueDate?: string
  remainingKm?: number
  remainingDays?: number
}

export interface DeadlineReminder {
  kind: 'deadline'
  vehicleId: string
  deadline: Deadline
  remainingDays: number
}

export type Reminder = MaintenanceReminder | DeadlineReminder

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso)
  const to = new Date(toIso)
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

export function computeMaintenanceReminders(
  vehicle: Vehicle,
  records: MaintenanceRecord[],
): MaintenanceReminder[] {
  const latestByCategory = new Map<string, MaintenanceRecord>()
  for (const record of records) {
    if (!record.intervalKm && !record.intervalMonths) continue
    const current = latestByCategory.get(record.category)
    if (!current || record.date > current.date) {
      latestByCategory.set(record.category, record)
    }
  }

  const today = new Date().toISOString()

  return Array.from(latestByCategory.values()).map((lastRecord) => {
    const nextDueOdometer = lastRecord.intervalKm
      ? lastRecord.odometer + lastRecord.intervalKm
      : undefined
    const nextDueDate = lastRecord.intervalMonths
      ? addMonths(lastRecord.date, lastRecord.intervalMonths)
      : undefined

    return {
      kind: 'maintenance',
      vehicleId: vehicle.id,
      category: lastRecord.category,
      lastRecord,
      nextDueOdometer,
      nextDueDate,
      remainingKm:
        nextDueOdometer !== undefined
          ? nextDueOdometer - vehicle.currentOdometer
          : undefined,
      remainingDays: nextDueDate ? daysBetween(today, nextDueDate) : undefined,
    }
  })
}

export function computeDeadlineReminders(deadlines: Deadline[]): DeadlineReminder[] {
  const today = new Date().toISOString()
  return deadlines.map((deadline) => ({
    kind: 'deadline',
    vehicleId: deadline.vehicleId,
    deadline,
    remainingDays: daysBetween(today, deadline.dueDate),
  }))
}

function addMonths(dateIso: string, months: number): string {
  const d = new Date(dateIso)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

export function isUrgent(reminder: Reminder): boolean {
  if (reminder.kind === 'deadline') {
    return reminder.remainingDays <= reminder.deadline.notifyBeforeDays
  }
  const kmUrgent = reminder.remainingKm !== undefined && reminder.remainingKm <= 500
  const dayUrgent = reminder.remainingDays !== undefined && reminder.remainingDays <= 30
  return kmUrgent || dayUrgent
}
