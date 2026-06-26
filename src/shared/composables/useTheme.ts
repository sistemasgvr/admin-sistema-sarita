import { ref, computed, onMounted, watch, provide, inject } from 'vue'
import type { ComputedRef, Ref } from 'vue'

type Theme = 'light' | 'dark'

interface ThemeContext {
  theme: Ref<Theme>
  isDarkMode: ComputedRef<boolean>
  toggleTheme: () => void
}

const ThemeSymbol = Symbol('theme')

function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function useThemeProvider() {
  const theme = ref<Theme>('light')

  const isDarkMode = computed(() => theme.value === 'dark')

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  onMounted(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null
    theme.value = savedTheme === 'dark' ? 'dark' : 'light'
    applyThemeClass(theme.value)
  })

  watch(theme, (newTheme) => {
    localStorage.setItem('theme', newTheme)
    applyThemeClass(newTheme)
  })

  const context: ThemeContext = { theme, isDarkMode, toggleTheme }
  provide(ThemeSymbol, context)

  return context
}

export function useTheme(): ThemeContext {
  const context = inject<ThemeContext>(ThemeSymbol)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
