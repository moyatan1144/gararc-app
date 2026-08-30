import { useEffect, useState } from 'react'
import {
  applyThemeMode,
  getStoredThemeMode,
  setStoredThemeMode,
  type ThemeMode,
} from '../lib/theme'

export function useThemeMode() {
  const [mode, setMode] = useState<ThemeMode>(getStoredThemeMode)

  function changeMode(next: ThemeMode) {
    setMode(next)
    setStoredThemeMode(next)
    applyThemeMode(next)
  }

  // 「システム」選択時は、OS側のテーマ変更にも追従させる
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    function handleChange() {
      if (getStoredThemeMode() === 'system') applyThemeMode('system')
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return { mode, changeMode }
}
