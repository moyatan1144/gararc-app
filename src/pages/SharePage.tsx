import { useParams } from 'react-router-dom'
import { decodeSharePayload } from '../lib/shareLink'

// アプリのナビゲーションを持たない単独ページ。ローカルデータが無い相手でも、
// URLにエンコードされた情報だけで車両の現在仕様を見られるようにする。
// 車検・保険などの期限情報は一切含めない(公開して問題ない情報だけのプロフィールページ)。
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

  const specLine = [data.manufacturer, data.model].filter(Boolean).join(' ')

  return (
    <div className="min-h-dvh flex justify-center bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-b from-sky-600 to-sky-700 text-white px-6 pt-10 pb-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-white/15 flex items-center justify-center text-4xl">
            🏍️
          </div>
          <h1 className="text-2xl font-bold mt-3">{data.name}</h1>
          <div className="text-sm text-sky-100 mt-1">{specLine || '車種未設定'}</div>
        </div>

        <div className="p-4 -mt-5">
          <div className="card grid grid-cols-3 gap-2 text-center divide-x divide-slate-200 dark:divide-slate-800">
            <div>
              <div className="text-xs text-slate-500">走行距離</div>
              <div className="font-semibold">{data.currentOdometer.toLocaleString()}km</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">排気量</div>
              <div className="font-semibold">
                {data.displacementCc ? `${data.displacementCc}cc` : '―'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">年式</div>
              <div className="font-semibold">{data.modelYear ? `${data.modelYear}年` : '―'}</div>
            </div>
          </div>

          <div className="card mt-4">
            <div className="font-medium mb-3">現在のカスタム仕様</div>
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

          <p className="text-xs text-slate-500 text-center mt-4 pb-6">🏍️ バイク管理アプリで作成</p>
        </div>
      </div>
    </div>
  )
}
