import { formatShortDate } from '../lib/dateUtils'

interface Props {
  remainingKm?: number
  remainingDays?: number
  dueDate?: string
  urgent: boolean
  className?: string
}

// リマインダー関連の「あと◯日/km」「具体的な日付」の表記を、アプリ内どこでも
// 同じ見た目に揃えるための共通コンポーネント。右揃え・等幅数字(tabular-nums)で
// 縦に並べることで、内容の文字数がバラバラでも右端が揃って見やすくなる。
export default function ReminderStat({
  remainingKm,
  remainingDays,
  dueDate,
  urgent,
  className = '',
}: Props) {
  const colorClass = urgent ? 'text-red-600' : 'text-sky-600'
  const lines: string[] = []
  if (remainingKm !== undefined) {
    lines.push(
      remainingKm >= 0
        ? `あと${remainingKm.toLocaleString()}km`
        : `${Math.abs(remainingKm).toLocaleString()}km超過`,
    )
  }
  if (remainingDays !== undefined) {
    lines.push(
      remainingDays >= 0 ? `あと${remainingDays}日` : `${Math.abs(remainingDays)}日超過`,
    )
  }

  if (lines.length === 0 && !dueDate) return null

  return (
    <div className={`flex flex-col items-end flex-shrink-0 leading-tight ${className}`}>
      {lines.map((line) => (
        <span key={line} className={`text-sm font-semibold tabular-nums ${colorClass}`}>
          {line}
        </span>
      ))}
      {dueDate && (
        <span className="text-xs text-slate-500 tabular-nums">{formatShortDate(dueDate)}</span>
      )}
    </div>
  )
}
