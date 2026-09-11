import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createVentasSinDocumentoTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-ventas-vsd"]',
      popover: {
        title: '1. Ventas sin documento',
        description:
          'Ventas internas que no se declaran a SUNAT (serie VSD01). Sirven para cobros menores o cuando el cliente no necesita comprobante; igual descuentan stock y entran a caja.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '2. Buscar',
        description: 'Busca por número (VSD01-0000123) o por cliente.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="vsd-nueva-venta"]',
      popover: {
        title: '3. Nueva venta',
        description:
          'Se registra desde el Punto de venta eligiendo el tipo «Venta sin documento». El resto del flujo (cliente, ítems, pago) es el mismo.',
        side: 'bottom',
        align: 'end',
      },
    },
    tableStep('[data-tutorial="vsd-ver"]', {
      popover: {
        title: '4. Ver detalle',
        description: 'Abre la venta con sus ítems, pagos y cilindros entregados.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="vsd-acciones"]', {
      popover: {
        title: '5. Acciones',
        description: `${bulletList([
          ['Imprimir ticket', 'comprobante interno para el cliente.'],
          ['Generar orden de salida', 'si la mercadería se despacha después.'],
          ['Eliminar', 'al no ir a SUNAT se puede eliminar; revierte stock y caja.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('ventas-sin-documento'),
      },
    }),
  ])
}
