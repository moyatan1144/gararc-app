import type { ChangeEvent } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  decimals?: number
  placeholder?: string
  required?: boolean
  className?: string
}

// 数字と小数点以外を取り除き、小数点以下をdecimals桁までに切り詰める。
// (例: decimals=1で "12.345" と入力/貼り付け -> "12.3")
function sanitize(raw: string, decimals: number): string {
  let cleaned = raw.replace(/[^\d.]/g, '')

  const firstDot = cleaned.indexOf('.')
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replaceAll('.', '')
  }

  if (decimals === 0) {
    const dotIndex = cleaned.indexOf('.')
    return dotIndex === -1 ? cleaned : cleaned.slice(0, dotIndex)
  }

  const [intPart, decPart] = cleaned.split('.')
  return decPart === undefined ? intPart : `${intPart}.${decPart.slice(0, decimals)}`
}

// type="number"はスピンボタンが出る上、小数桁数の制御ができないため、
// type="text"+inputMode="decimal"で桁数を制限しながら数値入力を受け付ける。
export default function DecimalInput({
  value,
  onChange,
  decimals = 0,
  placeholder,
  required,
  className = 'input',
}: Props) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(sanitize(e.target.value, decimals))
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      className={className}
    />
  )
}
