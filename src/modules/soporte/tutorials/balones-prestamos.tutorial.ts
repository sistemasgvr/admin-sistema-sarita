import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createBalonesPrestamosTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-balones-prestamos"]',
      popover: {
        title: '1. Préstamos',
        description:
          'Un préstamo es un cilindro de la empresa que se lleva el cliente al comprar gas y debe devolver. Aquí controlas cuáles están fuera, desde cuándo y con qué garantía.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="tabs"]',
      popover: {
        title: '2. Pestañas',
        description: `${bulletList([
          ['Préstamos', 'listado de préstamos con sus cilindros.'],
          ['Días en préstamo', 'antigüedad por cliente: cuánto tiempo lleva cada cilindro fuera, para priorizar recojos.'],
        ])}`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="prestamos-nuevo"]',
      popover: {
        title: '3. Nuevo préstamo',
        description:
          'Los préstamos no se crean aquí: nacen en el Punto de venta al vender gas con el escenario «Le prestamos uno». Este botón te lleva al POS con esa opción lista.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '4. Buscar y filtrar',
        description: 'Busca por número de préstamo o cliente y filtra por estado (activo, devuelto, vencido).',
        side: 'bottom',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="prestamos-ver"]', {
      popover: {
        title: '5. Ver detalle',
        description:
          'Cilindros incluidos, fecha de salida y límite, garantía entregada y el comprobante de la venta que lo originó.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="prestamos-acciones"]', {
      popover: {
        title: '6. Acciones',
        description: `${bulletList([
          ['Devolver', 'registra el retorno de uno o todos los cilindros y libera la garantía.'],
          ['Editar', 'ajusta fechas, observación o cilindros mientras esté activo.'],
          ['Eliminar', 'solo préstamos sin movimientos.'],
        ])}Para programar la visita de recojo usa el módulo Recojos.`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('balones-prestamos'),
      },
    }),
  ])
}
