// 共有ページのURLに埋め込むデータ。サーバーを持たないため、
// 車両の要約情報をURL自体にエンコードして持たせ、リンクを開いた人が
// アプリ本体やローカルデータを持っていなくても閲覧できるようにする。
// 車両のメモ欄(保険情報等を書く可能性がある非公開情報)は絶対に含めないこと。
export interface ShareablePayload {
  name: string
  manufacturer?: string
  model?: string
  displacementCc?: number
  modelYear?: number
  currentOdometer: number
  specs: { category: string; content: string; cost?: number }[]
}

function toBase64Url(input: string): string {
  const base64 = btoa(unescape(encodeURIComponent(input)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(input: string): string {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) base64 += '='
  return decodeURIComponent(escape(atob(base64)))
}

export function encodeSharePayload(payload: ShareablePayload): string {
  return toBase64Url(JSON.stringify(payload))
}

export function decodeSharePayload(encoded: string): ShareablePayload | null {
  try {
    const parsed = JSON.parse(fromBase64Url(encoded))
    if (parsed && typeof parsed === 'object' && typeof parsed.name === 'string') {
      return parsed as ShareablePayload
    }
    return null
  } catch {
    return null
  }
}

// Claude Artifactとして動かしている場合、公開URL(https://claude.ai/code/artifact/...)
// ではなく、サンドボックス化されたiframeの配信用サブドメイン(*.claudeusercontent.com)を
// location.originが指してしまう。そのURLは他人が開いても正しく機能しないため、
// その場合は既知の公開URLに差し替える。Artifactを再公開してもURLは変わらない
// (同じurlを指定して更新しているため)が、もし将来別のURLで公開し直した場合は
// この値も更新すること。
const KNOWN_ARTIFACT_URL = 'https://claude.ai/code/artifact/820a6bb3-84f0-4f94-b7ac-3500075b20dd'

function resolveShareBaseUrl(): string {
  if (location.hostname.endsWith('.claudeusercontent.com')) {
    return KNOWN_ARTIFACT_URL
  }
  return `${location.origin}${location.pathname}`
}

export function buildSharePageUrl(payload: ShareablePayload): string {
  const encoded = encodeSharePayload(payload)
  return `${resolveShareBaseUrl()}#/share/${encoded}`
}
