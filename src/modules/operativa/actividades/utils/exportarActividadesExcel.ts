import { actividadesService } from '@/modules/operativa/actividades/services/actividades.service'
import type {
  Actividad,
  ActividadListFilters,
} from '@/modules/operativa/actividades/interfaces/actividad.interface'
import type { ActividadColaboradorRanking } from '@/modules/operativa/actividades/utils/agruparActividadesPorColaborador'
import { toastInfo } from '@/shared/composables/useToast'
import { hoyIsoLima } from '@/shared/utils/date'
import { downloadExcelWorkbook, fetchAllPages, type ExcelColumn } from '@/shared/utils/exportExcel'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'

function formatComprobante(
  serie?: string | null,
  numero?: string | null,
): string {
  return [serie, numero].filter((part) => part?.trim()).join('-')
}

const columnasActividad: ExcelColumn<Actividad>[] = [
  { key: 'id', header: 'ID', width: 10, value: (r) => r.id },
  { key: 'titulo', header: 'Título', width: 36, value: (r) => r.titulo },
  {
    key: 'razon_social_cliente',
    header: 'Cliente',
    width: 32,
    value: (r) => r.razon_social_cliente,
  },
  {
    key: 'fecha_programada',
    header: 'Fecha programada',
    width: 16,
    value: (r) => r.fecha_programada,
  },
  {
    key: 'hora_inicio_estimada',
    header: 'Hora inicio',
    width: 14,
    value: (r) => r.hora_inicio_estimada,
  },
  {
    key: 'hora_fin_estimada',
    header: 'Hora fin',
    width: 14,
    value: (r) => r.hora_fin_estimada,
  },
  {
    key: 'fecha_hora_cierre',
    header: 'Cierre',
    width: 20,
    value: (r) => r.fecha_hora_cierre,
  },
  {
    key: 'nombre_tipo_actividad',
    header: 'Tipo',
    width: 18,
    value: (r) => formatListaOpcionLabel(r.nombre_tipo_actividad),
  },
  {
    key: 'nombre_prioridad',
    header: 'Prioridad',
    width: 14,
    value: (r) => r.nombre_prioridad,
  },
  {
    key: 'nombre_estado_actividad',
    header: 'Estado',
    width: 16,
    value: (r) => r.nombre_estado_actividad,
  },
  {
    key: 'nombre_usuario_responsable',
    header: 'Usuario responsable',
    width: 28,
    value: (r) => r.nombre_usuario_responsable,
  },
  {
    key: 'nombre_chofer_responsable',
    header: 'Chofer responsable',
    width: 28,
    value: (r) => r.nombre_chofer_responsable,
  },
  {
    key: 'comprobante',
    header: 'Comprobante',
    width: 18,
    value: (r) => formatComprobante(r.serie_comprobante, r.numero_comprobante),
  },
  {
    key: 'observaciones',
    header: 'Observaciones',
    width: 40,
    value: (r) => r.observaciones,
  },
]

export async function exportarActividadesExcel(
  filters: ActividadListFilters,
  vista: 'lista' | 'calendario' = 'lista',
): Promise<void> {
  const rows = await fetchAllPages(actividadesService.listar, filters)

  if (!rows.length) {
    toastInfo('No hay actividades que coincidan con los filtros actuales')
    return
  }

  await downloadExcelWorkbook({
    filename: `actividades_${vista}_${hoyIsoLima()}`,
    sheets: [
      {
        name: 'Actividades',
        rows,
        columns: columnasActividad,
      },
    ],
  })
}

type RankingExcelRow = ActividadColaboradorRanking & {
  puesto: number
  porcentaje: number
}

type ActividadExcelRow = Actividad & { colaborador: string }

export async function exportarColaboradoresExcel(
  ranking: ActividadColaboradorRanking[],
): Promise<void> {
  if (!ranking.length) {
    toastInfo('No hay colaboradores para exportar con los filtros actuales')
    return
  }

  const maxCantidad = Math.max(0, ...ranking.map((row) => row.cantidad))
  const rankingRows: RankingExcelRow[] = ranking.map((row, index) => ({
    ...row,
    puesto: index + 1,
    porcentaje: maxCantidad ? Math.round((row.cantidad / maxCantidad) * 100) : 0,
  }))

  const actividades: ActividadExcelRow[] = ranking.flatMap((row) =>
    row.actividades.map((actividad) => ({ ...actividad, colaborador: row.nombre })),
  )

  await downloadExcelWorkbook({
    filename: `actividades_colaboradores_${hoyIsoLima()}`,
    sheets: [
      {
        name: 'Ranking',
        rows: rankingRows,
        columns: [
          { key: 'puesto', header: 'Puesto', width: 10, value: (r) => r.puesto },
          { key: 'nombre', header: 'Colaborador', width: 36, value: (r) => r.nombre },
          { key: 'tipo', header: 'Tipo', width: 12, value: (r) => r.tipo },
          { key: 'cantidad', header: 'Actividades', width: 14, value: (r) => r.cantidad },
          { key: 'porcentaje', header: '% vs líder', width: 12, value: (r) => r.porcentaje },
          { key: 'ultima', header: 'Última actividad', width: 20, value: (r) => r.ultimaFecha },
        ],
      },
      {
        name: 'Actividades',
        rows: actividades,
        columns: [
          { key: 'colaborador', header: 'Colaborador', width: 28, value: (r) => r.colaborador },
          ...columnasActividad,
        ],
      },
    ],
  })
}
