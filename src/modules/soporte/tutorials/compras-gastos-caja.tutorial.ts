import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createComprasGastosCajaTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, clickThenNext, closeModalThenNext, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-compras-gastos-caja"]',
      popover: {
        title: '1. Gastos de caja',
        description:
          'Salidas menudas pagadas con dinero de la caja del día: pasajes, combustible, fletes, compras pequeñas sin factura. Aquí las consultas todas juntas; también se registran desde la pantalla de Caja.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="gastos-resumen"]',
      popover: {
        title: '2. Totales',
        description: 'Cantidad de gastos y monto acumulado del periodo filtrado.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '3. Buscar',
        description: 'Por concepto, observación o número de operación del pago.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-filtros"]',
      popover: {
        title: '4. Filtros',
        description: 'Rango de fechas y categoría de gasto para armar el reporte del mes.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="gastos-nuevo"]',
      popover: {
        title: '5. Nuevo gasto',
        description:
          'Requiere una caja abierta en la fecha del gasto. Pulsa «Siguiente» para ver el formulario.',
        side: 'bottom',
        align: 'end',
        onNextClick: clickThenNext('[data-tutorial="gastos-nuevo"]'),
      },
    },
    {
      element: '[data-tutorial="gasto-concepto"]',
      popover: {
        title: '6. Concepto',
        description: 'Descripción corta de en qué se gastó: «Combustible camión», «Flete cilindros», etc.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="gasto-monto"]',
      popover: {
        title: '7. Monto',
        description: 'Importe del gasto. Se descuenta del dinero que debería haber en caja al cierre.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="gasto-medio-pago"]',
      popover: {
        title: '8. Medio de pago',
        description:
          'Efectivo sale de la caja; Yape/Plin o transferencia requieren la cuenta bancaria y el número de operación para conciliar.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="gasto-categoria"]',
      popover: {
        title: '9. Categoría',
        description:
          'Clasifica el gasto para los reportes. Si falta una categoría, créala con el botón «+».',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="gasto-guardar"]',
      popover: {
        title: '10. Registrar gasto',
        description: 'Guarda el gasto; aparece de inmediato en la caja del día y en el libro diario.',
        side: 'top',
        align: 'end',
        onNextClick: closeModalThenNext(),
      },
    },
    {
      element: '[data-tutorial="gastos-tabla"]',
      popover: {
        title: '11. Listado',
        description: 'Concepto y fecha, categoría, medio de pago, monto y observación de cada gasto.',
        side: 'top',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="gastos-ver"]', {
      popover: {
        title: '12. Ver detalle',
        description: 'Ficha del gasto con quién lo registró y la sesión de caja a la que pertenece.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="gastos-acciones"]', {
      popover: {
        title: '13. Acciones',
        description: `${bulletList([
          ['Editar', 'corrige concepto, monto o categoría mientras la caja del día siga abierta.'],
          ['Anular', 'revierte el gasto; con la caja cerrada ya no se modifica.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('compras-gastos-caja'),
      },
    }),
  ])
}
