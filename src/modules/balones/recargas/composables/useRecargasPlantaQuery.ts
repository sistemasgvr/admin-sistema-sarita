// Fase 2: bal_recarga_planta se unificó en doc_salida (tipo RECARGA_PLANTA_EXTERNA).
// Este archivo adapta la forma vieja RecargaPlanta/RecargaPlantaListFilters para que
// CompraForm.vue, CompraRecargaPlantaDetalle.vue y ResumenRecarga.vue sigan
// funcionando sin reescribir su lógica de render, ahora respaldados por
// documentosSalidaService en vez del módulo NestJS eliminado recargas-planta.
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { documentosSalidaQueryKeys } from '@/modules/documentos-salida/constants/documentosSalidaQueryKeys'
import { documentosSalidaService } from '@/modules/documentos-salida/services/documentos-salida.service'
import type {
  DocumentoSalida,
  DocumentoSalidaListItem,
} from '@/modules/documentos-salida/interfaces/documento-salida.interface'
import type {
  RecargaPlanta,
  RecargaPlantaDetalle,
  RecargaPlantaListFilters,
} from '@/modules/balones/recargas/interfaces/recarga-planta.interface'

function estadoRecargaDe(d: {
  id_comprobante_compra?: number | null
  fecha_llegada_almacen?: string | null
  retorno_fisico?: boolean
  nombre_estado_ciclo?: string
}) {
  // El ciclo del documento manda: una orden anulada no está "enviada" aunque
  // conserve fecha de llegada o compra de cuando estaba vigente.
  if (d.nombre_estado_ciclo === 'ANULADA') return 'ANULADA'
  if (d.nombre_estado_ciclo === 'BORRADOR') return 'BORRADOR'
  if (d.id_comprobante_compra) return 'CERRADO'
  // Retornada = los envases entraron al almacén, no que haya fecha. El fallback
  // a la fecha cubre respuestas de una API anterior a retorno_fisico; desde
  // 20260910_retorno_fisico_fecha_ph la fecha solo existe con entrada física.
  if (d.retorno_fisico ?? Boolean(d.fecha_llegada_almacen)) return 'RETORNADO'
  return 'ENVIADO'
}

function mapDetalle(d: DocumentoSalida['detalle'][number]): RecargaPlantaDetalle {
  // En líneas de balón el producto de costo/stock es el gas del cilindro, no
  // id_producto de la fila OS (suele venir vacío o ser el envase).
  const idGas = d.id_producto_gas_balon ?? d.id_producto ?? null
  const nombreGas =
    d.nombre_producto_gas_balon?.trim() || d.nombre_producto?.trim() || null
  const capacidadBalon =
    d.capacidad_balon != null && Number.isFinite(Number(d.capacidad_balon))
      ? Number(d.capacidad_balon)
      : null

  return {
    id: d.id,
    id_balon: d.id_balon as number,
    codigo_balon: d.codigo_balon,
    id_producto: idGas,
    nombre_producto: nombreGas,
    codigo_producto: d.codigo_producto,
    // Capacidad real del cilindro (antes se mapeaba erróneamente d.cantidad).
    capacidad: capacidadBalon,
    capacidad_balon: capacidadBalon,
    cantidad: d.cantidad,
    id_unidad_medida: d.id_unidad_medida,
    nombre_unidad_medida: d.unidad_capacidad_balon ?? d.nombre_unidad_medida,
    unidad_capacidad_balon: d.unidad_capacidad_balon ?? null,
    id_unidad_capacidad_balon: d.id_unidad_capacidad_balon ?? null,
    lote: null,
    fecha_vencimiento_lote: null,
    fecha_prueba_hidrostatica: null,
    id_movimiento_recarga: null,
    observacion: d.glosa,
    nombre_estado_balon: null,
    // Datos del cilindro que expone doc_obtener_salida: con ellos la compra
    // decide si puede pedir ficha ICP y precarga el modal sin re-teclear.
    nombre_tipo_balon: d.nombre_tipo_balon ?? null,
    numero_serie_balon: d.numero_serie_balon ?? null,
    id_producto_gas_balon: d.id_producto_gas_balon ?? null,
    nombre_producto_gas_balon: d.nombre_producto_gas_balon ?? null,
  }
}

