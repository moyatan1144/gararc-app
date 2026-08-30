import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useReminders } from '../hooks/useReminders'
import { isUrgent, type DeadlineReminder, type Reminder } from '../reminders'
import ReminderStat from '../components/ReminderStat'

type SortMode = 'urgency' | 'vehicle'

export default function RemindersPage() {
  const { loading, reminders, deadlines, vehicles } = useReminders()
  const [sortMode, setSortMode] = useState<SortMode>('urgency')
  const [expandedVehicleIds, setExpandedVehicleIds] = useState<Set<string>>(new Set())

  if (loading) {
    return <div className="p-4 text-slate-500">読み込み中...</div>
  }

  function toggleVehicle(vehicleId: string) {
    setExpandedVehicleIds((prev) => {
      const next = new Set(prev)
      if (next.has(vehicleId)) {
        next.delete(vehicleId)
      } else {
        next.add(vehicleId)
      }
      return next
    })
  }

  const vehicleById = new Map(vehicles.map((v) => [v.id, v]))
  const vehicleOrder = new Map(vehicles.map((v, i) => [v.id, i]))
  const sorted = [...reminders].sort((a, b) => {
    if (sortMode === 'vehicle') {
      const orderDiff = (vehicleOrder.get(a.vehicleId) ?? 0) - (vehicleOrder.get(b.vehicleId) ?? 0)
      if (orderDiff !== 0) return orderDiff
    }
    return remainingValue(a) - remainingValue(b)
  })
  const deadlineReminderById = new Map(
    reminders
      .filter((r): r is DeadlineReminder => r.kind === 'deadline')
      .map((r) => [r.deadline.id, r]),
  )
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
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">リマインダー</h1>
          <div className="flex rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 text-xs">
            <SortButton active={sortMode === 'urgency'} onClick={() => setSortMode('urgency')}>
              期限順
            </SortButton>
            <SortButton active={sortMode === 'vehicle'} onClick={() => setSortMode('vehicle')}>
              車両順
            </SortButton>
          </div>
        </div>

        {sorted.length === 0 && (
          <div className="text-center text-slate-500 mt-8 text-sm">
            バイクログに交換間隔を設定するか、車検・保険の期限を登録すると
            <br />
            ここにリマインダーが表示されます。
          </div>
        )}

        <ul className="flex flex-col gap-1.5">
          {sorted.map((reminder, i) => {
            const vehicle = vehicleById.get(reminder.vehicleId)
            const urgent = isUrgent(reminder)
            return (
              <li key={i}>
                <Link
                  to={reminderLink(reminder)}
                  className={`card-compact flex items-center justify-between gap-2 ${urgent ? 'border-red-300 dark:border-red-800' : ''}`}
                >
                  <span className="font-medium truncate min-w-0">
                    {vehicle?.name} ・ {reminderLabel(reminder)}
                  </span>
                  {reminder.kind === 'deadline' ? (
                    <ReminderStat
                      remainingDays={reminder.remainingDays}
                      dueDate={reminder.deadline.dueDate}
                      urgent={urgent}
                    />
                  ) : (
                    <ReminderStat
                      remainingKm={reminder.remainingKm}
                      remainingDays={reminder.remainingDays}
                      dueDate={reminder.nextDueDate}
                      urgent={urgent}
                    />
                  )}
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

        <ul className="flex flex-col gap-2">
          {vehicles.map((vehicle) => {
            const vehicleDeadlines = deadlinesByVehicleId.get(vehicle.id) ?? []
            const expanded = expandedVehicleIds.has(vehicle.id)
            return (
              <li key={vehicle.id} className="card-compact">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleVehicle(vehicle.id)}
                    className="flex items-center gap-1.5 min-w-0 flex-1 text-left"
                  >
                    <span className={`text-xs text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                    <span className="font-medium truncate">🏍️ {vehicle.name}</span>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      （{vehicleDeadlines.length}件）
                    </span>
                  </button>
                  <Link
                    to={`/reminders/deadline/new?vehicleId=${vehicle.id}`}
                    className="text-sky-600 text-sm font-medium flex-shrink-0"
                  >
                    + 期限を追加
                  </Link>
                </div>
                {expanded &&
                  (vehicleDeadlines.length === 0 ? (
                    <div className="text-sm text-slate-500 mt-2">まだ期限が登録されていません</div>
                  ) : (
                    <ul className="flex flex-col gap-1.5 mt-2">
                      {vehicleDeadlines.map((d) => {
                        const reminder = deadlineReminderById.get(d.id)
                        const urgent = reminder ? isUrgent(reminder) : false
                        return (
                          <li key={d.id}>
                            <Link
                              to={`/reminders/deadline/${d.id}/edit`}
                              className={`block rounded-lg border px-2.5 py-1.5 ${
                                urgent
                                  ? 'border-red-300 dark:border-red-800'
                                  : 'border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-sm font-medium truncate">
                                  {d.type} ・ {d.label}
                                </span>
                                <ReminderStat
                                  remainingDays={reminder?.remainingDays}
                                  dueDate={d.dueDate}
                                  urgent={urgent}
                                />
                              </div>
                              {d.memo && (
                                <div className="text-sm text-slate-500 mt-0.5 whitespace-pre-wrap">
                                  {d.memo}
                                </div>
                              )}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  ))}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 ${
        active
          ? 'bg-sky-600 text-white font-medium'
          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
      }`}
    >
      {children}
    </button>
  )
}

function reminderLink(r: Reminder): string {
  if (r.kind === 'deadline') return `/reminders/deadline/${r.deadline.id}/edit`
  return `/vehicles/${r.vehicleId}/bikelog/${r.lastRecord.id}/edit`
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
