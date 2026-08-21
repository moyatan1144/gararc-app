import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { computeFuelStats, averageKmPerLiter } from '../fuelStats'

type Tab = 'maintenance' | 'fuel' | 'deadline'

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<Tab>('maintenance')

  const vehicle = useLiveQuery(() => (id ? db.vehicles.get(id) : undefined), [id])
  const maintenanceRecords = useLiveQuery(
    () =>
      id
        ? db.maintenanceRecords.where('vehicleId').equals(id).reverse().sortBy('date')
        : [],
    [id],
  )
  const fuelRecords = useLiveQuery(
    () => (id ? db.fuelRecords.where('vehicleId').equals(id).toArray() : []),
    [id],
  )
  const deadlines = useLiveQuery(
    () => (id ? db.deadlines.where('vehicleId').equals(id).sortBy('dueDate') : []),
    [id],
  )

  if (!vehicle || !id) return <div className="p-4 text-slate-500">読み込み中...</div>

  const fuelStats = fuelRecords ? computeFuelStats(fuelRecords) : []
  const avgKmPerL = averageKmPerLiter(fuelStats)

  return (
    <div className="p-4">
      <header className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">{vehicle.name}</h1>
          {vehicle.model && <div className="text-sm text-slate-500">{vehicle.model}</div>}
          <div className="text-sm text-slate-500">
            走行距離: {vehicle.currentOdometer.toLocaleString()} km
          </div>
        </div>
        <Link to={`/vehicles/${id}/edit`} className="text-sky-600 text-sm">
          編集
        </Link>
      </header>

      <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 mb-4 text-sm">
        <TabButton active={tab === 'maintenance'} onClick={() => setTab('maintenance')}>
          整備記録
        </TabButton>
        <TabButton active={tab === 'fuel'} onClick={() => setTab('fuel')}>
          給油記録
        </TabButton>
        <TabButton active={tab === 'deadline'} onClick={() => setTab('deadline')}>
          期限
        </TabButton>
      </div>

      {tab === 'maintenance' && (
        <Section
          addLabel="+ 整備記録を追加"
          addTo={`/vehicles/${id}/maintenance/new`}
        >
          {maintenanceRecords?.length === 0 && <Empty>まだ整備記録がありません</Empty>}
          <ul className="flex flex-col gap-2">
            {maintenanceRecords?.map((r) => (
              <li key={r.id} className="card">
                <div className="flex justify-between">
                  <span className="font-medium">{r.title}</span>
                  <span className="text-sm text-slate-500">{r.date}</span>
                </div>
                <div className="text-sm text-slate-500">{r.category}</div>
                <div className="text-sm text-slate-500">
                  {r.odometer.toLocaleString()} km
                  {r.cost !== undefined && ` ・ ¥${r.cost.toLocaleString()}`}
                </div>
                {r.memo && <div className="text-sm mt-1">{r.memo}</div>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {tab === 'fuel' && (
        <Section addLabel="+ 給油記録を追加" addTo={`/vehicles/${id}/fuel/new`}>
          {avgKmPerL !== undefined && (
            <div className="card mb-2 text-sm">
              平均燃費: <span className="font-semibold">{avgKmPerL.toFixed(2)} km/L</span>
            </div>
          )}
          {fuelStats.length === 0 && <Empty>まだ給油記録がありません</Empty>}
          <ul className="flex flex-col gap-2">
            {fuelStats.map(({ record, kmPerLiter }) => (
              <li key={record.id} className="card">
                <div className="flex justify-between">
                  <span className="font-medium">
                    {record.liters.toFixed(1)} L ・ ¥
                    {Math.round(record.liters * record.pricePerLiter).toLocaleString()}
                  </span>
                  <span className="text-sm text-slate-500">{record.date}</span>
                </div>
                <div className="text-sm text-slate-500">
                  {record.odometer.toLocaleString()} km
                  {!record.isFull && ' （満タンでない）'}
                </div>
                {kmPerLiter !== undefined && (
                  <div className="text-sm text-sky-600">{kmPerLiter.toFixed(2)} km/L</div>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {tab === 'deadline' && (
        <Section addLabel="+ 期限を追加" addTo={`/vehicles/${id}/deadline/new`}>
          {deadlines?.length === 0 && <Empty>まだ期限が登録されていません</Empty>}
          <ul className="flex flex-col gap-2">
            {deadlines?.map((d) => (
              <li key={d.id} className="card">
                <div className="flex justify-between">
                  <span className="font-medium">
                    {d.type} ・ {d.label}
                  </span>
                  <span className="text-sm text-slate-500">{d.dueDate}</span>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 ${
        active
          ? 'bg-sky-600 text-white font-medium'
          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
      }`}
    >
      {children}
    </button>
  )
}

function Section({
  addLabel,
  addTo,
  children,
}: {
  addLabel: string
  addTo: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="flex justify-end mb-2">
        <Link to={addTo} className="text-sky-600 text-sm font-medium">
          {addLabel}
        </Link>
      </div>
      {children}
    </div>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="text-center text-slate-500 text-sm py-8">{children}</div>
}
