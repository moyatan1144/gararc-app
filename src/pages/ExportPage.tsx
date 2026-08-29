import type { ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { getCurrentBikeLogSpecs } from '../bikeLog'
import BackHeader from '../components/BackHeader'

// PDF生成用の外部ライブラリは使わず、ブラウザ標準の印刷機能(window.print)を使う。
// Artifactのプレビュー(サンドボックス化されたiframe)ではファイルの自動ダウンロードが
// できないため、jsPDF等でblob保存する方式は動作しない。印刷ダイアログから
// 「PDFに保存」を選んでもらう方式であれば、通常のブラウザ・ホーム画面に
// 追加したアプリのどちらでも一貫して使える。
export default function ExportPage() {
  const vehicles = useLiveQuery(() => db.vehicles.toArray(), [])
  const bikeLogRecords = useLiveQuery(() => db.bikeLogRecords.toArray(), [])

  if (!vehicles || !bikeLogRecords) {
    return <div className="p-4 text-slate-500">読み込み中...</div>
  }

  return (
    <div className="p-4 print:p-6">
      <div className="print:hidden">
        <BackHeader title="車両情報を出力" to="/settings" />
        <button onClick={() => window.print()} className="btn-primary w-full mt-2">
          🖨️ PDFとして出力
        </button>
        <p className="text-xs text-slate-500 mt-2 mb-4">
          印刷ダイアログが開いたら、送信先(プリンター)を「PDFに保存」に変更して保存してください。
        </p>
      </div>

      {vehicles.length === 0 && (
        <div className="text-center text-slate-500 text-sm py-8">車両が登録されていません</div>
      )}

      <div className="flex flex-col gap-8 print:gap-0">
        {vehicles.map((vehicle) => {
          const records = bikeLogRecords.filter((r) => r.vehicleId === vehicle.id)
          const specs = getCurrentBikeLogSpecs(records)

          return (
            <section key={vehicle.id} className="break-after-page">
              <h2 className="text-lg font-bold border-b-2 border-slate-800 pb-1 mb-2">
                {vehicle.name}
              </h2>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm mb-4">
                <InfoRow label="メーカー・車種">
                  {[vehicle.manufacturer, vehicle.model].filter(Boolean).join(' ') || '未設定'}
                </InfoRow>
                {vehicle.displacementCc !== undefined && (
                  <InfoRow label="排気量">{vehicle.displacementCc}cc</InfoRow>
                )}
                {vehicle.modelYear !== undefined && (
                  <InfoRow label="年式">{vehicle.modelYear}年</InfoRow>
                )}
                {vehicle.plateNumber && <InfoRow label="ナンバー">{vehicle.plateNumber}</InfoRow>}
                <InfoRow label="走行距離">{vehicle.currentOdometer.toLocaleString()} km</InfoRow>
                {vehicle.purchaseOdometer !== undefined && (
                  <InfoRow label="購入時走行距離">
                    {vehicle.purchaseOdometer.toLocaleString()} km
                  </InfoRow>
                )}
              </dl>

              {vehicle.specNotes && (
                <div className="text-sm mb-4">
                  <div className="font-medium mb-1">メモ</div>
                  <div className="whitespace-pre-wrap text-slate-700">{vehicle.specNotes}</div>
                </div>
              )}

              <div className="text-sm">
                <div className="font-medium mb-1">バイクログ</div>
                {specs.length === 0 ? (
                  <div className="text-slate-500">記録なし</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-400">
                        <th className="py-1 pr-2">カテゴリ</th>
                        <th className="py-1 pr-2">内容</th>
                        <th className="py-1 pr-2">日付</th>
                        <th className="py-1 pr-2">費用</th>
                        <th className="py-1">状態</th>
                      </tr>
                    </thead>
                    <tbody>
                      {specs.map((spec) => (
                        <tr key={spec.category} className="border-b border-slate-200">
                          <td className="py-1 pr-2 align-top">{spec.category}</td>
                          <td className="py-1 pr-2 align-top">
                            {spec.content}
                            {spec.latestRecord.brand && ` ・ ${spec.latestRecord.brand}`}
                          </td>
                          <td className="py-1 pr-2 align-top whitespace-nowrap">
                            {spec.latestRecord.date}
                          </td>
                          <td className="py-1 pr-2 align-top whitespace-nowrap">
                            {spec.cost !== undefined ? `¥${spec.cost.toLocaleString()}` : '-'}
                          </td>
                          <td className="py-1 align-top whitespace-nowrap">
                            {spec.isScheduled ? '期限あり' : '期限なし'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-slate-500 whitespace-nowrap">{label}</dt>
      <dd>{children}</dd>
    </>
  )
}
