import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createFinanzasGarantiasTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-finanzas"]',
      popover: {
        title: '1. Finanzas',
        description:
          'Las garantías son el dinero que un cliente deja en depósito al llevarse un cilindro prestado o un accesorio alquilado. Se administran en Finanzas.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="tab-garantias"]',
      popover: {
        title: '2. Pestaña Garantías',
        description:
          'Aquí ves todas las garantías cobradas, cuánto se devolvió y el saldo que la empresa aún retiene de cada cliente.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '3. Buscar',
        description: 'Por nombre o documento del cliente, o por el préstamo/alquiler que la originó.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-filtros"]',
      popover: {
        title: '4. Filtros',
        description: `${bulletList([
          ['Activas', 'garantía completa aún retenida.'],
          ['Parciales', 'se devolvió una parte.'],
          ['Devueltas', 'saldo cero, ya reintegradas.'],
          ['Desde / Hasta', 'rango de fecha de registro.'],
        ])}`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="garantias-exportar"]',
      popover: {
        title: '5. Exportar',
        description: 'Descarga el listado filtrado a Excel.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="garantias-nueva"]',
      popover: {
        title: '6. Garantía manual',
        description:
          'Las garantías de préstamos y alquileres se registran automáticamente al cobrarlas en el POS. Usa este botón solo para garantías cobradas fuera del sistema o migradas.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="garantias-tabla"]',
      popover: {
        title: '7. Listado',
        description:
          'Cada fila muestra el cliente, el origen (préstamo, alquiler o manual), el monto cobrado, lo devuelto y el saldo retenido, junto con el medio de pago y el estado.',
        side: 'top',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="garantias-ver"]', {
      popover: {
        title: '8. Ver detalle',
        description: 'Ficha de la garantía con el historial de devoluciones y el enlace al préstamo o alquiler.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="garantias-devolver"]', {
      popover: {
        title: '9. Devolver garantía',
        description:
          'Cuando el cliente devuelve el cilindro o accesorio, registra aquí la devolución total o parcial. Si se devuelve en efectivo, sale de la caja abierta del día y queda en el arqueo.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="garantias-editar"]', {
      popover: {
        title: '10. Editar y eliminar',
        description:
          'Solo las garantías manuales se pueden editar o eliminar. Las que nacen de un préstamo o alquiler se corrigen desde su propio módulo.',
        side: 'left',
        align: 'center',
        onNextClick: () => finish('finanzas-garantias'),
      },
    }),
  ])
}
