import { useCallback, useEffect, useState } from 'react'
import { getPermission } from '../lib/notifications'

// ブラウザのサイト設定で通知許可が変更されたとき、対応ブラウザでは
// Permissions APIのchangeイベントで自動的に検知できる(ページ再読み込み不要)。
// 未対応ブラウザ(Safari等)向けにrefresh()も提供する。
export function useNotificationPermission() {
  const [permission, setPermission] = useState(getPermission())

  const refresh = useCallback(() => {
    setPermission(getPermission())
  }, [])

  useEffect(() => {
    if (!('permissions' in navigator)) return
    let cancelled = false

    navigator.permissions
      .query({ name: 'notifications' as PermissionName })
      .then((status) => {
        if (cancelled) return
        const onChange = () => setPermission(getPermission())
        status.addEventListener('change', onChange)
      })
      .catch(() => {
        // Permissions APIがnotificationsに対応していない場合は静かに諦める
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { permission, refresh }
}
