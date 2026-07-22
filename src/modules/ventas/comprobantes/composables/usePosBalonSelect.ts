import { computed, ref, watch, type Ref } from 'vue'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { useBalonesQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import type { BalonFormPreset, BalonListFilters } from '@/modules/balones/cilindros/interfaces/balon.interface'
import { ListaIds } from '@/shared/constants/lista-ids'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'

export type PosBalonSelectMode = 'cliente' | 'alquiler' | 'general'

function formatBalonLabel(balon: {
  codigo_balon: string
  nombre_tipo_balon?: string | null
  nombre_estado_balon?: string | null
  nombre_producto_gas?: string | null
  nombre_propietario?: string | null
  nombre_cliente_propietario?: string | null
  nombre_cliente_ubicacion?: string | null
}) {
  const parts = [balon.codigo_balon]

  if (balon.nombre_tipo_balon) {
    parts.push(balon.nombre_tipo_balon)
  }

  if (balon.nombre_producto_gas) {
    parts.push(balon.nombre_producto_gas)
  }

  const propietario = (balon.nombre_propietario ?? '').trim().toUpperCase()
  const estado = (balon.nombre_estado_balon ?? '').trim().toUpperCase()

  if (propietario === 'CLIENTE') {
    const cliente =
      balon.nombre_cliente_propietario?.trim() ||
      balon.nombre_cliente_ubicacion?.trim() ||
      'cliente'
    parts.push(`Propio de ${cliente}`)
  } else if (estado === 'PRESTADO_CLIENTE') {
    const cliente = balon.nombre_cliente_ubicacion?.trim()
    parts.push(cliente ? `Prestado a ${cliente}` : '(Prestado al cliente)')
  } else if (balon.nombre_estado_balon) {
    parts.push(`(${formatListaOpcionLabel(balon.nombre_estado_balon)})`)
  }

  return parts.join(' · ')
}

export function usePosBalonSelect(options: {
  mode: PosBalonSelectMode
  idCliente: Ref<number | ''>
  idAlmacen?: Ref<number | ''>
}) {
  const balonBuscar = ref('')
  const balonesFilters = ref<BalonListFilters>({ pagina: 1, limite: 50 })

  const estadoBalonQuery = useListaOpcionesQuery(ref(ListaIds.ESTADO_BALON))
  const propietarioQuery = useListaOpcionesQuery(ref(ListaIds.PROPIETARIO_BALON))

  const estadoEnAlmacenId = computed(() =>
    estadoBalonQuery.data.value?.find((item) => item.nombre === 'EN_ALMACEN')?.id,
  )

  const propietarioClienteId = computed(() =>
    propietarioQuery.data.value?.find((item) => item.nombre?.toUpperCase() === 'CLIENTE')?.id,
  )

  const balonesQuery = useBalonesQuery(balonesFilters)

  let balonBuscarTimeout: ReturnType<typeof setTimeout> | undefined

  const syncBalonFilters = () => {
    const term = balonBuscar.value.trim()
    const filters: BalonListFilters = {
      pagina: 1,
      limite: 50,
      buscar: term || undefined,
    }

    // Recarga / general: prestados (ubicación) + propios (propietario)
    if ((options.mode === 'cliente' || options.mode === 'general') && options.idCliente.value) {
      filters.idClienteRelacionado = Number(options.idCliente.value)
    }

    if (options.mode === 'alquiler') {
      if (estadoEnAlmacenId.value) {
        filters.idEstadoBalon = estadoEnAlmacenId.value
      }

      if (options.idAlmacen?.value) {
        filters.idAlmacen = Number(options.idAlmacen.value)
      }
    }

    balonesFilters.value = filters
  }

  watch(balonBuscar, () => {
    if (balonBuscarTimeout) {
      clearTimeout(balonBuscarTimeout)
    }

    balonBuscarTimeout = setTimeout(syncBalonFilters, 350)
  })

  watch(
    [() => options.idCliente.value, () => options.idAlmacen?.value, estadoEnAlmacenId],
    () => {
      syncBalonFilters()
    },
    { immediate: true },
  )

  const balonOptions = computed(() =>
    (balonesQuery.data.value?.data ?? []).map((balon) => ({
      value: balon.id,
      label: formatBalonLabel(balon),
    })),
  )

  const balonPreset = computed<BalonFormPreset>(() => {
    const preset: BalonFormPreset = {
      codigoBalon: balonBuscar.value.trim() || undefined,
    }

    if (options.mode === 'cliente' || options.mode === 'general') {
      if (options.idCliente.value) {
        // Nuevo balón desde Recarga: propio del cliente (viene con el suyo)
        preset.idClienteUbicacion = Number(options.idCliente.value)

        if (propietarioClienteId.value) {
          preset.idPropietario = propietarioClienteId.value
          preset.idClientePropietario = Number(options.idCliente.value)
        }
      }
    }

    if (options.mode === 'alquiler') {
      if (options.idAlmacen?.value) {
        preset.idAlmacen = Number(options.idAlmacen.value)
      }

      if (estadoEnAlmacenId.value) {
        preset.idEstadoBalon = estadoEnAlmacenId.value
      }
    }

    return preset
  })

  const requiresCliente = computed(() => options.mode === 'cliente')

  const balonSelectDisabled = computed(
    () => requiresCliente.value && !options.idCliente.value,
  )

  return {
    balonBuscar,
    balonesQuery,
    balonOptions,
    balonPreset,
    requiresCliente,
    balonSelectDisabled,
    syncBalonFilters,
  }
}
