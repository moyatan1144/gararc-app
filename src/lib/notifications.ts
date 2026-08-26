const ENABLED_KEY = 'bike-app-notify-enabled'
const LAST_NOTIFIED_KEY = 'bike-app-notify-last-date'
const ASKED_KEY = 'bike-app-notify-asked'

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

export function isInIframe(): boolean {
  try {
    return window.self !== window.top
  } catch {
    return true
  }
}

// ブラウザ設定で一度ブロックされた通知は、JSからは再度許可を求められない
// (ユーザー自身がブラウザ側で操作するしかない)。せめて迷わないよう、
// 環境ごとにできるだけ具体的な手順を案内する。
export function getPermissionHelpText(): string {
  const ua = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/.test(ua)
  const isAndroid = /Android/.test(ua)
  const isFirefox = /Firefox/.test(ua)
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua)

  if (isIOS && isSafari) {
    return '「設定」アプリ →「Safari」→「Webサイトの設定」→「通知」から、このサイトを「許可」に変更してください。'
  }
  if (isAndroid) {
    return 'アドレスバー右上の「⋮」→「設定」→「サイトの設定」→「通知」から、このサイトを「許可」に変更してください。'
  }
  if (isSafari) {
    return 'Safariメニュー →「設定」→「Webサイト」→「通知」から、このサイトを「許可」に変更してください。'
  }
  if (isFirefox) {
    return 'アドレスバー左の鍵アイコンをクリックし、通知の権限を「許可」に変更してください。'
  }
  return 'アドレスバー左のアイコン（鍵や「i」マークなど）をクリック →「サイトの設定」→「通知」を「許可」に変更してください。'
}

// 初回起動時に一度だけ通知許可のポップアップを出すためのフラグ。
// 誤って「ブロック」を押されても、二度目以降は聞き直さない(ブラウザ側で聞けなくなるため)。
export function hasAskedForPermission(): boolean {
  return localStorage.getItem(ASKED_KEY) === '1'
}

function markAskedForPermission(): void {
  localStorage.setItem(ASKED_KEY, '1')
}

export async function requestPermissionOnFirstVisit(): Promise<void> {
  if (isInIframe()) return
  if (!isNotificationApiSupported()) return
  if (hasAskedForPermission()) return
  if (Notification.permission !== 'default') return

  markAskedForPermission()
  const result = await requestPermission()
  if (result === 'granted') {
    setNotifyEnabled(true)
  }
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
