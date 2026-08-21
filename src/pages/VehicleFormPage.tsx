import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId, nowIso } from '../db'

export default function VehicleFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const existing = useLiveQuery(
    () => (id ? db.vehicles.get(id) : undefined),
    [id],
  )

  const [name, setName] = useState('')
  const [model, setModel] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [currentOdometer, setCurrentOdometer] = useState('0')
  const [loaded, setLoaded] = useState(!isEdit)

  if (isEdit && existing && !loaded) {
    setName(existing.name)
    setModel(existing.model ?? '')
    setPlateNumber(existing.plateNumber ?? '')
    setCurrentOdometer(String(existing.currentOdometer))
    setLoaded(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const now = nowIso()

    if (isEdit && id) {
      await db.vehicles.update(id, {
        name,
        model: model || undefined,
        plateNumber: plateNumber || undefined,
        currentOdometer: Number(currentOdometer) || 0,
        updatedAt: now,
      })
      navigate(`/vehicles/${id}`)
    } else {
      const vehicleId = newId()
      await db.vehicles.add({
        id: vehicleId,
        name,
        model: model || undefined,
        plateNumber: plateNumber || undefined,
        currentOdometer: Number(currentOdometer) || 0,
        createdAt: now,
        updatedAt: now,
      })
      navigate(`/vehicles/${vehicleId}`)
    }
  }

  async function handleDelete() {
    if (!id) return
    if (!confirm('この車両と関連する記録をすべて削除します。よろしいですか？')) return
    await db.transaction('rw', db.vehicles, db.maintenanceRecords, db.fuelRecords, db.deadlines, async () => {
      await db.maintenanceRecords.where('vehicleId').equals(id).delete()
      await db.fuelRecords.where('vehicleId').equals(id).delete()
      await db.deadlines.where('vehicleId').equals(id).delete()
      await db.vehicles.delete(id)
    })
    navigate('/')
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">{isEdit ? '車両を編集' : '車両を追加'}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="車両名（例: マイCB400）">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="愛車の呼び名"
          />
        </Field>
        <Field label="車種（任意）">
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="input"
            placeholder="例: Honda CB400SF"
          />
        </Field>
        <Field label="ナンバー（任意）">
          <input
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="現在の走行距離 (km)">
          <input
            required
            type="number"
            inputMode="numeric"
            value={currentOdometer}
            onChange={(e) => setCurrentOdometer(e.target.value)}
            className="input"
          />
        </Field>

        <button type="submit" className="btn-primary mt-2">
          {isEdit ? '更新する' : '登録する'}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-red-600 text-sm py-2"
          >
            この車両を削除する
          </button>
        )}
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
      {children}
    </label>
  )
}
