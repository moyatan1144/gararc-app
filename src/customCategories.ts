import { db, newId, nowIso } from './db'
import { DEFAULT_CUSTOM_CATEGORIES, MAINTENANCE_CATEGORIES, OTHER_CUSTOM_CATEGORY } from './types'
import { normalizeCategoryName } from './lib/textNormalize'

const ALL_DEFAULT_CATEGORIES = [...DEFAULT_CUSTOM_CATEGORIES, ...MAINTENANCE_CATEGORIES]

// アプリ起動時に、初期セットのうちまだ登録されていないカテゴリを投入する。
// (整備記録とカスタムの統合で、旧MAINTENANCE_CATEGORIESもここに合流させる)
// React StrictModeの二重effect実行などで同時に2回呼ばれても、
// name のユニーク制約により重複は作られない(片方は失敗するだけなので握りつぶす)。
export async function ensureDefaultCategoriesSeeded(): Promise<void> {
  const existing = await db.customCategories.toArray()
  const existingNames = new Set(existing.map((c) => normalizeCategoryName(c.name)))
  const missingNames = [...new Set(ALL_DEFAULT_CATEGORIES.map(normalizeCategoryName))].filter(
    (name) => !existingNames.has(name),
  )
  if (missingNames.length === 0) return

  const now = nowIso()
  try {
    await db.customCategories.bulkAdd(
      missingNames.map((name) => ({ id: newId(), name, createdAt: now })),
    )
  } catch {
    // 既に別の呼び出しでシード済みなら無視してよい(StrictModeの二重effect実行など)
  }
}

export type CategoryMutationError = 'empty' | 'duplicate' | 'protected'

export interface CategoryMutationResult {
  ok: boolean
  error?: CategoryMutationError
}

async function findDuplicate(normalizedName: string, excludeId?: string) {
  const all = await db.customCategories.toArray()
  return all.find(
    (c) => c.id !== excludeId && normalizeCategoryName(c.name) === normalizedName,
  )
}

export async function addCategory(rawName: string): Promise<CategoryMutationResult> {
  const name = normalizeCategoryName(rawName)
  if (!name) return { ok: false, error: 'empty' }
  if (await findDuplicate(name)) return { ok: false, error: 'duplicate' }

  await db.customCategories.add({ id: newId(), name, createdAt: nowIso() })
  return { ok: true }
}

// カテゴリ名を変更する。既にこのカテゴリ名を使っているカスタム記録があれば、
// 一覧が分裂しないよう合わせて改名する(同一項目の履歴として保ち続けるため)。
export async function renameCategory(
  id: string,
  rawName: string,
): Promise<CategoryMutationResult> {
  const target = await db.customCategories.get(id)
  if (!target) return { ok: false, error: 'empty' }
  if (target.name === OTHER_CUSTOM_CATEGORY) return { ok: false, error: 'protected' }

  const name = normalizeCategoryName(rawName)
  if (!name) return { ok: false, error: 'empty' }
  if (await findDuplicate(name, id)) return { ok: false, error: 'duplicate' }

  const oldName = target.name
  await db.transaction('rw', db.customCategories, db.bikeLogRecords, async () => {
    await db.customCategories.update(id, { name })
    if (oldName !== name) {
      await db.bikeLogRecords.where('category').equals(oldName).modify({ category: name })
    }
  })
  return { ok: true }
}

export type DeleteCategoryError = 'protected' | 'in_use'

export interface DeleteCategoryResult {
  ok: boolean
  error?: DeleteCategoryError
}

export async function deleteCategory(id: string): Promise<DeleteCategoryResult> {
  const target = await db.customCategories.get(id)
  if (!target) return { ok: true }
  if (target.name === OTHER_CUSTOM_CATEGORY) return { ok: false, error: 'protected' }

  const inUseCount = await db.bikeLogRecords.where('category').equals(target.name).count()
  if (inUseCount > 0) return { ok: false, error: 'in_use' }

  await db.customCategories.delete(id)
  return { ok: true }
}
