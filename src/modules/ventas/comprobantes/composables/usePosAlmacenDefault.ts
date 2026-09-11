import { watch, type Ref } from 'vue'
import type { Almacen } from '@/modules/configuracion/almacenes/interfaces/almacen.interface'

function almacenesDeSucursal(
  almacenes: Almacen[],
  idSucursal?: number | null,
): Almacen[] {
  if (idSucursal == null || Number.isNaN(Number(idSucursal))) return almacenes
  const suc = Number(idSucursal)
  return almacenes.filter((almacen) => Number(almacen.id_sucursal) === suc)
}

function resolverAlmacenPorDefecto(
  almacenes: Almacen[],
  idSucursal?: number | null,
): number | '' {
  const candidatos = almacenesDeSucursal(almacenes, idSucursal)
  if (!candidatos.length) return ''

  const principal = candidatos.find((almacen) =>
    almacen.nombre.toLowerCase().includes('principal'),
  )

  return (principal ?? candidatos[0]).id
}

/**
 * Preselecciona el almacén "Principal" (o el único disponible) en el POS.
 * Si hay sucursal actual, solo considera almacenes de esa sucursal y limpia
 * una selección que quede fuera de ella.
 */
export function usePosAlmacenDefault(
  almacenes: Ref<Almacen[] | undefined>,
  idAlmacen: Ref<number | ''>,
  idSucursal?: Ref<number | null | undefined>,
) {
  function aplicarAlmacenPorDefecto() {
    const lista = almacenes.value ?? []
    const suc = idSucursal?.value

    if (idAlmacen.value) {
      const actual = lista.find((a) => a.id === Number(idAlmacen.value))
      const fueraDeLista = !actual
      const fueraDeSucursal =
        actual != null &&
        suc != null &&
        !Number.isNaN(Number(suc)) &&
        Number(actual.id_sucursal) !== Number(suc)
      if (!fueraDeLista && !fueraDeSucursal) return
      idAlmacen.value = ''
    }

    idAlmacen.value = resolverAlmacenPorDefecto(lista, suc)
  }

  watch(
    [almacenes, () => idSucursal?.value],
    () => aplicarAlmacenPorDefecto(),
    { immediate: true },
  )

  return { aplicarAlmacenPorDefecto }
}
