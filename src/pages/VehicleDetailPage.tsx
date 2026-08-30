import { useRef, useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { computeFuelStats, averageKmPerLiter } from '../fuelStats'
import {
  getCurrentBikeLogSpecs,
  buildBikeLogHistory,
  computeBikeLogReminders,
  type CurrentBikeLogSpec,
} from '../bikeLog'
import { computeDeadlineReminders, formatDeadlineTitle, isUrgent } from '../reminders'
import { CUSTOM_TAGS } from '../types'
import { buildLineShareUrl, buildShareText, buildXShareUrl, shareVehicleText } from '../lib/share'
import { renderNodeToImageFile, shareImageFile } from '../lib/shareImage'
import BackHeader from '../components/BackHeader'
import ProfileCard from '../components/ProfileCard'
import ReminderStat from '../components/ReminderStat'

type Tab = 'bikelog' | 'fuel' | 'deadline'
const TABS: Tab[] = ['bikelog', 'fuel', 'deadline']

type FilterChip = 'scheduled' | 'unscheduled' | `tag:${string}`

const FILTER_CHIPS: { key: FilterChip; label: string }[] = [
  { key: 'scheduled', label: '期限あり' },
  { key: 'unscheduled', label: '期限なし' },
  ...CUSTOM_TAGS.map((tag) => ({ key: `tag:${tag}` as FilterChip, label: `#${tag}` })),
]

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : 'bikelog'
  const [activeFilters, setActiveFilters] = useState<Set<FilterChip>>(new Set())
  const [shareStatus, setShareStatus] = useState<string | null>(null)
  const [showManualShare, setShowManualShare] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [imageBusy, setImageBusy] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [imageCopied, setImageCopied] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  function setTab(next: Tab) {
    setSearchParams({ tab: next }, { replace: true })
  }

  function toggleFilter(chip: FilterChip) {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(chip)) {
        next.delete(chip)
      } else {
        next.add(chip)
      }
      return next
    })
  }

  const vehicle = useLiveQuery(() => (id ? db.vehicles.get(id) : undefined), [id])
  const bikeLogRecords = useLiveQuery(
    () => (id ? db.bikeLogRecords.where('vehicleId').equals(id).toArray() : []),
    [id],
  )
  const fuelRecords = useLiveQuery(
    () => (id ? db.fuelRecords.where('vehicleId').equals(id).toArray() : []),
    [id],
  )
  const deadlines = useLiveQuery(
    () => (id ? db.deadlines.where('vehicleId').equals(id).toArray() : []),
    [id],
  )

  if (!vehicle || !id) return <div className="p-4 text-slate-500">読み込み中...</div>

  const fuelStats = fuelRecords ? computeFuelStats(fuelRecords) : []
  const avgKmPerL = averageKmPerLiter(fuelStats)

  const sortedDeadlines = [...(deadlines ?? [])].sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
  const deadlineReminderById = new Map(
    computeDeadlineReminders(deadlines ?? []).map((r) => [r.deadline.id, r]),
  )

  const bikeLogSpecs = bikeLogRecords ? getCurrentBikeLogSpecs(bikeLogRecords) : []
  const reminderByCategory = new Map(
    computeBikeLogReminders(vehicle, bikeLogRecords ?? []).map((r) => [r.category, r]),
  )

  function matchesFilters(spec: CurrentBikeLogSpec): boolean {
    if (activeFilters.size === 0) return true
    return [...activeFilters].every((chip) => {
      if (chip === 'scheduled') return spec.isScheduled
      if (chip === 'unscheduled') return !spec.isScheduled
      const tag = chip.slice(4)
      return (spec.latestRecord.tags ?? []).includes(tag)
    })
  }

  const filteredSpecs = bikeLogSpecs.filter(matchesFilters)

  const shareText = buildShareText(vehicle, bikeLogSpecs)

  async function handleShareText() {
    if (!vehicle) return
    try {
      const result = await shareVehicleText(vehicle, shareText)
      if (result === 'copied') {
        setShareStatus('コピーしました')
        setShowManualShare(false)
      } else if (result === 'manual') {
        setShowManualShare(true)
      } else {
        setShareStatus(null)
        setShowManualShare(false)
      }
    } catch (err) {
      // 共有シートのキャンセルは正常操作なので無視する
      if (err instanceof Error && err.name === 'AbortError') return
      // 自動共有・自動コピーができない環境向けに、手動コピーの手段を出す
      setShowManualShare(true)
    }
  }

  // 画像として書き出して共有する。文字数制限を気にせず仕様一覧をまとめて送れる。
  // ファイル添付の共有(Web Share API)が使えない場合はクリップボードへのコピーを試み、
  // それも使えない場合は画像をその場に表示して手動で保存・共有してもらう。
  // 画像の生成自体に失敗した場合はテキスト共有にフォールバックする。
  async function handleShareImage() {
    if (!vehicle || !cardRef.current) return
    setImageBusy(true)
    try {
      const file = await renderNodeToImageFile(cardRef.current, `${vehicle.name}.png`)
      const result = await shareImageFile(file, {
        title: `${vehicle.name}の仕様`,
        text: `🏍️ ${vehicle.name}の現在の仕様`,
      })
      if (result === 'copied' || result === 'preview') {
        setImageCopied(result === 'copied')
        setPreviewImageUrl(URL.createObjectURL(file))
      }
    } catch {
      await handleShareText()
    } finally {
      setImageBusy(false)
    }
  }

  function renderBikeLogRow(spec: CurrentBikeLogSpec) {
    const isOpen = expandedCategory === spec.category
    const categoryRecords = bikeLogRecords?.filter((r) => r.category === spec.category) ?? []
    const history = isOpen ? buildBikeLogHistory(categoryRecords) : []
    const reminder = reminderByCategory.get(spec.category)
    const urgent = reminder ? isUrgent(reminder) : false

    return (
      <li
        key={spec.category}
        className={`card-compact ${urgent ? 'border-red-300 dark:border-red-800' : ''}`}
      >
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{spec.category}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {spec.isScheduled && (
                <span className="text-xs" title="期限あり">
                  🔔
                </span>
              )}
              {(spec.latestRecord.tags ?? []).map((tag) => (
                <span
                  key={tag}
                  title={`#${tag}`}
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] leading-none text-slate-600 dark:text-slate-300 font-medium"
                >
                  {tag[0]}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div className="text-sm text-slate-500 min-w-0">
              {spec.content}
              {spec.latestRecord.brand && ` ・ ${spec.latestRecord.brand}`}
              {spec.cost !== undefined && ` ・ ¥${spec.cost.toLocaleString()}`}
            </div>
            {reminder && (
              <ReminderStat
                remainingKm={reminder.remainingKm}
                remainingDays={reminder.remainingDays}
                dueDate={reminder.nextDueDate}
                urgent={urgent}
              />
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <Link
            to={`/vehicles/${id}/bikelog/new?category=${encodeURIComponent(spec.category)}`}
            className="text-sky-600 text-sm font-medium"
          >
            ＋更新
          </Link>
          <Link
            to={`/vehicles/${id}/bikelog/${spec.latestRecord.id}/edit`}
            className="text-sky-600 text-sm"
          >
            編集
          </Link>
          <button
            type="button"
            onClick={() => setExpandedCategory(isOpen ? null : spec.category)}
            className="text-sky-600 text-sm"
          >
            {isOpen ? '閉じる' : '履歴'}
          </button>
        </div>
        {isOpen && (
          <ul className="mt-2 flex flex-col gap-1 border-t border-slate-200 dark:border-slate-800 pt-2">
            {history.map((record) => (
              <li key={record.id} className="text-sm text-slate-500">
                {record.date}
                {'　'}
                {record.content}
                {record.cost !== undefined && ` ・ ¥${record.cost.toLocaleString()}`}
              </li>
            ))}
          </ul>
        )}
      </li>
    )
  }

  const profileCardData = {
    name: vehicle.name,
    manufacturer: vehicle.manufacturer,
    model: vehicle.model,
    displacementCc: vehicle.displacementCc,
    modelYear: vehicle.modelYear,
    currentOdometer: vehicle.currentOdometer,
    specs: bikeLogSpecs.map((s) => ({ category: s.category, content: s.content, cost: s.cost })),
  }

  return (
    <div className="p-4">
      {/* 画像共有用に画面外でレンダリングしておき、html2canvasで書き出す */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '480px' }} aria-hidden="true">
        <div ref={cardRef}>
          <ProfileCard data={profileCardData} />
        </div>
      </div>

      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <img
            src={previewImageUrl}
            alt="共有用画像"
            className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="text-white text-sm text-center mt-4">
            {imageCopied
              ? '画像をコピーしました。LINEやXの投稿欄に貼り付けて共有できます（保存する場合は長押ししてください）'
              : '画像を長押し（またはドラッグ）して保存し、共有してください'}
          </p>
          <button
            type="button"
            onClick={() => setPreviewImageUrl(null)}
            className="btn-secondary bg-white px-6 mt-4"
          >
            閉じる
          </button>
        </div>
      )}

      <BackHeader title={vehicle.name} to="/" />

      <div className="card mb-4 flex gap-3">
        {vehicle.photoDataUrl && (
          <img
            src={vehicle.photoDataUrl}
            alt=""
            className="w-20 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-800 flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="text-sm text-slate-500">
              {[vehicle.manufacturer, vehicle.model].filter(Boolean).join(' ') || '車種未設定'}
              {vehicle.displacementCc ? ` ・ ${vehicle.displacementCc}cc` : ''}
              {vehicle.modelYear ? ` ・ ${vehicle.modelYear}年` : ''}
            </div>
            <Link to={`/vehicles/${id}/edit`} className="text-sky-600 text-sm flex-shrink-0">
              編集
            </Link>
          </div>
          <div className="text-sm text-slate-500 mt-1">
            走行距離: {vehicle.currentOdometer.toLocaleString()} km
            {vehicle.purchaseOdometer !== undefined &&
              `（購入時 ${vehicle.purchaseOdometer.toLocaleString()} km）`}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <button
              onClick={handleShareImage}
              disabled={imageBusy}
              className="text-sky-600 text-sm disabled:opacity-50"
            >
              {imageBusy ? '画像を生成中...' : '📷 画像で共有'}
            </button>
            <a
              href={buildXShareUrl(shareText)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 text-sm"
            >
              Xでシェア
            </a>
            <a
              href={buildLineShareUrl(shareText)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 text-sm"
            >
              LINEでシェア
            </a>
            {shareStatus && <span className="text-xs text-slate-500">{shareStatus}</span>}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            現在の仕様をまとめた画像を共有します（Xでシェア・LINEでシェアはテキストで共有します）
          </p>
          {showManualShare && (
            <div className="mt-2">
              <p className="text-xs text-slate-500 mb-1">
                自動共有・自動コピーがこの環境では使えないため、下のテキストを選択してコピーしてください。
              </p>
              <textarea
                readOnly
                value={shareText}
                onFocus={(e) => e.target.select()}
                rows={6}
                className="input w-full text-sm"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 mb-4 text-sm">
        <TabButton active={tab === 'bikelog'} onClick={() => setTab('bikelog')}>
          バイクログ
        </TabButton>
        <TabButton active={tab === 'fuel'} onClick={() => setTab('fuel')}>
          給油記録
        </TabButton>
        <TabButton active={tab === 'deadline'} onClick={() => setTab('deadline')}>
          期限
        </TabButton>
      </div>

      {tab === 'bikelog' && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <Link to={`/vehicles/${id}/bikelog/new`} className="text-sky-600 text-sm font-medium">
              + バイクログに追加
            </Link>
            <Link to={`/vehicles/${id}/bikelog/categories`} className="text-sky-600 text-xs">
              カテゴリ管理
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {FILTER_CHIPS.map((chip) => {
              const active = activeFilters.has(chip.key)
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => toggleFilter(chip.key)}
                  className={`rounded-full px-3 py-1 text-xs border ${
                    active
                      ? 'bg-sky-600 border-sky-600 text-white font-medium'
                      : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>

          {bikeLogSpecs.length === 0 && <Empty>まだバイクログの記録がありません</Empty>}
          {bikeLogSpecs.length > 0 && filteredSpecs.length === 0 && (
            <Empty>条件に一致する記録がありません</Empty>
          )}
          <ul className="flex flex-col gap-2">{filteredSpecs.map((spec) => renderBikeLogRow(spec))}</ul>
        </div>
      )}

      {tab === 'fuel' && (
        <Section addLabel="+ 給油記録を追加" addTo={`/vehicles/${id}/fuel/new`}>
          {avgKmPerL !== undefined && (
            <div className="card mb-2 text-sm">
              平均燃費: <span className="font-semibold">{avgKmPerL.toFixed(2)} km/L</span>
            </div>
          )}
          {fuelStats.length > 0 && avgKmPerL === undefined && (
            <div className="card mb-2 text-sm text-slate-500">
              燃費を計算するには、満タン給油の記録があと1回以上必要です。
            </div>
          )}
          {fuelStats.length === 0 && <Empty>まだ給油記録がありません</Empty>}
          <ul className="flex flex-col gap-2">
            {fuelStats.map(({ record, kmPerLiter }) => (
              <li key={record.id} className="card">
                <div className="flex justify-between items-start">
                  <span className="font-medium">
                    {record.liters.toFixed(1)} L ・ ¥
                    {Math.round(record.liters * record.pricePerLiter).toLocaleString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">{record.date}</span>
                    <Link
                      to={`/vehicles/${id}/fuel/${record.id}/edit`}
                      className="text-sky-600 text-sm"
                    >
                      編集
                    </Link>
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  {record.meterType === 'trip'
                    ? `トリップ ${record.tripDistance?.toLocaleString()} km（総走行 ${record.odometer.toLocaleString()} km）`
                    : `${record.odometer.toLocaleString()} km`}
                  {!record.isFull && ' （満タンでない）'}
                </div>
                {kmPerLiter !== undefined && (
                  <div className="text-sm text-sky-600">{kmPerLiter.toFixed(2)} km/L</div>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {tab === 'deadline' && (
        <Section addLabel="+ 期限を追加" addTo={`/reminders/deadline/new?vehicleId=${id}&from=vehicle`}>
          {sortedDeadlines.length === 0 && <Empty>まだ期限が登録されていません</Empty>}
          <ul className="flex flex-col gap-1.5">
            {sortedDeadlines.map((d) => {
              const reminder = deadlineReminderById.get(d.id)
              const urgent = reminder ? isUrgent(reminder) : false
              return (
                <li key={d.id}>
                  <Link
                    to={`/reminders/deadline/${d.id}/edit?from=vehicle`}
                    className={`block rounded-lg border px-2.5 py-1.5 ${
                      urgent
                        ? 'border-red-300 dark:border-red-800'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {formatDeadlineTitle(d)}
                      </span>
                      <ReminderStat
                        remainingDays={reminder?.remainingDays}
                        dueDate={d.dueDate}
                        urgent={urgent}
                      />
                    </div>
                    {d.memo && (
                      <div className="text-sm text-slate-500 mt-0.5 whitespace-pre-wrap">
                        {d.memo}
                      </div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </Section>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 ${
        active
          ? 'bg-sky-600 text-white font-medium'
          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
      }`}
    >
      {children}
    </button>
  )
}

function Section({
  addLabel,
  addTo,
  children,
}: {
  addLabel: string
  addTo: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="flex justify-end mb-2">
        <Link to={addTo} className="text-sky-600 text-sm font-medium">
          {addLabel}
        </Link>
      </div>
      {children}
    </div>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="text-center text-slate-500 text-sm py-8">{children}</div>
}
