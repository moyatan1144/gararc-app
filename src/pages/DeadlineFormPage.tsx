import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId, nowIso } from '../db'
import type { DeadlineType } from '../types'
import BackHeader from '../components/BackHeader'
import ConfirmDeleteButton from '../components/ConfirmDeleteButton'

const TYPES: DeadlineType[] = ['車検', '任意保険', '自賠責保険', 'その他']

export default function DeadlineFormPage() {
  const { deadlineId } = useParams<{ deadlineId?: string }>()
  const isEdit = Boolean(deadlineId)
  const navigate = useNavigate()
  const existing = useLiveQuery(
    () => (deadlineId ? db.deadlines.get(deadlineId) : undefined),
    [deadlineId],
  )
  const vehicles = useLiveQuery(() => db.vehicles.orderBy('createdAt').toArray(), [])
  const existingVehicle = useLiveQuery(
    () => (existing ? db.vehicles.get(existing.vehicleId) : undefined),
    [existing],
  )
  const [searchParams] = useSearchParams()
  const presetVehicleId = !isEdit ? searchParams.get('vehicleId') : null
  const presetVehicle = useLiveQuery(
    () => (presetVehicleId ? db.vehicles.get(presetVehicleId) : undefined),
    [presetVehicleId],
  )

  // 車両ページの「期限」タブから来た場合はそのタブへ、そうでなければ
  // リマインダーへ戻る(どちらの入口からも登録できるようにしているため)。
  const backToVehicleId = isEdit ? existing?.vehicleId : presetVehicleId
  const backTo = backToVehicleId ? `/vehicles/${backToVehicleId}?tab=deadline` : '/reminders'

  const [vehicleId, setVehicleId] = useState(presetVehicleId ?? '')
  const [type, setType] = useState<DeadlineType>('車検')
  const [label, setLabel] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notifyBeforeDays, setNotifyBeforeDays] = useState('60')
  const [memo, setMemo] = useState('')
  const [loaded, setLoaded] = useState(!isEdit)

  if (isEdit && existing && !loaded) {
    setVehicleId(existing.vehicleId)
    setType(existing.type)
    setLabel(existing.label === existing.type ? '' : existing.label)
    setDueDate(existing.dueDate)
    setNotifyBeforeDays(String(existing.notifyBeforeDays))
    setMemo(existing.memo ?? '')
    setLoaded(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!vehicleId) return

    const fields = {
      vehicleId,
      type,
      label: label || type,
      dueDate,
      notifyBeforeDays: Number(notifyBeforeDays) || 60,
      memo: memo || undefined,
    }

    if (isEdit && deadlineId) {
      await db.deadlines.update(deadlineId, fields)
    } else {
      await db.deadlines.add({ id: newId(), ...fields, createdAt: nowIso() })
    }

    navigate(backTo)
  }

  async function handleDelete() {
    if (!deadlineId) return
    await db.deadlines.delete(deadlineId)
    navigate(backTo)
  }

  return (
    <div className="p-4">
      <BackHeader title={isEdit ? '期限を編集' : '期限を追加'} to={backTo} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="車両">
          {isEdit || presetVehicleId ? (
            <div className="input bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {(isEdit ? existingVehicle?.name : presetVehicle?.name) ?? '読み込み中...'}
            </div>
          ) : (
            <select
              required
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="input"
            >
              <option value="" disabled>
                選択してください
              </option>
              {vehicles?.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          )}
        </Field>
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
        <Field label="ラベル（任意）">
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
        <Field label="何日前から通知するか（初期値: 2ヶ月前）">
          <input
            type="number"
            inputMode="numeric"
            value={notifyBeforeDays}
            onChange={(e) => setNotifyBeforeDays(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="メモ（任意・証券番号など）">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="input"
            rows={3}
            placeholder="例: 証券番号、連絡先、更新条件など"
          />
          <span className="text-xs text-slate-500">
            ⚠️
            このデータは端末内にのみ保存され、外部には送信されません。証券番号など重要な情報を入力する場合は、ご自身の判断・責任でご利用ください。
          </span>
        </Field>

        <button type="submit" className="btn-primary mt-2">
          {isEdit ? '更新する' : '記録する'}
        </button>

        {isEdit && (
          <ConfirmDeleteButton
            onConfirm={handleDelete}
            label="この期限を削除する"
            confirmMessage="この期限を削除します。よろしいですか？"
          />
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
