import { ref } from 'vue'

// La clave y los colores de la barra del navegador se repiten en el
// script en línea de index.html.
const STORAGE_KEY = 'bender-theme'
const BROWSER_BAR_COLORS = { dark: '#090913', light: '#fafafd' }
const PREFERENCES = ['light', 'dark', 'system']

const systemLight = window.matchMedia('(prefers-color-scheme: light)')

function readPreference() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return PREFERENCES.includes(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

export const themePreference = ref(readPreference())

function resolvedTheme() {
  if (themePreference.value !== 'system') return themePreference.value
  return systemLight.matches ? 'light' : 'dark'
}

function applyTheme() {
  const root = document.documentElement
  const theme = resolvedTheme()
  if (root.dataset.theme === theme) return

  // Sin transiciones durante el cambio: cada elemento con `transition`
  // cambiaría de color a su ritmo. Leer un estilo obliga a aplicar el
  // tema nuevo antes de volver a activarlas.
  root.setAttribute('data-theme-switching', '')
  root.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BROWSER_BAR_COLORS[theme])
  void getComputedStyle(root).color
  requestAnimationFrame(() => root.removeAttribute('data-theme-switching'))
}

export function setThemePreference(preference) {
  themePreference.value = preference
  try {
    localStorage.setItem(STORAGE_KEY, preference)
  } catch {}
  applyTheme()
}

export function initTheme() {
  applyTheme()
  systemLight.addEventListener('change', () => {
    if (themePreference.value === 'system') applyTheme()
  })
}
