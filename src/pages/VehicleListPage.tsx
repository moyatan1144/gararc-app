import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useReminders } from '../hooks/useReminders'

export default function VehicleListPage() {
  const vehicles = useLiveQuery(() => db.vehicles.orderBy('createdAt').toArray(), [])
  const { urgentCount } = useReminders()

  return (
    <div className="p-4">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">車両一覧</h1>
        <Link
          to="/vehicles/new"
          className="rounded-full bg-sky-600 text-white px-4 py-1.5 text-sm font-medium"
        >
          + 追加
        </Link>
      </header>

      {urgentCount > 0 && (
        <Link
          to="/reminders"
          className="block rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 px-4 py-3 text-sm font-medium mb-4"
        >
          ⚠️ 要注意のリマインダーが{urgentCount}件あります
        </Link>
      )}

      {vehicles?.length === 0 && (
        <div className="text-center text-slate-500 mt-16 text-sm">
          まだ車両が登録されていません。
          <br />
          「+ 追加」からバイクを登録しましょう。
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {vehicles?.map((vehicle) => (
          <li key={vehicle.id}>
            <Link
              to={`/vehicles/${vehicle.id}`}
              className="block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm"
            >
              <div className="font-semibold">{vehicle.name}</div>
              {vehicle.model && (
                <div className="text-sm text-slate-500">{vehicle.model}</div>
              )}
              <div className="text-sm text-slate-500 mt-1">
                走行距離: {vehicle.currentOdometer.toLocaleString()} km
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
