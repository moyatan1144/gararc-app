// 素のhtml2canvasはTailwind CSS v4が生成するoklch()カラーをパース出来ず
// 例外を投げるため、oklch/lab等のモダンなCSSカラー関数に対応した
// フォーク版のhtml2canvas-proを使う(APIはhtml2canvasと同一)。
import html2canvas from 'html2canvas-pro'

// DOM要素をPNG画像として書き出す。SNS投稿等で文字数制限を気にせず
// 車両情報をまとめて共有できるようにするため、テキストではなく画像にする。
// (Claude Artifactは単一HTMLファイルとして配信されるため動的import()が使えず、
// html2canvas-proは静的importでバンドルに含めている)
export async function renderNodeToImageFile(node: HTMLElement, filename: string): Promise<File> {
  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: '#f1f5f9',
    useCORS: true,
  })
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('画像の生成に失敗しました'))), 'image/png')
  })
  return new File([blob], filename, { type: 'image/png' })
}

export type ImageShareResult = 'shared' | 'preview'

// Web Share API(ファイル添付)が使えればネイティブの共有シートを開く。
// 使えない・失敗した場合は呼び出し側でプレビュー表示し、手動保存してもらう。
export async function shareImageFile(
  file: File,
  opts: { title: string; text: string },
): Promise<ImageShareResult> {
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: opts.title, text: opts.text })
      return 'shared'
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'shared'
      return 'preview'
    }
  }
  return 'preview'
}
