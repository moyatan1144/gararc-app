import { Link } from 'react-router-dom'
import { useReminders } from '../hooks/useReminders'
import { isUrgent, type Reminder } from '../reminders'

export default function RemindersPage() {
  const { loading, reminders, deadlines, vehicles } = useReminders()

  if (loading) {
    return <div className="p-4 text-slate-500">読み込み中...</div>
  }

  const vehicleById = new Map(vehicles.map((v) => [v.id, v]))
  const sorted = [...reminders].sort((a, b) => remainingValue(a) - remainingValue(b))
  const deadlinesByVehicleId = new Map<string, typeof deadlines>()
  for (const vehicle of vehicles) deadlinesByVehicleId.set(vehicle.id, [])
  for (const d of deadlines) {
    const list = deadlinesByVehicleId.get(d.vehicleId)
    if (list) list.push(d)
  }
  for (const list of deadlinesByVehicleId.values()) {
    list.sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
  }

  return (
    <div className="p-4 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold mb-4">リマインダー</h1>

        {sorted.length === 0 && (
          <div className="text-center text-slate-500 mt-8 text-sm">
            整備記録・カスタムに交換間隔を設定するか、車検・保険の期限を登録すると
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
                <Link to={reminderLink(reminder)} className={`card block ${urgent ? 'border-red-300 dark:border-red-800' : ''}`}>
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {vehicle?.name} ・ {reminderLabel(reminder)}
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

      <div>
        <h2 className="text-lg font-bold mb-2">期限一覧</h2>

        {vehicles.length === 0 && (
          <div className="text-center text-slate-500 py-8 text-sm">
            車両を登録すると、ここで車両ごとに期限を管理できます。
          </div>
        )}

        <ul className="flex flex-col gap-4">
          {vehicles.map((vehicle) => {
            const vehicleDeadlines = deadlinesByVehicleId.get(vehicle.id) ?? []
            return (
              <li key={vehicle.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">🏍️ {vehicle.name}</span>
                  <Link
                    to={`/reminders/deadline/new?vehicleId=${vehicle.id}`}
                    className="text-sky-600 text-sm font-medium"
                  >
                    + 期限を追加
                  </Link>
                </div>
                {vehicleDeadlines.length === 0 ? (
                  <div className="text-sm text-slate-500">まだ期限が登録されていません</div>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {vehicleDeadlines.map((d) => (
                      <li key={d.id}>
                        <Link
                          to={`/reminders/deadline/${d.id}/edit`}
                          className="block rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium">
                              {d.type} ・ {d.label}
                            </span>
                            <span className="text-sm text-slate-500 flex-shrink-0">
                              {d.dueDate}
                            </span>
                          </div>
                          {d.memo && (
                            <div className="text-sm text-slate-500 mt-1 whitespace-pre-wrap">
                              {d.memo}
                            </div>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function reminderLink(r: Reminder): string {
  if (r.kind === 'deadline') return `/reminders/deadline/${r.deadline.id}/edit`
  if (r.kind === 'custom') return `/vehicles/${r.vehicleId}?tab=custom`
  return `/vehicles/${r.vehicleId}?tab=maintenance`
}

function reminderLabel(r: Reminder): string {
  if (r.kind === 'deadline') return r.deadline.type
  return r.category
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
