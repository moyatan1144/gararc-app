import { useEffect } from 'react'
import { requestPermissionOnFirstVisit } from '../lib/notifications'

// UIを持たない常駐コンポーネント。初回起動時にのみ通知許可のポップアップを出す。
export default function NotificationPrompt() {
  useEffect(() => {
    requestPermissionOnFirstVisit()
  }, [])

  return null
}
