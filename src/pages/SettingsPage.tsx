import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../db'
import { useReminders } from '../hooks/useReminders'
import { useNotificationPermission } from '../hooks/useNotificationPermission'
import { useThemeMode } from '../hooks/useThemeMode'
import type { ThemeMode } from '../lib/theme'
import {
  getPermissionHelpText,
  isInIframe,
  isNotificationApiSupported,
  isNotifyEnabled,
  requestPermission,
  setNotifyEnabled,
} from '../lib/notifications'

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: 'システム' },
  { mode: 'light', label: 'ライト' },
  { mode: 'dark', label: 'ダーク' },
]

export default function SettingsPage() {
  const { urgentCount } = useReminders()
  const [enabled, setEnabled] = useState(isNotifyEnabled())
  const { permission, refresh } = useNotificationPermission()
  const supported = isNotificationApiSupported()
  const inIframe = isInIframe()
  const { mode: themeMode, changeMode: changeThemeMode } = useThemeMode()

  async function handleToggle(next: boolean) {
    if (next && permission !== 'granted') {
      const result = await requestPermission()
      refresh()
      if (result === 'granted') {
        setEnabled(true)
        setNotifyEnabled(true)
      }
      return
    }
    setEnabled(next)
    setNotifyEnabled(next)
  }

  const importInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  async function handleExport() {
    const data = {
      vehicles: await db.vehicles.toArray(),
      bikeLogRecords: await db.bikeLogRecords.toArray(),
      fuelRecords: await db.fuelRecords.toArray(),
      deadlines: await db.deadlines.toArray(),
      customCategories: await db.customCategories.toArray(),
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

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    let data: {
      vehicles?: unknown[]
      bikeLogRecords?: unknown[]
      fuelRecords?: unknown[]
      deadlines?: unknown[]
      customCategories?: unknown[]
    }
    try {
      data = JSON.parse(await file.text())
    } catch {
      alert('ファイルの読み込みに失敗しました。正しいバックアップファイル(JSON)を選択してください。')
      return
    }
    if (!Array.isArray(data.vehicles)) {
      alert('バックアップファイルの形式が正しくありません。')
      return
    }
    if (
      !confirm(
        '現在この端末に保存されているデータはすべて削除され、バックアップの内容で置き換えられます。よろしいですか？',
      )
    ) {
      return
    }

    setImporting(true)
    try {
      await db.transaction(
        'rw',
        [db.vehicles, db.bikeLogRecords, db.fuelRecords, db.deadlines, db.customCategories],
        async () => {
          await Promise.all([
            db.vehicles.clear(),
            db.bikeLogRecords.clear(),
            db.fuelRecords.clear(),
            db.deadlines.clear(),
            db.customCategories.clear(),
          ])
          await Promise.all([
            db.vehicles.bulkAdd(data.vehicles as never[]),
            db.bikeLogRecords.bulkAdd((data.bikeLogRecords ?? []) as never[]),
            db.fuelRecords.bulkAdd((data.fuelRecords ?? []) as never[]),
            db.deadlines.bulkAdd((data.deadlines ?? []) as never[]),
            db.customCategories.bulkAdd((data.customCategories ?? []) as never[]),
          ])
        },
      )
      alert('データを復元しました。')
    } catch {
      alert('復元中にエラーが発生しました。ファイルが破損している可能性があります。')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-xl font-bold">設定</h1>

      <div className="card">
        <div className="font-medium mb-1">表示モード</div>
        <p className="text-sm text-slate-500 mb-3">
          画面の明るさを選べます。「システム」は端末の設定に自動で合わせます。
        </p>
        <div className="flex rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 text-xs">
          {THEME_OPTIONS.map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => changeThemeMode(mode)}
              className={`flex-1 py-2 ${
                themeMode === mode
                  ? 'bg-sky-600 text-white font-medium'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="font-medium mb-1">リマインダー通知</div>
        <p className="text-sm text-slate-500 mb-2">
          アプリを開いた時に、要注意のリマインダーがあれば端末に通知します（1日1回まで）。
          バックグラウンドで自動チェックすることはできないため、アプリを開いたタイミングでのみ通知されます。
        </p>

        {!supported && (
          <p className="text-sm text-red-600">この端末・ブラウザは通知に対応していません。</p>
        )}

        {supported && inIframe && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-sm p-3">
            現在プレビュー環境（試用版リンク）で開いているため、通知は許可できません。実際にホスティングしたページや、ホーム画面に追加したアプリとして開くと設定できるようになります。
          </div>
        )}

        {supported && !inIframe && permission === 'denied' && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm p-3 flex flex-col gap-2">
            <div>通知がブロックされています。次の手順で許可に変更してください（変更すると自動で反映されます）。</div>
            <div>{getPermissionHelpText()}</div>
            <button
              type="button"
              onClick={refresh}
              className="self-start rounded-full border border-red-300 dark:border-red-700 px-3 py-1 text-xs font-medium"
            >
              変更したか再確認する
            </button>
          </div>
        )}

        {supported && !inIframe && permission !== 'denied' && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {permission === 'granted' ? '通知は許可されています' : '通知を有効にする'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled && permission === 'granted'}
                onChange={(e) => handleToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:bg-sky-600 transition-colors" />
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </label>
          </div>
        )}

        <p className="text-sm text-slate-500 mt-2">
          現在の要注意リマインダー: <span className="font-semibold">{urgentCount}件</span>
        </p>
      </div>

      <div className="card">
        <div className="font-medium mb-1">車両情報の出力</div>
        <p className="text-sm text-slate-500 mb-3">
          各車両の車両情報と車両ログを一覧にして出力します。印刷ダイアログから「PDFに保存」を選ぶと、PDFとして保存できます。
        </p>
        <Link to="/settings/export" className="btn-secondary w-full block text-center">
          車両情報を出力する
        </Link>
      </div>

      <div className="card">
        <div className="font-medium mb-1">データのバックアップ</div>
        <p className="text-sm text-slate-500 mb-3">
          このアプリのデータは端末内にのみ保存されています。機種変更やブラウザのデータ削除に備えて、定期的にバックアップをエクスポートしてください。
        </p>
        <button onClick={handleExport} className="btn-secondary w-full">
          データをエクスポート (JSON)
        </button>
        <button
          type="button"
          onClick={() => importInputRef.current?.click()}
          disabled={importing}
          className="btn-secondary w-full mt-2"
        >
          {importing ? '復元中...' : 'バックアップから復元 (JSON)'}
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImportFile}
        />
      </div>
    </div>
  )
}
