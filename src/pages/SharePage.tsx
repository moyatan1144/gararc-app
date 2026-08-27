import { useParams } from 'react-router-dom'
import { decodeSharePayload } from '../lib/shareLink'

// アプリのナビゲーションを持たない単独ページ。ローカルデータが無い相手でも、
// URLにエンコードされた情報だけで車両の現在仕様を見られるようにする。
export default function SharePage() {
  const { payload } = useParams<{ payload: string }>()
  const data = payload ? decodeSharePayload(payload) : null

  if (!data) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="text-center text-slate-500 text-sm">
          リンクが無効か、壊れています。
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex justify-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-md">
        <div className="card mb-4">
          <h1 className="text-xl font-bold">🏍️ {data.name}</h1>
          <div className="text-sm text-slate-500 mt-1">
            {[data.manufacturer, data.model].filter(Boolean).join(' ') || '車種未設定'}
            {data.displacementCc ? ` ・ ${data.displacementCc}cc` : ''}
            {data.modelYear ? ` ・ ${data.modelYear}年` : ''}
          </div>
          <div className="text-sm text-slate-500 mt-1">
            走行距離: {data.currentOdometer.toLocaleString()} km
          </div>
        </div>

        <div className="card">
          <div className="font-medium mb-3">現在の仕様</div>
          {data.specs.length === 0 ? (
            <div className="text-sm text-slate-500">カスタム記録はまだありません</div>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.specs.map((spec) => (
                <li
                  key={spec.category}
                  className="flex justify-between gap-3 text-sm border-b border-slate-200 dark:border-slate-800 pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-slate-500 flex-shrink-0">{spec.category}</span>
                  <span className="font-medium text-right">
                    {spec.content}
                    {spec.cost !== undefined && (
                      <span className="block text-xs text-slate-500 font-normal">
                        ¥{spec.cost.toLocaleString()}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-xs text-slate-500 text-center mt-4">バイク管理アプリで作成</p>
      </div>
    </div>
  )
}
