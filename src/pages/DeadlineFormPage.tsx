import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId, nowIso } from '../db'
import type { DeadlineType } from '../types'
import BackHeader from '../components/BackHeader'

const TYPES: DeadlineType[] = ['車検', '任意保険', '自賠責保険', 'その他']

export default function DeadlineFormPage() {
  const { id: vehicleId, deadlineId } = useParams<{ id: string; deadlineId?: string }>()
  const isEdit = Boolean(deadlineId)
  const navigate = useNavigate()
  const existing = useLiveQuery(
    () => (deadlineId ? db.deadlines.get(deadlineId) : undefined),
    [deadlineId],
  )

  const [type, setType] = useState<DeadlineType>('車検')
  const [label, setLabel] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notifyBeforeDays, setNotifyBeforeDays] = useState('30')
  const [loaded, setLoaded] = useState(!isEdit)

  if (isEdit && existing && !loaded) {
    setType(existing.type)
    setLabel(existing.label === existing.type ? '' : existing.label)
    setDueDate(existing.dueDate)
    setNotifyBeforeDays(String(existing.notifyBeforeDays))
    setLoaded(true)
  }

  const backTo = `/vehicles/${vehicleId}?tab=deadline`

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!vehicleId) return

    const fields = {
      type,
      label: label || type,
      dueDate,
      notifyBeforeDays: Number(notifyBeforeDays) || 30,
    }

    if (isEdit && deadlineId) {
      await db.deadlines.update(deadlineId, fields)
    } else {
      await db.deadlines.add({ id: newId(), vehicleId, ...fields, createdAt: nowIso() })
    }

    navigate(backTo)
  }

  async function handleDelete() {
    if (!deadlineId) return
    if (!confirm('この期限を削除します。よろしいですか？')) return
    await db.deadlines.delete(deadlineId)
    navigate(backTo)
  }

  return (
    <div className="p-4">
      <BackHeader title={isEdit ? '期限を編集' : '期限を追加'} to={backTo} />
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
          {isEdit ? '更新する' : '記録する'}
        </button>

        {isEdit && (
          <button type="button" onClick={handleDelete} className="text-red-600 text-sm py-2">
            この期限を削除する
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
