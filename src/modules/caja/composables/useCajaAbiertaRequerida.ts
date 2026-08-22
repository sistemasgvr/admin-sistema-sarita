import { computed, ref, toValue, type Ref } from 'vue'
import { useCajaDiaQuery, useCajaPendienteCierreQuery } from '@/modules/caja/composables/useCajaQuery'
import { formatListDate, hoyIsoLima } from '@/shared/utils/date'
import { toastWarning } from '@/shared/composables/useToast'

function hoyLocal(): string {
  return hoyIsoLima()
}

/** Regla operativa: ventas y movimientos requieren caja ABIERTA del día (arqueo Z diario) por sucursal. */
export function useCajaAbiertaRequerida(
  fecha: Ref<string>,
  idSucursal: Ref<number | null | undefined> = ref(null),
) {
  const query = useCajaDiaQuery(fecha, idSucursal)
  const pendienteQuery = useCajaPendienteCierreQuery(idSucursal)

  const sucursalLista = computed(() => {
    const id = toValue(idSucursal)
    return id == null || Number.isNaN(Number(id)) ? null : Number(id)
  })

  const sesion = computed(() => query.data.value)
  const estadoCaja = computed(() => sesion.value?.estadoCaja ?? null)
  const cajaAbierta = computed(
    () => Boolean(sesion.value?.id) && estadoCaja.value === 'ABIERTA',
  )
  const cajaCerrada = computed(
    () => Boolean(sesion.value?.id) && estadoCaja.value === 'CERRADA',
  )

  const pendienteCierre = computed(() => pendienteQuery.data.value?.data?.[0] ?? null)
  const hayPendienteCierre = computed(() => Boolean(pendienteCierre.value))

  const sesionEsPendiente = computed(() => {
    if (!cajaAbierta.value || !sesion.value?.fecha) return false
    return String(sesion.value.fecha).slice(0, 10) < hoyLocal()
  })

  const mensajeBloqueo = computed(() => {
    if (query.isLoading.value || pendienteQuery.isLoading.value) return null
    // Sin sucursal no se puede validar (la caja es por fecha + sucursal).
    if (sucursalLista.value == null) return null

    if (sesionEsPendiente.value) {
      const f = formatListDate(sesion.value?.fecha)
      return `La caja del ${f} quedó abierta de un día anterior. Ciérrala (arqueo) antes de seguir vendiendo; luego abre la de hoy.`
    }

    if (cajaAbierta.value) return null

    if (hayPendienteCierre.value && pendienteCierre.value) {
      const f = formatListDate(pendienteCierre.value.fecha)
      const dias = pendienteCierre.value.diasAbierta ?? 1
      return `Hay una caja sin cerrar del ${f} (${dias} día${dias === 1 ? '' : 's'}). Ciérrala en Ventas → Caja antes de abrir u operar la de hoy.`
    }

    if (cajaCerrada.value) {
      return 'La caja de esta fecha ya está cerrada. No se pueden registrar ventas ni movimientos.'
    }
    return 'Debes abrir la caja del día antes de registrar ventas o movimientos de caja.'
  })

  /** ABIERTA del día consultado y no arrastrada de un día anterior. */
  const puedeOperar = computed(
    () => sucursalLista.value != null && cajaAbierta.value && !sesionEsPendiente.value,
  )

  function assertCajaAbierta(): boolean {
    if (sucursalLista.value == null) {
      toastWarning('Selecciona un almacén para validar la caja de su sucursal')
      return false
    }
    if (query.isLoading.value || pendienteQuery.isLoading.value) {
      toastWarning('Verificando estado de caja...')
      return false
    }
    if (puedeOperar.value) return true
    toastWarning(mensajeBloqueo.value || 'Caja no disponible')
    return false
  }

  return {
    query,
    sesion,
    estadoCaja,
    cajaAbierta,
    cajaCerrada,
    puedeOperar,
    pendienteCierre,
    hayPendienteCierre,
    sesionEsPendiente,
    mensajeBloqueo,
    assertCajaAbierta,
    isLoading: computed(() => query.isLoading.value || pendienteQuery.isLoading.value),
  }
}
