import type { Deadline } from './types'
import type { BikeLogReminder } from './bikeLog'
import { daysBetween } from './lib/dateUtils'

export interface DeadlineReminder {
  kind: 'deadline'
  vehicleId: string
  deadline: Deadline
  remainingDays: number
}

export type Reminder = DeadlineReminder | BikeLogReminder

export function computeDeadlineReminders(deadlines: Deadline[]): DeadlineReminder[] {
  const today = new Date().toISOString()
  return deadlines.map((deadline) => ({
    kind: 'deadline',
    vehicleId: deadline.vehicleId,
    deadline,
    remainingDays: daysBetween(today, deadline.dueDate),
  }))
}

export function isUrgent(reminder: Reminder): boolean {
  if (reminder.kind === 'deadline') {
    return reminder.remainingDays <= reminder.deadline.notifyBeforeDays
  }
  const kmUrgent = reminder.remainingKm !== undefined && reminder.remainingKm <= 500
  const dayUrgent = reminder.remainingDays !== undefined && reminder.remainingDays <= 30
  return kmUrgent || dayUrgent
}
