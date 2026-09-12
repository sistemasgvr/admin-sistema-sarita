import {
  runTutorial,
  tableStep,
  type TutorialOptions,
} from '@/modules/soporte/tutorials/tutorial-base'

export function createConfiguracionAlmacenesTutorial(options: TutorialOptions = {}) {
  return runTutorial(options, ({ sidebarStep, clickThenNext, closeModalThenNext, finish }) => [
    sidebarStep({
      element: '[data-tutorial="menu-configuracion-almacenes"]',
      popover: {
        title: '1. Almacenes',
        description:
          'Los almacenes son los lugares físicos donde se guarda el stock y los cilindros. Cada almacén pertenece a una sucursal; compras, ventas y traslados indican a qué almacén afectan.',
        side: 'right',
        align: 'start',
      },
    }),
    {
      element: '[data-tutorial="lista-buscador"]',
      popover: {
        title: '2. Buscar y filtrar',
        description: 'Por nombre o ubicación; el filtro permite ver solo los almacenes de una sucursal.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="almacenes-nuevo"]',
      popover: {
        title: '3. Nuevo almacén',
        description: 'Pulsa «Siguiente» para ver el formulario.',
        side: 'bottom',
        align: 'end',
        onNextClick: clickThenNext('[data-tutorial="almacenes-nuevo"]'),
      },
    },
    {
      element: '[data-tutorial="almacen-sucursal"]',
      popover: {
        title: '4. Sucursal',
        description: 'A qué sucursal pertenece. Determina qué caja y qué usuarios lo usan por defecto.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="almacen-nombre"]',
      popover: {
        title: '5. Nombre, ubicación y descripción',
        description: 'Nombre («Almacén Central», «Planta»), dónde está y una descripción opcional de qué se guarda.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tutorial="almacen-guardar"]',
      popover: {
        title: '6. Guardar',
        description: 'Crea el almacén. Aparecerá al registrar compras, movimientos y cilindros.',
        side: 'top',
        align: 'end',
        onNextClick: closeModalThenNext(),
      },
    },
    {
      element: '[data-tutorial="almacenes-tabla"]',
      popover: {
        title: '7. Listado',
        description: 'Sucursal, nombre, ubicación y descripción de cada almacén.',
        side: 'top',
        align: 'start',
      },
    },
    tableStep('[data-tutorial="almacenes-editar"]', {
      popover: {
        title: '8. Editar y eliminar',
        description: 'Corrige los datos o desactiva el almacén. Un almacén con stock o cilindros no se puede eliminar.',
        side: 'left',
        align: 'center',
        onNextClick: () => finish('configuracion-almacenes'),
      },
    }),
  ])
}
