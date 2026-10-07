import { computed, shallowRef, watch, type Ref } from 'vue'
import type { Balon } from '@/modules/balones/cilindros/interfaces/balon.interface'
import { esBalonEntregable } from '@/modules/balones/cilindros/utils/disponibilidadBalon'

export function useBalonSeleccionado(
  id: Ref<number | ''>,
  resultados: Ref<Balon[]>,
  almacen: Ref<number | null | undefined>,
) {
  const seleccionado = shallowRef<Balon | null>(null)

  // Capturar antes de que cerrar el selector limpie la búsqueda remota.
  watch(
    [id, resultados],
    ([valor, filas]) => {
      seleccionado.value =
        valor === ''
          ? null
          : (filas.find((balon) => Number(balon.id) === Number(valor)) ??
            (Number(seleccionado.value?.id) === Number(valor) ? seleccionado.value : null))
    },
    { flush: 'sync', immediate: true },
  )

  watch(
    almacen,
    () => {
      id.value = ''
      seleccionado.value = null
    },
    { flush: 'sync' },
  )

  return computed(() => {
    const balon = seleccionado.value
    return balon &&
      almacen.value != null &&
      Number(balon.id_almacen) === Number(almacen.value) &&
      esBalonEntregable(balon)
      ? balon
      : null
  })
}
