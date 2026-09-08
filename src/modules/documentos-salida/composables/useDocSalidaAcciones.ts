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
      documento.value?.nombre_tipo_orden === 'RECARGA_PLANTA_EXTERNA' ||
      documento.value?.nombre_tipo_orden === 'RETORNO_PLANTA_EXTERNA',
  )

  const puedeGenerar = computed(() => esBorrador.value && puedeEditar.value)

  /** Mientras no se emita a SUNAT el contenido del documento aún se corrige. */
  const puedeEditarDatos = computed(
    () => !anulada.value && !emitido.value && puedeEditar.value,
  )

  const puedeRegistrarRetorno = computed(
    () => esPlantaExterna.value && !anulada.value && puedeEditar.value,
  )

  const puedeConvertirGre = computed(
    () => documento.value != null && !esBorrador.value && !anulada.value && !emitido.value,
  )

  const puedeEmitir = computed(() => Boolean(documento.value?.serie) && !emitido.value)

  const puedeAnular = computed(() => !anulada.value && !emitido.value && puedeEditar.value)

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
    puedeGenerar,
    puedeEditarDatos,
    puedeRegistrarRetorno,
    puedeConvertirGre,
    puedeEmitir,
    puedeAnular,
    puedeAsociarLote,
    accionesMenu,
  }
}
