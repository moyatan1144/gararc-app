import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId, nowIso } from '../db'
import type { MeterType } from '../types'
import BackHeader from '../components/BackHeader'
import DecimalInput from '../components/DecimalInput'
import ConfirmDeleteButton from '../components/ConfirmDeleteButton'

export default function FuelFormPage() {
  const { id: vehicleId, fuelId } = useParams<{ id: string; fuelId?: string }>()
  const isEdit = Boolean(fuelId)
  const navigate = useNavigate()
  const vehicle = useLiveQuery(
    () => (vehicleId ? db.vehicles.get(vehicleId) : undefined),
    [vehicleId],
  )
  const existing = useLiveQuery(
    () => (fuelId ? db.fuelRecords.get(fuelId) : undefined),
    [fuelId],
  )

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [meterType, setMeterType] = useState<MeterType>('odometer')
  const [odometer, setOdometer] = useState('')
  const [tripDistance, setTripDistance] = useState('')
  const [liters, setLiters] = useState('')
  const [pricePerLiter, setPricePerLiter] = useState('')
  const [isFull, setIsFull] = useState(true)
  const [memo, setMemo] = useState('')
  const [loaded, setLoaded] = useState(!isEdit)

  if (isEdit && existing && !loaded) {
    setDate(existing.date)
    setMeterType(existing.meterType)
    setOdometer(String(existing.odometer))
    setTripDistance(existing.tripDistance !== undefined ? String(existing.tripDistance) : '')
    setLiters(String(existing.liters))
    setPricePerLiter(String(existing.pricePerLiter))
    setIsFull(existing.isFull)
    setMemo(existing.memo ?? '')
    setLoaded(true)
  }

  if (!isEdit && vehicle && odometer === '' && meterType === 'odometer') {
    setOdometer(String(vehicle.currentOdometer))
  }

  const backTo = `/vehicles/${vehicleId}?tab=fuel`

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!vehicleId) return

    const referenceOdometer = vehicle?.currentOdometer ?? 0
    const tripNum = Number(tripDistance) || 0
    const odometerNum =
      meterType === 'trip' ? referenceOdometer + tripNum : Number(odometer) || 0

    const fields = {
      vehicleId,
      date,
      meterType,
      odometer: odometerNum,
      tripDistance: meterType === 'trip' ? tripNum : undefined,
      liters: Number(liters) || 0,
      pricePerLiter: Number(pricePerLiter) || 0,
      isFull,
      memo: memo || undefined,
    }

    await db.transaction('rw', db.fuelRecords, db.vehicles, async () => {
      if (isEdit && fuelId) {
        await db.fuelRecords.update(fuelId, fields)
      } else {
        await db.fuelRecords.add({ id: newId(), ...fields, createdAt: nowIso() })
      }
      if (vehicle && odometerNum > vehicle.currentOdometer) {
        await db.vehicles.update(vehicleId, {
          currentOdometer: odometerNum,
          updatedAt: nowIso(),
        })
      }
    })

    navigate(backTo)
  }

  async function handleDelete() {
    if (!fuelId) return
    await db.fuelRecords.delete(fuelId)
    navigate(backTo)
  }

  const totalCost =
    liters && pricePerLiter ? Math.round(Number(liters) * Number(pricePerLiter)) : undefined

  return (
    <div className="p-4">
      <BackHeader title={isEdit ? '給油記録を編集' : '給油記録を追加'} to={backTo} />
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

        <Field label="距離の入力方法">
          <div className="flex flex-col sm:flex-row rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 text-sm">
            <button
              type="button"
              onClick={() => setMeterType('odometer')}
              className={`flex-1 py-2.5 px-3 text-center ${
                meterType === 'odometer'
                  ? 'bg-sky-600 text-white font-medium'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span className="block text-base font-bold tracking-wide">ODO</span>
              <span className="block text-xs opacity-80">総走行距離</span>
            </button>
            <button
              type="button"
              onClick={() => setMeterType('trip')}
              className={`flex-1 py-2.5 px-3 text-center border-t sm:border-t-0 sm:border-l border-slate-300 dark:border-slate-700 ${
                meterType === 'trip'
                  ? 'bg-sky-600 text-white font-medium'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span className="block text-base font-bold tracking-wide">TRIP</span>
              <span className="block text-xs opacity-80">前回給油からの距離</span>
            </button>
          </div>
        </Field>

        {meterType === 'odometer' ? (
          <Field label="走行距離 (km)">
            <DecimalInput
              required
              decimals={1}
              value={odometer}
              onChange={setOdometer}
            />
          </Field>
        ) : (
          <Field label="トリップメーターの値 (km)">
            <DecimalInput
              required
              decimals={1}
              value={tripDistance}
              onChange={setTripDistance}
              placeholder="前回の給油からの走行距離"
            />
            <span className="text-xs text-slate-500">
              総走行距離: {(
                (vehicle?.currentOdometer ?? 0) + (Number(tripDistance) || 0)
              ).toLocaleString()}{' '}
              km
            </span>
          </Field>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
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
          <Field label="単価 (円/L・整数)">
            <DecimalInput
              required
              decimals={0}
              value={pricePerLiter}
              onChange={setPricePerLiter}
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
          {isEdit ? '更新する' : '記録する'}
        </button>

        {isEdit && (
          <ConfirmDeleteButton
            onConfirm={handleDelete}
            label="この給油記録を削除する"
            confirmMessage="この給油記録を削除します。よろしいですか？"
          />
        )}
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
