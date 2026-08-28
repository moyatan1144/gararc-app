import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId, nowIso } from '../db'
import { OTHER_CUSTOM_CATEGORY, CUSTOM_TAGS, SCHEDULE_CUSTOM_TAGS } from '../types'
import BackHeader from '../components/BackHeader'
import ConfirmDeleteButton from '../components/ConfirmDeleteButton'
import DecimalInput from '../components/DecimalInput'

export default function CustomFormPage() {
  const { id: vehicleId, recordId } = useParams<{ id: string; recordId?: string }>()
  const isEdit = Boolean(recordId)
  const navigate = useNavigate()
  const existing = useLiveQuery(
    () => (recordId ? db.customRecords.get(recordId) : undefined),
    [recordId],
  )
  const categories = useLiveQuery(() => db.customCategories.toArray(), [])
  const sortedCategories = [...(categories ?? [])].sort((a, b) => {
    if (a.name === OTHER_CUSTOM_CATEGORY) return 1
    if (b.name === OTHER_CUSTOM_CATEGORY) return -1
    return a.name.localeCompare(b.name, 'ja')
  })

  const vehicle = useLiveQuery(
    () => (vehicleId ? db.vehicles.get(vehicleId) : undefined),
    [vehicleId],
  )

  const [searchParams] = useSearchParams()
  const presetCategory = !isEdit ? searchParams.get('category') : null

  const [category, setCategory] = useState(presetCategory ?? '')
  const [content, setContent] = useState('')
  const [cost, setCost] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [tags, setTags] = useState<string[]>([])
  const [odometer, setOdometer] = useState('')
  const [intervalKm, setIntervalKm] = useState('')
  const [intervalMonths, setIntervalMonths] = useState('')
  const [loaded, setLoaded] = useState(!isEdit)

  if (isEdit && existing && !loaded) {
    setCategory(existing.category)
    setContent(existing.content)
    setCost(existing.cost !== undefined ? String(existing.cost) : '')
    setDate(existing.date)
    setTags(existing.tags ?? [])
    setOdometer(existing.odometer !== undefined ? String(existing.odometer) : '')
    setIntervalKm(existing.intervalKm !== undefined ? String(existing.intervalKm) : '')
    setIntervalMonths(
      existing.intervalMonths !== undefined ? String(existing.intervalMonths) : '',
    )
    setLoaded(true)
  }

  const isSchedule = tags.some((t) => (SCHEDULE_CUSTOM_TAGS as string[]).includes(t))

  if (!isEdit && isSchedule && vehicle && odometer === '') {
    setOdometer(String(vehicle.currentOdometer))
  }

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const backTo = `/vehicles/${vehicleId}?tab=bikelog`

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!vehicleId) return

    const fields = {
      category,
      content,
      cost: cost ? Number(cost) : undefined,
      date,
      tags: tags.length > 0 ? tags : undefined,
      odometer: isSchedule && odometer ? Number(odometer) : undefined,
      intervalKm: isSchedule && intervalKm ? Number(intervalKm) : undefined,
      intervalMonths: isSchedule && intervalMonths ? Number(intervalMonths) : undefined,
    }

    if (isEdit && recordId) {
      await db.customRecords.update(recordId, fields)
    } else {
      await db.customRecords.add({ id: newId(), vehicleId, ...fields, createdAt: nowIso() })
    }

    navigate(backTo)
  }

  async function handleDelete() {
    if (!recordId) return
    await db.customRecords.delete(recordId)
    navigate(backTo)
  }

  return (
    <div className="p-4">
      <BackHeader
        title={isEdit ? 'カスタムを編集' : presetCategory ? `${presetCategory}を更新` : 'カスタムを追加'}
        to={backTo}
      />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="カテゴリ">
          {presetCategory ? (
            <div className="input bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {presetCategory}
            </div>
          ) : (
            <>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input"
              >
                <option value="" disabled>
                  選択してください
                </option>
                {sortedCategories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Link
                to={`/vehicles/${vehicleId}/custom/categories`}
                className="text-sky-600 text-xs mt-1 inline-block"
              >
                カテゴリを管理
              </Link>
            </>
          )}
        </Field>
        <Field label="変更後の内容">
          <input
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input"
            placeholder="例: ヨシムラ R-11"
          />
        </Field>
        <Field label="変更日">
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="価格（円・任意）">
          <DecimalInput decimals={0} value={cost} onChange={setCost} />
        </Field>
        <Field label="タグ（任意・複数選択可）">
          <div className="flex flex-wrap gap-2">
            {CUSTOM_TAGS.map((tag) => {
              const active = tags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-3 py-1.5 text-sm border ${
                    active
                      ? 'bg-sky-600 border-sky-600 text-white font-medium'
                      : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  #{tag}
                </button>
              )
            })}
          </div>
          <span className="text-xs text-slate-500">
            #消耗品交換・#メンテナンスを選ぶと、次回交換の目安を設定できます
          </span>
        </Field>

        {isSchedule && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
            <div className="text-sm font-medium mb-2">
              次回交換の目安（設定するとリマインダーに表示されます）
            </div>
            <Field label="現在の走行距離 (km)">
              <input
                type="number"
                inputMode="numeric"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="input"
              />
            </Field>
            <div className="flex flex-col sm:flex-row gap-3 mt-3">
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
        )}

        <button type="submit" className="btn-primary mt-2">
          {isEdit ? '更新する' : '記録する'}
        </button>

        {isEdit && (
          <ConfirmDeleteButton
            onConfirm={handleDelete}
            label="このカスタム記録を削除する"
            confirmMessage="このカスタム記録を削除します。よろしいですか？"
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
