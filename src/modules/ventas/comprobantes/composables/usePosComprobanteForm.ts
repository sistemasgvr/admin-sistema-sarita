import { computed, ref, watch } from 'vue'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import { useComprobanteCatalogosPosQuery } from '@/modules/ventas/comprobantes/composables/useComprobantesQuery'
import { comprobantesService } from '@/modules/ventas/comprobantes/services/comprobantes.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { PermisoBanderas } from '@/shared/constants/permissions'

export function usePosComprobanteForm() {
  const authStore = useAuthStore()
  const catalogosQuery = useComprobanteCatalogosPosQuery()

  const clienteBuscar = ref('')
  const clientesFilters = ref({
    pagina: 1,
    limite: 50,
    soloActivos: 1 as number,
    buscar: undefined as string | undefined,
  })
  const clientesQuery = useClientesQuery(clientesFilters)

  let clienteBuscarTimeout: ReturnType<typeof setTimeout> | undefined

  watch(clienteBuscar, (value) => {
    if (clienteBuscarTimeout) {
      clearTimeout(clienteBuscarTimeout)
    }

    clienteBuscarTimeout = setTimeout(() => {
      const term = value.trim()
      clientesFilters.value = {
        ...clientesFilters.value,
        buscar: term || undefined,
      }
    }, 350)
  })

  const idTipoComprobante = ref<number | ''>('')
  const serie = ref('B001')
  const numero = ref('')
  const fecha = ref(new Date().toISOString().slice(0, 10))
  const idCliente = ref<number | ''>('')

  const canEmit = computed(() => authStore.hasPermission(PermisoBanderas.COMPROBANTES_EMITIR))

  const tipoComprobanteOptions = computed(() =>
    (catalogosQuery.data.value?.tiposComprobante ?? [])
      .filter((item) => ['01', '03'].includes(item.descripcion ?? ''))
      .map((item) => ({
        value: item.id,
        label: `${item.nombre} (${item.descripcion})`,
      })),
  )

  const clienteOptions = computed(() =>
    (clientesQuery.data.value?.data ?? []).map((cliente) => ({
      value: cliente.id,
      label: `${cliente.razon_social ?? cliente.numero_documento} — ${cliente.numero_documento}`,
    })),
  )

  const idAfectacionGravado = computed(() => {
    const opcion = (catalogosQuery.data.value?.afectacionesIgv ?? []).find(
      (item) => item.descripcion === '10',
    )
    return opcion?.id
  })

  const idMonedaPen = computed(() => {
    const opcion = (catalogosQuery.data.value?.monedas ?? []).find((item) => item.nombre === 'PEN')
    return opcion?.id
  })

  const idTipoOperacionVentaInterna = computed(() => {
    const opcion = (catalogosQuery.data.value?.tiposOperacionSunat ?? []).find(
      (item) => item.descripcion === '0101',
    )
    return opcion?.id
  })

  watch(idTipoComprobante, async (value) => {
    if (!value || !serie.value.trim()) {
      numero.value = ''
      return
    }

    try {
      const result = await comprobantesService.obtenerSiguienteNumero(Number(value), serie.value)
      numero.value = result.numero
    } catch {
      numero.value = ''
    }
  })

  watch(serie, async (value) => {
    if (!idTipoComprobante.value || !value.trim()) return

    try {
      const result = await comprobantesService.obtenerSiguienteNumero(
        Number(idTipoComprobante.value),
        value,
      )
      numero.value = result.numero
    } catch {
      numero.value = ''
    }
  })

  watch(
    tipoComprobanteOptions,
    (options) => {
      if (!idTipoComprobante.value && options.length > 0) {
        const boleta = options.find((item) => item.label.includes('BOLETA'))
        idTipoComprobante.value = boleta?.value ?? options[0].value
      }
    },
    { immediate: true },
  )

  function comprobanteBaseValido() {
    return (
      Boolean(idTipoComprobante.value) &&
      Boolean(idCliente.value) &&
      Boolean(serie.value.trim())
    )
  }

  return {
    authStore,
    catalogosQuery,
    clientesQuery,
    clienteBuscar,
    idTipoComprobante,
    serie,
    numero,
    fecha,
    idCliente,
    canEmit,
    tipoComprobanteOptions,
    clienteOptions,
    idAfectacionGravado,
    idMonedaPen,
    idTipoOperacionVentaInterna,
    comprobanteBaseValido,
  }
}

export function formatPosMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

export function calcularTotalesDesdeImporte(valorVenta: number) {
  const igv = valorVenta * 0.18
  return {
    valorVenta,
    igv,
    total: valorVenta + igv,
  }
}
