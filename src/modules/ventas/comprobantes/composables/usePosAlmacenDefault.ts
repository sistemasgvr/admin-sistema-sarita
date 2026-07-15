import { watch, type Ref } from 'vue'
import type { Almacen } from '@/modules/configuracion/almacenes/interfaces/almacen.interface'

function resolverAlmacenPorDefecto(almacenes: Almacen[]): number | '' {
  if (!almacenes.length) return ''

  const principal = almacenes.find((almacen) =>
    almacen.nombre.toLowerCase().includes('principal'),
  )

  return (principal ?? almacenes[0]).id
}

/**
 * Preselecciona el almacén "Principal" (o el único disponible) en el POS.
 */
export function usePosAlmacenDefault(
  almacenes: Ref<Almacen[] | undefined>,
  idAlmacen: Ref<number | ''>,
) {
  function aplicarAlmacenPorDefecto() {
    if (idAlmacen.value) return

    idAlmacen.value = resolverAlmacenPorDefecto(almacenes.value ?? [])
  }

  watch(almacenes, () => aplicarAlmacenPorDefecto(), { immediate: true })

  return { aplicarAlmacenPorDefecto }
}