function mapCompleto(d: DocumentoSalida): RecargaPlanta {
  return {
    id: d.id,
    numero: d.numero,
    fecha_salida: d.fecha,
    id_proveedor: d.id_proveedor,
    nombre_proveedor: d.nombre_proveedor,
    id_almacen: d.id_almacen,
    nombre_almacen: d.nombre_almacen,
    id_guia_salida: null,
    serie_guia_salida: d.serie,
    numero_guia_salida: d.numero_sunat,
    id_guia_retorno: null,
    serie_guia_ingreso: d.serie_guia_ingreso,
    numero_guia_ingreso: d.numero_guia_ingreso,
    id_comprobante_compra: d.id_comprobante_compra,
    serie_factura: d.serie_factura,
    numero_factura: d.numero_factura,
    fecha_llegada_almacen: d.fecha_llegada_almacen,
    retorno_fisico: d.retorno_fisico ?? Boolean(d.fecha_llegada_almacen),
    id_almacen_retorno: d.id_almacen_retorno ?? null,
    nombre_almacen_retorno: d.nombre_almacen_retorno ?? null,
    lote: d.lote,
    fecha_vencimiento_lote: d.fecha_vencimiento_lote,
    fecha_prueba_hidrostatica: d.fecha_prueba_hidrostatica,
    id_estado: d.id_estado_ciclo,
    nombre_estado: estadoRecargaDe(d),
    descripcion_estado: null,
    total_cilindros: d.detalle.filter((x) => x.id_balon).length,
    total_productos: d.detalle.filter((x) => !x.id_balon).length,
    observacion: d.observaciones,
    detalles: d.detalle.filter((x) => x.id_balon).map(mapDetalle),
    puede_eliminar: d.nombre_estado_ciclo === 'BORRADOR',
    motivo_bloqueo_eliminar:
      d.nombre_estado_ciclo !== 'BORRADOR' ? 'El documento ya fue generado' : null,
    estado: d.estado,
    fecha_creacion: d.fecha_creacion,
    fecha_modificacion: undefined,
  }
}

function mapListItem(d: DocumentoSalidaListItem): RecargaPlanta {
  return {
    id: d.id,
    numero: d.numero,
    fecha_salida: d.fecha,
    id_proveedor: d.id_proveedor,
    nombre_proveedor: d.nombre_proveedor,
    id_almacen: d.id_almacen,
    nombre_almacen: d.nombre_almacen,
    id_guia_salida: null,
    // La guía de salida de la recarga es la GRE del propio documento; el
    // listado ya trae serie y correlativo, y dejarlos en null hacía que la
    // columna se viera vacía aunque la orden estuviera convertida a GRE.
    serie_guia_salida: d.serie,
    numero_guia_salida: d.numero_sunat,
    id_guia_retorno: null,
    serie_guia_ingreso: null,
    numero_guia_ingreso: null,
    id_comprobante_compra: d.id_comprobante_compra,
    serie_factura: null,
    numero_factura: null,
    fecha_llegada_almacen: d.fecha_llegada_almacen,
    retorno_fisico: d.retorno_fisico ?? Boolean(d.fecha_llegada_almacen),
    id_almacen_retorno: d.id_almacen_retorno ?? null,
    nombre_almacen_retorno: d.nombre_almacen_retorno ?? null,
    lote: d.lote,
    fecha_vencimiento_lote: null,
    fecha_prueba_hidrostatica: null,
    id_estado: d.id_estado_ciclo,
    nombre_estado: estadoRecargaDe(d),
    descripcion_estado: null,
    // total_items mezcla cilindros y líneas de gas; el listado ya los separa.
    total_cilindros: d.total_cilindros ?? null,
    total_productos: d.total_productos ?? null,
    observacion: d.observaciones,
    detalles: undefined,
    puede_eliminar: d.nombre_estado_ciclo === 'BORRADOR',
    motivo_bloqueo_eliminar:
      d.nombre_estado_ciclo !== 'BORRADOR' ? 'El documento ya fue generado' : null,
    estado: 1,
    fecha_creacion: d.fecha_creacion,
    fecha_modificacion: undefined,
  }
}

export function useRecargasPlantaQuery(filters: Ref<RecargaPlantaListFilters>) {
  return useQuery({
    // Misma razón que en useRecargaPlantaQuery: los ítems van mapeados, así que
    // no pueden compartir entrada con el listado crudo de documentos de salida.
    queryKey: computed(() => [
      ...documentosSalidaQueryKeys.list({ ...filters.value, codigoTipoOrden: 'RECARGA_PLANTA_EXTERNA' }),
      'recarga',
    ] as const),
    queryFn: async () => {
      const res = await documentosSalidaService.listar({
        buscar: filters.value.buscar,
        pagina: filters.value.pagina,
        limite: filters.value.limite,
        idAlmacen: filters.value.idAlmacen,
        idProveedor: filters.value.idProveedor,
        codigoEstadoCiclo: filters.value.codigoEstadoCiclo,
        fechaDesde: filters.value.fechaDesde,
        fechaHasta: filters.value.fechaHasta,
        codigoTipoOrden: 'RECARGA_PLANTA_EXTERNA',
      })
      return { ...res, data: res.data.map(mapListItem) }
    },
    placeholderData: keepPreviousData,
  })
}

export function useRecargaPlantaQuery(id: Ref<number | null>) {
  return useQuery({
    // Se anida bajo detail(id) y no se reutiliza tal cual: esta query guarda
    // la forma mapeada (con `detalles`), y el formulario de documento de
    // salida lee la misma clave esperando el documento crudo (con `detalle`).
    // Compartir entrada hacía que, tras abrir una recarga, entrar al documento
    // reventara en el primer render con `documento.detalle` undefined.
    // Al colgar de detail(id), las invalidaciones por prefijo siguen llegando.
    queryKey: computed(() => [...documentosSalidaQueryKeys.detail(id.value ?? 0), 'recarga'] as const),
    queryFn: async () => mapCompleto(await documentosSalidaService.obtenerPorId(id.value!)),
    enabled: computed(() => id.value != null && id.value > 0),
  })
}
