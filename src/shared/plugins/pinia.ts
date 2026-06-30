import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

let persistToLocalStorage = false

export function setAuthPersistMode(useLocalStorage: boolean) {
  persistToLocalStorage = useLocalStorage
}

const authPersistStorage = {
  getItem(key: string): string | null {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key)
  },
  setItem(key: string, value: string) {
    if (persistToLocalStorage) {
      sessionStorage.removeItem(key)
      localStorage.setItem(key, value)
      return
    }

    localStorage.removeItem(key)
    sessionStorage.setItem(key, value)
  },
}

export const pinia = createPinia()

pinia.use(
  createPersistedState({
    storage: authPersistStorage,
  }),
)
