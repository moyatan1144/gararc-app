// 半角カタカナ -> 全角カタカナの対応表(濁点・半濁点は次の文字と合成する)
const HALFWIDTH_KATAKANA: Record<string, string> = {
  ｱ: 'ア', ｲ: 'イ', ｳ: 'ウ', ｴ: 'エ', ｵ: 'オ',
  ｶ: 'カ', ｷ: 'キ', ｸ: 'ク', ｹ: 'ケ', ｺ: 'コ',
  ｻ: 'サ', ｼ: 'シ', ｽ: 'ス', ｾ: 'セ', ｿ: 'ソ',
  ﾀ: 'タ', ﾁ: 'チ', ﾂ: 'ツ', ﾃ: 'テ', ﾄ: 'ト',
  ﾅ: 'ナ', ﾆ: 'ニ', ﾇ: 'ヌ', ﾈ: 'ネ', ﾉ: 'ノ',
  ﾊ: 'ハ', ﾋ: 'ヒ', ﾌ: 'フ', ﾍ: 'ヘ', ﾎ: 'ホ',
  ﾏ: 'マ', ﾐ: 'ミ', ﾑ: 'ム', ﾒ: 'メ', ﾓ: 'モ',
  ﾔ: 'ヤ', ﾕ: 'ユ', ﾖ: 'ヨ',
  ﾗ: 'ラ', ﾘ: 'リ', ﾙ: 'ル', ﾚ: 'レ', ﾛ: 'ロ',
  ﾜ: 'ワ', ｦ: 'ヲ', ﾝ: 'ン',
  ｧ: 'ァ', ｨ: 'ィ', ｩ: 'ゥ', ｪ: 'ェ', ｫ: 'ォ',
  ｬ: 'ャ', ｭ: 'ュ', ｮ: 'ョ', ｯ: 'ッ',
  ｰ: 'ー', '｡': '。', '｢': '「', '｣': '」', '､': '、', '･': '・',
}

const HALFWIDTH_KATAKANA_DAKUTEN: Record<string, string> = {
  ｶ: 'ガ', ｷ: 'ギ', ｸ: 'グ', ｹ: 'ゲ', ｺ: 'ゴ',
  ｻ: 'ザ', ｼ: 'ジ', ｽ: 'ズ', ｾ: 'ゼ', ｿ: 'ゾ',
  ﾀ: 'ダ', ﾁ: 'ヂ', ﾂ: 'ヅ', ﾃ: 'デ', ﾄ: 'ド',
  ﾊ: 'バ', ﾋ: 'ビ', ﾌ: 'ブ', ﾍ: 'ベ', ﾎ: 'ボ',
  ｳ: 'ヴ',
}

const HALFWIDTH_KATAKANA_HANDAKUTEN: Record<string, string> = {
  ﾊ: 'パ', ﾋ: 'ピ', ﾌ: 'プ', ﾍ: 'ペ', ﾎ: 'ポ',
}

function halfWidthKatakanaToFullWidth(input: string): string {
  let result = ''
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    const next = input[i + 1]
    if (next === 'ﾞ' && HALFWIDTH_KATAKANA_DAKUTEN[ch]) {
      result += HALFWIDTH_KATAKANA_DAKUTEN[ch]
      i++
    } else if (next === 'ﾟ' && HALFWIDTH_KATAKANA_HANDAKUTEN[ch]) {
      result += HALFWIDTH_KATAKANA_HANDAKUTEN[ch]
      i++
    } else if (HALFWIDTH_KATAKANA[ch]) {
      result += HALFWIDTH_KATAKANA[ch]
    } else {
      result += ch
    }
  }
  return result
}

// 半角英数記号(! ~ ~)を全角に変換する
function halfWidthAsciiToFullWidth(input: string): string {
  return input.replace(/[\x21-\x7E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0xfee0))
}

// カテゴリ名の重複防止用に正規化する: 半角→全角統一、半角/全角スペースは完全に除去する。
export function normalizeCategoryName(input: string): string {
  let s = input
  s = halfWidthKatakanaToFullWidth(s)
  s = halfWidthAsciiToFullWidth(s)
  s = s.replace(/[\s　]/g, '')
  return s
}
