import { useState } from 'react'

interface Props {
  onConfirm: () => void | Promise<void>
  label: string
  confirmMessage: string
}

// window.confirm()はArtifactのプレビュー(iframe)などでブロックされ、
// 押しても何も起きないことがあるため、アプリ内蔵の確認UIに置き換える。
export default function ConfirmDeleteButton({ onConfirm, label, confirmMessage }: Props) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-3 flex flex-col gap-2">
        <p className="text-sm text-red-700 dark:text-red-300">{confirmMessage}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onConfirm()}
            className="flex-1 rounded-lg bg-red-600 text-white text-sm font-medium py-2"
          >
            削除する
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="btn-secondary flex-1 py-2 text-sm"
          >
            キャンセル
          </button>
        </div>
      </div>
    )
  }

  return (
    <button type="button" onClick={() => setConfirming(true)} className="text-red-600 text-sm py-2">
      {label}
    </button>
  )
}
