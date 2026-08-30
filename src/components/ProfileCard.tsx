export interface ProfileCardData {
  name: string
  icon?: string
  manufacturer?: string
  model?: string
  displacementCc?: number
  modelYear?: number
  currentOdometer: number
  specs: { category: string; content: string; cost?: number }[]
}

// 共有用のプロフィールカード。SNS投稿画像として書き出す(html2canvas)場合と、
// 共有ページ(SharePage)としてそのまま表示する場合の両方で使う共通の見た目。
// 画像として書き出した際に見る人の端末のダークモード設定に左右されないよう、
// dark:バリアントは使わず常に同じ配色にする。
export default function ProfileCard({ data }: { data: ProfileCardData }) {
  const specLine = [data.manufacturer, data.model].filter(Boolean).join(' ')

  return (
    <div className="w-full bg-slate-100 text-slate-900">
      <div className="bg-gradient-to-b from-sky-600 to-sky-700 text-white px-6 pt-10 pb-8 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-white/15 flex items-center justify-center text-4xl">
          {data.icon ?? '🏍️'}
        </div>
        <h1 className="text-2xl font-bold mt-3">{data.name}</h1>
        <div className="text-sm text-sky-100 mt-1">{specLine || '車種未設定'}</div>
      </div>

      <div className="p-4 -mt-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm grid grid-cols-3 gap-2 text-center divide-x divide-slate-200">
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

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm mt-4">
          <div className="font-medium mb-3">現在の仕様</div>
          {data.specs.length === 0 ? (
            <div className="text-sm text-slate-500">まだ記録がありません</div>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.specs.map((spec) => (
                <li
                  key={spec.category}
                  className="flex justify-between gap-3 text-sm border-b border-slate-200 pb-2 last:border-0 last:pb-0"
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

        <p className="text-xs text-slate-500 text-center mt-4 pb-2">🏍️ バイク管理アプリで作成</p>
      </div>
    </div>
  )
}
