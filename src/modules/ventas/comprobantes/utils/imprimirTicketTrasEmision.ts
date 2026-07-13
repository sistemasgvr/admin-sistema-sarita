import { empresasService } from '@/modules/configuracion/empresas/services/empresas.service'
import { comprobantesService } from '@/modules/ventas/comprobantes/services/comprobantes.service'
import {
  buildTicketHtml,
  openTicketPrintWindow,
  writeAndPrintTicket,
} from '@/modules/ventas/comprobantes/utils/comprobanteTicket'

/**
 * Abre la ventana YA (en el clic del usuario) y luego emite/consulta.
 * Chrome bloquea window.open si se llama después de un await (p. ej. Emitir SUNAT).
 */
export function abrirVentanaTicketAlClic(): Window | null {
  return openTicketPrintWindow()
}

export async function cargarEImprimirTicketEnVentana(win: Window, id: number) {
  const [detalle, empresas] = await Promise.all([
    comprobantesService.obtenerPorId(id),
    empresasService.listar({ pagina: 1, limite: 1 }),
  ])

  writeAndPrintTicket(win, buildTicketHtml(detalle, empresas.data[0] ?? null))
}

export function debeImprimirTrasEmision(estadoSunat: string) {
  const estado = estadoSunat.toUpperCase()
  return estado === 'ACEPTADO' || estado === 'PENDIENTE'
}

/**
 * Flujo POS: abrir ventana en el mismo clic → emitir → imprimir ticket.
 * Evita el bloqueo de pop-ups de Chrome tras await.
 */
export async function emitirConImpresionTicket(options: {
  comprobanteId: number
  emitir: () => Promise<{ sunat: { estado: string } }>
}): Promise<'impreso' | 'sin_ventana' | 'no_imprimir'> {
  const win = abrirVentanaTicketAlClic()

  try {
    const data = await options.emitir()

    if (!debeImprimirTrasEmision(data.sunat.estado)) {
      win?.close()
      return 'no_imprimir'
    }

    if (!win) {
      return 'sin_ventana'
    }

    await cargarEImprimirTicketEnVentana(win, options.comprobanteId)
    return 'impreso'
  } catch (error) {
    win?.close()
    throw error
  }
}

/** Impresión manual (botón Imprimir ticket): abre ventana sincronamente. */
export async function imprimirTicketPorComprobanteId(id: number) {
  const win = openTicketPrintWindow()

  if (!win) {
    throw new Error(
      'El navegador bloqueó la ventana de impresión. En el candado de la URL, permite ventanas emergentes.',
    )
  }

  try {
    await cargarEImprimirTicketEnVentana(win, id)
  } catch (error) {
    win.close()
    throw error
  }
}
