import { computed, onMounted, ref, watch } from 'vue'
import { CLIENTES_VARIOS_CODIGO } from '@/modules/clientes/constants/clientesVarios'
import { useClientesQuery } from '@/modules/clientes/composables/useClientesQuery'
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'
import { clientesService } from '@/modules/clientes/services/clientes.service'
import { getClienteOptionLabel } from '@/modules/clientes/utils/clienteNombre'
import { useComprobanteCatalogosPosQuery } from '@/modules/ventas/comprobantes/composables/useComprobantesQuery'
import {
  CODIGO_NOTA_VENTA,
  esNotaVentaCodigo,
} from '@/modules/ventas/comprobantes/constants/tipoComprobante'
import { comprobantesService } from '@/modules/ventas/comprobantes/services/comprobantes.service'
import {
  seriePorDefectoDesdeCodigo,
  tipoRequiereRuc,
  validarSerieParaTipo,
} from '@/modules/ventas/comprobantes/utils/serieComprobante'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { PermisoBanderas } from '@/shared/constants/permissions'

/** Tipos de venta directa en punto de venta (sin origen). NC/ND se emiten desde flujo de notas. */
const CODIGOS_TIPO_POS = ['01', '03', CODIGO_NOTA_VENTA] as const

export {
  seriePorDefectoDesdeCodigo,
  validarSerieParaTipo,
  tipoRequiereRuc,
} from '@/modules/ventas/comprobantes/utils/serieComprobante'

