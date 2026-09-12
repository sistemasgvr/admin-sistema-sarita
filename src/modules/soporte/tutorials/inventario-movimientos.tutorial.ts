import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createInventarioMovimientosTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, clickThenNext, closeModalThenNext, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-inventario-movimientos"]',
      popover: {
        title: '1. Movimientos de inventario',
        description:
          'Historial de cada entrada y salida de stock: compras, ventas, ajustes, traslados y movimientos de balones. Es el rastro completo de lo que pasó con cada unidad.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '2. Buscar',
        description: 'Por glosa, nombre del producto o número de serie del balón.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-filtros"]',
      popover: {
        title: '3. Filtros',
        description: `${bulletList([
          ['Naturaleza', 'movimientos de productos o de balones.'],
          ['Desde / Hasta', 'rango de fechas.'],
        ])}`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="movimientos-nuevo"]',
      popover: {
        title: '4. Nuevo movimiento',
        description:
          'Registra un ajuste o traslado manual. Pulsa «Siguiente» para ver el formulario.',
        side: 'bottom',
        align: 'end',
        onNextClick: clickThenNext('[data-tutorial="movimientos-nuevo"]'),
      },
    },
    {
      element: '[data-tutorial="movimiento-naturaleza"]',
      popover: {
        title: '5. Naturaleza',
        description: 'Producto (accesorios, gas a granel) o Balón (un cilindro identificado por su serie).',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="movimiento-tipo"]',
      popover: {
        title: '6. Tipo de movimiento',
        description:
          'Ajuste (entrada o salida para corregir el saldo) o Traslado (de un almacén a otro). Puedes crear tipos adicionales con el botón «+».',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="movimiento-cantidad"]',
      popover: {
        title: '7. Producto, cantidad y almacén',
        description:
          'Elige el producto o balón, la cantidad y el almacén. En un ajuste indicas el sentido (entrada/salida); en un traslado, almacén origen y destino.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="movimiento-glosa"]',
      popover: {
        title: '8. Glosa',
        description: 'Explica el motivo («conteo físico», «rotura», «envío a sucursal»); queda en el historial.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="movimiento-guardar"]',
      popover: {
        title: '9. Registrar',
        description: 'Guarda el movimiento y actualiza el saldo del stock al instante.',
        side: 'top',
        align: 'end',
        onNextClick: closeModalThenNext(),
      },
    },
    {
      element: '[data-tutorial="movimientos-tabla"]',
      popover: {
        title: '10. Historial',
        description:
          'Fecha, naturaleza, tipo, producto o balón, cantidad, almacén origen → destino (o cliente), y el documento que lo originó con enlace a la compra, venta u orden.',
        side: 'top',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="movimientos-anular"]', {
      popover: {
        title: '11. Anular',
        description:
          'Solo los movimientos manuales (ajustes y traslados) se anulan desde aquí; los que vienen de una compra o venta se revierten anulando ese documento.',
        side: 'left',
        align: 'center',
        onNextClick: () => finish('inventario-movimientos'),
      },
    }),
  ])
}
