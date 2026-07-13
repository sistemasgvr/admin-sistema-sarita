import { empresasService } from '@/modules/configuracion/empresas/services/empresas.service'
import { comprobantesService } from '@/modules/ventas/comprobantes/services/comprobantes.service'
import {
  buildTicketHtml,
  printTicketHtml,
} from '@/modules/ventas/comprobantes/utils/comprobanteTicket'

/** Abre la ticketera 80mm del comprobante (tras emitirlo a SUNAT). */
export async function imprimirTicketPorComprobanteId(id: number) {
  const [detalle, empresas] = await Promise.all([
    comprobantesService.obtenerPorId(id),
    empresasService.listar({ pagina: 1, limite: 1 }),
  ])

  printTicketHtml(buildTicketHtml(detalle, empresas.data[0] ?? null))
}

export function debeImprimirTrasEmision(estadoSunat: string) {
  const estado = estadoSunat.toUpperCase()
  return estado === 'ACEPTADO' || estado === 'PENDIENTE'
}
