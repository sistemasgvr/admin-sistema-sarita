import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function parsePositiveIntQuery(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw == null || raw === '') return null
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

/**
 * Abre un recurso cuando la ruta trae `?id=` (u otra key) y limpia el query
 * para no reabrir al cerrar el modal.
 */
export function useOpenIdFromRouteQuery(options: {
  queryKey?: string
  onOpen: (id: number) => void | Promise<void>
  clearAfterOpen?: boolean
}) {
  const route = useRoute()
  const router = useRouter()
  const key = options.queryKey ?? 'id'
  let consuming = false

  async function consume() {
    if (consuming) return
    const id = parsePositiveIntQuery(route.query[key])
    if (id == null) return

    consuming = true
    try {
      await options.onOpen(id)
      if (options.clearAfterOpen === false) return
      if (!(key in route.query)) return
      const nextQuery = { ...route.query }
      delete nextQuery[key]
      await router.replace({ query: nextQuery })
    } finally {
      consuming = false
    }
  }

  onMounted(() => {
    void consume()
  })

  watch(
    () => route.query[key],
    () => {
      void consume()
    },
  )
}
