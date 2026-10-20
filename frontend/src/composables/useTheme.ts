import { ref } from 'vue'

export type ThemeId = 'paper' | 'midnight' | 'neon' | 'ocean'

export interface ThemeOption {
  id: ThemeId
  label: string
  /** Representative colours for the switcher swatch (theme bg + accent). */
  bg: string
  accent: string
}

export const THEMES: ThemeOption[] = [
  { id: 'paper', label: 'Paper', bg: '#f4f2ec', accent: '#e63e1e' },
  { id: 'midnight', label: 'Midnight', bg: '#0c0c0e', accent: '#ff5230' },
  { id: 'neon', label: 'Neon', bg: '#0a0a14', accent: '#8b5cf6' },
  { id: 'ocean', label: 'Ocean', bg: '#e9f1fa', accent: '#0284c7' },
]

const STORAGE_KEY = 'opengiphy-theme'

/**
 * Theme state — a module-level ref mirroring the `data-theme` attribute
 * on <html>. The attribute is set before first paint by the inline
 * script in index.html (saved choice, else OS-scheme default); this
 * composable only reads it as the initial value and writes through on
 * switch, persisting the choice to localStorage.
 */
function initialTheme(): ThemeId {
  const attr = document.documentElement.dataset.theme
  return THEMES.some((t) => t.id === attr) ? (attr as ThemeId) : 'paper'
}

const current = ref<ThemeId>(initialTheme())

export function useTheme() {
  function setTheme(id: ThemeId): void {
    current.value = id
    document.documentElement.dataset.theme = id
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // Storage unavailable (private mode) — the attribute still applies.
    }
  }

  return { themes: THEMES, current, setTheme }
}
