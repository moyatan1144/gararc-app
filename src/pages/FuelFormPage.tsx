import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId, nowIso } from '../db'

export default function FuelFormPage() {
  const { id: vehicleId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const vehicle = useLiveQuery(
    () => (vehicleId ? db.vehicles.get(vehicleId) : undefined),
    [vehicleId],
  )

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [odometer, setOdometer] = useState('')
  const [liters, setLiters] = useState('')
  const [pricePerLiter, setPricePerLiter] = useState('')
  const [isFull, setIsFull] = useState(true)
  const [memo, setMemo] = useState('')

  if (vehicle && odometer === '') {
    setOdometer(String(vehicle.currentOdometer))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!vehicleId) return
    const odometerNum = Number(odometer) || 0

    await db.transaction('rw', db.fuelRecords, db.vehicles, async () => {
      await db.fuelRecords.add({
        id: newId(),
        vehicleId,
        date,
        odometer: odometerNum,
        liters: Number(liters) || 0,
        pricePerLiter: Number(pricePerLiter) || 0,
        isFull,
        memo: memo || undefined,
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

  const totalCost =
    liters && pricePerLiter ? Math.round(Number(liters) * Number(pricePerLiter)) : undefined

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">給油記録を追加</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="給油日">
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
        <div className="flex gap-3">
          <Field label="給油量 (L)">
            <input
              required
              type="number"
              step="0.01"
              inputMode="decimal"
              value={liters}
              onChange={(e) => setLiters(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="単価 (円/L)">
            <input
              required
              type="number"
              step="0.1"
              inputMode="decimal"
              value={pricePerLiter}
              onChange={(e) => setPricePerLiter(e.target.value)}
              className="input"
            />
          </Field>
        </div>
        {totalCost !== undefined && (
          <div className="text-sm text-slate-500">合計金額: ¥{totalCost.toLocaleString()}</div>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isFull}
            onChange={(e) => setIsFull(e.target.checked)}
          />
          満タン給油（燃費計算の基準にする）
        </label>

        <Field label="メモ（任意）">
          <input value={memo} onChange={(e) => setMemo(e.target.value)} className="input" />
        </Field>

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
