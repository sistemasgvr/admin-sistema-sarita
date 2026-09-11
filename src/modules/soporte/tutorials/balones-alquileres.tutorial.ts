import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createBalonesAlquileresTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-balones-alquileres"]',
      popover: {
        title: '1. Alquileres',
        description:
          'Alquiler de accesorios (regulador, manómetro, etc.) por un periodo. El cilindro nunca se alquila: si se entrega, va como préstamo. Aquí se controla la vigencia y las devoluciones.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="tabs"]',
      popover: {
        title: '2. Pestañas',
        description: `${bulletList([
          ['Alquileres', 'listado con inicio, fin pactado y estado.'],
          ['Días de atraso', 'alquileres vencidos ordenados por días de retraso, para cobrar o recoger.'],
        ])}`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="alquileres-nuevo"]',
      popover: {
        title: '3. Alquilar en POS',
        description:
          'El alquiler se cobra como un ítem de venta: el botón abre el Punto de venta con el tipo «Alquiler de accesorio». Ahí eliges el producto, el periodo y la garantía.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '4. Buscar y filtrar',
        description: 'Busca por número o cliente y filtra por estado (vigente, vencido, devuelto).',
        side: 'bottom',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="alquileres-ver"]', {
      popover: {
        title: '5. Ver detalle',
        description:
          'Producto alquilado, fechas, tarifa y total cobrado, garantía y los cilindros que salieron en préstamo junto con el accesorio.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="alquileres-acciones"]', {
      popover: {
        title: '6. Acciones',
        description: `${bulletList([
          ['Devolver', 'cierra el alquiler, registra el fin real y devuelve la garantía.'],
          ['Renovar', 'extiende el periodo cobrando un nuevo tramo.'],
          ['Editar', 'ajusta fechas u observación.'],
          ['Eliminar', 'solo alquileres sin cobros asociados.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('balones-alquileres'),
      },
    }),
  ])
}