export function usePosComprobanteForm(options?: {
  /** Serie del comprobante origen (NC/ND). */
  serieOrigen?: () => string | null | undefined
}) {
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
  let cargandoNumero = false
  let sincronizandoSerieDesdeTipo = false

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
  /** Snapshot del cliente elegido; no depende del cache de búsqueda. */
  const clienteSeleccionadoCache = ref<Cliente | null>(null)
  const clientesVarios = ref<Cliente | null>(null)

  const canEmit = computed(() => authStore.hasPermission(PermisoBanderas.COMPROBANTES_EMITIR))
  const canPrint = computed(() => authStore.hasPermission(PermisoBanderas.COMPROBANTES_LISTAR))

  const tipoComprobanteOptions = computed(() =>
    (catalogosQuery.data.value?.tiposComprobante ?? [])
      .filter((item) =>
        CODIGOS_TIPO_POS.includes(
          (item.descripcion ?? '') as (typeof CODIGOS_TIPO_POS)[number],
        ),
      )
      .map((item) => {
        const codigo = item.descripcion ?? ''
        const nombre =
          codigo === CODIGO_NOTA_VENTA
            ? 'NOTA DE VENTA'
            : (item.nombre ?? '').replace(/_/g, ' ')
        return {
          value: item.id,
          label: `${nombre} (${codigo})`,
          codigo,
        }
      }),
  )

  const codigoTipoComprobante = computed(() => {
    const opcion = tipoComprobanteOptions.value.find(
      (item) => item.value === idTipoComprobante.value,
    )
    return opcion?.codigo ?? ''
  })

  const esNotaVenta = computed(() => esNotaVentaCodigo(codigoTipoComprobante.value))

  const clienteOptions = computed(() => {
    const options = (clientesQuery.data.value?.data ?? []).map((cliente) => ({
      value: cliente.id,
      label: getClienteOptionLabel(cliente),
    }))

    const cached = clienteSeleccionadoCache.value
    if (cached && !options.some((option) => option.value === cached.id)) {
      options.unshift({
        value: cached.id,
        label: getClienteOptionLabel(cached),
      })
    }

    return options
  })

  const clienteSeleccionado = computed(
    () =>
      clienteSeleccionadoCache.value ??
      (clientesQuery.data.value?.data ?? []).find((cliente) => cliente.id === idCliente.value),
  )

  watch(idCliente, (value) => {
    if (!value) {
      clienteSeleccionadoCache.value = null
      return
    }

    const fromList = (clientesQuery.data.value?.data ?? []).find((cliente) => cliente.id === value)
    if (fromList) {
      clienteSeleccionadoCache.value = fromList
    }
  })

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

  async function refrescarSiguienteNumero() {
    if (!idTipoComprobante.value || !serie.value.trim()) {
      numero.value = ''
      return
    }

    cargandoNumero = true
    try {
      const result = await comprobantesService.obtenerSiguienteNumero(
        Number(idTipoComprobante.value),
        serie.value.trim().toUpperCase(),
      )
      numero.value = result.numero
    } catch {
      numero.value = ''
    } finally {
      cargandoNumero = false
    }
  }

  watch(idTipoComprobante, async (value) => {
    if (!value) {
      numero.value = ''
      return
    }

    const codigo =
      tipoComprobanteOptions.value.find((item) => item.value === value)?.codigo ?? ''
    const serieOrigen = options?.serieOrigen?.() ?? null
    const serieEsperada = seriePorDefectoDesdeCodigo(codigo, serie.value, serieOrigen)

    if (serie.value.trim().toUpperCase() !== serieEsperada) {
      sincronizandoSerieDesdeTipo = true
      serie.value = serieEsperada
      sincronizandoSerieDesdeTipo = false
    }

    await refrescarSiguienteNumero()
  })

  watch(serie, async (value) => {
    if (sincronizandoSerieDesdeTipo || cargandoNumero) return
    if (!idTipoComprobante.value || !value.trim()) return

    const upper = value.trim().toUpperCase()
    if (upper !== value) {
      sincronizandoSerieDesdeTipo = true
      serie.value = upper
      sincronizandoSerieDesdeTipo = false
    }

    await refrescarSiguienteNumero()
  })

  watch(
    tipoComprobanteOptions,
    (opts) => {
      if (!idTipoComprobante.value && opts.length > 0) {
        const boleta = opts.find((item) => item.codigo === '03')
        idTipoComprobante.value = boleta?.value ?? opts[0].value
      }
    },
    { immediate: true },
  )

  function mensajeValidacionComprobante(): string | null {
    if (!idTipoComprobante.value) return 'Selecciona el tipo de comprobante'
    if (!idCliente.value) return 'Selecciona un cliente'

    const codigo = codigoTipoComprobante.value
    const serieOrigen = options?.serieOrigen?.() ?? null
    const errorSerie = validarSerieParaTipo(codigo, serie.value, serieOrigen)
    if (errorSerie) return errorSerie

    if (tipoRequiereRuc(codigo, serie.value) && !clienteDocumentoEsRuc(clienteSeleccionado.value)) {
      return codigo === '01'
        ? 'La factura requiere un cliente con RUC (11 dígitos)'
        : 'Este comprobante (serie F) requiere un cliente con RUC (11 dígitos)'
    }

    return null
  }

  function comprobanteBaseValido() {
    return mensajeValidacionComprobante() === null
  }

  /** Selecciona un cliente recién creado/cargado sin depender del resultado de búsqueda. */
  function seleccionarCliente(cliente: Cliente) {
    clienteSeleccionadoCache.value = cliente
    idCliente.value = cliente.id
    clienteBuscar.value = ''
  }

  function aplicarClientesVariosPorDefecto() {
    if (clientesVarios.value) {
      seleccionarCliente(clientesVarios.value)
    } else {
      idCliente.value = ''
      clienteSeleccionadoCache.value = null
    }
    clienteBuscar.value = ''
  }

  async function cargarClientesVarios() {
    try {
      const result = await clientesService.listar({
        buscar: CLIENTES_VARIOS_CODIGO,
        pagina: 1,
        limite: 10,
        soloActivos: 1,
      })
      const found =
        (result.data ?? []).find(
          (cliente) =>
            (cliente.codigo_interno ?? '').toUpperCase() === CLIENTES_VARIOS_CODIGO,
        ) ?? null
      clientesVarios.value = found
      if (found && !idCliente.value) {
        seleccionarCliente(found)
      }
    } catch {
      clientesVarios.value = null
    }
  }

  /**
   * Limpia datos operativos y deja listo el POS para la siguiente venta.
   * Conserva tipo/serie, reaplica Clientes varios y pide el siguiente correlativo.
   */
  async function reiniciarTrasOperacion() {
    aplicarClientesVariosPorDefecto()
    fecha.value = new Date().toISOString().slice(0, 10)
    await refrescarSiguienteNumero()
  }

  const canCreateCliente = computed(() =>
    authStore.hasPermission(PermisoBanderas.CLIENTES_CREAR),
  )

  onMounted(() => {
    void cargarClientesVarios()
  })

  watch(esNotaVenta, (activo) => {
    if (activo && clientesVarios.value) {
      seleccionarCliente(clientesVarios.value)
    }
  })

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
    canPrint,
    canCreateCliente,
    tipoComprobanteOptions,
    codigoTipoComprobante,
    esNotaVenta,
    clienteOptions,
    clienteSeleccionado,
    clientesVarios,
    idAfectacionGravado,
    idMonedaPen,
    idTipoOperacionVentaInterna,
    comprobanteBaseValido,
    mensajeValidacionComprobante,
    refrescarSiguienteNumero,
    reiniciarTrasOperacion,
    seleccionarCliente,
  }
}

function clienteDocumentoEsRuc(cliente: Cliente | null | undefined) {
  if (!cliente) return false

  const tipo = (cliente.nombre_tipo_documento ?? '').toUpperCase()
  const doc = (cliente.numero_documento ?? '').trim()

  if (tipo.includes('RUC')) return /^\d{11}$/.test(doc)
  // Sin tipo claro: solo aceptar exactamente 11 dígitos numéricos
  return /^\d{11}$/.test(doc)
}

export function formatPosMoney(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

/** Tasa IGV Perú (18%). Los precios del catálogo/POS se tratan como IGV incluido. */
export const TASA_IGV = 0.18

/**
 * Descompone un importe con IGV incluido en valor venta + IGV.
 * Ej.: S/ 28.00 → valor 23.73 + IGV 4.27 = total 28.00
 */
export function calcularTotalesDesdeImporte(
  importeConIgv: number,
  tasaIgv: number = TASA_IGV,
) {
  const total = Number(importeConIgv) || 0

  if (total <= 0 || tasaIgv <= 0) {
    return { valorVenta: total, igv: 0, total }
  }

  const valorVenta = Math.round((total / (1 + tasaIgv)) * 100) / 100
  const igv = Math.round((total - valorVenta) * 100) / 100

  return {
    valorVenta,
    igv,
    total: Math.round(total * 100) / 100,
  }
}
