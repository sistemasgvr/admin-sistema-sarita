import { computed, type Ref } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { ICONS } from '@/shared/constants/icons'
import { PermisoBanderas } from '@/shared/constants/permissions'
import type { ActionMenuItem } from '@/shared/interfaces/action-menu.interface'

/** Lo mínimo que hace falta para decidir qué acciones aplican. */
export interface DocSalidaAccionesFuente {
  id: number
  nombre_estado_ciclo?: string | null
  nombre_tipo_orden?: string | null
  emitido_sunat?: boolean | null
  serie?: string | null
  ticket_sunat?: string | null
  detalle_desde_venta?: boolean | null
  /**
   * Los envases ya entraron al almacén (ENTRADA_PLANTA_EXTERNA vigente). Es lo
   * único que prueba el retorno: `fecha_llegada_almacen` acompaña al retorno
   * pero por sí sola no mueve inventario.
   */
  retorno_fisico?: boolean | null
  fecha_llegada_almacen?: string | null
  id_comprobante_compra?: number | null
  /**
   * SUNAT exige número de documento de quien recibe. La API lo busca en este
   * orden (destinatario → cliente → proveedor, y el proveedor primero en
   * planta externa), así que aquí hacen falta los tres. El listado no los
   * envía: son opcionales y su ausencia no decide nada.
   */
  documento_destinatario?: string | null
  documento_cliente?: string | null
  documento_proveedor?: string | null
}

export type DocSalidaAccion =
  | 'ver'
  | 'generar'
  | 'retorno'
  | 'traslado'
  | 'direccion'
  | 'lote'
  | 'gre'
  | 'emitir'
  | 'pdf'
  | 'anular'

/**
 * Reglas de negocio de las acciones de un documento de salida.
 *
 * Viven acá y no en cada vista porque el listado y el detalle tienen que
 * ofrecer exactamente lo mismo: si "Generar" aparece en una pantalla y no en la
 * otra para el mismo documento, una de las dos está mintiendo.
 */
