import { computed } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { useAuthStore } from '@/modules/auth/stores/auth.store'

const useSeleccionStore = defineStore('empresa-seleccionada', {
  state: () => ({ porUsuario: {} as Record<string, number | undefined> }),
  persist: true,
})

/** Preferencia por usuario. Nunca sustituir una selección por el primer registro. */
export function useEmpresaSeleccionada() {
  const auth = useAuthStore()
  const { porUsuario } = storeToRefs(useSeleccionStore())
  return computed<number | undefined>({
    get: () => porUsuario.value[String(auth.user?.id ?? 'anonimo')],
    set: (id) => { porUsuario.value[String(auth.user?.id ?? 'anonimo')] = id },
  })
}
