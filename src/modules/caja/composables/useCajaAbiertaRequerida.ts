import { computed, ref, type Ref } from 'vue'
import { useCajaDiaQuery, useCajaPendienteCierreQuery } from '@/modules/caja/composables/useCajaQuery'
import { formatListDate } from '@/shared/utils/date'
import { toastWarning } from '@/shared/composables/useToast'

function hoyLocal(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Regla operativa: ventas y movimientos requieren caja ABIERTA del día (arqueo Z diario). */
export function useCajaAbiertaRequerida(
  fecha: Ref<string>,
  idSucursal: Ref<number | null | undefined> = ref(null),
) {
  const query = useCajaDiaQuery(fecha, idSucursal)
  const pendienteQuery = useCajaPendienteCierreQuery(idSucursal)

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
  const puedeOperar = computed(() => cajaAbierta.value && !sesionEsPendiente.value)

  function assertCajaAbierta(): boolean {
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
