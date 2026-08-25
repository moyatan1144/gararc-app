const ENABLED_KEY = 'bike-app-notify-enabled'
const LAST_NOTIFIED_KEY = 'bike-app-notify-last-date'

export function isNotificationApiSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator
}

export function getPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationApiSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestPermission(): Promise<NotificationPermission> {
  return Notification.requestPermission()
}

export function isNotifyEnabled(): boolean {
  return localStorage.getItem(ENABLED_KEY) === '1'
}

export function setNotifyEnabled(enabled: boolean): void {
  localStorage.setItem(ENABLED_KEY, enabled ? '1' : '0')
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function hasNotifiedToday(): boolean {
  return localStorage.getItem(LAST_NOTIFIED_KEY) === todayKey()
}

function markNotifiedToday(): void {
  localStorage.setItem(LAST_NOTIFIED_KEY, todayKey())
}

// アプリ起動時に呼び出し、要注意リマインダーがあれば端末に通知を出す(1日1回まで)。
// バックグラウンドでの定期チェックはできないため、アプリを開いた時にだけ判定する。
export async function maybeShowReminderNotification(urgentCount: number): Promise<void> {
  if (urgentCount === 0) return
  if (!isNotifyEnabled()) return
  if (getPermission() !== 'granted') return
  if (hasNotifiedToday()) return

  const registration = await navigator.serviceWorker.ready
  await registration.showNotification('バイク管理', {
    body: `要注意のリマインダーが${urgentCount}件あります`,
    tag: 'bike-app-reminder',
  })
  markNotifiedToday()
}
