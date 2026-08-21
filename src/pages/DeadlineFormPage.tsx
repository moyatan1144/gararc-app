import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db, newId, nowIso } from '../db'
import type { DeadlineType } from '../types'

const TYPES: DeadlineType[] = ['車検', '任意保険', '自賠責保険', 'その他']

export default function DeadlineFormPage() {
  const { id: vehicleId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [type, setType] = useState<DeadlineType>('車検')
  const [label, setLabel] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notifyBeforeDays, setNotifyBeforeDays] = useState('30')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!vehicleId) return

    await db.deadlines.add({
      id: newId(),
      vehicleId,
      type,
      label: label || type,
      dueDate,
      notifyBeforeDays: Number(notifyBeforeDays) || 30,
      createdAt: nowIso(),
    })

    navigate(`/vehicles/${vehicleId}`)
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">期限を追加</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="種類">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as DeadlineType)}
            className="input"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="ラベル（任意、空欄は種類名になります）">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="input"
            placeholder="例: 〇〇損保 任意保険"
          />
        </Field>
        <Field label="期限日">
          <input
            required
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="何日前から通知するか">
          <input
            type="number"
            inputMode="numeric"
            value={notifyBeforeDays}
            onChange={(e) => setNotifyBeforeDays(e.target.value)}
            className="input"
          />
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
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
      {children}
    </label>
  )
}
