import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createVentasResumenDiarioTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, clickThenNext, closeModalThenNext, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-ventas-resumen-diario"]',
      popover: {
        title: '1. Resumen diario',
        description:
          'Las boletas no se envían una por una: se declaran a SUNAT agrupadas en un resumen diario. Aquí se generan y se consulta su estado.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="rd-nuevo"]',
      popover: {
        title: '2. Nuevo resumen',
        description: 'Pulsa «Siguiente» para ver cómo se arma el resumen del día.',
        side: 'bottom',
        align: 'end',
        onNextClick: clickThenNext('[data-tutorial="rd-nuevo"]'),
      },
    },
    {
      element: '[data-tutorial="rd-filtro"]',
      popover: {
        title: '3. Fecha y correlativo',
        description:
          'Indica la fecha de las boletas a declarar. El correlativo numera los resúmenes del mismo día (001, 002…) por si necesitas enviar otro. «Actualizar preview» carga las boletas.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="rd-comprobantes"]',
      popover: {
        title: '4. Comprobantes a incluir',
        description:
          'Lista las boletas pendientes de esa fecha con cantidad y totales. Revisa que estén todas antes de enviar; las boletas anuladas se informan también en el resumen.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="rd-enviar"]',
      popover: {
        title: '5. Enviar a SUNAT',
        description:
          'SUNAT responde con un ticket y procesa el resumen en unos minutos. Las boletas incluidas pasan a ACEPTADAS cuando el resumen es aceptado.',
        side: 'top',
        align: 'end',
        onNextClick: closeModalThenNext(),
      },
    },
    tableStep('[data-tutorial="rd-acciones"]', {
      popover: {
        title: '6. Seguimiento',
        description: `${bulletList([
          ['Ver detalle', 'boletas incluidas y respuesta de SUNAT.'],
          ['Consultar estado', 'con el ticket, pregunta a SUNAT si ya procesó el resumen.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('ventas-resumen-diario'),
      },
    }),
  ])
}
