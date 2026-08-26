import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId, nowIso } from '../db'
import { CUSTOM_CATEGORY_SUGGESTIONS } from '../types'
import BackHeader from '../components/BackHeader'

export default function CustomFormPage() {
  const { id: vehicleId, recordId } = useParams<{ id: string; recordId?: string }>()
  const isEdit = Boolean(recordId)
  const navigate = useNavigate()
  const existing = useLiveQuery(
    () => (recordId ? db.customRecords.get(recordId) : undefined),
    [recordId],
  )
  const [searchParams] = useSearchParams()
  const presetCategory = !isEdit ? searchParams.get('category') : null

  const [category, setCategory] = useState(presetCategory ?? '')
  const [content, setContent] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [loaded, setLoaded] = useState(!isEdit)

  if (isEdit && existing && !loaded) {
    setCategory(existing.category)
    setContent(existing.content)
    setDate(existing.date)
    setLoaded(true)
  }

  const backTo = `/vehicles/${vehicleId}?tab=custom`

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!vehicleId) return

    const fields = { category, content, date }

    if (isEdit && recordId) {
      await db.customRecords.update(recordId, fields)
    } else {
      await db.customRecords.add({ id: newId(), vehicleId, ...fields, createdAt: nowIso() })
    }

    navigate(backTo)
  }

  async function handleDelete() {
    if (!recordId) return
    if (!confirm('このカスタム記録を削除します。よろしいですか？')) return
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
              <input
                required
                list="custom-category-suggestions"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input"
                placeholder="例: マフラー"
              />
              <datalist id="custom-category-suggestions">
                {CUSTOM_CATEGORY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
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

        <button type="submit" className="btn-primary mt-2">
          {isEdit ? '更新する' : '記録する'}
        </button>

        {isEdit && (
          <button type="button" onClick={handleDelete} className="text-red-600 text-sm py-2">
            このカスタム記録を削除する
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
