import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createVentasComprobantesTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-ventas-comprobantes"]',
      popover: {
        title: '1. Comprobantes',
        description:
          'En el menú Ventas ingresa a Comprobantes: aquí viven todas las boletas, facturas y notas emitidas o pendientes de emitir.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '2. Buscar',
        description:
          'Escribe la serie y número (B001-0000123), solo el número o el nombre del cliente. La lista se filtra mientras escribes.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-filtros"]',
      popover: {
        title: '3. Filtros',
        description:
          'Acota por tipo de comprobante, estado SUNAT, fechas o sucursal. Útil para ver lo pendiente de emitir del día.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="comprobantes-nueva-venta"]',
      popover: {
        title: '4. Nueva venta',
        description: 'Acceso directo al Punto de venta para registrar un comprobante nuevo.',
        side: 'bottom',
        align: 'end',
      },
    },
    tableStep('[data-tutorial="comprobantes-estado"]', {
      popover: {
        title: '5. Estado SUNAT',
        description: `Cada comprobante muestra su situación:${bulletList([
          ['PENDIENTE', 'guardado pero aún no enviado; se indica el plazo que queda para emitirlo.'],
          ['ACEPTADO', 'SUNAT lo recibió correctamente.'],
          ['RECHAZADO', 'revisa el motivo en «Consultar CDR» y corrige.'],
          ['ANULADO', 'dado de baja mediante comunicación de baja o nota de crédito.'],
        ])}`,
        side: 'top',
        align: 'start',
      },
    }),
    tableStep('[data-tutorial="comprobantes-ver"]', {
      popover: {
        title: '6. Ver detalle',
        description:
          'Abre el comprobante completo: cliente, ítems, pagos, cilindros entregados y el PDF para imprimir o enviar.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="comprobantes-acciones"]', {
      popover: {
        title: '7. Acciones',
        description: `El menú «⋮» agrupa lo que puedes hacer según el estado:${bulletList([
          ['Editar', 'solo mientras no se haya emitido.'],
          ['Emitir SUNAT', 'envía el comprobante pendiente.'],
          ['Generar orden de salida', 'crea la orden para despachar la mercadería (y luego la guía de remisión).'],
          ['Nota de crédito', 'anula o corrige un comprobante ya aceptado.'],
          ['Consultar CDR', 'respuesta de SUNAT.'],
          ['Anular en SUNAT', 'comunicación de baja dentro del plazo.'],
          ['Descargar PDF A4', 'formato para imprimir o enviar por correo.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('ventas-comprobantes'),
      },
    }),
  ])
}
