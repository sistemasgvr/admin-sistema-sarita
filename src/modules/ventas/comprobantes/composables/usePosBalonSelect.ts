import { computed, ref, watch, type Ref } from 'vue'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { useBalonesQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import type {
  Balon,
  BalonFormPreset,
  BalonListFilters,
} from '@/modules/balones/cilindros/interfaces/balon.interface'
import { getBalonEstadoBadge } from '@/modules/balones/utils/balonEstadoBadge'
import { ListaIds } from '@/shared/constants/lista-ids'
import type { SelectOption, SelectOptionBadge } from '@/shared/interfaces/form.interface'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'
import {
  listaOpcionBadgeColor,
  normalizeListaOpcionCode,
} from '@/shared/utils/listaOpcionBadge'

export type PosBalonSelectMode = 'cliente' | 'alquiler' | 'general'

export function formatBalonLabel(balon: {
  codigo_balon: string
  nombre_tipo_balon?: string | null
  nombre_estado_balon?: string | null
  nombre_estado_contenido?: string | null
  nombre_producto_gas?: string | null
  nombre_almacen?: string | null
  capacidad?: number | null
  nombre_unidad_medida?: string | null
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

  if (balon.capacidad != null) {
    const um = balon.nombre_unidad_medida ? ` ${balon.nombre_unidad_medida}` : ''
    parts.push(`${balon.capacidad}${um}`)
  }

  if (balon.nombre_estado_contenido) {
    parts.push(formatListaOpcionLabel(balon.nombre_estado_contenido))
  }

  if (balon.nombre_almacen) {
    parts.push(balon.nombre_almacen)
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

export function balonToSelectOption(balon: Balon): SelectOption {
  const badges: SelectOptionBadge[] = []

  if (balon.nombre_producto_gas) {
    badges.push({ label: balon.nombre_producto_gas, color: 'primary' })
  }

  if (balon.capacidad != null) {
    const um = balon.nombre_unidad_medida ? ` ${balon.nombre_unidad_medida}` : ''
    badges.push({ label: `${balon.capacidad}${um}`, color: 'neutral' })
  }

  const contenidoCode = normalizeListaOpcionCode(balon.nombre_estado_contenido)
  if (contenidoCode) {
    badges.push({
      label: formatListaOpcionLabel(balon.nombre_estado_contenido),
      color: listaOpcionBadgeColor(contenidoCode),
    })
  }

  const estadoBadge = getBalonEstadoBadge(balon)
  if (estadoBadge) {
    badges.push(estadoBadge)
  }

  if (balon.nombre_almacen) {
    badges.push({ label: balon.nombre_almacen, color: 'neutral' })
  }

  const propietario = (balon.nombre_propietario ?? '').trim().toUpperCase()
  const estado = (balon.nombre_estado_balon ?? '').trim().toUpperCase()
  if (propietario === 'CLIENTE') {
    const cliente =
      balon.nombre_cliente_propietario?.trim() ||
      balon.nombre_cliente_ubicacion?.trim() ||
      'cliente'
    badges.push({ label: `Propio de ${cliente}`, color: 'warning' })
  } else if (estado === 'PRESTADO_CLIENTE' && balon.nombre_cliente_ubicacion) {
    badges.push({
      label: `Prestado a ${balon.nombre_cliente_ubicacion}`,
      color: 'warning',
    })
  }

  const title = balon.nombre_tipo_balon
    ? `${balon.codigo_balon} · ${balon.nombre_tipo_balon}`
    : balon.codigo_balon

  return {
    value: balon.id,
    title,
    label: formatBalonLabel(balon),
    badges,
  }
}

export function usePosBalonSelect(options: {
  mode: PosBalonSelectMode
  idCliente: Ref<number | ''>
  idAlmacen?: Ref<number | ''>
  /** Ej. `medicinal` para kit POS: solo cilindros de esa familia de gas. */
  familiaGas?: Ref<string | undefined>
  /** Filtros API adicionales (p. ej. estado según tipo de movimiento). */
  extraFilters?: Ref<Partial<BalonListFilters> | undefined>
  /** Filtro local post-API (p. ej. varios estados). */
  clientFilter?: Ref<((balon: Balon) => boolean) | undefined>
  /** Deshabilita el select hasta que el padre esté listo (tipo de movimiento, etc.). */
  selectionLocked?: Ref<boolean>
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

  const propietarioEmpresaId = computed(() =>
    propietarioQuery.data.value?.find((item) => item.nombre?.toUpperCase() === 'EMPRESA')?.id,
  )

  const balonesQuery = useBalonesQuery(balonesFilters)

  let balonBuscarTimeout: ReturnType<typeof setTimeout> | undefined

  const syncBalonFilters = () => {
    const term = balonBuscar.value.trim()
    const filters: BalonListFilters = {
      pagina: 1,
      limite: 50,
      buscar: term || undefined,
      // Nunca ofrecer dados de baja / robados en selects operativos.
      soloBajas: false,
      ...options.extraFilters?.value,
    }

    // Recarga / general: prestados (ubicación) + propios (propietario)
    if ((options.mode === 'cliente' || options.mode === 'general') && options.idCliente.value) {
      filters.idClienteRelacionado = Number(options.idCliente.value)
    }

    // Venta / entrega / alquiler: solo stock de la empresa en almacén (nunca "Propio de cliente")
    if (options.mode === 'alquiler') {
      if (estadoEnAlmacenId.value) {
        filters.idEstadoBalon = estadoEnAlmacenId.value
      }

      if (options.idAlmacen?.value) {
        filters.idAlmacen = Number(options.idAlmacen.value)
      }

      if (propietarioEmpresaId.value) {
        filters.idPropietario = propietarioEmpresaId.value
      }
    }

    const familia = options.familiaGas?.value?.trim()
    if (familia) {
      filters.familiaGas = familia
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
    [
      () => options.idCliente.value,
      () => options.idAlmacen?.value,
      () => options.familiaGas?.value,
      () => options.extraFilters?.value,
      estadoEnAlmacenId,
      propietarioEmpresaId,
    ],
    () => {
      syncBalonFilters()
    },
    { immediate: true, deep: true },
  )

  const balonOptions = computed(() => {
    let rows = balonesQuery.data.value?.data ?? []

    // Red de seguridad: en stock de empresa no listar envases del cliente
    if (options.mode === 'alquiler') {
      rows = rows.filter((balon) => {
        const propietario = (balon.nombre_propietario ?? '').trim().toUpperCase()
        return propietario !== 'CLIENTE' && balon.id_cliente_propietario == null
      })
    }

    const clientFilter = options.clientFilter?.value
    if (clientFilter) {
      rows = rows.filter(clientFilter)
    }

    return rows.map((balon) => balonToSelectOption(balon))
  })

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

      if (propietarioEmpresaId.value) {
        preset.idPropietario = propietarioEmpresaId.value
      }
    }

    const extra = options.extraFilters?.value
    if (extra?.idAlmacen) preset.idAlmacen = extra.idAlmacen
    if (extra?.idEstadoBalon) preset.idEstadoBalon = extra.idEstadoBalon
    if (extra?.idPropietario) preset.idPropietario = extra.idPropietario

    return preset
  })

  const requiresCliente = computed(() => options.mode === 'cliente')

  const balonSelectDisabled = computed(
    () =>
      Boolean(options.selectionLocked?.value) ||
      (requiresCliente.value && !options.idCliente.value),
  )

  return {
    balonBuscar,
    balonesQuery,
    balonOptions,
    balonPreset,
    requiresCliente,
    balonSelectDisabled,
    syncBalonFilters,
    propietarioEmpresaId,
  }
}