export function useDocSalidaAcciones(documento: Ref<DocSalidaAccionesFuente | null | undefined>) {
  const authStore = useAuthStore()

  const puedeEditar = computed(() =>
    authStore.hasPermission(PermisoBanderas.DOCUMENTOS_SALIDA_EDITAR),
  )

  const estado = computed(() => documento.value?.nombre_estado_ciclo ?? '')
  const anulada = computed(() => estado.value === 'ANULADA')
  const emitido = computed(() => Boolean(documento.value?.emitido_sunat))

  const esBorrador = computed(() => estado.value === 'BORRADOR')

  const esPlantaExterna = computed(
    () =>
      documento.value?.nombre_tipo_orden === 'RECARGA_PLANTA_EXTERNA',
  )

  const puedeGenerar = computed(() => esBorrador.value && puedeEditar.value)

  /** Mientras no se emita a SUNAT el contenido del documento aún se corrige. */
  const puedeEditarDatos = computed(
    () => !anulada.value && !emitido.value && puedeEditar.value,
  )

  /** El retorno físico ya se registró: los cilindros y el gas están en almacén. */
  const retornoRegistrado = computed(() => Boolean(documento.value?.retorno_fisico))

  /** La factura del proveedor ya está vinculada a la orden. */
  const tieneCompraVinculada = computed(() => Boolean(documento.value?.id_comprobante_compra))

  /**
   * Solo hay retorno cuando hubo salida: en borrador el inventario no se movió
   * y los cilindros nunca fueron a planta (la API también lo rechaza). Y solo
   * se registra una vez: repetirlo duplicaba el ingreso de envases y gas.
   */
  const puedeRegistrarRetorno = computed(
    () =>
      esPlantaExterna.value &&
      (estado.value === 'GENERADA' || estado.value === 'EMITIDA_SUNAT') &&
      !retornoRegistrado.value &&
      puedeEditar.value,
  )

  const puedeConvertirGre = computed(
    () => documento.value != null && !esBorrador.value && !anulada.value && !emitido.value,
  )

  /**
   * La guía no se puede armar sin documento de quien recibe. En planta externa
   * el receptor es el proveedor (mismo criterio que el PDF y el mapper de la
   * API). Cuando la fuente es una fila del listado ninguno de los campos
   * viaja: ahí no hay nada que juzgar y la acción se ofrece igual, que la API
   * valida antes de llamar a SUNAT.
   */
  const destinatarioDocumentado = computed(() => {
    const candidatos = [
      documento.value?.documento_destinatario,
      documento.value?.documento_cliente,
      documento.value?.documento_proveedor,
    ]
    if (candidatos.every((doc) => doc === undefined)) return true
    return candidatos.some((doc) => Boolean(doc?.trim()))
  })

  /** Una orden anulada conserva su serie: sin este corte seguía siendo emitible. */
  const puedeEmitir = computed(
    () =>
      !anulada.value &&
      Boolean(documento.value?.serie) &&
      !emitido.value &&
      destinatarioDocumentado.value &&
      authStore.hasPermission(PermisoBanderas.DOCUMENTOS_SALIDA_EMITIR),
  )

  /**
   * Anular en API usa DOCUMENTOS_SALIDA_ELIMINAR. Con factura vinculada
   * doc_anular_salida rechaza la operación (hay que anular la compra primero):
   * ofrecer la acción solo llevaba al error.
   */
  const tieneTicketSunat = computed(
    () => Boolean(String(documento.value?.ticket_sunat ?? '').trim()),
  )

  /**
   * Anular en API usa DOCUMENTOS_SALIDA_ELIMINAR. Con factura vinculada
   * doc_anular_salida rechaza; con ticket_sunat (aunque aún PENDIENTE)
   * también — no ofrecer la acción.
   */
  const puedeAnular = computed(
    () =>
      !anulada.value &&
      !emitido.value &&
      !tieneTicketSunat.value &&
      !tieneCompraVinculada.value &&
      authStore.hasPermission(PermisoBanderas.DOCUMENTOS_SALIDA_ELIMINAR),
  )

  const puedeAsociarLote = computed(
    () =>
      !anulada.value && authStore.hasPermission(PermisoBanderas.LOTES_PROTOCOLO_EDITAR),
  )

  /** Menú de la fila del listado; el detalle usa los mismos flags en sus botones. */
  const accionesMenu = computed<ActionMenuItem[]>(() => [
    { key: 'ver', label: 'Ver / editar', icon: ICONS.eye },
    { key: 'generar', label: 'Generar', icon: ICONS.check, hidden: !puedeGenerar.value },
    {
      key: 'retorno',
      label: 'Registrar retorno',
      icon: ICONS.arrowDownToLine,
      hidden: !puedeRegistrarRetorno.value,
    },
    {
      key: 'traslado',
      label: 'Datos de traslado',
      icon: ICONS.truck,
      hidden: !puedeEditarDatos.value,
    },
    {
      key: 'direccion',
      label: 'Dirección de entrega',
      icon: ICONS.mapPin,
      hidden: !puedeEditarDatos.value,
    },
    {
      key: 'lote',
      label: 'Registrar lote y protocolo',
      icon: ICONS.clipboardCheck,
      hidden: !puedeAsociarLote.value,
    },
    {
      key: 'gre',
      label: documento.value?.serie ? 'Editar datos GRE' : 'Convertir a guía de remisión',
      icon: ICONS.fileText,
      hidden: !puedeConvertirGre.value,
    },
    { key: 'emitir', label: 'Emitir a SUNAT', icon: ICONS.upload, hidden: !puedeEmitir.value },
    { key: 'pdf', label: 'Descargar PDF', icon: ICONS.download },
    {
      key: 'anular',
      label: 'Anular',
      icon: ICONS.ban,
      danger: true,
      hidden: !puedeAnular.value,
    },
  ])

  return {
    esPlantaExterna,
    retornoRegistrado,
    tieneCompraVinculada,
    puedeGenerar,
    puedeEditarDatos,
    puedeRegistrarRetorno,
    puedeConvertirGre,
    destinatarioDocumentado,
    puedeEmitir,
    puedeAnular,
    puedeAsociarLote,
    accionesMenu,
  }
}
