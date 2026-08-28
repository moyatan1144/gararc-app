import { useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { computeFuelStats, averageKmPerLiter } from '../fuelStats'
import { getCurrentCustomSpecs, buildCustomHistory } from '../customRecords'
import {
  buildLineShareUrl,
  buildVehicleShareUrl,
  buildXShareUrl,
  shareVehicleLink,
} from '../lib/share'
import BackHeader from '../components/BackHeader'

type Tab = 'maintenance' | 'fuel' | 'deadline' | 'custom'
const TABS: Tab[] = ['maintenance', 'fuel', 'deadline', 'custom']

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : 'maintenance'
  const [shareStatus, setShareStatus] = useState<string | null>(null)
  const [showManualShare, setShowManualShare] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  function setTab(next: Tab) {
    setSearchParams({ tab: next }, { replace: true })
  }

  const vehicle = useLiveQuery(() => (id ? db.vehicles.get(id) : undefined), [id])
  const maintenanceRecords = useLiveQuery(
    () =>
      id
        ? db.maintenanceRecords.where('vehicleId').equals(id).reverse().sortBy('date')
        : [],
    [id],
  )
  const fuelRecords = useLiveQuery(
    () => (id ? db.fuelRecords.where('vehicleId').equals(id).toArray() : []),
    [id],
  )
  const deadlines = useLiveQuery(
    () => (id ? db.deadlines.where('vehicleId').equals(id).sortBy('dueDate') : []),
    [id],
  )
  const customRecords = useLiveQuery(
    () => (id ? db.customRecords.where('vehicleId').equals(id).toArray() : []),
    [id],
  )

  if (!vehicle || !id) return <div className="p-4 text-slate-500">読み込み中...</div>

  const fuelStats = fuelRecords ? computeFuelStats(fuelRecords) : []
  const avgKmPerL = averageKmPerLiter(fuelStats)
  const customSpecs = customRecords ? getCurrentCustomSpecs(customRecords) : []
  const shareUrl = buildVehicleShareUrl(vehicle, customSpecs)

  async function handleShare() {
    if (!vehicle) return
    try {
      const result = await shareVehicleLink(vehicle, shareUrl)
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

  return (
    <div className="p-4">
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
          {vehicle.specNotes && (
            <div className="text-sm mt-2 whitespace-pre-wrap">{vehicle.specNotes}</div>
          )}
          <Link
            to={`/vehicles/${id}?tab=custom`}
            className="inline-block text-sky-600 text-sm mt-2"
          >
            → 現在のカスタム仕様を見る
          </Link>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <button onClick={handleShare} className="text-sky-600 text-sm">
              🔗 共有
            </button>
            <a
              href={buildXShareUrl(vehicle, shareUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 text-sm"
            >
              Xでシェア
            </a>
            <a
              href={buildLineShareUrl(shareUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 text-sm"
            >
              LINEでシェア
            </a>
            {shareStatus && <span className="text-xs text-slate-500">{shareStatus}</span>}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            現在のカスタム仕様も含めたページのリンクを共有します
          </p>
          {showManualShare && (
            <div className="mt-2">
              <p className="text-xs text-slate-500 mb-1">
                自動共有・自動コピーがこの環境では使えないため、下のリンクを選択してコピーしてください。
              </p>
              <textarea
                readOnly
                value={shareUrl}
                onFocus={(e) => e.target.select()}
                rows={2}
                className="input w-full text-sm"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 mb-4 text-sm">
        <TabButton active={tab === 'maintenance'} onClick={() => setTab('maintenance')}>
          整備記録
        </TabButton>
        <TabButton active={tab === 'fuel'} onClick={() => setTab('fuel')}>
          給油記録
        </TabButton>
        <TabButton active={tab === 'deadline'} onClick={() => setTab('deadline')}>
          期限
        </TabButton>
        <TabButton active={tab === 'custom'} onClick={() => setTab('custom')}>
          カスタム
        </TabButton>
      </div>

      {tab === 'maintenance' && (
        <Section
          addLabel="+ 整備記録を追加"
          addTo={`/vehicles/${id}/maintenance/new`}
        >
          {maintenanceRecords?.length === 0 && <Empty>まだ整備記録がありません</Empty>}
          <ul className="flex flex-col gap-2">
            {maintenanceRecords?.map((r) => (
              <li key={r.id} className="card">
                <div className="flex justify-between items-start">
                  <span className="font-medium">{r.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">{r.date}</span>
                    <Link
                      to={`/vehicles/${id}/maintenance/${r.id}/edit`}
                      className="text-sky-600 text-sm"
                    >
                      編集
                    </Link>
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  {r.category}
                  {r.brand && ` ・ ${r.brand}`}
                </div>
                <div className="text-sm text-slate-500">
                  {r.odometer.toLocaleString()} km
                  {r.cost !== undefined && ` ・ ¥${r.cost.toLocaleString()}`}
                </div>
                {r.memo && <div className="text-sm mt-1">{r.memo}</div>}
              </li>
            ))}
          </ul>
        </Section>
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
        <Section addLabel="+ 期限を追加" addTo={`/vehicles/${id}/deadline/new`}>
          {deadlines?.length === 0 && <Empty>まだ期限が登録されていません</Empty>}
          <ul className="flex flex-col gap-2">
            {deadlines?.map((d) => (
              <li key={d.id} className="card">
                <div className="flex justify-between items-start">
                  <span className="font-medium">
                    {d.type} ・ {d.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">{d.dueDate}</span>
                    <Link
                      to={`/vehicles/${id}/deadline/${d.id}/edit`}
                      className="text-sky-600 text-sm"
                    >
                      編集
                    </Link>
                  </div>
                </div>
                {d.memo && (
                  <div className="text-sm text-slate-500 mt-1 whitespace-pre-wrap">{d.memo}</div>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {tab === 'custom' && (
        <Section addLabel="+ カスタムを追加" addTo={`/vehicles/${id}/custom/new`}>
          <div className="flex justify-end -mt-1 mb-2">
            <Link to={`/vehicles/${id}/custom/categories`} className="text-sky-600 text-xs">
              カテゴリ管理
            </Link>
          </div>
          {customSpecs.length === 0 && <Empty>まだカスタム記録がありません</Empty>}
          <ul className="flex flex-col gap-2">
            {customSpecs.map((spec) => {
              const isOpen = expandedCategory === spec.category
              const categoryRecords =
                customRecords?.filter((r) => r.category === spec.category) ?? []
              const history = isOpen ? buildCustomHistory(categoryRecords) : []
              return (
                <li key={spec.category} className="card">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{spec.category}</div>
                      <div className="text-sm text-slate-500">
                        {spec.content}
                        {spec.cost !== undefined && ` ・ ¥${spec.cost.toLocaleString()}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        to={`/vehicles/${id}/custom/new?category=${encodeURIComponent(spec.category)}`}
                        className="text-sky-600 text-sm font-medium"
                      >
                        ＋更新
                      </Link>
                      <button
                        type="button"
                        onClick={() => setExpandedCategory(isOpen ? null : spec.category)}
                        className="text-sky-600 text-sm"
                      >
                        {isOpen ? '閉じる' : '履歴'}
                      </button>
                    </div>
                  </div>
                  {isOpen && (
                    <ul className="mt-2 flex flex-col gap-1 border-t border-slate-200 dark:border-slate-800 pt-2">
                      {history.map(({ record, before }) => (
                        <li
                          key={record.id}
                          className="text-sm text-slate-500 flex justify-between items-center gap-2"
                        >
                          <span>
                            {record.date}　{before !== null ? `${before} → ${record.content}` : record.content}
                            {record.cost !== undefined && ` ・ ¥${record.cost.toLocaleString()}`}
                          </span>
                          <Link
                            to={`/vehicles/${id}/custom/${record.id}/edit`}
                            className="text-sky-600 flex-shrink-0"
                          >
                            編集
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
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
