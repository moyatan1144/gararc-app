import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { OTHER_CUSTOM_CATEGORY } from '../types'
import { addCategory, deleteCategory, renameCategory } from '../customCategories'
import { compareJaGojuon } from '../lib/textNormalize'
import BackHeader from '../components/BackHeader'

const ERROR_MESSAGES = {
  empty: 'カテゴリ名を入力してください',
  duplicate: '同じカテゴリ名が既に登録されています',
  protected: '「その他」は編集・削除できません',
  in_use: 'このカテゴリを使ったバイクログ記録があるため削除できません',
}

export default function CustomCategoryManagePage() {
  const { id: vehicleId } = useParams<{ id: string }>()
  const categories = useLiveQuery(() => db.customCategories.toArray(), [])

  const [newName, setNewName] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const backTo = `/vehicles/${vehicleId}?tab=bikelog`
  const sorted = [...(categories ?? [])].sort((a, b) => {
    if (a.name === OTHER_CUSTOM_CATEGORY) return 1
    if (b.name === OTHER_CUSTOM_CATEGORY) return -1
    return compareJaGojuon(a.name, b.name)
  })

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setAddError(null)
    const result = await addCategory(newName)
    if (!result.ok) {
      setAddError(ERROR_MESSAGES[result.error ?? 'empty'])
      return
    }
    setNewName('')
  }

  function startEdit(id: string, currentName: string) {
    setEditingId(id)
    setEditValue(currentName)
    setEditError(null)
    setRowError(null)
    setConfirmDeleteId(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
    setEditError(null)
  }

  async function saveEdit(id: string) {
    setEditError(null)
    const result = await renameCategory(id, editValue)
    if (!result.ok) {
      setEditError(ERROR_MESSAGES[result.error ?? 'empty'])
      return
    }
    setEditingId(null)
    setEditValue('')
  }

  function startDelete(id: string) {
    setConfirmDeleteId(id)
    setEditingId(null)
    setRowError(null)
  }

  async function confirmDelete(id: string) {
    setRowError(null)
    const result = await deleteCategory(id)
    setConfirmDeleteId(null)
    if (!result.ok) {
      setRowError({ id, message: ERROR_MESSAGES[result.error ?? 'in_use'] })
    }
  }

  return (
    <div className="p-4">
      <BackHeader title="カテゴリの追加・削除" to={backTo} />

      <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-4">
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="input flex-1 min-w-0"
            placeholder="新しいカテゴリ名"
          />
          <button type="submit" className="btn-primary px-4 flex-shrink-0">
            追加
          </button>
        </div>
        {addError && <p className="text-sm text-red-600">{addError}</p>}
        <p className="text-xs text-slate-500">
          半角文字は自動的に全角に変換され、スペースは取り除かれます。同じ名前は登録できません。
        </p>
      </form>

      <ul className="flex flex-col gap-2">
        {sorted.map((category) => {
          const isProtected = category.name === OTHER_CUSTOM_CATEGORY
          const isEditing = editingId === category.id
          const isConfirmingDelete = confirmDeleteId === category.id
          return (
            <li key={category.id} className="card">
              {isConfirmingDelete ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    「{category.name}」を削除します。よろしいですか？
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => confirmDelete(category.id)}
                      className="flex-1 rounded-lg bg-red-600 text-white text-sm font-medium py-1.5"
                    >
                      削除する
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="btn-secondary flex-1 py-1.5 text-sm"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : isEditing ? (
                <div className="flex flex-col gap-2">
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="input"
                    autoFocus
                  />
                  {editError && <p className="text-sm text-red-600">{editError}</p>}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(category.id)}
                      className="btn-primary flex-1 py-1.5 text-sm"
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="btn-secondary flex-1 py-1.5 text-sm"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium min-w-0 break-words">{category.name}</span>
                  {isProtected ? (
                    <span className="text-xs text-slate-500 flex-shrink-0">初期カテゴリ</span>
                  ) : (
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(category.id, category.name)}
                        className="text-sky-600 text-sm"
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        onClick={() => startDelete(category.id)}
                        className="text-red-600 text-sm"
                      >
                        削除
                      </button>
                    </div>
                  )}
                </div>
              )}
              {rowError?.id === category.id && (
                <p className="text-sm text-red-600 mt-2">{rowError.message}</p>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
