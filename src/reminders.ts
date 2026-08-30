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

// ラベル未入力時はlabelがtypeと同じ文字列で保存されるため、そのまま表示すると
// 「車検・車検」のように重複して見える。その場合はtypeだけを表示する。
export function formatDeadlineTitle(deadline: Deadline): string {
  return deadline.label && deadline.label !== deadline.type
    ? `${deadline.type} ・ ${deadline.label}`
    : deadline.type
}

export function isUrgent(reminder: Reminder): boolean {
  if (reminder.kind === 'deadline') {
    return reminder.remainingDays <= reminder.deadline.notifyBeforeDays
  }
  const kmUrgent = reminder.remainingKm !== undefined && reminder.remainingKm <= 500
  const dayUrgent = reminder.remainingDays !== undefined && reminder.remainingDays <= 30
  return kmUrgent || dayUrgent
}
