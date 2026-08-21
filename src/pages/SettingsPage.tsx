import { db } from '../db'

export default function SettingsPage() {
  async function handleExport() {
    const data = {
      vehicles: await db.vehicles.toArray(),
      maintenanceRecords: await db.maintenanceRecords.toArray(),
      fuelRecords: await db.fuelRecords.toArray(),
      deadlines: await db.deadlines.toArray(),
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bike-app-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">設定</h1>
      <div className="card">
        <div className="font-medium mb-1">データのバックアップ</div>
        <p className="text-sm text-slate-500 mb-3">
          このアプリのデータは端末内にのみ保存されています。機種変更やブラウザのデータ削除に備えて、定期的にバックアップをエクスポートしてください。
        </p>
        <button onClick={handleExport} className="btn-secondary w-full">
          データをエクスポート (JSON)
        </button>
      </div>
    </div>
  )
}
