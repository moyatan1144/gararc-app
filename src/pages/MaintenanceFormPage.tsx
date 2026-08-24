import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId, nowIso } from '../db'
import { MAINTENANCE_CATEGORIES } from '../types'
import BackHeader from '../components/BackHeader'

export default function MaintenanceFormPage() {
  const { id: vehicleId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const vehicle = useLiveQuery(
    () => (vehicleId ? db.vehicles.get(vehicleId) : undefined),
    [vehicleId],
  )

  const [category, setCategory] = useState<string>(MAINTENANCE_CATEGORIES[0])
  const [title, setTitle] = useState('')
  const [brand, setBrand] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [odometer, setOdometer] = useState('')
  const [cost, setCost] = useState('')
  const [memo, setMemo] = useState('')
  const [intervalKm, setIntervalKm] = useState('')
  const [intervalMonths, setIntervalMonths] = useState('')

  if (vehicle && odometer === '') {
    // 初期値として現在の走行距離を提案
    setOdometer(String(vehicle.currentOdometer))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!vehicleId) return
    const odometerNum = Number(odometer) || 0

    await db.transaction('rw', db.maintenanceRecords, db.vehicles, async () => {
      await db.maintenanceRecords.add({
        id: newId(),
        vehicleId,
        category,
        title: title || category,
        brand: brand || undefined,
        date,
        odometer: odometerNum,
        cost: cost ? Number(cost) : undefined,
        memo: memo || undefined,
        intervalKm: intervalKm ? Number(intervalKm) : undefined,
        intervalMonths: intervalMonths ? Number(intervalMonths) : undefined,
        createdAt: nowIso(),
      })
      if (vehicle && odometerNum > vehicle.currentOdometer) {
        await db.vehicles.update(vehicleId, {
          currentOdometer: odometerNum,
          updatedAt: nowIso(),
        })
      }
    })

    navigate(`/vehicles/${vehicleId}`)
  }

  return (
    <div className="p-4">
      <BackHeader title="整備記録を追加" to={`/vehicles/${vehicleId}`} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="カテゴリ">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
          >
            {MAINTENANCE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="内容（任意、空欄はカテゴリ名になります）">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="例: フロントタイヤ交換"
          />
        </Field>
        <Field label="メーカー・ブランド（任意）">
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="input"
            placeholder="例: MICHELIN"
          />
        </Field>
        <Field label="作業日">
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="走行距離 (km)">
          <input
            required
            type="number"
            inputMode="numeric"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="費用（円・任意）">
          <input
            type="number"
            inputMode="numeric"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="メモ（任意）">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="input"
            rows={3}
          />
        </Field>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
          <div className="text-sm font-medium mb-2">
            次回交換の目安（設定するとリマインダーに表示されます）
          </div>
          <div className="flex gap-3">
            <Field label="距離間隔 (km)">
              <input
                type="number"
                inputMode="numeric"
                value={intervalKm}
                onChange={(e) => setIntervalKm(e.target.value)}
                className="input"
                placeholder="例: 3000"
              />
            </Field>
            <Field label="期間間隔 (ヶ月)">
              <input
                type="number"
                inputMode="numeric"
                value={intervalMonths}
                onChange={(e) => setIntervalMonths(e.target.value)}
                className="input"
                placeholder="例: 6"
              />
            </Field>
          </div>
        </div>

        <button type="submit" className="btn-primary mt-2">
          記録する
        </button>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm flex-1">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
      {children}
    </label>
  )
}
