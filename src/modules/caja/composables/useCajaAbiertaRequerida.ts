import { computed, ref, type Ref } from 'vue'
import { useCajaDiaQuery } from '@/modules/caja/composables/useCajaQuery'
import { toastWarning } from '@/shared/composables/useToast'

/** Regla operativa: ventas y movimientos de caja requieren sesión ABIERTA. */
export function useCajaAbiertaRequerida(
  fecha: Ref<string>,
  idSucursal: Ref<number | null | undefined> = ref(null),
) {
  const query = useCajaDiaQuery(fecha, idSucursal)

  const sesion = computed(() => query.data.value)
  const estadoCaja = computed(() => sesion.value?.estadoCaja ?? null)
  const cajaAbierta = computed(
    () => Boolean(sesion.value?.id) && estadoCaja.value === 'ABIERTA',
  )
  const cajaCerrada = computed(
    () => Boolean(sesion.value?.id) && estadoCaja.value === 'CERRADA',
  )

  const mensajeBloqueo = computed(() => {
    if (query.isLoading.value) return null
    if (cajaAbierta.value) return null
    if (cajaCerrada.value) {
      return 'La caja de esta fecha ya está cerrada. No se pueden registrar ventas ni movimientos.'
    }
    return 'Debes abrir la caja del día antes de registrar ventas o movimientos de caja.'
  })

  function assertCajaAbierta(): boolean {
    if (query.isLoading.value) {
      toastWarning('Verificando estado de caja...')
      return false
    }
    if (cajaAbierta.value) return true
    toastWarning(mensajeBloqueo.value || 'Caja no disponible')
    return false
  }

  return {
    query,
    sesion,
    estadoCaja,
    cajaAbierta,
    cajaCerrada,
    mensajeBloqueo,
    assertCajaAbierta,
    isLoading: computed(() => query.isLoading.value),
  }
}
