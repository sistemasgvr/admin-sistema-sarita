import {
  TUTORIAL_WAIT_FOR_ELEMENT_MS,
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createBalonesRecojosTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, clickThenNext, closeModalThenNext, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-balones-recojos"]',
      popover: {
        title: '1. Recojos',
        description:
          'Programa y registra las visitas para recuperar cilindros prestados o accesorios alquilados que el cliente aún no devuelve.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="tabs"]',
      popover: {
        title: '2. Pestañas',
        description: `${bulletList([
          ['Pendientes', 'todo lo que está fuera (préstamos y alquileres) con sus días y si ya tiene recojo programado.'],
          ['Visitas', 'los recojos programados y su resultado.'],
        ])}`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="recojos-pendientes-tabla"]',
      popover: {
        title: '3. Pendientes de recojo',
        description:
          'Cada fila es un cilindro o accesorio fuera, con el cliente, el número de préstamo/alquiler y los días transcurridos. El botón «Programar recojo» de la fila abre la visita con esos datos ya cargados. Pulsa «Siguiente» para ir a Visitas.',
        side: 'top',
        align: 'start',
        onNextClick: clickThenNext('[data-tutorial="tab-visitas"]'),
      },
    },
    {
      element: '[data-tutorial="recojos-programar"]',
      // La pestaña Visitas monta su listado al cambiar de tab.
      waitForElement: TUTORIAL_WAIT_FOR_ELEMENT_MS,
      popover: {
        title: '4. Programar',
        description: 'También puedes programar una visita desde cero. Pulsa «Siguiente» para verlo.',
        side: 'bottom',
        align: 'end',
        onNextClick: clickThenNext('[data-tutorial="recojos-programar"]'),
      },
    },
    {
      element: '[data-tutorial="recojo-datos"]',
      popover: {
        title: '5. Cliente y origen',
        description:
          'Elige el cliente y si el recojo corresponde a un préstamo o a un alquiler; luego el préstamo/alquiler activo concreto.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="recojo-fecha"]',
      popover: {
        title: '6. Fecha y hora',
        description: 'Día programado de la visita y, opcionalmente, la hora estimada y una observación con indicaciones.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="recojo-guardar"]',
      popover: {
        title: '7. Programar',
        description: 'Guarda la visita; aparecerá en Visitas y la fila de Pendientes quedará marcada como programada.',
        side: 'top',
        align: 'end',
        onNextClick: closeModalThenNext(),
      },
    },
    tableStep('[data-tutorial="recojos-ver"]', {
      popover: {
        title: '8. Ver detalle',
        description: 'Datos de la visita, cilindros esperados y el resultado registrado.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="recojos-acciones"]', {
      popover: {
        title: '9. Acciones',
        description: `${bulletList([
          ['Registrar resultado', 'qué se recogió (todo, parcial o nada) y el estado de cada cilindro; cierra el préstamo/alquiler si corresponde.'],
          ['Cancelar', 'la visita no se realizará.'],
          ['Eliminar', 'solo visitas sin resultado.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('balones-recojos'),
      },
    }),
  ])
}
