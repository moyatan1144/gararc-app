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

export function buildSharePageUrl(payload: ShareablePayload): string {
  const encoded = encodeSharePayload(payload)
  return `${location.origin}${location.pathname}#/share/${encoded}`
}
