import { onUnmounted, watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { notificacionesQueryKeys } from '@/modules/notificaciones/constants/notificacionesQueryKeys'
import type { Notificacion } from '@/modules/notificaciones/interfaces/notificacion.interface'
import { toastInfo } from '@/shared/composables/useToast'
import { PermisoBanderas } from '@/shared/constants/permissions'

const EVENTO_NUEVA = 'notificacion.nueva'
const EVENTO_SINCRONIZAR = 'notificaciones.sincronizar'

let sharedSocket: Socket | null = null

function socketBaseUrl() {
  const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
  return base.replace(/\/$/, '')
}

export function useNotificacionesSocket() {
  const authStore = useAuthStore()
  const queryClient = useQueryClient()

  function disconnect() {
    if (sharedSocket) {
      sharedSocket.removeAllListeners()
      sharedSocket.disconnect()
      sharedSocket = null
    }
  }

  function refreshQueries() {
    void queryClient.invalidateQueries({ queryKey: notificacionesQueryKeys.all })
  }

  function connect() {
    if (!authStore.token || !authStore.hasPermission(PermisoBanderas.NOTIFICACIONES_LISTAR)) {
      disconnect()
      return
    }

    if (sharedSocket?.connected) return

    disconnect()

    sharedSocket = io(`${socketBaseUrl()}/notificaciones`, {
      transports: ['websocket', 'polling'],
      auth: { token: authStore.token },
      autoConnect: true,
      reconnection: true,
    })

    // En tiempo real (usuario online cuando se crea)
    sharedSocket.on(EVENTO_NUEVA, (payload: Notificacion) => {
      refreshQueries()
      if (payload?.titulo) {
        toastInfo(payload.titulo)
      }
    })

    // Catch-up: pendientes creadas mientras estaba offline / sin socket
    sharedSocket.on(
      EVENTO_SINCRONIZAR,
      (payload: { totalNoLeidas?: number; items?: Notificacion[] }) => {
        refreshQueries()
        const total = Number(payload?.totalNoLeidas ?? 0)
        if (total <= 0) return

        if (total === 1) {
          const unica = payload.items?.[0]
          toastInfo(unica?.titulo || 'Tienes 1 notificación sin leer')
          return
        }

        toastInfo(`Tienes ${total} notificaciones sin leer`)
      },
    )

    sharedSocket.on('connect', () => {
      // Al reconectar, el server ya emite sincronizar; reforzamos refresh local
      refreshQueries()
    })
  }

  watch(
    () => [authStore.token, authStore.isAuthenticated] as const,
    ([token, isAuth]) => {
      if (token && isAuth) connect()
      else disconnect()
    },
    { immediate: true },
  )

  onUnmounted(() => {
    // Socket compartido por sesión; no desconectar al desmontar el menú.
  })

  return { connect, disconnect }
}
