import { computed, readonly, ref } from 'vue'

/**
 * Estado de conexión compartido por toda la app.
 *
 * - `sinInternet`: el navegador dice que no hay red (`navigator.onLine`).
 * - `servidorInaccesible`: hay red, pero la última petición a la API no obtuvo
 *   respuesta (servidor caído, VPN, DNS). Lo marca `apiClient` y se limpia con
 *   la siguiente respuesta exitosa.
 *
 * En mostrador se confundía «se cayó SUNAT», «se cayó el sistema» y «se cayó el
 * internet»: la franja de `AppConexionBanner` deja claro cuál es.
 */
const sinInternet = ref(typeof navigator !== 'undefined' ? navigator.onLine === false : false)
const servidorInaccesible = ref(false)

let escuchando = false
function escucharNavegador() {
  if (escuchando || typeof window === 'undefined') return
  escuchando = true
  window.addEventListener('online', () => {
    sinInternet.value = false
  })
  window.addEventListener('offline', () => {
    sinInternet.value = true
  })
}

export function marcarServidorInaccesible() {
  servidorInaccesible.value = true
}

export function marcarServidorAccesible() {
  if (servidorInaccesible.value) servidorInaccesible.value = false
}

export function navegadorSinInternet(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

export function useEstadoConexion() {
  escucharNavegador()
  return {
    sinInternet: readonly(sinInternet),
    servidorInaccesible: readonly(servidorInaccesible),
    hayProblema: computed(() => sinInternet.value || servidorInaccesible.value),
  }
}
