// ブラウザにストレージの永続化をリクエストする。許可されると、空き容量逼迫時などに
// ブラウザが自動でデータを消去する対象から外れやすくなる（完全な保証ではない）。
// 対応していない環境や、許可/拒否のいずれであっても失敗しても問題ない処理。
export async function requestPersistentStorage(): Promise<void> {
  if (!navigator.storage?.persist) return
  try {
    const already = await navigator.storage.persisted()
    if (!already) await navigator.storage.persist()
  } catch {
    // 失敗しても致命的ではないため無視する
  }
}
