import { Link } from 'react-router-dom'
import { useReminders } from '../hooks/useReminders'
import { isUrgent, type Reminder } from '../reminders'

export default function RemindersPage() {
  const { loading, reminders, vehicles } = useReminders()

  if (loading) {
    return <div className="p-4 text-slate-500">読み込み中...</div>
  }

  const vehicleById = new Map(vehicles.map((v) => [v.id, v]))
  const sorted = [...reminders].sort((a, b) => remainingValue(a) - remainingValue(b))

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">リマインダー</h1>

      {sorted.length === 0 && (
        <div className="text-center text-slate-500 mt-16 text-sm">
          整備記録に交換間隔を設定するか、車検・保険の期限を登録すると
          <br />
          ここにリマインダーが表示されます。
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {sorted.map((reminder, i) => {
          const vehicle = vehicleById.get(reminder.vehicleId)
          const urgent = isUrgent(reminder)
          return (
            <li key={i}>
              <Link
                to={`/vehicles/${reminder.vehicleId}?tab=${reminder.kind === 'deadline' ? 'deadline' : 'maintenance'}`}
                className={`card block ${urgent ? 'border-red-300 dark:border-red-800' : ''}`}
              >
                <div className="flex justify-between">
                  <span className="font-medium">
                    {vehicle?.name} ・{' '}
                    {reminder.kind === 'maintenance' ? reminder.category : reminder.deadline.type}
                  </span>
                  {urgent && <span className="text-red-600 text-xs font-semibold">要注意</span>}
                </div>
                <div className="text-sm text-slate-500 mt-1">{describe(reminder)}</div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function remainingValue(r: Reminder): number {
  if (r.kind === 'deadline') return r.remainingDays
  const candidates = [r.remainingKm, r.remainingDays !== undefined ? r.remainingDays * 30 : undefined]
  return Math.min(...candidates.filter((v): v is number => v !== undefined), Infinity)
}

function describe(r: Reminder): string {
  if (r.kind === 'deadline') {
    return r.remainingDays >= 0
      ? `あと${r.remainingDays}日（${r.deadline.dueDate}）`
      : `${Math.abs(r.remainingDays)}日超過（${r.deadline.dueDate}）`
  }
  const parts: string[] = []
  if (r.remainingKm !== undefined) {
    parts.push(r.remainingKm >= 0 ? `あと${r.remainingKm.toLocaleString()}km` : `${Math.abs(r.remainingKm).toLocaleString()}km超過`)
  }
  if (r.remainingDays !== undefined) {
    parts.push(r.remainingDays >= 0 ? `あと${r.remainingDays}日` : `${Math.abs(r.remainingDays)}日超過`)
  }
  return parts.join(' ・ ') || '交換間隔未設定'
}
