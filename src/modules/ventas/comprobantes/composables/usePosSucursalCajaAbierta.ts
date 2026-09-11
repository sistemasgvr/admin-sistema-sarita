import { computed, type Ref } from 'vue'
import { useCajaSesionesQuery } from '@/modules/caja/composables/useCajaQuery'
import type { CajaSesionesListFilters } from '@/modules/caja/interfaces/caja.interface'

/**
 * Sucursal preferida del POS: la de una caja ABIERTA en la fecha de la venta.
 * Si no hay sesión abierta, retorna null y el POS no fuerza filtro de almacén.
 */
export function usePosSucursalCajaAbierta(fecha: Ref<string>) {
  const filtros = computed<CajaSesionesListFilters>(() => {
    const dia = String(fecha.value ?? '').slice(0, 10)
    return {
      fechaDesde: dia || undefined,
      fechaHasta: dia || undefined,
      estadoCaja: 'ABIERTA',
      pagina: 1,
      limite: 50,
    }
  })

  const sesionesQuery = useCajaSesionesQuery(filtros)

  const idSucursal = computed<number | null>(() => {
    const rows = sesionesQuery.data.value?.data ?? []
    const conSucursal = rows.find((s) => s.idSucursal != null)
    return conSucursal?.idSucursal != null ? Number(conSucursal.idSucursal) : null
  })

  return { idSucursal, sesionesQuery }
}
