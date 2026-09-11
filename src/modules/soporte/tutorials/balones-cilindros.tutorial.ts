import {
  bulletList,
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createBalonesCilindrosTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-balones-cilindros"]',
      popover: {
        title: '1. Libro de cilindros',
        description:
          'Inventario de todos los envases: propios, de clientes y de planta. Desde aquí sabes dónde está cada uno, en qué estado y cuándo le vence la P.H.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="tabs"]',
      popover: {
        title: '2. Pestañas',
        description: `${bulletList([
          ['Libro de cilindros', 'el listado completo.'],
          ['Aprobaciones', 'solicitudes de baja pendientes de aprobar (cilindros dañados o perdidos).'],
        ])}`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="cilindros-resumen"]',
      popover: {
        title: '3. Resumen',
        description:
          'Totales por situación: en almacén, en clientes, por vencer P.H., etc. Cada tarjeta es un atajo que filtra el listado.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '4. Buscar y escanear',
        description:
          'Busca por código, libro o tipo. Con la pistola puedes escanear el código del cilindro y el listado salta directo a él.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="lista-filtros"]',
      popover: {
        title: '5. Filtros',
        description:
          'Combina gas, almacén, estado, propietario y vista (llenos, fuera, con días en cliente) para armar la consulta que necesitas.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="cilindros-exportar"]',
      popover: {
        title: '6. Exportar',
        description: 'Descarga un Excel por propietario con resumen y detalle de cilindros.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tutorial="cilindros-nuevo"]',
      popover: {
        title: '7. Nuevo cilindro',
        description: 'Abre el formulario de registro (ver la ruta «Registrar un cilindro»).',
        side: 'bottom',
        align: 'end',
      },
    },
    tableStep('[data-tutorial="cilindros-ver"]', {
      popover: {
        title: '8. Ficha del cilindro',
        description:
          'Todo el historial del envase: recargas, movimientos entre almacenes, préstamos, alquileres, mantenimientos y en qué cliente está.',
        side: 'left',
        align: 'center',
      },
    }),
    tableStep('[data-tutorial="cilindros-acciones"]', {
      popover: {
        title: '9. Acciones',
        description: `${bulletList([
          ['Editar', 'corrige datos, ubicación o P.H.'],
          ['Solicitar baja', 'cilindro dañado, perdido o vencido; queda pendiente de aprobación.'],
          ['Reactivar', 'vuelve a DISPONIBLE un cilindro dado de baja.'],
          ['Eliminar', 'solo si no tiene historial.'],
        ])}`,
        side: 'left',
        align: 'center',
        onNextClick: () => finish('balones-cilindros'),
      },
    }),
  ])
}
