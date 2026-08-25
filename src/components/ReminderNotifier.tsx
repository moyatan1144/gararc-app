import { useEffect } from 'react'
import { useReminders } from '../hooks/useReminders'
import { maybeShowReminderNotification } from '../lib/notifications'

// UIを持たない常駐コンポーネント。アプリ起動時に要注意リマインダーの件数を判定し、
// 設定が有効かつ通知許可済みなら端末通知を出す。
export default function ReminderNotifier() {
  const { loading, urgentCount } = useReminders()

  useEffect(() => {
    if (loading) return
    maybeShowReminderNotification(urgentCount)
  }, [loading, urgentCount])

  return null
}
