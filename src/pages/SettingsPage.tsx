import { useState } from 'react'
import { db } from '../db'
import { useReminders } from '../hooks/useReminders'
import {
  getPermission,
  isNotificationApiSupported,
  isNotifyEnabled,
  requestPermission,
  setNotifyEnabled,
} from '../lib/notifications'

export default function SettingsPage() {
  const { urgentCount } = useReminders()
  const [enabled, setEnabled] = useState(isNotifyEnabled())
  const [permission, setPermission] = useState(getPermission())
  const supported = isNotificationApiSupported()

  async function handleToggle(next: boolean) {
    if (next && permission !== 'granted') {
      const result = await requestPermission()
      setPermission(result)
      if (result !== 'granted') return
    }
    setEnabled(next)
    setNotifyEnabled(next)
  }

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
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-xl font-bold">設定</h1>

      <div className="card">
        <div className="flex items-center justify-between mb-1">
          <div className="font-medium">リマインダー通知</div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              disabled={!supported}
              onChange={(e) => handleToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:bg-sky-600 transition-colors" />
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
          </label>
        </div>
        <p className="text-sm text-slate-500 mb-2">
          アプリを開いた時に、要注意のリマインダーがあれば端末に通知します（1日1回まで）。
          バックグラウンドで自動チェックすることはできないため、アプリを開いたタイミングでのみ通知されます。
        </p>
        {!supported && (
          <p className="text-sm text-red-600">この端末・ブラウザは通知に対応していません。</p>
        )}
        {supported && permission === 'denied' && (
          <p className="text-sm text-red-600">
            通知がブロックされています。ブラウザの設定からこのサイトの通知を許可してください。
          </p>
        )}
        <p className="text-sm text-slate-500 mt-2">
          現在の要注意リマインダー: <span className="font-semibold">{urgentCount}件</span>
        </p>
      </div>

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
