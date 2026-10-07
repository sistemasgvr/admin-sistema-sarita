import { effectScope, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import type { Balon } from '@/modules/balones/cilindros/interfaces/balon.interface'
import { useBalonSeleccionado } from './useBalonSeleccionado'

const datosBase = { estado: 1, fecha_creacion: '', fecha_modificacion: '' }

describe('selección de balón en orden de salida', () => {
  it('conserva el balón al limpiar la búsqueda y descarta selecciones de otro almacén', () => {
    const scope = effectScope()
    scope.run(() => {
      const balon: Balon = { ...datosBase, id: 25, codigo_balon: 'K5714008', id_almacen: 1 }
      const id = ref<number | ''>('')
      const resultados = ref<Balon[]>([balon])
      const almacen = ref(1)
      const seleccionado = useBalonSeleccionado(id, resultados, almacen)
      id.value = 25
      resultados.value = [{ ...datosBase, id: 1, codigo_balon: 'OTRO', id_almacen: 1 }]
      expect(seleccionado.value).toEqual(balon)
      almacen.value = 2
      expect(id.value).toBe('')
      expect(seleccionado.value).toBeNull()
      id.value = 1
      expect(seleccionado.value).toBeNull()
    })
    scope.stop()
  })

  it('respeta cambios de disponibilidad y permite limpiar la selección', () => {
    const scope = effectScope()
    scope.run(() => {
      const resultados = ref<Balon[]>([{ ...datosBase, id: 25, codigo_balon: 'K5714008', id_almacen: 1 }])
      const id = ref<number | ''>(25)
      const seleccionado = useBalonSeleccionado(id, resultados, ref(1))
      expect(seleccionado.value?.id).toBe(25)
      resultados.value = [{ ...resultados.value[0]!, nombre_estado_balon: 'PENDIENTE_ENVIO' }]
      expect(seleccionado.value).toBeNull()
      id.value = ''
      resultados.value = []
      expect(seleccionado.value).toBeNull()
    })
    scope.stop()
  })
})
