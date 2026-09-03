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
  nombre_estado_ciclo?: string
}) {
  if (d.id_comprobante_compra) return 'CERRADO'
  if (d.fecha_llegada_almacen) return 'RETORNADO'
  if (d.nombre_estado_ciclo === 'BORRADOR') return 'BORRADOR'
  return 'ENVIADO'
}

function mapDetalle(d: DocumentoSalida['detalle'][number]): RecargaPlantaDetalle {
  return {
    id: d.id,
    id_balon: d.id_balon as number,
    codigo_balon: d.codigo_balon,
    id_producto: d.id_producto,
    nombre_producto: d.nombre_producto,
    codigo_producto: d.codigo_producto,
    capacidad: d.cantidad,
    id_unidad_medida: d.id_unidad_medida,
    nombre_unidad_medida: d.nombre_unidad_medida,
    lote: null,
    fecha_vencimiento_lote: null,
    fecha_prueba_hidrostatica: null,
    id_movimiento_recarga: null,
    observacion: d.glosa,
    nombre_estado_balon: null,
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
    lote: d.lote,
    fecha_vencimiento_lote: d.fecha_vencimiento_lote,
    fecha_prueba_hidrostatica: d.fecha_prueba_hidrostatica,
    id_estado: d.id_estado_ciclo,
    nombre_estado: estadoRecargaDe(d),
    descripcion_estado: null,
    total_cilindros: d.detalle.filter((x) => x.id_balon).length,
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
    serie_guia_salida: null,
    numero_guia_salida: null,
    id_guia_retorno: null,
    serie_guia_ingreso: null,
    numero_guia_ingreso: null,
    id_comprobante_compra: d.id_comprobante_compra,
    serie_factura: null,
    numero_factura: null,
    fecha_llegada_almacen: d.fecha_llegada_almacen,
    lote: d.lote,
    fecha_vencimiento_lote: null,
    fecha_prueba_hidrostatica: null,
    id_estado: d.id_estado_ciclo,
    nombre_estado: estadoRecargaDe(d),
    descripcion_estado: null,
    total_cilindros: d.total_items,
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
    queryKey: computed(() =>
      documentosSalidaQueryKeys.list({ ...filters.value, codigoTipoOrden: 'RECARGA_PLANTA_EXTERNA' }),
    ),
    queryFn: async () => {
      const res = await documentosSalidaService.listar({
        buscar: filters.value.buscar,
        pagina: filters.value.pagina,
        limite: filters.value.limite,
        idAlmacen: filters.value.idAlmacen,
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
    queryKey: computed(() => documentosSalidaQueryKeys.detail(id.value ?? 0)),
    queryFn: async () => mapCompleto(await documentosSalidaService.obtenerPorId(id.value!)),
    enabled: computed(() => id.value != null && id.value > 0),
  })
}
