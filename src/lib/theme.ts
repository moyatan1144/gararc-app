export type ThemeMode = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'theme-mode'

export function getStoredThemeMode(): ThemeMode {
  const value = localStorage.getItem(STORAGE_KEY)
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
}

export function setStoredThemeMode(mode: ThemeMode): void {
  localStorage.setItem(STORAGE_KEY, mode)
}

// .darkクラスの付け外しで見た目を切り替える(index.cssのcustom-variant参照)。
export function applyThemeMode(mode: ThemeMode): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = mode === 'dark' || (mode === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.style.colorScheme = mode === 'system' ? 'light dark' : mode
}
