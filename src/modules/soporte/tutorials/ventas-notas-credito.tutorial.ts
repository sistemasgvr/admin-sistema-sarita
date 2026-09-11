import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createVentasNotasCreditoTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-ventas-notas-credito"]',
      popover: {
        title: '1. Notas de crédito',
        description:
          'Una nota de crédito anula o corrige un comprobante que SUNAT ya aceptó. Aquí se listan todas y se crean nuevas.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="nc-nueva"]',
      popover: {
        title: '2. Nueva nota de crédito',
        description: `El flujo es:${bulletList([
          ['Elegir el comprobante origen', 'boleta o factura aceptada por SUNAT.'],
          ['Motivo', 'anulación total, devolución, descuento o corrección.'],
          ['Ítems y montos', 'todo el comprobante o solo parte.'],
          ['Emitir', 'la nota se envía a SUNAT con la serie de la familia del origen (BC01 / FC01).'],
        ])}También puedes iniciarla desde el menú «⋮» del comprobante en la lista de Comprobantes.`,
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '3. Buscar',
        description: 'Busca por número de nota, por el comprobante origen o por cliente.',
        side: 'bottom',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="nc-ver"]', {
      popover: {
        title: '4. Ver detalle',
        description:
          'Muestra la nota, el comprobante que afecta y el efecto en stock, cilindros y caja (devolución o crédito a favor).',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="nc-acciones"]', {
      popover: {
        title: '5. Acciones',
        description: `${bulletList([
          ['Emitir SUNAT', 'si la nota quedó pendiente.'],
          ['Consultar CDR', 'respuesta de SUNAT.'],
          ['Descargar PDF', 'para entregar al cliente.'],
          ['Eliminar', 'solo notas no aceptadas por SUNAT.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('ventas-notas-credito'),
      },
    }),
  ])
}
