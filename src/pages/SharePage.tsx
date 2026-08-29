import { useParams } from 'react-router-dom'
import { decodeSharePayload } from '../lib/shareLink'
import ProfileCard from '../components/ProfileCard'

// アプリのナビゲーションを持たない単独ページ。ローカルデータが無い相手でも、
// URLにエンコードされた情報だけで車両の現在仕様を見られるようにする。
// 車検・保険などの期限情報は一切含めない(公開して問題ない情報だけのプロフィールページ)。
export default function SharePage() {
  const { payload } = useParams<{ payload: string }>()
  const data = payload ? decodeSharePayload(payload) : null

  if (!data) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4 bg-slate-50 text-slate-900">
        <div className="text-center text-slate-500 text-sm">リンクが無効か、壊れています。</div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex justify-center bg-slate-100">
      <div className="w-full max-w-md">
        <ProfileCard data={data} />
      </div>
    </div>
  )
}
