import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId, nowIso } from '../db'
import { OTHER_CUSTOM_CATEGORY, CUSTOM_TAGS, SCHEDULE_CUSTOM_TAGS } from '../types'
import { buildBikeLogHistory } from '../bikeLog'
import { compareJaGojuon } from '../lib/textNormalize'
import BackHeader from '../components/BackHeader'
import ConfirmDeleteButton from '../components/ConfirmDeleteButton'
import DecimalInput from '../components/DecimalInput'

// recordIdが変わっても(履歴の別記録をクリックした場合など)同じルートのままだと
// コンポーネントが再マウントされずフォームの中身が更新されないため、
// recordIdをkeyにして強制的に再マウントさせる。
export default function BikeLogFormPage() {
  const { recordId } = useParams<{ recordId?: string }>()
  return <BikeLogFormInner key={recordId ?? 'new'} />
}

function BikeLogFormInner() {
  const { id: vehicleId, recordId } = useParams<{ id: string; recordId?: string }>()
  const isEdit = Boolean(recordId)
  const navigate = useNavigate()
  const existing = useLiveQuery(
    () => (recordId ? db.bikeLogRecords.get(recordId) : undefined),
    [recordId],
  )
  const categories = useLiveQuery(() => db.customCategories.toArray(), [])
  const sortedCategories = [...(categories ?? [])].sort((a, b) => {
    if (a.name === OTHER_CUSTOM_CATEGORY) return 1
    if (b.name === OTHER_CUSTOM_CATEGORY) return -1
    return compareJaGojuon(a.name, b.name)
  })

  const vehicle = useLiveQuery(
    () => (vehicleId ? db.vehicles.get(vehicleId) : undefined),
    [vehicleId],
  )

  // 編集中のカテゴリの全記録(履歴表示・個別削除・カテゴリ一括削除に使う)。
  // フォーム中でカテゴリを変更しても、履歴は「元々編集していたカテゴリ」のまま固定する。
  const historyCategory = existing?.category
  const categoryRecords = useLiveQuery(
    () =>
      vehicleId && historyCategory
        ? db.bikeLogRecords.where({ vehicleId, category: historyCategory }).toArray()
        : [],
    [vehicleId, historyCategory],
  )
  const history = categoryRecords ? buildBikeLogHistory(categoryRecords) : []

  const [searchParams] = useSearchParams()
  const presetCategory = !isEdit ? searchParams.get('category') : null

  const [category, setCategory] = useState(presetCategory ?? '')
  const [content, setContent] = useState('')
  const [brand, setBrand] = useState('')
  const [cost, setCost] = useState('')
  const [memo, setMemo] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [tags, setTags] = useState<string[]>([])
  const [odometer, setOdometer] = useState('')
  const [intervalKm, setIntervalKm] = useState('')
  const [intervalMonths, setIntervalMonths] = useState('')
  const [loaded, setLoaded] = useState(!isEdit)

  if (isEdit && existing && !loaded) {
    setCategory(existing.category)
    setContent(existing.content)
    setBrand(existing.brand ?? '')
    setCost(existing.cost !== undefined ? String(existing.cost) : '')
    setMemo(existing.memo ?? '')
    setDate(existing.date)
    setTags(existing.tags ?? [])
    setOdometer(existing.odometer !== undefined ? String(existing.odometer) : '')
    setIntervalKm(existing.intervalKm !== undefined ? String(existing.intervalKm) : '')
    setIntervalMonths(
      existing.intervalMonths !== undefined ? String(existing.intervalMonths) : '',
    )
    setLoaded(true)
  }

  // タグ未選択(初期状態)では全項目を表示し、タグを選んだ時だけ絞り込む。
  // #消耗品交換・#メンテナンスのどちらかを選んでいれば次回交換の目安欄を表示する。
  const showSchedule =
    tags.length === 0 || tags.some((t) => (SCHEDULE_CUSTOM_TAGS as string[]).includes(t))

  if (!isEdit && showSchedule && vehicle && odometer === '') {
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
      brand: brand || undefined,
      cost: cost ? Number(cost) : undefined,
      memo: memo || undefined,
      date,
      tags: tags.length > 0 ? tags : undefined,
      odometer: showSchedule && odometer ? Number(odometer) : undefined,
      intervalKm: showSchedule && intervalKm ? Number(intervalKm) : undefined,
      intervalMonths: showSchedule && intervalMonths ? Number(intervalMonths) : undefined,
    }

    if (isEdit && recordId) {
      await db.bikeLogRecords.update(recordId, fields)
    } else {
      await db.bikeLogRecords.add({ id: newId(), vehicleId, ...fields, createdAt: nowIso() })
    }

    navigate(backTo)
  }

  async function handleDeleteRecord(targetId: string) {
    await db.bikeLogRecords.delete(targetId)
    if (targetId === recordId) {
      navigate(backTo)
    }
  }

  async function handleDeleteCategory() {
    if (!vehicleId || !historyCategory) return
    await db.bikeLogRecords.where({ vehicleId, category: historyCategory }).delete()
    navigate(backTo)
  }

  return (
    <div className="p-4">
      <BackHeader
        title={
          isEdit ? 'バイクログを編集' : presetCategory ? `${presetCategory}を更新` : 'バイクログに追加'
        }
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
                to={`/vehicles/${vehicleId}/bikelog/categories`}
                className="text-sky-600 text-xs mt-1 inline-block"
              >
                カテゴリを管理
              </Link>
            </>
          )}
        </Field>
        <Field label="内容">
          <input
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input"
            placeholder="例: ヨシムラ R-11 / フロントタイヤ交換"
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
        <Field label="日付">
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="費用（円・任意）">
          <DecimalInput decimals={0} value={cost} onChange={setCost} />
        </Field>
        <Field label="メモ（任意）">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="input"
            rows={3}
          />
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

        {showSchedule && (
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
          {isEdit ? '更新する' : '登録する'}
        </button>
      </form>

      {isEdit && (
        <div className="mt-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">{historyCategory}の履歴</h2>
            <ConfirmDeleteButton
              onConfirm={handleDeleteCategory}
              label="このカテゴリを全て削除"
              confirmMessage={`「${historyCategory}」の記録を全て削除します。履歴も含めて元に戻せません。よろしいですか？`}
            />
          </div>
          <p className="text-xs text-slate-500">記録を選ぶと編集できます</p>
          <ul className="flex flex-col gap-1.5">
            {history.map((record) => (
              <li
                key={record.id}
                className={`card-compact ${record.id === recordId ? 'border-sky-400 dark:border-sky-600' : ''}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <Link
                    to={`/vehicles/${vehicleId}/bikelog/${record.id}/edit`}
                    className="text-sm min-w-0 flex-1"
                  >
                    <div className="text-slate-500">{record.date}</div>
                    <div>
                      {record.content}
                      {record.brand && ` ・ ${record.brand}`}
                    </div>
                    <div className="text-slate-500">
                      {record.odometer !== undefined && `${record.odometer.toLocaleString()} km`}
                      {record.cost !== undefined && ` ・ ¥${record.cost.toLocaleString()}`}
                    </div>
                    {record.memo && <div className="text-slate-500 mt-1">{record.memo}</div>}
                  </Link>
                  <ConfirmDeleteButton
                    onConfirm={() => handleDeleteRecord(record.id)}
                    label="削除"
                    confirmMessage="この記録を削除します。よろしいですか？"
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm flex-1 min-w-0">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
      {children}
    </label>
  )
}
